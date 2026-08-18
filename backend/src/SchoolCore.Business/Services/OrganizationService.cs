using Microsoft.Data.SqlClient;
using SchoolCore.Business.Security;
using SchoolCore.Common.Exceptions;
using SchoolCore.Common.Security;
using SchoolCore.Common.Time;
using SchoolCore.Common.Validation;
using SchoolCore.DataAccess.Repositories;
using SchoolCore.Models.Dtos.Common;
using SchoolCore.Models.Dtos.Organization;

namespace SchoolCore.Business.Services;

public interface IOrganizationService
{
    Task<PagedResult<BranchDto>> ListBranchesAsync(PagedRequest paging, string? search, CancellationToken ct = default);
    Task<BranchDto> GetBranchAsync(Guid id, CancellationToken ct = default);
    Task<BranchDto> CreateBranchAsync(BranchUpsertRequest request, CancellationToken ct = default);
    Task<BranchDto> UpdateBranchAsync(Guid id, BranchUpsertRequest request, CancellationToken ct = default);
    Task DeleteBranchAsync(Guid id, CancellationToken ct = default);

    Task<PagedResult<SchoolCycleDto>> ListSchoolCyclesAsync(PagedRequest paging, string? search, CancellationToken ct = default);
    Task<SchoolCycleDto> GetSchoolCycleAsync(Guid id, CancellationToken ct = default);
    Task<SchoolCycleDto> CreateSchoolCycleAsync(SchoolCycleUpsertRequest request, CancellationToken ct = default);
    Task<SchoolCycleDto> UpdateSchoolCycleAsync(Guid id, SchoolCycleUpsertRequest request, CancellationToken ct = default);
    Task DeleteSchoolCycleAsync(Guid id, CancellationToken ct = default);

    Task<InstitutionSettingsDto?> GetInstitutionSettingsAsync(CancellationToken ct = default);
    Task<InstitutionSettingsDto> UpsertInstitutionSettingsAsync(InstitutionSettingsUpsertRequest request, CancellationToken ct = default);

    Task<IReadOnlyList<TimeZoneCatalogItemDto>> ListTimeZonesAsync(CancellationToken ct = default);
    Task<EffectiveTimeZoneDto> ResolveTimeZoneAsync(Guid? branchId, CancellationToken ct = default);

    Task<PagedResult<EducationLevelDto>> ListEducationLevelsAsync(PagedRequest paging, string? search, CancellationToken ct = default);
    Task<EducationLevelDto> GetEducationLevelAsync(Guid id, CancellationToken ct = default);
    Task<EducationLevelDto> CreateEducationLevelAsync(EducationLevelUpsertRequest request, CancellationToken ct = default);
    Task<EducationLevelDto> UpdateEducationLevelAsync(Guid id, EducationLevelUpsertRequest request, CancellationToken ct = default);
    Task DeleteEducationLevelAsync(Guid id, CancellationToken ct = default);

    Task<PagedResult<PaymentMethodDto>> ListPaymentMethodsAsync(PagedRequest paging, string? search, CancellationToken ct = default);
    Task<PaymentMethodDto> GetPaymentMethodAsync(Guid id, CancellationToken ct = default);
    Task<PaymentMethodDto> CreatePaymentMethodAsync(PaymentMethodUpsertRequest request, CancellationToken ct = default);
    Task<PaymentMethodDto> UpdatePaymentMethodAsync(Guid id, PaymentMethodUpsertRequest request, CancellationToken ct = default);
    Task DeletePaymentMethodAsync(Guid id, CancellationToken ct = default);

    Task<PagedResult<PaymentConceptDto>> ListPaymentConceptsAsync(PagedRequest paging, string? search, CancellationToken ct = default);
    Task<PaymentConceptDto> GetPaymentConceptAsync(Guid id, CancellationToken ct = default);
    Task<PaymentConceptDto> CreatePaymentConceptAsync(PaymentConceptUpsertRequest request, CancellationToken ct = default);
    Task<PaymentConceptDto> UpdatePaymentConceptAsync(Guid id, PaymentConceptUpsertRequest request, CancellationToken ct = default);
    Task DeletePaymentConceptAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<PaymentConceptAmountDto>> SetPaymentConceptAmountsAsync(Guid id, SetPaymentConceptAmountsRequest request, CancellationToken ct = default);

