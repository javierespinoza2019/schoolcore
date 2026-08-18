using System.Data;
using System.Data.Common;
using System.Text.Json;
using Dapper;
using SchoolCore.Models.Dtos.Common;
using SchoolCore.Models.Dtos.Organization;

namespace SchoolCore.DataAccess.Repositories;

public interface IOrganizationRepository
{
    Task<PagedResult<BranchDto>> ListBranchesAsync(Guid tenantId, int page, int pageSize, string? search, CancellationToken ct = default);
    Task<BranchDto?> GetBranchAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<BranchDto> CreateBranchAsync(Guid tenantId, Guid id, BranchUpsertRequest request, Guid? userId, CancellationToken ct = default);
    Task<BranchDto> UpdateBranchAsync(Guid tenantId, Guid id, BranchUpsertRequest request, Guid? userId, CancellationToken ct = default);
    Task SoftDeleteBranchAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default);

    Task<PagedResult<SchoolCycleDto>> ListSchoolCyclesAsync(Guid tenantId, int page, int pageSize, string? search, CancellationToken ct = default);
    Task<SchoolCycleDto?> GetSchoolCycleAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<SchoolCycleDto> CreateSchoolCycleAsync(Guid tenantId, Guid id, SchoolCycleUpsertRequest request, Guid? userId, CancellationToken ct = default);
    Task<SchoolCycleDto> UpdateSchoolCycleAsync(Guid tenantId, Guid id, SchoolCycleUpsertRequest request, Guid? userId, CancellationToken ct = default);
    Task SoftDeleteSchoolCycleAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default);

    Task<InstitutionSettingsDto?> GetInstitutionSettingsAsync(Guid tenantId, CancellationToken ct = default);
    Task<InstitutionSettingsDto> UpsertInstitutionSettingsAsync(Guid tenantId, InstitutionSettingsUpsertRequest request, Guid? userId, CancellationToken ct = default);

    Task<IReadOnlyList<TimeZoneCatalogItemDto>> ListTimeZonesAsync(CancellationToken ct = default);
    Task<EffectiveTimeZoneDto> ResolveTimeZoneAsync(Guid tenantId, Guid? branchId, CancellationToken ct = default);

    Task<PagedResult<EducationLevelDto>> ListEducationLevelsAsync(Guid tenantId, int page, int pageSize, string? search, CancellationToken ct = default);
    Task<EducationLevelDto?> GetEducationLevelAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<EducationLevelDto> CreateEducationLevelAsync(Guid tenantId, Guid id, EducationLevelUpsertRequest request, Guid? userId, CancellationToken ct = default);
    Task<EducationLevelDto> UpdateEducationLevelAsync(Guid tenantId, Guid id, EducationLevelUpsertRequest request, Guid? userId, CancellationToken ct = default);
    Task SoftDeleteEducationLevelAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default);

    Task<PagedResult<PaymentMethodDto>> ListPaymentMethodsAsync(Guid tenantId, int page, int pageSize, string? search, CancellationToken ct = default);
    Task<PaymentMethodDto?> GetPaymentMethodAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<PaymentMethodDto> CreatePaymentMethodAsync(Guid tenantId, Guid id, PaymentMethodUpsertRequest request, Guid? userId, CancellationToken ct = default);
    Task<PaymentMethodDto> UpdatePaymentMethodAsync(Guid tenantId, Guid id, PaymentMethodUpsertRequest request, Guid? userId, CancellationToken ct = default);
    Task SoftDeletePaymentMethodAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default);

    Task<PagedResult<PaymentConceptDto>> ListPaymentConceptsAsync(Guid tenantId, int page, int pageSize, string? search, CancellationToken ct = default);
    Task<PaymentConceptDto?> GetPaymentConceptAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<PaymentConceptDto> CreatePaymentConceptAsync(Guid tenantId, Guid id, PaymentConceptUpsertRequest request, Guid? userId, CancellationToken ct = default);
    Task<PaymentConceptDto> UpdatePaymentConceptAsync(Guid tenantId, Guid id, PaymentConceptUpsertRequest request, Guid? userId, CancellationToken ct = default);
    Task SoftDeletePaymentConceptAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default);
    Task<IReadOnlyList<PaymentConceptAmountDto>> SetPaymentConceptAmountsAsync(Guid tenantId, Guid conceptId, IReadOnlyList<PaymentConceptAmountItem> amounts, CancellationToken ct = default);

    Task<PagedResult<StaffUserDto>> ListStaffAsync(Guid tenantId, int page, int pageSize, string? search, CancellationToken ct = default);
    Task<StaffUserDto?> GetStaffAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<StaffUserDto> CreateStaffAsync(Guid tenantId, Guid id, string email, string passwordHash, string firstName, string lastName, bool isActive, Guid? userId, CancellationToken ct = default);
    Task<StaffUserDto> UpdateStaffAsync(Guid tenantId, Guid id, UpdateStaffUserRequest request, Guid? userId, CancellationToken ct = default);
    Task SoftDeleteStaffAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default);
    Task<IReadOnlyList<RoleDto>> SetRolesAsync(Guid tenantId, Guid userId, IEnumerable<string> roleCodes, CancellationToken ct = default);
    Task<IReadOnlyList<UserBranchDto>> SetBranchesAsync(Guid tenantId, Guid userId, IEnumerable<Guid> branchIds, CancellationToken ct = default);
    Task<IReadOnlyList<RoleDto>> ListRolesAsync(CancellationToken ct = default);

    Task<IReadOnlyList<EmailTemplateDto>> ListEmailTemplatesAsync(Guid tenantId, CancellationToken ct = default);
    Task<EmailTemplateDto?> GetEmailTemplateAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<EmailTemplateDto?> ResolveEmailTemplateAsync(Guid tenantId, string templateKey, string culture = "es", CancellationToken ct = default);
    Task<EmailTemplateDto> UpsertEmailTemplateAsync(Guid tenantId, Guid id, EmailTemplateUpsertRequest request, CancellationToken ct = default);
    Task DeactivateEmailTemplateAsync(Guid tenantId, Guid id, CancellationToken ct = default);

    Task<IReadOnlyList<FeatureFlagDto>> ListFeatureFlagsAsync(Guid tenantId, Guid? branchId, CancellationToken ct = default);
    Task<bool> ResolveFeatureFlagAsync(Guid tenantId, Guid? branchId, string featureKey, CancellationToken ct = default);
    Task SetTenantFeatureFlagAsync(Guid tenantId, string featureKey, bool isEnabled, CancellationToken ct = default);
    Task SetBranchFeatureFlagAsync(Guid tenantId, Guid branchId, string featureKey, bool isEnabled, CancellationToken ct = default);
}

