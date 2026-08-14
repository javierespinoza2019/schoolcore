namespace SchoolCore.Common.Security;

/// <summary>
/// Contexto de tenant/usuario del request autenticado (rellenado desde JWT).
/// </summary>
public interface ITenantContext
{
    Guid? TenantId { get; }
    Guid? UserId { get; }
    bool IsAuthenticated { get; }
    void Set(Guid tenantId, Guid userId);
    void Clear();
}

/// <inheritdoc />
public sealed class TenantContext : ITenantContext
{
    public Guid? TenantId { get; private set; }
    public Guid? UserId { get; private set; }
    public bool IsAuthenticated => TenantId.HasValue && UserId.HasValue;

    public void Set(Guid tenantId, Guid userId)
    {
        TenantId = tenantId;
        UserId = userId;
    }

    public void Clear()
    {
        TenantId = null;
        UserId = null;
    }
}
