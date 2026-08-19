using SchoolCore.Common.Exceptions;
using SchoolCore.Common.Security;

namespace SchoolCore.Business.Security;

/// <summary>
/// Alcance de sucursal: Super Admin = todo el tenant; el resto = UserBranch (claims JWT).
/// </summary>
public static class BranchAccess
{
    public static bool IsSuperAdmin(ITenantContext context) =>
        MvpLoginRoles.IsSuperAdmin(context.Roles);

    public static void EnsureQueryBranch(ITenantContext context, Guid? branchId)
    {
        if (IsSuperAdmin(context))
            return;
        if (branchId is null || branchId == Guid.Empty)
            return;
        EnsureCanAccess(context, branchId.Value);
    }

    public static void EnsureCanAccess(ITenantContext context, Guid branchId)
    {
        if (IsSuperAdmin(context))
            return;
        if (!context.BranchIds.Contains(branchId))
            throw AppException.Forbidden("No tienes acceso a esta sucursal.");
    }

    public static void EnsureCanAssign(ITenantContext context, IReadOnlyList<Guid> branchIds)
    {
        if (branchIds.Count == 0)
            throw AppException.BadRequest("Selecciona al menos una sucursal.");
        if (IsSuperAdmin(context))
            return;
        foreach (var id in branchIds.Distinct())
        {
            if (!context.BranchIds.Contains(id))
                throw AppException.Forbidden("Solo puedes asignar sucursales a las que perteneces.");
        }
    }
}