    Task<PagedResult<StaffUserDto>> ListStaffAsync(PagedRequest paging, string? search, CancellationToken ct = default);
    Task<StaffUserDto> GetStaffAsync(Guid id, CancellationToken ct = default);
    Task<StaffUserDto> CreateStaffAsync(CreateStaffUserRequest request, CancellationToken ct = default);
    Task<StaffUserDto> UpdateStaffAsync(Guid id, UpdateStaffUserRequest request, CancellationToken ct = default);
    Task DeleteStaffAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<RoleDto>> ListRolesAsync(CancellationToken ct = default);

    Task<IReadOnlyList<EmailTemplateDto>> ListEmailTemplatesAsync(CancellationToken ct = default);
    Task<EmailTemplateDto> GetEmailTemplateAsync(Guid id, CancellationToken ct = default);
    Task<EmailTemplateDto> UpsertEmailTemplateAsync(EmailTemplateUpsertRequest request, CancellationToken ct = default);
    Task DeactivateEmailTemplateAsync(Guid id, CancellationToken ct = default);

    Task<IReadOnlyList<FeatureFlagDto>> ListFeatureFlagsAsync(Guid? branchId, CancellationToken ct = default);
    Task SetFeatureFlagAsync(SetFeatureFlagRequest request, CancellationToken ct = default);

    Task<IReadOnlyList<RolePermissionGrantDto>> GetRolePermissionsAsync(Guid roleId, CancellationToken ct = default);
    Task<IReadOnlyList<RolePermissionGrantDto>> ReplaceRolePermissionsAsync(Guid roleId, ReplaceRolePermissionsRequest request, CancellationToken ct = default);
}

public sealed class OrganizationService : IOrganizationService
{
    private readonly IOrganizationRepository _repo;
    private readonly IRolePermissionRepository _rolePermissions;
    private readonly IPermissionResolver _permissionResolver;
    private readonly ITenantContext _tenant;
    private readonly IAuthService _auth;

    public OrganizationService(
        IOrganizationRepository repo,
        IRolePermissionRepository rolePermissions,
        IPermissionResolver permissionResolver,
        ITenantContext tenant,
        IAuthService auth)
    {
        _repo = repo;
        _rolePermissions = rolePermissions;
        _permissionResolver = permissionResolver;
        _tenant = tenant;
        _auth = auth;
    }

    private (Guid TenantId, Guid UserId) Ctx() => TenantGuard.Require(_tenant);

    private static async Task<T> ExecAsync<T>(Func<Task<T>> action)
    {
        try { return await action(); }
        catch (SqlException ex) when (ex.Number is 51001 or 51009) { throw AppException.Conflict(ex.Message); }
        catch (SqlException ex) when (ex.Number == 51004) { throw AppException.NotFound(ex.Message); }
        catch (SqlException ex) { throw AppException.BadRequest(ex.Message); }
    }

    private static async Task ExecAsync(Func<Task> action)
    {
        try { await action(); }
        catch (SqlException ex) when (ex.Number is 51001 or 51009) { throw AppException.Conflict(ex.Message); }
        catch (SqlException ex) when (ex.Number == 51004) { throw AppException.NotFound(ex.Message); }
        catch (SqlException ex) { throw AppException.BadRequest(ex.Message); }
    }

    public async Task<PagedResult<BranchDto>> ListBranchesAsync(PagedRequest paging, string? search, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        paging.Normalize();
        return await _repo.ListBranchesAsync(tenantId, paging.Page, paging.PageSize, search, ct);
    }

