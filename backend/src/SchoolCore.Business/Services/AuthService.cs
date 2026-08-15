using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SchoolCore.Business.Email;
using SchoolCore.Common.Email;
using SchoolCore.Common.Exceptions;
using SchoolCore.Common.Interaction;
using SchoolCore.Common.Options;
using SchoolCore.Common.Security;
using SchoolCore.DataAccess.Repositories;
using SchoolCore.Models.Dtos.Auth;
using SchoolCore.Models.Entities;

namespace SchoolCore.Business.Services;

/// <summary>
/// Contrato del servicio de autenticación staff (JWT + refresh + reset).
/// </summary>
public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, string? clientIp, CancellationToken cancellationToken = default);
    Task<LoginResponse> RefreshAsync(RefreshRequest request, string? clientIp, CancellationToken cancellationToken = default);
    Task LogoutAsync(LogoutRequest request, CancellationToken cancellationToken = default);
    Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default);
    Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default);
    string HashPassword(string password);
}

/// <inheritdoc />
public sealed class AuthService : IAuthService
{
    private const int MaxFailedAttempts = 5;
    private const int LockoutMinutes = 15;
    private const int PasswordResetHours = 1;
    private const int MinPasswordLength = 8;

    private readonly IAuthRepository _authRepository;
    private readonly IOrganizationRepository _organizationRepository;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IEmailQueue _emailQueue;
    private readonly JwtOptions _jwtOptions;
    private readonly AppOptions _appOptions;
    private readonly ILogger<AuthService> _logger;
    private readonly PasswordHasher<AuthUserRecord> _passwordHasher = new();

    public AuthService(
        IAuthRepository authRepository,
        IOrganizationRepository organizationRepository,
        IJwtTokenService jwtTokenService,
        IEmailQueue emailQueue,
        IOptions<JwtOptions> jwtOptions,
        IOptions<AppOptions> appOptions,
        ILogger<AuthService> logger)
    {
        _authRepository = authRepository;
        _organizationRepository = organizationRepository;
        _jwtTokenService = jwtTokenService;
        _emailQueue = emailQueue;
        _jwtOptions = jwtOptions.Value;
        _appOptions = appOptions.Value;
        _logger = logger;
    }

