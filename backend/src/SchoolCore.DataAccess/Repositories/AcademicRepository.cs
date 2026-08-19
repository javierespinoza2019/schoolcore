using System.Data;
using System.Data.Common;
using Dapper;
using SchoolCore.DataAccess;
using SchoolCore.Models.Dtos.Academic;
using SchoolCore.Models.Dtos.Common;

namespace SchoolCore.DataAccess.Repositories;

public interface IAcademicRepository
{
    Task<PagedResult<TeacherDto>> ListTeachersAsync(Guid tenantId, Guid? branchId, int page, int pageSize, string? search, CancellationToken ct = default);
    Task<TeacherDto?> GetTeacherAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<TeacherDto> CreateTeacherAsync(Guid tenantId, Guid id, TeacherUpsertRequest request, Guid? userId, CancellationToken ct = default);
    Task<TeacherDto> UpdateTeacherAsync(Guid tenantId, Guid id, TeacherUpsertRequest request, Guid? userId, CancellationToken ct = default);
    Task<IReadOnlyList<TeacherBranchDto>> SetTeacherBranchesAsync(Guid tenantId, Guid teacherId, IEnumerable<Guid> branchIds, CancellationToken ct = default);
    Task SoftDeleteTeacherAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default);

    Task<PagedResult<ClassroomDto>> ListClassroomsAsync(Guid tenantId, Guid? branchId, int page, int pageSize, string? search, CancellationToken ct = default);
    Task<ClassroomDto?> GetClassroomAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<ClassroomDto> CreateClassroomAsync(Guid tenantId, Guid id, ClassroomUpsertRequest request, Guid? userId, CancellationToken ct = default);
    Task<ClassroomDto> UpdateClassroomAsync(Guid tenantId, Guid id, ClassroomUpsertRequest request, Guid? userId, CancellationToken ct = default);
    Task SoftDeleteClassroomAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default);

    Task<PagedResult<EnrollmentDto>> ListEnrollmentsAsync(Guid tenantId, Guid? branchId, string? status, int page, int pageSize, CancellationToken ct = default);
    Task<EnrollmentDto?> GetEnrollmentAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<EnrollmentDto> CreateEnrollmentAsync(Guid tenantId, Guid id, CreateEnrollmentRequest request, Guid? userId, CancellationToken ct = default);
    Task<EnrollmentDto> SaveEnrollmentWizardAsync(Guid tenantId, Guid id, SaveEnrollmentWizardRequest request, Guid? userId, CancellationToken ct = default);
    Task<EnrollmentDto> CompleteEnrollmentAsync(Guid tenantId, Guid id, Guid studentId, Guid? userId, CancellationToken ct = default);
    Task SoftDeleteEnrollmentAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default);
}

public sealed class AcademicRepository : IAcademicRepository
{
    private readonly ISqlConnectionFactory _factory;
    public AcademicRepository(ISqlConnectionFactory factory) => _factory = factory;
    private async Task<DbConnection> OpenAsync(CancellationToken ct) => (DbConnection)await _factory.CreateOpenConnectionAsync(ct);

    public async Task<PagedResult<TeacherDto>> ListTeachersAsync(Guid tenantId, Guid? branchId, int page, int pageSize, string? search, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var p = new DynamicParameters(new { TenantId = tenantId, BranchId = branchId, Page = page, PageSize = pageSize, Search = search });
        p.Add("TotalCount", dbType: DbType.Int32, direction: ParameterDirection.Output);
        await using var multi = await conn.QueryMultipleAsync(new CommandDefinition(
            "sp_Teacher_List", p, commandType: CommandType.StoredProcedure, cancellationToken: ct));
        var items = (await multi.ReadAsync<TeacherDto>()).ToList();
        var branchRows = (await multi.ReadAsync<TeacherBranchRow>()).ToList();
        var total = p.Get<int>("TotalCount");
        HydrateTeacherBranches(items, branchRows);
        return DapperPaging.ToPagedResult(items, total, page, pageSize);
    }