    public async Task<BranchDto> GetBranchAsync(Guid id, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        return await _repo.GetBranchAsync(tenantId, id, ct) ?? throw AppException.NotFound("Branch not found.");
    }

    public Task<BranchDto> CreateBranchAsync(BranchUpsertRequest request, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        ValidateBranch(request);
        return ExecAsync(() => _repo.CreateBranchAsync(tenantId, Guid.NewGuid(), request, userId, ct));
    }

    public Task<BranchDto> UpdateBranchAsync(Guid id, BranchUpsertRequest request, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        ValidateBranch(request);
        return ExecAsync(() => _repo.UpdateBranchAsync(tenantId, id, request, userId, ct));
    }

    public Task DeleteBranchAsync(Guid id, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        return ExecAsync(() => _repo.SoftDeleteBranchAsync(tenantId, id, userId, ct));
    }

    public async Task<PagedResult<SchoolCycleDto>> ListSchoolCyclesAsync(PagedRequest paging, string? search, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        paging.Normalize();
        return await _repo.ListSchoolCyclesAsync(tenantId, paging.Page, paging.PageSize, search, ct);
    }

    public async Task<SchoolCycleDto> GetSchoolCycleAsync(Guid id, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        return await _repo.GetSchoolCycleAsync(tenantId, id, ct) ?? throw AppException.NotFound("SchoolCycle not found.");
    }

    public Task<SchoolCycleDto> CreateSchoolCycleAsync(SchoolCycleUpsertRequest request, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        if (string.IsNullOrWhiteSpace(request.Name)) throw AppException.BadRequest("Name is required.");
        return ExecAsync(() => _repo.CreateSchoolCycleAsync(tenantId, Guid.NewGuid(), request, userId, ct));
    }

    public Task<SchoolCycleDto> UpdateSchoolCycleAsync(Guid id, SchoolCycleUpsertRequest request, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        return ExecAsync(() => _repo.UpdateSchoolCycleAsync(tenantId, id, request, userId, ct));
    }

    public Task DeleteSchoolCycleAsync(Guid id, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        return ExecAsync(() => _repo.SoftDeleteSchoolCycleAsync(tenantId, id, userId, ct));
    }

    public async Task<InstitutionSettingsDto?> GetInstitutionSettingsAsync(CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        return await _repo.GetInstitutionSettingsAsync(tenantId, ct);
    }

    public Task<InstitutionSettingsDto> UpsertInstitutionSettingsAsync(InstitutionSettingsUpsertRequest request, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        FieldValidator.ThrowIfInvalid(
            FieldValidator.TextFree(request.DisplayName, FieldStandards.InstitutionDisplayNameMax, "Nombre", required: true, minLen: 2),
            FieldValidator.TextFree(request.LegalName, FieldStandards.LegalNameMax, "Razón social"),
            FieldValidator.Code(request.TaxId, FieldStandards.TaxIdMax, "RFC"),
            FieldValidator.TextFree(request.Website, FieldStandards.WebsiteMax, "Sitio web"),
            FieldValidator.Phone(request.Phone),
            FieldValidator.Email(request.Email),
            FieldValidator.TextFree(request.Address, FieldStandards.AddressMax, "Dirección"));
        EnsureAllowedTimeZone(request.TimeZoneId, required: true);
        return ExecAsync(() => _repo.UpsertInstitutionSettingsAsync(tenantId, request, userId, ct));
    }

    public Task<IReadOnlyList<TimeZoneCatalogItemDto>> ListTimeZonesAsync(CancellationToken ct = default)
        => _repo.ListTimeZonesAsync(ct);

    public async Task<EffectiveTimeZoneDto> ResolveTimeZoneAsync(Guid? branchId, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        return await _repo.ResolveTimeZoneAsync(tenantId, branchId, ct);
    }

    public async Task<PagedResult<EducationLevelDto>> ListEducationLevelsAsync(PagedRequest paging, string? search, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        paging.Normalize();
        return await _repo.ListEducationLevelsAsync(tenantId, paging.Page, paging.PageSize, search, ct);
    }