    /// <inheritdoc />
    public string HashPassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            throw new ArgumentException("Password is required.", nameof(password));
        }

        return _passwordHasher.HashPassword(new AuthUserRecord(), password);
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request, string? clientIp, CancellationToken cancellationToken = default)
    {
        ValidateLoginRequest(request);

        try
        {
            var lookup = await _authRepository.GetUserByEmailAsync(request.Email.Trim(), NormalizeTenantCode(request.TenantCode), cancellationToken);
            if (lookup.IsAmbiguous)
            {
                throw AppException.Conflict("Multiple tenants match this email. Provide TenantCode.");
            }

            var user = lookup.User;
            if (user is null)
            {
            throw AppException.Unauthorized("Correo o contraseña incorrectos.");
        }

        EnsureCanAttemptLogin(user, lookup.Roles);

        var verify = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verify == PasswordVerificationResult.Failed)
        {
            await _authRepository.UpdateLoginFailureAsync(user.Id, user.TenantId, MaxFailedAttempts, LockoutMinutes, cancellationToken);
            throw AppException.Unauthorized("Correo o contraseña incorrectos.");
        }

            await _authRepository.ResetAccessFailedAsync(user.Id, user.TenantId, cancellationToken);
            return await IssueTokensAsync(user, lookup.Roles, lookup.BranchIds, clientIp, cancellationToken);
        }
        catch (AppException)
        {
            throw;
        }
        catch (Microsoft.Data.SqlClient.SqlException ex)
        {
            _logger.LogError(ex, "SQL failure during login for {Email}", request.Email);
            throw AppException.BadRequest(
                $"Database error during login (SQL {ex.Number}): {ex.Message}",
                new[] { ex.Message });
        }
    }

    public async Task<LoginResponse> RefreshAsync(RefreshRequest request, string? clientIp, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            throw AppException.BadRequest("RefreshToken is required.");
        }

        var hash = HashOpaqueToken(request.RefreshToken);
        var (token, lookup) = await _authRepository.GetRefreshTokenAsync(hash, cancellationToken);
        if (token is null || lookup.User is null)
        {
            throw AppException.Unauthorized("Invalid or expired refresh token.");
        }

        var user = lookup.User;
        if (!user.IsActive || !MvpLoginRoles.HasAllowedRole(lookup.Roles))
        {
            throw AppException.Forbidden("User is not allowed to refresh session.");
        }

        // Rotación: revocar el refresh presentado e emitir uno nuevo.
        await _authRepository.RevokeRefreshTokenAsync(hash, user.Id, user.TenantId, cancellationToken);
        return await IssueTokensAsync(user, lookup.Roles, lookup.BranchIds, clientIp, cancellationToken);
    }

    public async Task LogoutAsync(LogoutRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            throw AppException.BadRequest("RefreshToken is required.");
        }

        var hash = HashOpaqueToken(request.RefreshToken);
        await _authRepository.RevokeRefreshTokenAsync(hash, null, null, cancellationToken);
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            throw AppException.BadRequest(
                InteractionMessages.Text("AUTH_EMAIL_REQUIRED"),
                new[] { "AUTH_EMAIL_REQUIRED" });
        }

        var lookup = await _authRepository.GetUserByEmailAsync(request.Email.Trim(), NormalizeTenantCode(request.TenantCode), cancellationToken);
        // Respuesta uniforme: no revelar si el email existe.
        if (lookup.IsAmbiguous || lookup.User is null || !lookup.User.IsActive)
        {
            return;
        }

        var user = lookup.User;
        var rawToken = CreateOpaqueToken();
        var tokenHash = HashOpaqueToken(rawToken);
        var expiresAt = DateTime.UtcNow.AddHours(PasswordResetHours);

        await _authRepository.CreatePasswordResetTokenAsync(Guid.NewGuid(), user.TenantId, user.Id, tokenHash, expiresAt, cancellationToken);

        var resetUrl = $"{_appOptions.PublicWebBaseUrl.TrimEnd('/')}/reset-password?token={Uri.EscapeDataString(rawToken)}";
        var schoolName = string.IsNullOrWhiteSpace(user.TenantName) ? "SchoolCore" : user.TenantName;
        var userName = string.IsNullOrWhiteSpace(user.FirstName) ? user.Email : user.FirstName.Trim();

        var template = await _organizationRepository.ResolveEmailTemplateAsync(
            user.TenantId, EmailTemplateKeys.PasswordReset, "es", cancellationToken);

        var vars = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["SchoolName"] = schoolName,
            ["ResetUrl"] = resetUrl,
            ["UserName"] = userName,
            ["Year"] = DateTime.UtcNow.Year.ToString(),
            ["PrimaryColor"] = string.IsNullOrWhiteSpace(template?.PrimaryColor) ? "#2563eb" : template!.PrimaryColor,
            ["LogoUrl"] = template?.LogoUrl ?? string.Empty
        };

        var subjectTemplate = string.IsNullOrWhiteSpace(template?.Subject)
            ? "Recuperación de contraseña — {{SchoolName}}"
            : template.Subject;
        var bodyTemplate = string.IsNullOrWhiteSpace(template?.HtmlBody)
            ? BuildPasswordResetHtmlFallback()
            : template.HtmlBody;

        var subject = EmailTemplateRenderer.Render(subjectTemplate, vars);
        var body = EmailTemplateRenderer.Render(bodyTemplate, vars);

        try
        {
            await _emailQueue.EnqueueAsync(new OutboundEmail(user.Email, subject, body), cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to enqueue password reset email for user {UserId}", user.Id);
        }
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
        {
            throw AppException.BadRequest(
                InteractionMessages.Text("AUTH_INVALID_RESET_TOKEN"),
                new[] { "AUTH_INVALID_RESET_TOKEN" });
        }

        ValidatePasswordComplexity(request.NewPassword);

        var tokenHash = HashOpaqueToken(request.Token.Trim());
        var (userId, tenantId, success) = await _authRepository.ConsumePasswordResetTokenAsync(tokenHash, cancellationToken);
        if (!success || userId is null || tenantId is null)
        {
            throw AppException.BadRequest(
                InteractionMessages.Text("AUTH_INVALID_RESET_TOKEN"),
                new[] { "AUTH_INVALID_RESET_TOKEN" });
        }

        var passwordHash = HashPassword(request.NewPassword);
        var rows = await _authRepository.UpdatePasswordAsync(userId.Value, tenantId.Value, passwordHash, userId, cancellationToken);
        if (rows == 0)
        {
            throw AppException.BadRequest("Unable to update password.");
        }

        // Invalidar todas las sesiones del usuario.
        await _authRepository.RevokeRefreshTokenAsync(null, userId, tenantId, cancellationToken);
    }

    private async Task<LoginResponse> IssueTokensAsync(
        AuthUserRecord user,
        IReadOnlyList<string> roles,
        IReadOnlyList<Guid> branchIds,
        string? clientIp,
        CancellationToken cancellationToken)
    {
        var accessExpires = DateTime.UtcNow.AddMinutes(_jwtOptions.AccessTokenMinutes);
        var refreshExpires = DateTime.UtcNow.AddDays(_jwtOptions.RefreshTokenDays);
        var accessToken = _jwtTokenService.CreateAccessToken(user, roles, branchIds, accessExpires);

        var refreshRaw = CreateOpaqueToken();
        var refreshHash = HashOpaqueToken(refreshRaw);
        await _authRepository.CreateRefreshTokenAsync(
            Guid.NewGuid(),
            user.TenantId,
            user.Id,
            refreshHash,
            refreshExpires,
            clientIp,
            cancellationToken);

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshRaw,
            AccessTokenExpiresAt = accessExpires,
            RefreshTokenExpiresAt = refreshExpires,
            UserId = user.Id,
            TenantId = user.TenantId,
            TenantCode = user.TenantCode,
            TenantName = user.TenantName,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = roles,
            BranchIds = branchIds
        };
    }

    private static void ValidateLoginRequest(LoginRequest request)
    {
        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            errors.Add("Email is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            errors.Add("Password is required.");
        }

        if (errors.Count > 0)
        {
            throw AppException.BadRequest("Validation failed.", errors);
        }
    }

    private static void EnsureCanAttemptLogin(AuthUserRecord user, IReadOnlyList<string> roles)
    {
        if (!user.IsActive)
        {
            throw AppException.Forbidden("User account is inactive.");
        }

        if (user.LockoutEndUtc.HasValue && user.LockoutEndUtc.Value > DateTime.UtcNow)
        {
            throw AppException.Forbidden("User account is temporarily locked. Try again later.");
        }

        if (!MvpLoginRoles.HasAllowedRole(roles))
        {
            throw AppException.Forbidden("Role is not allowed to sign in to the staff portal.");
        }
    }

    private static void ValidatePasswordComplexity(string password)
    {
        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(password) || password.Length < MinPasswordLength)
        {
            errors.Add($"Password must be at least {MinPasswordLength} characters.");
        }

        if (!string.IsNullOrEmpty(password))
        {
            if (!password.Any(char.IsUpper))
            {
                errors.Add("Password must contain at least one uppercase letter.");
            }

            if (!password.Any(char.IsLower))
            {
                errors.Add("Password must contain at least one lowercase letter.");
            }

            if (!password.Any(char.IsDigit))
            {
                errors.Add("Password must contain at least one digit.");
            }
        }

        if (errors.Count > 0)
        {
            errors.Insert(0, "AUTH_PASSWORD_COMPLEXITY");
            throw AppException.BadRequest(InteractionMessages.Text("AUTH_PASSWORD_COMPLEXITY"), errors);
        }
    }

    private static string? NormalizeTenantCode(string? tenantCode) =>
        string.IsNullOrWhiteSpace(tenantCode) ? null : tenantCode.Trim();

    private static string CreateOpaqueToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    private static string HashOpaqueToken(string rawToken)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(hash);
    }

    /// <summary>Fallback si no hay fila en EmailTemplate (p. ej. BD sin seed 018).</summary>
    private static string BuildPasswordResetHtmlFallback() =>
        """
        <html>
        <body style="font-family:Segoe UI,Arial,sans-serif;color:#1a1a1a;">
          <h2>{{SchoolName}}</h2>
          <p>Hola {{UserName}},</p>
          <p>Recibimos una solicitud para restablecer tu contraseña de SchoolCore.</p>
          <p><a href="{{ResetUrl}}">Restablecer contraseña</a></p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
          <p style="color:#666;font-size:12px;">El enlace expira en 1 hora · {{Year}}</p>
        </body>
        </html>
        """;
}