public sealed class OrganizationRepository : IOrganizationRepository
{
    private readonly ISqlConnectionFactory _factory;

    public OrganizationRepository(ISqlConnectionFactory factory) => _factory = factory;

    private async Task<DbConnection> OpenAsync(CancellationToken ct) =>
        (DbConnection)await _factory.CreateOpenConnectionAsync(ct);

    public async Task<PagedResult<BranchDto>> ListBranchesAsync(Guid tenantId, int page, int pageSize, string? search, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var p = new DynamicParameters(new { TenantId = tenantId, Page = page, PageSize = pageSize, Search = search });
        var (items, total) = await DapperPaging.QueryPagedAsync<BranchDto>(conn, "sp_Branch_List", p, ct);
        return DapperPaging.ToPagedResult(items, total, page, pageSize);
    }

    public async Task<BranchDto?> GetBranchAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<BranchDto>(new CommandDefinition("sp_Branch_GetById", new { TenantId = tenantId, Id = id }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<BranchDto> CreateBranchAsync(Guid tenantId, Guid id, BranchUpsertRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<BranchDto>(new CommandDefinition("sp_Branch_Create", new
        {
            Id = id,
            TenantId = tenantId,
            request.Name,
            request.Code,
            request.IsActive,
            request.Address,
            request.City,
            request.State,
            request.PostalCode,
            request.Phone,
            request.Email,
            request.TimeZoneId,
            request.DirectorName,
            request.DirectorEmail,
            request.DirectorPhone,
            request.Capacity,
            request.OpenedAt,
            request.Area,
            request.Levels,
            request.OperationalStatus,
            request.PhotoUrl,
            CreatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<BranchDto> UpdateBranchAsync(Guid tenantId, Guid id, BranchUpsertRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<BranchDto>(new CommandDefinition("sp_Branch_Update", new
        {
            TenantId = tenantId,
            Id = id,
            request.Name,
            request.Code,
            request.IsActive,
            request.Address,
            request.City,
            request.State,
            request.PostalCode,
            request.Phone,
            request.Email,
            request.TimeZoneId,
            request.DirectorName,
            request.DirectorEmail,
            request.DirectorPhone,
            request.Capacity,
            request.OpenedAt,
            request.Area,
            request.Levels,
            request.OperationalStatus,
            request.PhotoUrl,
            UpdatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task SoftDeleteBranchAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition("sp_Branch_SoftDelete", new { TenantId = tenantId, Id = id, UpdatedBy = userId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<PagedResult<SchoolCycleDto>> ListSchoolCyclesAsync(Guid tenantId, int page, int pageSize, string? search, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var p = new DynamicParameters(new { TenantId = tenantId, Page = page, PageSize = pageSize, Search = search });
        var (items, total) = await DapperPaging.QueryPagedAsync<SchoolCycleDto>(conn, "sp_SchoolCycle_List", p, ct);
        return DapperPaging.ToPagedResult(items, total, page, pageSize);
    }

    public async Task<SchoolCycleDto?> GetSchoolCycleAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<SchoolCycleDto>(new CommandDefinition("sp_SchoolCycle_GetById", new { TenantId = tenantId, Id = id }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<SchoolCycleDto> CreateSchoolCycleAsync(Guid tenantId, Guid id, SchoolCycleUpsertRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<SchoolCycleDto>(new CommandDefinition("sp_SchoolCycle_Create", new
        {
            Id = id,
            TenantId = tenantId,
            request.Name,
            request.StartDate,
            request.EndDate,
            request.IsActive,
            CreatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<SchoolCycleDto> UpdateSchoolCycleAsync(Guid tenantId, Guid id, SchoolCycleUpsertRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<SchoolCycleDto>(new CommandDefinition("sp_SchoolCycle_Update", new
        {
            TenantId = tenantId,
            Id = id,
            request.Name,
            request.StartDate,
            request.EndDate,
            request.IsActive,
            UpdatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task SoftDeleteSchoolCycleAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition("sp_SchoolCycle_SoftDelete", new { TenantId = tenantId, Id = id, UpdatedBy = userId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<InstitutionSettingsDto?> GetInstitutionSettingsAsync(Guid tenantId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<InstitutionSettingsDto>(new CommandDefinition("sp_InstitutionSettings_Get", new { TenantId = tenantId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<InstitutionSettingsDto> UpsertInstitutionSettingsAsync(Guid tenantId, InstitutionSettingsUpsertRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<InstitutionSettingsDto>(new CommandDefinition("sp_InstitutionSettings_Upsert", new
        {
            TenantId = tenantId,
            request.DisplayName,
            request.LegalName,
            request.TaxId,
            request.Phone,
            request.Email,
            request.Website,
            request.Address,
            request.LogoUrl,
            request.PrimaryColor,
            request.TimeZoneId,
            UpdatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<IReadOnlyList<TimeZoneCatalogItemDto>> ListTimeZonesAsync(CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var rows = await conn.QueryAsync<TimeZoneCatalogItemDto>(new CommandDefinition(
            "sp_TimeZone_ListCatalog",
            commandType: CommandType.StoredProcedure,
            cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<EffectiveTimeZoneDto> ResolveTimeZoneAsync(Guid tenantId, Guid? branchId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<EffectiveTimeZoneDto>(new CommandDefinition(
            "sp_TimeZone_Resolve",
            new { TenantId = tenantId, BranchId = branchId },
            commandType: CommandType.StoredProcedure,
            cancellationToken: ct));
    }

    public async Task<PagedResult<EducationLevelDto>> ListEducationLevelsAsync(Guid tenantId, int page, int pageSize, string? search, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var p = new DynamicParameters(new { TenantId = tenantId, Page = page, PageSize = pageSize, Search = search });
        var (items, total) = await DapperPaging.QueryPagedAsync<EducationLevelDto>(conn, "sp_EducationLevel_List", p, ct);
        return DapperPaging.ToPagedResult(items, total, page, pageSize);
    }

    public async Task<EducationLevelDto?> GetEducationLevelAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<EducationLevelDto>(new CommandDefinition("sp_EducationLevel_GetById", new { TenantId = tenantId, Id = id }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<EducationLevelDto> CreateEducationLevelAsync(Guid tenantId, Guid id, EducationLevelUpsertRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<EducationLevelDto>(new CommandDefinition("sp_EducationLevel_Create", new
        {
            Id = id,
            TenantId = tenantId,
            request.Name,
            request.Code,
            request.GradeCount,
            request.SortOrder,
            request.IsActive,
            CreatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<EducationLevelDto> UpdateEducationLevelAsync(Guid tenantId, Guid id, EducationLevelUpsertRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<EducationLevelDto>(new CommandDefinition("sp_EducationLevel_Update", new
        {
            TenantId = tenantId,
            Id = id,
            request.Name,
            request.Code,
            request.GradeCount,
            request.SortOrder,
            request.IsActive,
            UpdatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task SoftDeleteEducationLevelAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition("sp_EducationLevel_SoftDelete", new { TenantId = tenantId, Id = id, UpdatedBy = userId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<PagedResult<PaymentMethodDto>> ListPaymentMethodsAsync(Guid tenantId, int page, int pageSize, string? search, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var p = new DynamicParameters(new { TenantId = tenantId, Page = page, PageSize = pageSize, Search = search });
        var (items, total) = await DapperPaging.QueryPagedAsync<PaymentMethodDto>(conn, "sp_PaymentMethod_List", p, ct);
        return DapperPaging.ToPagedResult(items, total, page, pageSize);
    }

    public async Task<PaymentMethodDto?> GetPaymentMethodAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<PaymentMethodDto>(new CommandDefinition("sp_PaymentMethod_GetById", new { TenantId = tenantId, Id = id }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<PaymentMethodDto> CreatePaymentMethodAsync(Guid tenantId, Guid id, PaymentMethodUpsertRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<PaymentMethodDto>(new CommandDefinition("sp_PaymentMethod_Create", new
        {
            Id = id,
            TenantId = tenantId,
            request.Name,
            request.Info,
            request.IsActive,
            request.SortOrder,
            CreatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<PaymentMethodDto> UpdatePaymentMethodAsync(Guid tenantId, Guid id, PaymentMethodUpsertRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<PaymentMethodDto>(new CommandDefinition("sp_PaymentMethod_Update", new
        {
            TenantId = tenantId,
            Id = id,
            request.Name,
            request.Info,
            request.IsActive,
            request.SortOrder,
            UpdatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task SoftDeletePaymentMethodAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition("sp_PaymentMethod_SoftDelete", new { TenantId = tenantId, Id = id, UpdatedBy = userId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<PagedResult<PaymentConceptDto>> ListPaymentConceptsAsync(Guid tenantId, int page, int pageSize, string? search, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var p = new DynamicParameters(new { TenantId = tenantId, Page = page, PageSize = pageSize, Search = search });
        var (items, total) = await DapperPaging.QueryPagedAsync<PaymentConceptDto>(conn, "sp_PaymentConcept_List", p, ct);
        return DapperPaging.ToPagedResult(items, total, page, pageSize);
    }

    public async Task<PaymentConceptDto?> GetPaymentConceptAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await using var multi = await conn.QueryMultipleAsync(new CommandDefinition("sp_PaymentConcept_GetById", new { TenantId = tenantId, Id = id }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
        var concept = await multi.ReadSingleOrDefaultAsync<PaymentConceptDto>();
        if (concept is null) return null;
        concept.Amounts = (await multi.ReadAsync<PaymentConceptAmountDto>()).ToList();
        return concept;
    }

    public async Task<PaymentConceptDto> CreatePaymentConceptAsync(Guid tenantId, Guid id, PaymentConceptUpsertRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<PaymentConceptDto>(new CommandDefinition("sp_PaymentConcept_Create", new
        {
            Id = id,
            TenantId = tenantId,
            request.Name,
            request.ConceptType,
            request.DefaultAmount,
            request.DifferentiatedByLevel,
            request.IsActive,
            CreatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<PaymentConceptDto> UpdatePaymentConceptAsync(Guid tenantId, Guid id, PaymentConceptUpsertRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<PaymentConceptDto>(new CommandDefinition("sp_PaymentConcept_Update", new
        {
            TenantId = tenantId,
            Id = id,
            request.Name,
            request.ConceptType,
            request.DefaultAmount,
            request.DifferentiatedByLevel,
            request.IsActive,
            UpdatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task SoftDeletePaymentConceptAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition("sp_PaymentConcept_SoftDelete", new { TenantId = tenantId, Id = id, UpdatedBy = userId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<IReadOnlyList<PaymentConceptAmountDto>> SetPaymentConceptAmountsAsync(Guid tenantId, Guid conceptId, IReadOnlyList<PaymentConceptAmountItem> amounts, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var json = JsonSerializer.Serialize(amounts.Select(a => new { educationLevelId = a.EducationLevelId, amount = a.Amount }));
        var rows = await conn.QueryAsync<PaymentConceptAmountDto>(new CommandDefinition("sp_PaymentConcept_SetAmounts", new
        {
            TenantId = tenantId,
            PaymentConceptId = conceptId,
            AmountsJson = json
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<PagedResult<StaffUserDto>> ListStaffAsync(Guid tenantId, int page, int pageSize, string? search, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var p = new DynamicParameters(new { TenantId = tenantId, Page = page, PageSize = pageSize, Search = search });
        p.Add("TotalCount", dbType: DbType.Int32, direction: ParameterDirection.Output);
        await using var multi = await conn.QueryMultipleAsync(new CommandDefinition(
            "sp_User_ListStaff", p, commandType: CommandType.StoredProcedure, cancellationToken: ct));
        var items = (await multi.ReadAsync<StaffUserDto>()).ToList();
        var roleRows = (await multi.ReadAsync<StaffRoleRow>()).ToList();
        var branchRows = (await multi.ReadAsync<StaffBranchRow>()).ToList();
        var total = p.Get<int>("TotalCount");

        var rolesByUser = roleRows
            .GroupBy(r => r.UserId)
            .ToDictionary(g => g.Key, g => (IReadOnlyList<RoleDto>)g
                .Select(r => new RoleDto { RoleId = r.RoleId, RoleCode = r.RoleCode, RoleName = r.RoleName })
                .ToList());
        var branchesByUser = branchRows
            .GroupBy(b => b.UserId)
            .ToDictionary(g => g.Key, g => (IReadOnlyList<UserBranchDto>)g
                .Select(b => new UserBranchDto { BranchId = b.BranchId, BranchName = b.BranchName, BranchCode = b.BranchCode })
                .ToList());

        foreach (var user in items)
        {
            user.Roles = rolesByUser.TryGetValue(user.Id, out var roles) ? roles : Array.Empty<RoleDto>();
            user.Branches = branchesByUser.TryGetValue(user.Id, out var branches) ? branches : Array.Empty<UserBranchDto>();
        }

        return DapperPaging.ToPagedResult(items, total, page, pageSize);
    }

    private sealed class StaffRoleRow
    {
        public Guid UserId { get; set; }
        public Guid RoleId { get; set; }
        public string RoleCode { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
    }

    private sealed class StaffBranchRow
    {
        public Guid UserId { get; set; }
        public Guid BranchId { get; set; }
        public string BranchName { get; set; } = string.Empty;
        public string BranchCode { get; set; } = string.Empty;
    }

    public async Task<StaffUserDto?> GetStaffAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await using var multi = await conn.QueryMultipleAsync(new CommandDefinition("sp_User_GetStaffById", new { TenantId = tenantId, Id = id }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
        var user = await multi.ReadSingleOrDefaultAsync<StaffUserDto>();
        if (user is null) return null;
        user.Roles = (await multi.ReadAsync<RoleDto>()).ToList();
        user.Branches = (await multi.ReadAsync<UserBranchDto>()).ToList();
        return user;
    }

    public async Task<StaffUserDto> CreateStaffAsync(Guid tenantId, Guid id, string email, string passwordHash, string firstName, string lastName, bool isActive, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<StaffUserDto>(new CommandDefinition("sp_User_CreateStaff", new
        {
            Id = id,
            TenantId = tenantId,
            Email = email,
            PasswordHash = passwordHash,
            FirstName = firstName,
            LastName = lastName,
            IsActive = isActive,
            CreatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<StaffUserDto> UpdateStaffAsync(Guid tenantId, Guid id, UpdateStaffUserRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<StaffUserDto>(new CommandDefinition("sp_User_UpdateStaff", new
        {
            TenantId = tenantId,
            Id = id,
            request.Email,
            request.FirstName,
            request.LastName,
            request.IsActive,
            UpdatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task SoftDeleteStaffAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition("sp_User_SoftDeleteStaff", new { TenantId = tenantId, Id = id, UpdatedBy = userId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<IReadOnlyList<RoleDto>> SetRolesAsync(Guid tenantId, Guid userId, IEnumerable<string> roleCodes, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var csv = string.Join(',', roleCodes);
        var rows = await conn.QueryAsync<RoleDto>(new CommandDefinition("sp_User_SetRoles", new { TenantId = tenantId, UserId = userId, RoleCodesCsv = csv }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<IReadOnlyList<UserBranchDto>> SetBranchesAsync(Guid tenantId, Guid userId, IEnumerable<Guid> branchIds, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var csv = string.Join(',', branchIds);
        var rows = await conn.QueryAsync<UserBranchDto>(new CommandDefinition("sp_User_SetBranches", new { TenantId = tenantId, UserId = userId, BranchIdsCsv = csv }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<IReadOnlyList<RoleDto>> ListRolesAsync(CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var raw = await conn.QueryAsync(new CommandDefinition("sp_Role_List", commandType: CommandType.StoredProcedure, cancellationToken: ct));
        return raw.Select(r => new RoleDto
        {
            RoleId = (Guid)r.Id,
            RoleCode = (string)r.Code,
            RoleName = (string)r.Name,
            UserCount = r.UserCount == null ? 0 : (int)r.UserCount
        }).ToList();
    }

    public async Task<IReadOnlyList<EmailTemplateDto>> ListEmailTemplatesAsync(Guid tenantId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var rows = await conn.QueryAsync<EmailTemplateDto>(new CommandDefinition("sp_EmailTemplate_List", new { TenantId = tenantId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<EmailTemplateDto?> GetEmailTemplateAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<EmailTemplateDto>(new CommandDefinition("sp_EmailTemplate_GetById", new { TenantId = tenantId, Id = id }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<EmailTemplateDto?> ResolveEmailTemplateAsync(Guid tenantId, string templateKey, string culture = "es", CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<EmailTemplateDto>(new CommandDefinition(
            "sp_EmailTemplate_Resolve",
            new { TenantId = tenantId, TemplateKey = templateKey, Culture = culture },
            commandType: CommandType.StoredProcedure,
            cancellationToken: ct));
    }

    public async Task<EmailTemplateDto> UpsertEmailTemplateAsync(Guid tenantId, Guid id, EmailTemplateUpsertRequest request, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<EmailTemplateDto>(new CommandDefinition("sp_EmailTemplate_UpsertTenant", new
        {
            Id = id,
            TenantId = tenantId,
            request.TemplateKey,
            request.Culture,
            request.Subject,
            request.HtmlBody,
            request.LogoUrl,
            request.PrimaryColor,
            request.IsActive
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task DeactivateEmailTemplateAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition("sp_EmailTemplate_Deactivate", new { TenantId = tenantId, Id = id }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<IReadOnlyList<FeatureFlagDto>> ListFeatureFlagsAsync(Guid tenantId, Guid? branchId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var rows = await conn.QueryAsync<FeatureFlagDto>(new CommandDefinition("sp_FeatureFlag_ListForTenant", new { TenantId = tenantId, BranchId = branchId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<bool> ResolveFeatureFlagAsync(Guid tenantId, Guid? branchId, string featureKey, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<bool>(new CommandDefinition("sp_FeatureFlag_Resolve", new { TenantId = tenantId, BranchId = branchId, FeatureKey = featureKey }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task SetTenantFeatureFlagAsync(Guid tenantId, string featureKey, bool isEnabled, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition("sp_FeatureFlag_SetTenant", new { TenantId = tenantId, FeatureKey = featureKey, IsEnabled = isEnabled }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task SetBranchFeatureFlagAsync(Guid tenantId, Guid branchId, string featureKey, bool isEnabled, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition("sp_FeatureFlag_SetBranch", new { TenantId = tenantId, BranchId = branchId, FeatureKey = featureKey, IsEnabled = isEnabled }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }
}
