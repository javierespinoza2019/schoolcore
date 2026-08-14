using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SchoolCore.Common.Options;
using SchoolCore.Common.Security;
using SchoolCore.Models.Entities;

namespace SchoolCore.Business.Services;

/// <summary>
/// Emisión de JWT access tokens.
/// </summary>
public interface IJwtTokenService
{
    string CreateAccessToken(AuthUserRecord user, IReadOnlyList<string> roles, IReadOnlyList<Guid> branchIds, DateTime expiresAtUtc);
}

/// <inheritdoc />
public sealed class JwtTokenService : IJwtTokenService
{
    private readonly JwtOptions _options;

    public JwtTokenService(IOptions<JwtOptions> options)
    {
        _options = options.Value;
    }

    public string CreateAccessToken(AuthUserRecord user, IReadOnlyList<string> roles, IReadOnlyList<Guid> branchIds, DateTime expiresAtUtc)
    {
        if (string.IsNullOrWhiteSpace(_options.Secret) || _options.Secret.Length < 32)
        {
            throw new InvalidOperationException("Jwt:Secret must be configured with at least 32 characters.");
        }

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new(ClaimTypes.GivenName, user.FirstName ?? string.Empty),
            new(ClaimTypes.Surname, user.LastName ?? string.Empty),
            new(SchoolCoreClaimTypes.TenantId, user.TenantId.ToString()),
            new(SchoolCoreClaimTypes.TenantCode, user.TenantCode ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
        };

        foreach (var role in roles.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        foreach (var branchId in branchIds.Distinct())
        {
            claims.Add(new Claim(SchoolCoreClaimTypes.BranchId, branchId.ToString()));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAtUtc,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
