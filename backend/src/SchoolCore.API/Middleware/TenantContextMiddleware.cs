using System.Security.Claims;
using SchoolCore.Common.Security;

namespace SchoolCore.API.Middleware;

/// <summary>
/// Lee TenantId y UserId desde claims JWT y los publica en ITenantContext.
/// </summary>
public sealed class TenantContextMiddleware
{
    private readonly RequestDelegate _next;

    public TenantContextMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ITenantContext tenantContext)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userIdValue = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? context.User.FindFirstValue("sub");
            var tenantIdValue = context.User.FindFirstValue(SchoolCoreClaimTypes.TenantId);

            if (Guid.TryParse(userIdValue, out var userId) && Guid.TryParse(tenantIdValue, out var tenantId))
            {
                var roles = context.User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
                var branchIds = context.User.FindAll(SchoolCoreClaimTypes.BranchId)
                    .Select(c => Guid.TryParse(c.Value, out var id) ? id : Guid.Empty)
                    .Where(id => id != Guid.Empty)
                    .ToList();
                tenantContext.Set(tenantId, userId, roles, branchIds);
            }
        }

        await _next(context);
    }
}