    public async Task<EducationLevelDto> GetEducationLevelAsync(Guid id, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        return await _repo.GetEducationLevelAsync(tenantId, id, ct) ?? throw AppException.NotFound("EducationLevel not found.");
    }

    public Task<EducationLevelDto> CreateEducationLevelAsync(EducationLevelUpsertRequest request, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Code)) throw AppException.BadRequest("Name and Code are required.");
        return ExecAsync(() => _repo.CreateEducationLevelAsync(tenantId, Guid.NewGuid(), request, userId, ct));
    }

    public Task<EducationLevelDto> UpdateEducationLevelAsync(Guid id, EducationLevelUpsertRequest request, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        return ExecAsync(() => _repo.UpdateEducationLevelAsync(tenantId, id, request, userId, ct));
    }

    public Task DeleteEducationLevelAsync(Guid id, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        return ExecAsync(() => _repo.SoftDeleteEducationLevelAsync(tenantId, id, userId, ct));
    }

    public async Task<PagedResult<PaymentMethodDto>> ListPaymentMethodsAsync(PagedRequest paging, string? search, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        paging.Normalize();
        return await _repo.ListPaymentMethodsAsync(tenantId, paging.Page, paging.PageSize, search, ct);
    }

    public async Task<PaymentMethodDto> GetPaymentMethodAsync(Guid id, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        return await _repo.GetPaymentMethodAsync(tenantId, id, ct) ?? throw AppException.NotFound("PaymentMethod not found.");
    }

    public Task<PaymentMethodDto> CreatePaymentMethodAsync(PaymentMethodUpsertRequest request, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        if (string.IsNullOrWhiteSpace(request.Name)) throw AppException.BadRequest("Name is required.");
        return ExecAsync(() => _repo.CreatePaymentMethodAsync(tenantId, Guid.NewGuid(), request, userId, ct));
    }

    public Task<PaymentMethodDto> UpdatePaymentMethodAsync(Guid id, PaymentMethodUpsertRequest request, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        return ExecAsync(() => _repo.UpdatePaymentMethodAsync(tenantId, id, request, userId, ct));
    }

    public Task DeletePaymentMethodAsync(Guid id, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        return ExecAsync(() => _repo.SoftDeletePaymentMethodAsync(tenantId, id, userId, ct));
    }

    public async Task<PagedResult<PaymentConceptDto>> ListPaymentConceptsAsync(PagedRequest paging, string? search, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        paging.Normalize();
        return await _repo.ListPaymentConceptsAsync(tenantId, paging.Page, paging.PageSize, search, ct);
    }

    public async Task<PaymentConceptDto> GetPaymentConceptAsync(Guid id, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        return await _repo.GetPaymentConceptAsync(tenantId, id, ct) ?? throw AppException.NotFound("PaymentConcept not found.");
    }

    public Task<PaymentConceptDto> CreatePaymentConceptAsync(PaymentConceptUpsertRequest request, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        if (string.IsNullOrWhiteSpace(request.Name)) throw AppException.BadRequest("Name is required.");
        return ExecAsync(() => _repo.CreatePaymentConceptAsync(tenantId, Guid.NewGuid(), request, userId, ct));
    }

    public Task<PaymentConceptDto> UpdatePaymentConceptAsync(Guid id, PaymentConceptUpsertRequest request, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        return ExecAsync(() => _repo.UpdatePaymentConceptAsync(tenantId, id, request, userId, ct));
    }

    public Task DeletePaymentConceptAsync(Guid id, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        return ExecAsync(() => _repo.SoftDeletePaymentConceptAsync(tenantId, id, userId, ct));
    }

    public Task<IReadOnlyList<PaymentConceptAmountDto>> SetPaymentConceptAmountsAsync(Guid id, SetPaymentConceptAmountsRequest request, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        return ExecAsync(() => _repo.SetPaymentConceptAmountsAsync(tenantId, id, request.Amounts, ct));
    }

    public async Task<PagedResult<StaffUserDto>> ListStaffAsync(PagedRequest paging, string? search, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        paging.Normalize();
        return await _repo.ListStaffAsync(tenantId, paging.Page, paging.PageSize, search, ct);
    }

    public async Task<StaffUserDto> GetStaffAsync(Guid id, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        return await _repo.GetStaffAsync(tenantId, id, ct) ?? throw AppException.NotFound("User not found.");
    }

    public async Task<StaffUserDto> CreateStaffAsync(CreateStaffUserRequest request, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        FieldValidator.ThrowIfInvalid(
            FieldValidator.Email(request.Email, required: true),
            FieldValidator.Password(request.Password),
            FieldValidator.PersonName(request.FirstName, "El nombre"),
            FieldValidator.PersonName(request.LastName, "Los apellidos"));

        var hash = _auth.HashPassword(request.Password);
        var created = await ExecAsync(() => _repo.CreateStaffAsync(tenantId, Guid.NewGuid(), request.Email.Trim(), hash, request.FirstName, request.LastName, request.IsActive, userId, ct));
        if (request.RoleCodes.Count > 0)
            await ExecAsync(() => _repo.SetRolesAsync(tenantId, created.Id, request.RoleCodes, ct));
        if (request.BranchIds.Count > 0)
            await ExecAsync(() => _repo.SetBranchesAsync(tenantId, created.Id, request.BranchIds, ct));
        return await GetStaffAsync(created.Id, ct);
    }

    public async Task<StaffUserDto> UpdateStaffAsync(Guid id, UpdateStaffUserRequest request, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        await ExecAsync(() => _repo.UpdateStaffAsync(tenantId, id, request, userId, ct));
        if (request.RoleCodes is not null)
            await ExecAsync(() => _repo.SetRolesAsync(tenantId, id, request.RoleCodes, ct));
        if (request.BranchIds is not null)
            await ExecAsync(() => _repo.SetBranchesAsync(tenantId, id, request.BranchIds, ct));
        return await GetStaffAsync(id, ct);
    }

    public Task DeleteStaffAsync(Guid id, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        return ExecAsync(() => _repo.SoftDeleteStaffAsync(tenantId, id, userId, ct));
    }

    public Task<IReadOnlyList<RoleDto>> ListRolesAsync(CancellationToken ct = default)
    {
        Ctx();
        return _repo.ListRolesAsync(ct);
    }

    public async Task<IReadOnlyList<EmailTemplateDto>> ListEmailTemplatesAsync(CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        return await _repo.ListEmailTemplatesAsync(tenantId, ct);
    }

    public async Task<EmailTemplateDto> GetEmailTemplateAsync(Guid id, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        return await _repo.GetEmailTemplateAsync(tenantId, id, ct) ?? throw AppException.NotFound("EmailTemplate not found.");
    }

    public Task<EmailTemplateDto> UpsertEmailTemplateAsync(EmailTemplateUpsertRequest request, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        if (string.IsNullOrWhiteSpace(request.TemplateKey)) throw AppException.BadRequest("TemplateKey is required.");
        return ExecAsync(() => _repo.UpsertEmailTemplateAsync(tenantId, Guid.NewGuid(), request, ct));
    }

    public Task DeactivateEmailTemplateAsync(Guid id, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        return ExecAsync(() => _repo.DeactivateEmailTemplateAsync(tenantId, id, ct));
    }

    public async Task<IReadOnlyList<FeatureFlagDto>> ListFeatureFlagsAsync(Guid? branchId, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        return await _repo.ListFeatureFlagsAsync(tenantId, branchId, ct);
    }

    public Task SetFeatureFlagAsync(SetFeatureFlagRequest request, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        if (string.IsNullOrWhiteSpace(request.FeatureKey)) throw AppException.BadRequest("FeatureKey is required.");
        if (request.BranchId.HasValue)
            return ExecAsync(() => _repo.SetBranchFeatureFlagAsync(tenantId, request.BranchId.Value, request.FeatureKey, request.IsEnabled, ct));
        return ExecAsync(() => _repo.SetTenantFeatureFlagAsync(tenantId, request.FeatureKey, request.IsEnabled, ct));
    }

    public async Task<IReadOnlyList<RolePermissionGrantDto>> GetRolePermissionsAsync(Guid roleId, CancellationToken ct = default)
    {
        _ = Ctx();
        var rows = await _rolePermissions.ListByRoleIdAsync(roleId, ct);
        return AggregateGrants(rows);
    }

    public async Task<IReadOnlyList<RolePermissionGrantDto>> ReplaceRolePermissionsAsync(
        Guid roleId, ReplaceRolePermissionsRequest request, CancellationToken ct = default)
    {
        _ = Ctx();
        var flat = (request.Grants ?? Array.Empty<RolePermissionGrantDto>())
            .Where(g => !string.IsNullOrWhiteSpace(g.ViewCode))
            .SelectMany(g => (g.Actions ?? Array.Empty<string>())
                .Where(a => !string.IsNullOrWhiteSpace(a))
                .Select(a => (g.ViewCode.Trim(), a.Trim())));

        try
        {
            var rows = await _rolePermissions.ReplaceForRoleAsync(roleId, flat, ct);
            _permissionResolver.InvalidateCache();
            return AggregateGrants(rows);
        }
        catch (SqlException ex) when (ex.Number is 51001 or 51002)
        {
            throw AppException.BadRequest(ex.Message);
        }
    }

    private static IReadOnlyList<RolePermissionGrantDto> AggregateGrants(
        IReadOnlyList<(string ViewCode, string ActionCode)> rows)
    {
        return rows
            .GroupBy(r => r.ViewCode, StringComparer.OrdinalIgnoreCase)
            .Select(g => new RolePermissionGrantDto
            {
                ViewCode = g.Key,
                Actions = g.Select(x => x.ActionCode).Distinct(StringComparer.OrdinalIgnoreCase)
                    .OrderBy(a => a, StringComparer.Ordinal).ToList()
            })
            .OrderBy(g => g.ViewCode, StringComparer.Ordinal)
            .ToList();
    }

    private static void ValidateBranch(BranchUpsertRequest request)
    {
        FieldValidator.ThrowIfInvalid(
            FieldValidator.TextFree(request.Name, FieldStandards.BranchNameMax, "Nombre", required: true, minLen: 2),
            FieldValidator.Code(request.Code, FieldStandards.BranchCodeMax, "Código", required: true),
            FieldValidator.TextFree(request.Address, FieldStandards.BranchAddressMax, "Dirección"),
            FieldValidator.TextFree(request.City, FieldStandards.CityMax, "Ciudad"),
            FieldValidator.TextFree(request.State, FieldStandards.StateMax, "Estado"),
            FieldValidator.PostalCodeMx(request.PostalCode),
            FieldValidator.Phone(request.Phone),
            FieldValidator.Email(request.Email),
            FieldValidator.TextFree(request.DirectorName, 200, "Director"),
            FieldValidator.Email(request.DirectorEmail),
            FieldValidator.Phone(request.DirectorPhone, label: "Teléfono del director"));

        if (!string.IsNullOrWhiteSpace(request.TimeZoneId))
            EnsureAllowedTimeZone(request.TimeZoneId, required: true);
    }

    /// <summary>
    /// Valida catálogo cerrado. No convierte ni reescribe fechas históricas.
    /// </summary>
    private static void EnsureAllowedTimeZone(string? timeZoneId, bool required)
    {
        if (string.IsNullOrWhiteSpace(timeZoneId))
        {
            if (required)
                throw AppException.BadRequest("TimeZoneId is required.");
            return;
        }

        if (!SchoolCoreTimeZones.IsAllowed(timeZoneId))
            throw AppException.BadRequest($"Time zone '{timeZoneId}' is not allowed.");
    }
}
