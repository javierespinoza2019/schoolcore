using System.Data;
using System.Data.Common;
using Dapper;
using SchoolCore.Models.Dtos.Common;
using SchoolCore.Models.Dtos.People;

namespace SchoolCore.DataAccess.Repositories;

public interface IPeopleRepository
{
    Task<PagedResult<StudentDto>> ListStudentsAsync(Guid tenantId, Guid? branchId, string? status, int page, int pageSize, string? search, CancellationToken ct = default);
    Task<StudentDto?> GetStudentAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<StudentDto> CreateStudentAsync(Guid tenantId, Guid id, StudentUpsertRequest request, Guid? userId, CancellationToken ct = default);
    Task<StudentDto> UpdateStudentAsync(Guid tenantId, Guid id, StudentUpsertRequest request, Guid? userId, CancellationToken ct = default);
    Task SoftDeleteStudentAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default);

    Task<PagedResult<GuardianDto>> ListGuardiansAsync(Guid tenantId, int page, int pageSize, string? search, CancellationToken ct = default);
    Task<GuardianDto?> GetGuardianAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<GuardianDto> CreateGuardianAsync(Guid tenantId, Guid id, GuardianUpsertRequest request, Guid? userId, CancellationToken ct = default);
    Task<GuardianDto> UpdateGuardianAsync(Guid tenantId, Guid id, GuardianUpsertRequest request, Guid? userId, CancellationToken ct = default);
    Task SoftDeleteGuardianAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default);
    Task LinkGuardianAsync(Guid tenantId, Guid studentId, LinkGuardianRequest request, CancellationToken ct = default);
    Task UnlinkGuardianAsync(Guid tenantId, Guid studentId, Guid guardianId, CancellationToken ct = default);
    Task<IReadOnlyList<GuardianDto>> ListGuardiansByStudentAsync(Guid tenantId, Guid studentId, CancellationToken ct = default);
    Task<IReadOnlyList<GuardianLinkedStudentDto>> ListStudentsByGuardianAsync(Guid tenantId, Guid guardianId, CancellationToken ct = default);

    Task<DocumentDto> CreateDocumentAsync(Guid tenantId, DocumentDto doc, CancellationToken ct = default);
    Task<DocumentDto?> GetDocumentAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<PagedResult<DocumentDto>> ListDocumentsAsync(Guid tenantId, string? entityType, Guid? entityId, int page, int pageSize, CancellationToken ct = default);
    Task SoftDeleteDocumentAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default);

    Task<IReadOnlyList<TimelineEventDto>> ListTimelineAsync(Guid tenantId, string entityType, Guid entityId, CancellationToken ct = default);
    Task<TimelineEventDto> CreateTimelineAsync(Guid tenantId, Guid id, TimelineEventCreateRequest request, Guid? userId, CancellationToken ct = default);
}

public sealed class PeopleRepository : IPeopleRepository
{
    private readonly ISqlConnectionFactory _factory;
    public PeopleRepository(ISqlConnectionFactory factory) => _factory = factory;
    private async Task<DbConnection> OpenAsync(CancellationToken ct) => (DbConnection)await _factory.CreateOpenConnectionAsync(ct);

    public async Task<PagedResult<StudentDto>> ListStudentsAsync(Guid tenantId, Guid? branchId, string? status, int page, int pageSize, string? search, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var p = new DynamicParameters(new { TenantId = tenantId, BranchId = branchId, Status = status, Page = page, PageSize = pageSize, Search = search });
        var (items, total) = await DapperPaging.QueryPagedAsync<StudentDto>(conn, "sp_Student_List", p, ct);
        return DapperPaging.ToPagedResult(items, total, page, pageSize);
    }

