namespace SchoolCore.Common.Security;

/// <summary>
/// Nombres de claims JWT usados por SchoolCore.
/// </summary>
public static class SchoolCoreClaimTypes
{
    public const string TenantId = "tenant_id";
    public const string TenantCode = "tenant_code";
    public const string BranchId = "branch_id";
}

/// <summary>
/// Roles staff habilitados para login en el MVP.
/// </summary>
public static class MvpLoginRoles
{
    public static readonly HashSet<string> Allowed = new(StringComparer.OrdinalIgnoreCase)
    {
        "SuperAdmin",
        "Director",
        "Coordinator",
        "Cashier",
        "Accountant",
        "Receptionist"
    };

    public static bool HasAllowedRole(IEnumerable<string> roles) =>
        roles.Any(r => Allowed.Contains(r));

    public static bool IsSuperAdmin(IEnumerable<string>? roles) =>
        roles is not null && roles.Any(r => string.Equals(r, "SuperAdmin", StringComparison.OrdinalIgnoreCase));
}
