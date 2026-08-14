namespace SchoolCore.Models.Dtos.Auth;

/// <summary>
/// Solicitud de inicio de sesión staff.
/// </summary>
public sealed class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Código de tenant opcional para desambiguar el mismo email en varias escuelas.
    /// </summary>
    public string? TenantCode { get; set; }
}

/// <summary>
/// Respuesta de login / refresh con access y refresh tokens.
/// </summary>
public sealed class LoginResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime AccessTokenExpiresAt { get; set; }
    public DateTime RefreshTokenExpiresAt { get; set; }
    public Guid UserId { get; set; }
    public Guid TenantId { get; set; }
    public string TenantCode { get; set; } = string.Empty;
    public string TenantName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public IReadOnlyList<string> Roles { get; set; } = Array.Empty<string>();
    public IReadOnlyList<Guid> BranchIds { get; set; } = Array.Empty<Guid>();
}

/// <summary>
/// Solicitud para renovar el access token.
/// </summary>
public sealed class RefreshRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}

/// <summary>
/// Solicitud de recuperación de contraseña.
/// </summary>
public sealed class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
    public string? TenantCode { get; set; }
}

/// <summary>
/// Solicitud para establecer nueva contraseña con token de un uso.
/// </summary>
public sealed class ResetPasswordRequest
{
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

/// <summary>
/// Solicitud de cierre de sesión (revoca refresh token).
/// </summary>
public sealed class LogoutRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}