    public async Task<StudentDto?> GetStudentAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<StudentDto>(new CommandDefinition("sp_Student_GetById", new { TenantId = tenantId, Id = id }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<StudentDto> CreateStudentAsync(Guid tenantId, Guid id, StudentUpsertRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<StudentDto>(new CommandDefinition("sp_Student_Create", new
        {
            Id = id,
            TenantId = tenantId,
            request.BranchId,
            request.EnrollmentNumber,
            request.FirstName,
            request.LastName,
            request.Gender,
            request.BirthDate,
            request.Email,
            request.Phone,
            request.Address,
            request.EducationLevelId,
            request.Grade,
            request.GroupCode,
            request.Status,
            request.EnrollmentDate,
            request.BloodType,
            request.Allergies,
            request.MedicalNotes,
            request.ScholarshipPercent,
            request.SchoolCycleId,
            request.ClassroomId,
            request.LevelName,
            request.PhotoUrl,
            CreatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<StudentDto> UpdateStudentAsync(Guid tenantId, Guid id, StudentUpsertRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<StudentDto>(new CommandDefinition("sp_Student_Update", new
        {
            TenantId = tenantId,
            Id = id,
            request.BranchId,
            request.FirstName,
            request.LastName,
            request.Gender,
            request.BirthDate,
            request.Email,
            request.Phone,
            request.Address,
            request.EducationLevelId,
            request.Grade,
            request.GroupCode,
            request.Status,
            request.EnrollmentDate,
            request.BloodType,
            request.Allergies,
            request.MedicalNotes,
            request.ScholarshipPercent,
            request.SchoolCycleId,
            request.ClassroomId,
            request.LevelName,
            request.PhotoUrl,
            UpdatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task SoftDeleteStudentAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition("sp_Student_SoftDelete", new { TenantId = tenantId, Id = id, UpdatedBy = userId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<PagedResult<GuardianDto>> ListGuardiansAsync(Guid tenantId, int page, int pageSize, string? search, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var p = new DynamicParameters(new { TenantId = tenantId, Page = page, PageSize = pageSize, Search = search });
        var (items, total) = await DapperPaging.QueryPagedAsync<GuardianDto>(conn, "sp_Guardian_List", p, ct);
        return DapperPaging.ToPagedResult(items, total, page, pageSize);
    }

    public async Task<GuardianDto?> GetGuardianAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<GuardianDto>(new CommandDefinition("sp_Guardian_GetById", new { TenantId = tenantId, Id = id }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<GuardianDto> CreateGuardianAsync(Guid tenantId, Guid id, GuardianUpsertRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<GuardianDto>(new CommandDefinition("sp_Guardian_Create", new
        {
            Id = id,
            TenantId = tenantId,
            request.FirstName,
            request.LastName,
            request.Email,
            request.Phone,
            request.Occupation,
            request.Address,
            request.Status,
            CreatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<GuardianDto> UpdateGuardianAsync(Guid tenantId, Guid id, GuardianUpsertRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<GuardianDto>(new CommandDefinition("sp_Guardian_Update", new
        {
            TenantId = tenantId,
            Id = id,
            request.FirstName,
            request.LastName,
            request.Email,
            request.Phone,
            request.Occupation,
            request.Address,
            request.Status,
            UpdatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task SoftDeleteGuardianAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition("sp_Guardian_SoftDelete", new { TenantId = tenantId, Id = id, UpdatedBy = userId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task LinkGuardianAsync(Guid tenantId, Guid studentId, LinkGuardianRequest request, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition("sp_StudentGuardian_Link", new
        {
            TenantId = tenantId,
            StudentId = studentId,
            request.GuardianId,
            request.Relationship,
            request.IsPrimary
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task UnlinkGuardianAsync(Guid tenantId, Guid studentId, Guid guardianId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition("sp_StudentGuardian_Unlink", new { TenantId = tenantId, StudentId = studentId, GuardianId = guardianId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<IReadOnlyList<GuardianDto>> ListGuardiansByStudentAsync(Guid tenantId, Guid studentId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var rows = await conn.QueryAsync<GuardianDto>(new CommandDefinition("sp_StudentGuardian_ListByStudent", new { TenantId = tenantId, StudentId = studentId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<IReadOnlyList<GuardianLinkedStudentDto>> ListStudentsByGuardianAsync(Guid tenantId, Guid guardianId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var rows = await conn.QueryAsync<GuardianLinkedStudentDto>(new CommandDefinition(
            "sp_StudentGuardian_ListByGuardian",
            new { TenantId = tenantId, GuardianId = guardianId },
            commandType: CommandType.StoredProcedure,
            cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<DocumentDto> CreateDocumentAsync(Guid tenantId, DocumentDto doc, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<DocumentDto>(new CommandDefinition("sp_Document_Create", new
        {
            doc.Id,
            TenantId = tenantId,
            doc.FileId,
            doc.UploaderUserId,
            doc.EntityType,
            doc.EntityId,
            doc.OriginalFileName,
            doc.ContentType,
            doc.Extension,
            doc.SizeBytes,
            doc.RelativePath,
            doc.Status,
            CreatedBy = doc.UploaderUserId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<DocumentDto?> GetDocumentAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<DocumentDto>(new CommandDefinition("sp_Document_GetById", new { TenantId = tenantId, Id = id }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<PagedResult<DocumentDto>> ListDocumentsAsync(Guid tenantId, string? entityType, Guid? entityId, int page, int pageSize, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var p = new DynamicParameters(new { TenantId = tenantId, EntityType = entityType, EntityId = entityId, Page = page, PageSize = pageSize });
        var (items, total) = await DapperPaging.QueryPagedAsync<DocumentDto>(conn, "sp_Document_List", p, ct);
        return DapperPaging.ToPagedResult(items, total, page, pageSize);
    }

    public async Task SoftDeleteDocumentAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition("sp_Document_SoftDelete", new { TenantId = tenantId, Id = id, DeletedBy = userId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<IReadOnlyList<TimelineEventDto>> ListTimelineAsync(Guid tenantId, string entityType, Guid entityId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var rows = await conn.QueryAsync<TimelineEventDto>(new CommandDefinition("sp_TimelineEvent_List", new { TenantId = tenantId, EntityType = entityType, EntityId = entityId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<TimelineEventDto> CreateTimelineAsync(Guid tenantId, Guid id, TimelineEventCreateRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<TimelineEventDto>(new CommandDefinition("sp_TimelineEvent_Create", new
        {
            Id = id,
            TenantId = tenantId,
            request.EntityType,
            request.EntityId,
            request.EventDate,
            request.Title,
            request.Description,
            request.Icon,
            request.Badge,
            CreatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }
}
