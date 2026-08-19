namespace SchoolCore.Common.Security;

/// <summary>
/// Contexto de tenant/usuario del request autenticado (rellenado desde JWT).
/// </summary>
public interface ITenantContext
{
    Guid? TenantId { get; }
    Guid? UserId { get; }
    IReadOnlyList<string> Roles { get; }
    IReadOnlyList<Guid> BranchIds { get; }
    bool IsAuthenticated { get; }
    void Set(Guid tenantId, Guid userId);
    void Set(Guid tenantId, Guid userId, IReadOnlyList<string> roles, IReadOnlyList<Guid> branchIds);
    void Clear();
}

/// <inheritdoc />
public sealed class TenantContext : ITenantContext
{
    public Guid? TenantId { get; private set; }
    public Guid? UserId { get; private set; }
    public IReadOnlyList<string> Roles { get; private set; } = Array.Empty<string>();
    public IReadOnlyList<Guid> BranchIds { get; private set; } = Array.Empty<Guid>();
    public bool IsAuthenticated => TenantId.HasValue && UserId.HasValue;

    public void Set(Guid tenantId, Guid userId) =>
        Set(tenantId, userId, Array.Empty<string>(), Array.Empty<Guid>());

    public void Set(Guid tenantId, Guid userId, IReadOnlyList<string> roles, IReadOnlyList<Guid> branchIds)
    {
        TenantId = tenantId;
        UserId = userId;
        Roles = roles ?? Array.Empty<string>();
        BranchIds = branchIds ?? Array.Empty<Guid>();
    }

    public void Clear()
    {
        TenantId = null;
        UserId = null;
        Roles = Array.Empty<string>();
        BranchIds = Array.Empty<Guid>();
    }
}