    public async Task<TeacherDto?> GetTeacherAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await using var multi = await conn.QueryMultipleAsync(new CommandDefinition(
            "sp_Teacher_GetById", new { TenantId = tenantId, Id = id }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
        var teacher = await multi.ReadSingleOrDefaultAsync<TeacherDto>();
        if (teacher is null) return null;
        teacher.Branches = (await multi.ReadAsync<TeacherBranchDto>()).ToList();
        return teacher;
    }

    public async Task<TeacherDto> CreateTeacherAsync(Guid tenantId, Guid id, TeacherUpsertRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await using var multi = await conn.QueryMultipleAsync(new CommandDefinition(
            "sp_Teacher_Create", MapTeacher(tenantId, id, request, userId, create: true), commandType: CommandType.StoredProcedure, cancellationToken: ct));
        var teacher = await multi.ReadSingleAsync<TeacherDto>();
        if (!multi.IsConsumed)
            await multi.ReadAsync<TeacherBranchDto>();
        return teacher;
    }

    public async Task<TeacherDto> UpdateTeacherAsync(Guid tenantId, Guid id, TeacherUpsertRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await using var multi = await conn.QueryMultipleAsync(new CommandDefinition(
            "sp_Teacher_Update", MapTeacher(tenantId, id, request, userId, create: false), commandType: CommandType.StoredProcedure, cancellationToken: ct));
        var teacher = await multi.ReadSingleAsync<TeacherDto>();
        if (!multi.IsConsumed)
            await multi.ReadAsync<TeacherBranchDto>();
        return teacher;
    }

    private static object MapTeacher(Guid tenantId, Guid id, TeacherUpsertRequest request, Guid? userId, bool create) => create
        ? new { Id = id, TenantId = tenantId, request.BranchId, request.FirstName, request.LastName, request.Email, request.Phone, request.Specialty, request.SubjectsJson, request.EmploymentType, request.MonthlySalary, request.EducationLevelId, request.Status, request.HireDate, request.ScheduleNotes, request.LevelName, request.PhotoUrl, CreatedBy = userId }
        : new { TenantId = tenantId, Id = id, request.BranchId, request.FirstName, request.LastName, request.Email, request.Phone, request.Specialty, request.SubjectsJson, request.EmploymentType, request.MonthlySalary, request.EducationLevelId, request.Status, request.HireDate, request.ScheduleNotes, request.LevelName, request.PhotoUrl, UpdatedBy = userId };

    public async Task<IReadOnlyList<TeacherBranchDto>> SetTeacherBranchesAsync(Guid tenantId, Guid teacherId, IEnumerable<Guid> branchIds, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var csv = string.Join(',', branchIds);
        var rows = await conn.QueryAsync<TeacherBranchDto>(new CommandDefinition("sp_Teacher_SetBranches", new
        {
            TenantId = tenantId,
            TeacherId = teacherId,
            BranchIdsCsv = csv
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
        return rows.ToList();
    }

    private static void HydrateTeacherBranches(List<TeacherDto> items, List<TeacherBranchRow> branchRows)
    {
        var byTeacher = branchRows
            .GroupBy(b => b.TeacherId)
            .ToDictionary(g => g.Key, g => (IReadOnlyList<TeacherBranchDto>)g
                .Select(b => new TeacherBranchDto { BranchId = b.BranchId, BranchName = b.BranchName, BranchCode = b.BranchCode })
                .ToList());
        foreach (var teacher in items)
            teacher.Branches = byTeacher.TryGetValue(teacher.Id, out var branches) ? branches : Array.Empty<TeacherBranchDto>();
    }

    private sealed class TeacherBranchRow
    {
        public Guid TeacherId { get; set; }
        public Guid BranchId { get; set; }
        public string BranchName { get; set; } = string.Empty;
        public string BranchCode { get; set; } = string.Empty;
    }

    public async Task SoftDeleteTeacherAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition("sp_Teacher_SoftDelete", new { TenantId = tenantId, Id = id, UpdatedBy = userId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<PagedResult<ClassroomDto>> ListClassroomsAsync(Guid tenantId, Guid? branchId, int page, int pageSize, string? search, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var p = new DynamicParameters(new { TenantId = tenantId, BranchId = branchId, Page = page, PageSize = pageSize, Search = search });
        var (items, total) = await DapperPaging.QueryPagedAsync<ClassroomDto>(conn, "sp_Classroom_List", p, ct);
        return DapperPaging.ToPagedResult(items, total, page, pageSize);
    }

    public async Task<ClassroomDto?> GetClassroomAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<ClassroomDto>(new CommandDefinition("sp_Classroom_GetById", new { TenantId = tenantId, Id = id }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<ClassroomDto> CreateClassroomAsync(Guid tenantId, Guid id, ClassroomUpsertRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<ClassroomDto>(new CommandDefinition("sp_Classroom_Create", new
        {
            Id = id,
            TenantId = tenantId,
            request.BranchId,
            request.Name,
            request.EducationLevelId,
            request.Grade,
            request.GroupCode,
            request.Capacity,
            request.RoomType,
            request.Building,
            request.FloorNumber,
            request.Status,
            request.TeacherId,
            request.ScheduleNotes,
            request.EquipmentJson,
            request.LevelName,
            request.AssignedTeacherName,
            request.AssignedGroupsJson,
            CreatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<ClassroomDto> UpdateClassroomAsync(Guid tenantId, Guid id, ClassroomUpsertRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<ClassroomDto>(new CommandDefinition("sp_Classroom_Update", new
        {
            TenantId = tenantId,
            Id = id,
            request.BranchId,
            request.Name,
            request.EducationLevelId,
            request.Grade,
            request.GroupCode,
            request.Capacity,
            request.Occupied,
            request.RoomType,
            request.Building,
            request.FloorNumber,
            request.Status,
            request.TeacherId,
            request.ScheduleNotes,
            request.EquipmentJson,
            request.LevelName,
            request.AssignedTeacherName,
            request.AssignedGroupsJson,
            UpdatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task SoftDeleteClassroomAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition("sp_Classroom_SoftDelete", new { TenantId = tenantId, Id = id, UpdatedBy = userId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<PagedResult<EnrollmentDto>> ListEnrollmentsAsync(Guid tenantId, Guid? branchId, string? status, int page, int pageSize, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var p = new DynamicParameters(new { TenantId = tenantId, BranchId = branchId, Status = status, Page = page, PageSize = pageSize });
        var (items, total) = await DapperPaging.QueryPagedAsync<EnrollmentDto>(conn, "sp_Enrollment_List", p, ct);
        return DapperPaging.ToPagedResult(items, total, page, pageSize);
    }

    public async Task<EnrollmentDto?> GetEnrollmentAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<EnrollmentDto>(new CommandDefinition("sp_Enrollment_GetById", new { TenantId = tenantId, Id = id }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<EnrollmentDto> CreateEnrollmentAsync(Guid tenantId, Guid id, CreateEnrollmentRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<EnrollmentDto>(new CommandDefinition("sp_Enrollment_Create", new
        {
            Id = id,
            TenantId = tenantId,
            request.BranchId,
            request.SchoolCycleId,
            CreatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<EnrollmentDto> SaveEnrollmentWizardAsync(Guid tenantId, Guid id, SaveEnrollmentWizardRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<EnrollmentDto>(new CommandDefinition("sp_Enrollment_SaveWizard", new
        {
            TenantId = tenantId,
            Id = id,
            request.CurrentStep,
            request.Step1StudentJson,
            request.Step2GuardiansJson,
            request.Step3AcademicJson,
            request.Step4DocumentsJson,
            request.Step5FinanceJson,
            UpdatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<EnrollmentDto> CompleteEnrollmentAsync(Guid tenantId, Guid id, Guid studentId, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<EnrollmentDto>(new CommandDefinition("sp_Enrollment_Complete", new
        {
            TenantId = tenantId,
            Id = id,
            StudentId = studentId,
            UpdatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task SoftDeleteEnrollmentAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition("sp_Enrollment_SoftDelete", new { TenantId = tenantId, Id = id, UpdatedBy = userId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }
}
