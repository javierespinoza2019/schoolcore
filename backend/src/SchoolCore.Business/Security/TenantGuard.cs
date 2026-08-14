using SchoolCore.Common.Exceptions;
using SchoolCore.Common.Security;

namespace SchoolCore.Business.Security;

/// <summary>
/// Helpers para exigir TenantId/UserId desde JWT en operaciones de negocio.
/// </summary>
public static class TenantGuard
{
    public static (Guid TenantId, Guid UserId) Require(ITenantContext context)
    {
        if (!context.IsAuthenticated || context.TenantId is null || context.UserId is null)
        {
            throw AppException.Unauthorized("Authenticated tenant context is required.");
        }

        return (context.TenantId.Value, context.UserId.Value);
    }
}
