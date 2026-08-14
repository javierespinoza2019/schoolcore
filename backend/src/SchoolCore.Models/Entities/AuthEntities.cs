namespace SchoolCore.Models.Entities;

/// <summary>
/// Refresh token persistido (solo hash).
/// </summary>
public sealed class RefreshToken
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Usuario autenticable con contexto de tenant (proyección de SP auth).
/// </summary>
public sealed class AuthUserRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int AccessFailedCount { get; set; }
    public DateTime? LockoutEndUtc { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public string TenantCode { get; set; } = string.Empty;
    public string TenantName { get; set; } = string.Empty;
    public bool IsAmbiguous { get; set; }
}

/// <summary>
/// Resultado de lookup de usuario para auth (roles + sucursales).
/// </summary>
public sealed class AuthUserLookup
{
    public AuthUserRecord? User { get; set; }
    public IReadOnlyList<string> Roles { get; set; } = Array.Empty<string>();
    public IReadOnlyList<Guid> BranchIds { get; set; } = Array.Empty<Guid>();
    public bool IsAmbiguous { get; set; }
}
