namespace SchoolCore.Common.Constants;

/// <summary>
/// Claves de feature flags (Global / Tenant / Branch).
/// </summary>
public static class FeatureKeys
{
    public const string StripeModule = "StripeModule";
    public const string AiAssistant = "AiAssistant";
    public const string ParentPortal = "ParentPortal";
    public const string TeacherPortal = "TeacherPortal";
    public const string StudentPortal = "StudentPortal";
    public const string CfdiModule = "CfdiModule";
    public const string AdvancedAcademics = "AdvancedAcademics";
}

/// <summary>
/// Códigos de rol MVP con login habilitado.
/// </summary>
public static class MvpRoleCodes
{
    public const string SuperAdmin = "SuperAdmin";
    public const string Director = "Director";
    public const string Coordinator = "Coordinator";
    public const string Cashier = "Cashier";
    public const string Accountant = "Accountant";
    public const string Receptionist = "Receptionist";

    public static readonly IReadOnlyList<string> All =
    [
        SuperAdmin,
        Director,
        Coordinator,
        Cashier,
        Accountant,
        Receptionist
    ];
}

/// <summary>
/// Claim types usados en JWT SchoolCore.
/// </summary>
public static class SchoolCoreClaimTypes
{
    public const string TenantId = "tenant_id";
    public const string BranchIds = "branch_ids";
    public const string RoleCodes = "role_codes";
}
