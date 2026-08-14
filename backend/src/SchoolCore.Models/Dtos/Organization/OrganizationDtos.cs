namespace SchoolCore.Models.Dtos.Organization;

public sealed class BranchDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    /// <summary>IANA id; null = hereda del tenant.</summary>
    public string? TimeZoneId { get; set; }
    /// <summary>Contacto operativo del campus (no sustituye el rol Director).</summary>
    public string? DirectorName { get; set; }
    public string? DirectorEmail { get; set; }
    public string? DirectorPhone { get; set; }
    public int? Capacity { get; set; }
    public DateTime? OpenedAt { get; set; }
    public string? Area { get; set; }
    public string? Levels { get; set; }
    public string? OperationalStatus { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public sealed class BranchUpsertRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    /// <summary>IANA id; null = hereda del tenant.</summary>
    public string? TimeZoneId { get; set; }
    public string? DirectorName { get; set; }
    public string? DirectorEmail { get; set; }
    public string? DirectorPhone { get; set; }
    public int? Capacity { get; set; }
    public DateTime? OpenedAt { get; set; }
    public string? Area { get; set; }
    public string? Levels { get; set; }
    public string? OperationalStatus { get; set; }
}

public sealed class SchoolCycleDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public sealed class SchoolCycleUpsertRequest
{
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
}

public sealed class InstitutionSettingsDto
{
    public Guid TenantId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string? LegalName { get; set; }
    public string? TaxId { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? Address { get; set; }
    public string? LogoUrl { get; set; }
    public string? PrimaryColor { get; set; }
    /// <summary>Zona IANA del tenant (default America/Mexico_City).</summary>
    public string TimeZoneId { get; set; } = "America/Mexico_City";
    public DateTime? UpdatedAt { get; set; }
}

public sealed class InstitutionSettingsUpsertRequest
{
    public string DisplayName { get; set; } = string.Empty;
    public string? LegalName { get; set; }
    public string? TaxId { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? Address { get; set; }
    public string? LogoUrl { get; set; }
    public string? PrimaryColor { get; set; }
    /// <summary>Zona IANA del tenant.</summary>
    public string TimeZoneId { get; set; } = "America/Mexico_City";
}

public sealed class TimeZoneCatalogItemDto
{
    public string Id { get; set; } = string.Empty;
    public string DisplayNameEs { get; set; } = string.Empty;
    public string DisplayNameEn { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public sealed class EffectiveTimeZoneDto
{
    public string EffectiveTimeZoneId { get; set; } = "America/Mexico_City";
    public string Source { get; set; } = "Platform";
    public string? TenantTimeZoneId { get; set; }
    public string? BranchTimeZoneId { get; set; }
}

public sealed class EducationLevelDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int GradeCount { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public sealed class EducationLevelUpsertRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int GradeCount { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class PaymentMethodDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Info { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public sealed class PaymentMethodUpsertRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Info { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}

public sealed class PaymentConceptAmountDto
{
    public Guid Id { get; set; }
    public Guid PaymentConceptId { get; set; }
    public Guid EducationLevelId { get; set; }
    public string? EducationLevelName { get; set; }
    public decimal Amount { get; set; }
}

public sealed class PaymentConceptDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ConceptType { get; set; } = string.Empty;
    public decimal DefaultAmount { get; set; }
    public bool DifferentiatedByLevel { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public IReadOnlyList<PaymentConceptAmountDto> Amounts { get; set; } = Array.Empty<PaymentConceptAmountDto>();
}

public sealed class PaymentConceptUpsertRequest
{
    public string Name { get; set; } = string.Empty;
    public string ConceptType { get; set; } = "mensual";
    public decimal DefaultAmount { get; set; }
    public bool DifferentiatedByLevel { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class PaymentConceptAmountItem
{
    public Guid EducationLevelId { get; set; }
    public decimal Amount { get; set; }
}

public sealed class SetPaymentConceptAmountsRequest
{
    public IReadOnlyList<PaymentConceptAmountItem> Amounts { get; set; } = Array.Empty<PaymentConceptAmountItem>();
}

public sealed class StaffUserDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public IReadOnlyList<RoleDto> Roles { get; set; } = Array.Empty<RoleDto>();
    public IReadOnlyList<UserBranchDto> Branches { get; set; } = Array.Empty<UserBranchDto>();
}

public sealed class RoleDto
{
    public Guid RoleId { get; set; }
    public string RoleCode { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
}

public sealed class UserBranchDto
{
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public string BranchCode { get; set; } = string.Empty;
}

public sealed class CreateStaffUserRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public IReadOnlyList<string> RoleCodes { get; set; } = Array.Empty<string>();
    public IReadOnlyList<Guid> BranchIds { get; set; } = Array.Empty<Guid>();
}

public sealed class UpdateStaffUserRequest
{
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public IReadOnlyList<string>? RoleCodes { get; set; }
    public IReadOnlyList<Guid>? BranchIds { get; set; }
}

public sealed class EmailTemplateDto
{
    public Guid Id { get; set; }
    public Guid? TenantId { get; set; }
    public string TemplateKey { get; set; } = string.Empty;
    public string Culture { get; set; } = "es";
    public string Subject { get; set; } = string.Empty;
    public string HtmlBody { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? PrimaryColor { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public sealed class EmailTemplateUpsertRequest
{
    public string TemplateKey { get; set; } = string.Empty;
    public string Culture { get; set; } = "es";
    public string Subject { get; set; } = string.Empty;
    public string HtmlBody { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? PrimaryColor { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class FeatureFlagDto
{
    public string FeatureKey { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public string ResolvedFrom { get; set; } = string.Empty;
}

public sealed class SetFeatureFlagRequest
{
    public string FeatureKey { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public Guid? BranchId { get; set; }
}
