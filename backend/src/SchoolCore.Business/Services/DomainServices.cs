using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using SchoolCore.Business.Security;
using SchoolCore.Common.Exceptions;
using SchoolCore.Common.Options;
using SchoolCore.Common.Security;
using SchoolCore.DataAccess.Repositories;
using SchoolCore.Models.Dtos.Academic;
using SchoolCore.Models.Dtos.Common;
using SchoolCore.Models.Dtos.Finance;
using SchoolCore.Models.Dtos.Notifications;
using SchoolCore.Models.Dtos.People;
using SchoolCore.Models.Dtos.Reports;
using ClosedXML.Excel;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace SchoolCore.Business.Services;

internal static class SqlExec
{
    public static async Task<T> RunAsync<T>(Func<Task<T>> action)
    {
        try { return await action(); }
        catch (SqlException ex) when (ex.Number is 51001 or 51009) { throw AppException.Conflict(ex.Message); }
        catch (SqlException ex) when (ex.Number == 51004) { throw AppException.NotFound(ex.Message); }
        catch (SqlException ex) { throw AppException.BadRequest(ex.Message); }
    }

    public static async Task RunAsync(Func<Task> action)
    {
        try { await action(); }
        catch (SqlException ex) when (ex.Number is 51001 or 51009) { throw AppException.Conflict(ex.Message); }
        catch (SqlException ex) when (ex.Number == 51004) { throw AppException.NotFound(ex.Message); }
        catch (SqlException ex) { throw AppException.BadRequest(ex.Message); }
    }
}

public interface IPeopleService
{
    Task<PagedResult<StudentDto>> ListStudentsAsync(Guid? branchId, string? status, PagedRequest paging, string? search, CancellationToken ct = default);
    Task<StudentDto> GetStudentAsync(Guid id, CancellationToken ct = default);
    Task<StudentDto> CreateStudentAsync(StudentUpsertRequest request, CancellationToken ct = default);
    Task<StudentDto> UpdateStudentAsync(Guid id, StudentUpsertRequest request, CancellationToken ct = default);
    Task DeleteStudentAsync(Guid id, CancellationToken ct = default);

    Task<PagedResult<GuardianDto>> ListGuardiansAsync(PagedRequest paging, string? search, CancellationToken ct = default);
    Task<GuardianDto> GetGuardianAsync(Guid id, CancellationToken ct = default);
    Task<GuardianDto> CreateGuardianAsync(GuardianUpsertRequest request, CancellationToken ct = default);
    Task<GuardianDto> UpdateGuardianAsync(Guid id, GuardianUpsertRequest request, CancellationToken ct = default);
    Task DeleteGuardianAsync(Guid id, CancellationToken ct = default);
    Task LinkGuardianAsync(Guid studentId, LinkGuardianRequest request, CancellationToken ct = default);
    Task UnlinkGuardianAsync(Guid studentId, Guid guardianId, CancellationToken ct = default);
    Task<IReadOnlyList<GuardianDto>> ListStudentGuardiansAsync(Guid studentId, CancellationToken ct = default);

    Task<DocumentDto> UploadDocumentAsync(string entityType, Guid entityId, Stream content, string fileName, string contentType, CancellationToken ct = default);
    Task<(DocumentDto Meta, Stream Content)> DownloadDocumentAsync(Guid id, CancellationToken ct = default);
    Task<PagedResult<DocumentDto>> ListDocumentsAsync(string? entityType, Guid? entityId, PagedRequest paging, CancellationToken ct = default);
    Task DeleteDocumentAsync(Guid id, CancellationToken ct = default);

    Task<IReadOnlyList<TimelineEventDto>> ListTimelineAsync(string entityType, Guid entityId, CancellationToken ct = default);
    Task<TimelineEventDto> CreateTimelineAsync(TimelineEventCreateRequest request, CancellationToken ct = default);
}

public sealed class PeopleService : IPeopleService
{
    private readonly IPeopleRepository _repo;
    private readonly ITenantContext _tenant;
    private readonly DocumentsOptions _docs;
    private readonly string _rootPath;

    public PeopleService(IPeopleRepository repo, ITenantContext tenant, IOptions<DocumentsOptions> docs, IHostEnvironment env)
    {
        _repo = repo;
        _tenant = tenant;
        _docs = docs.Value;
        _rootPath = Path.IsPathRooted(_docs.RootPath)
            ? _docs.RootPath
            : Path.GetFullPath(Path.Combine(env.ContentRootPath, "..", "..", _docs.RootPath));
    }

    private (Guid TenantId, Guid UserId) Ctx() => TenantGuard.Require(_tenant);

    public async Task<PagedResult<StudentDto>> ListStudentsAsync(Guid? branchId, string? status, PagedRequest paging, string? search, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        paging.Normalize(200);
        return await _repo.ListStudentsAsync(tenantId, branchId, status, paging.Page, paging.PageSize, search, ct);
    }

    public async Task<StudentDto> GetStudentAsync(Guid id, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        return await _repo.GetStudentAsync(tenantId, id, ct) ?? throw AppException.NotFound("Student not found.");
    }

    public Task<StudentDto> CreateStudentAsync(StudentUpsertRequest request, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        if (request.BranchId == Guid.Empty) throw AppException.BadRequest("Branch is required.");
        if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
            throw AppException.BadRequest("FirstName and LastName are required.");
        return SqlExec.RunAsync(() => _repo.CreateStudentAsync(tenantId, Guid.NewGuid(), request, userId, ct));
    }

    public Task<StudentDto> UpdateStudentAsync(Guid id, StudentUpsertRequest request, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        if (request.BranchId == Guid.Empty) throw AppException.BadRequest("Branch is required.");
        if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
            throw AppException.BadRequest("FirstName and LastName are required.");
        return SqlExec.RunAsync(() => _repo.UpdateStudentAsync(tenantId, id, request, userId, ct));
    }

    public Task DeleteStudentAsync(Guid id, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        return SqlExec.RunAsync(() => _repo.SoftDeleteStudentAsync(tenantId, id, userId, ct));
    }

    public async Task<PagedResult<GuardianDto>> ListGuardiansAsync(PagedRequest paging, string? search, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        paging.Normalize();
        return await _repo.ListGuardiansAsync(tenantId, paging.Page, paging.PageSize, search, ct);
    }

    public async Task<GuardianDto> GetGuardianAsync(Guid id, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        return await _repo.GetGuardianAsync(tenantId, id, ct) ?? throw AppException.NotFound("Guardian not found.");
    }

    public Task<GuardianDto> CreateGuardianAsync(GuardianUpsertRequest request, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        return SqlExec.RunAsync(() => _repo.CreateGuardianAsync(tenantId, Guid.NewGuid(), request, userId, ct));
    }

    public Task<GuardianDto> UpdateGuardianAsync(Guid id, GuardianUpsertRequest request, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        return SqlExec.RunAsync(() => _repo.UpdateGuardianAsync(tenantId, id, request, userId, ct));
    }

    public Task DeleteGuardianAsync(Guid id, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        return SqlExec.RunAsync(() => _repo.SoftDeleteGuardianAsync(tenantId, id, userId, ct));
    }

    public Task LinkGuardianAsync(Guid studentId, LinkGuardianRequest request, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        return SqlExec.RunAsync(() => _repo.LinkGuardianAsync(tenantId, studentId, request, ct));
    }

    public Task UnlinkGuardianAsync(Guid studentId, Guid guardianId, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        return SqlExec.RunAsync(() => _repo.UnlinkGuardianAsync(tenantId, studentId, guardianId, ct));
    }

    public Task<IReadOnlyList<GuardianDto>> ListStudentGuardiansAsync(Guid studentId, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        return _repo.ListGuardiansByStudentAsync(tenantId, studentId, ct);
    }

    public async Task<DocumentDto> UploadDocumentAsync(string entityType, Guid entityId, Stream content, string fileName, string contentType, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        var ext = Path.GetExtension(fileName)?.ToLowerInvariant() ?? string.Empty;
        if (!_docs.AllowedExtensions.Contains(ext, StringComparer.OrdinalIgnoreCase))
            throw AppException.BadRequest($"Extension '{ext}' is not allowed.");
        if (content.CanSeek && content.Length > _docs.MaxFileSizeBytes)
            throw AppException.BadRequest("File exceeds maximum size of 5 MB.");

        var fileId = Guid.NewGuid();
        var relative = Path.Combine(userId.ToString("D"), $"{fileId:D}{ext}").Replace('\\', '/');
        var absoluteDir = Path.Combine(_rootPath, userId.ToString("D"));
        Directory.CreateDirectory(absoluteDir);
        var absolutePath = Path.Combine(absoluteDir, $"{fileId:D}{ext}");

        await using (var fs = File.Create(absolutePath))
        {
            await content.CopyToAsync(fs, ct);
            if (fs.Length > _docs.MaxFileSizeBytes)
            {
                fs.Close();
                File.Delete(absolutePath);
                throw AppException.BadRequest("File exceeds maximum size of 5 MB.");
            }

            var meta = new DocumentDto
            {
                Id = Guid.NewGuid(),
                FileId = fileId,
                UploaderUserId = userId,
                EntityType = entityType,
                EntityId = entityId,
                OriginalFileName = Path.GetFileName(fileName),
                ContentType = contentType,
                Extension = ext,
                SizeBytes = fs.Length,
                RelativePath = relative,
                Status = "pending"
            };
            return await SqlExec.RunAsync(() => _repo.CreateDocumentAsync(tenantId, meta, ct));
        }
    }

    public async Task<(DocumentDto Meta, Stream Content)> DownloadDocumentAsync(Guid id, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        var meta = await _repo.GetDocumentAsync(tenantId, id, ct) ?? throw AppException.NotFound("Document not found.");
        var absolute = Path.Combine(_rootPath, meta.RelativePath.Replace('/', Path.DirectorySeparatorChar));
        if (!File.Exists(absolute)) throw AppException.NotFound("Document file not found on disk.");
        Stream stream = File.OpenRead(absolute);
        return (meta, stream);
    }

    public async Task<PagedResult<DocumentDto>> ListDocumentsAsync(string? entityType, Guid? entityId, PagedRequest paging, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        paging.Normalize();
        return await _repo.ListDocumentsAsync(tenantId, entityType, entityId, paging.Page, paging.PageSize, ct);
    }

    public async Task DeleteDocumentAsync(Guid id, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        var meta = await _repo.GetDocumentAsync(tenantId, id, ct);
        await SqlExec.RunAsync(() => _repo.SoftDeleteDocumentAsync(tenantId, id, userId, ct));
        if (meta is not null)
        {
            var absolute = Path.Combine(_rootPath, meta.RelativePath.Replace('/', Path.DirectorySeparatorChar));
            if (File.Exists(absolute)) File.Delete(absolute);
        }
    }

    public Task<IReadOnlyList<TimelineEventDto>> ListTimelineAsync(string entityType, Guid entityId, CancellationToken ct = default)
    {
        var (tenantId, _) = Ctx();
        return _repo.ListTimelineAsync(tenantId, entityType, entityId, ct);
    }

    public Task<TimelineEventDto> CreateTimelineAsync(TimelineEventCreateRequest request, CancellationToken ct = default)
    {
        var (tenantId, userId) = Ctx();
        if (string.IsNullOrWhiteSpace(request.Title)) throw AppException.BadRequest("Title is required.");
        return SqlExec.RunAsync(() => _repo.CreateTimelineAsync(tenantId, Guid.NewGuid(), request, userId, ct));
    }
}

public interface IAcademicService
{
    Task<PagedResult<TeacherDto>> ListTeachersAsync(Guid? branchId, PagedRequest paging, string? search, CancellationToken ct = default);
    Task<TeacherDto> GetTeacherAsync(Guid id, CancellationToken ct = default);
    Task<TeacherDto> CreateTeacherAsync(TeacherUpsertRequest request, CancellationToken ct = default);
    Task<TeacherDto> UpdateTeacherAsync(Guid id, TeacherUpsertRequest request, CancellationToken ct = default);
    Task DeleteTeacherAsync(Guid id, CancellationToken ct = default);

    Task<PagedResult<ClassroomDto>> ListClassroomsAsync(Guid? branchId, PagedRequest paging, string? search, CancellationToken ct = default);
    Task<ClassroomDto> GetClassroomAsync(Guid id, CancellationToken ct = default);
    Task<ClassroomDto> CreateClassroomAsync(ClassroomUpsertRequest request, CancellationToken ct = default);
    Task<ClassroomDto> UpdateClassroomAsync(Guid id, ClassroomUpsertRequest request, CancellationToken ct = default);
    Task DeleteClassroomAsync(Guid id, CancellationToken ct = default);

    Task<PagedResult<EnrollmentDto>> ListEnrollmentsAsync(Guid? branchId, string? status, PagedRequest paging, CancellationToken ct = default);
    Task<EnrollmentDto> GetEnrollmentAsync(Guid id, CancellationToken ct = default);
    Task<EnrollmentDto> CreateEnrollmentAsync(CreateEnrollmentRequest request, CancellationToken ct = default);
    Task<EnrollmentDto> SaveEnrollmentWizardAsync(Guid id, SaveEnrollmentWizardRequest request, CancellationToken ct = default);
    Task<EnrollmentDto> CompleteEnrollmentAsync(Guid id, CompleteEnrollmentRequest request, CancellationToken ct = default);
}

public sealed class AcademicService : IAcademicService
{
    private readonly IAcademicRepository _repo;
    private readonly ITenantContext _tenant;
    public AcademicService(IAcademicRepository repo, ITenantContext tenant) { _repo = repo; _tenant = tenant; }
    private (Guid TenantId, Guid UserId) Ctx() => TenantGuard.Require(_tenant);

    public async Task<PagedResult<TeacherDto>> ListTeachersAsync(Guid? branchId, PagedRequest paging, string? search, CancellationToken ct = default)
    { var (t, _) = Ctx(); paging.Normalize(200); return await _repo.ListTeachersAsync(t, branchId, paging.Page, paging.PageSize, search, ct); }
    public async Task<TeacherDto> GetTeacherAsync(Guid id, CancellationToken ct = default)
    { var (t, _) = Ctx(); return await _repo.GetTeacherAsync(t, id, ct) ?? throw AppException.NotFound("Teacher not found."); }
    public Task<TeacherDto> CreateTeacherAsync(TeacherUpsertRequest request, CancellationToken ct = default)
    { var (t, u) = Ctx(); ValidateTeacher(request); return SqlExec.RunAsync(() => _repo.CreateTeacherAsync(t, Guid.NewGuid(), request, u, ct)); }
    public Task<TeacherDto> UpdateTeacherAsync(Guid id, TeacherUpsertRequest request, CancellationToken ct = default)
    { var (t, u) = Ctx(); ValidateTeacher(request); return SqlExec.RunAsync(() => _repo.UpdateTeacherAsync(t, id, request, u, ct)); }
    public Task DeleteTeacherAsync(Guid id, CancellationToken ct = default)
    { var (t, u) = Ctx(); return SqlExec.RunAsync(() => _repo.SoftDeleteTeacherAsync(t, id, u, ct)); }

    public async Task<PagedResult<ClassroomDto>> ListClassroomsAsync(Guid? branchId, PagedRequest paging, string? search, CancellationToken ct = default)
    { var (t, _) = Ctx(); paging.Normalize(200); return await _repo.ListClassroomsAsync(t, branchId, paging.Page, paging.PageSize, search, ct); }
    public async Task<ClassroomDto> GetClassroomAsync(Guid id, CancellationToken ct = default)
    { var (t, _) = Ctx(); return await _repo.GetClassroomAsync(t, id, ct) ?? throw AppException.NotFound("Classroom not found."); }
    public Task<ClassroomDto> CreateClassroomAsync(ClassroomUpsertRequest request, CancellationToken ct = default)
    { var (t, u) = Ctx(); ValidateClassroom(request); return SqlExec.RunAsync(() => _repo.CreateClassroomAsync(t, Guid.NewGuid(), request, u, ct)); }
    public Task<ClassroomDto> UpdateClassroomAsync(Guid id, ClassroomUpsertRequest request, CancellationToken ct = default)
    { var (t, u) = Ctx(); ValidateClassroom(request); return SqlExec.RunAsync(() => _repo.UpdateClassroomAsync(t, id, request, u, ct)); }
    public Task DeleteClassroomAsync(Guid id, CancellationToken ct = default)
    { var (t, u) = Ctx(); return SqlExec.RunAsync(() => _repo.SoftDeleteClassroomAsync(t, id, u, ct)); }

    public async Task<PagedResult<EnrollmentDto>> ListEnrollmentsAsync(Guid? branchId, string? status, PagedRequest paging, CancellationToken ct = default)
    { var (t, _) = Ctx(); paging.Normalize(); return await _repo.ListEnrollmentsAsync(t, branchId, status, paging.Page, paging.PageSize, ct); }
    public async Task<EnrollmentDto> GetEnrollmentAsync(Guid id, CancellationToken ct = default)
    { var (t, _) = Ctx(); return await _repo.GetEnrollmentAsync(t, id, ct) ?? throw AppException.NotFound("Enrollment not found."); }
    public Task<EnrollmentDto> CreateEnrollmentAsync(CreateEnrollmentRequest request, CancellationToken ct = default)
    { var (t, u) = Ctx(); return SqlExec.RunAsync(() => _repo.CreateEnrollmentAsync(t, Guid.NewGuid(), request, u, ct)); }
    public Task<EnrollmentDto> SaveEnrollmentWizardAsync(Guid id, SaveEnrollmentWizardRequest request, CancellationToken ct = default)
    { var (t, u) = Ctx(); return SqlExec.RunAsync(() => _repo.SaveEnrollmentWizardAsync(t, id, request, u, ct)); }
    public Task<EnrollmentDto> CompleteEnrollmentAsync(Guid id, CompleteEnrollmentRequest request, CancellationToken ct = default)
    { var (t, u) = Ctx(); return SqlExec.RunAsync(() => _repo.CompleteEnrollmentAsync(t, id, request.StudentId, u, ct)); }

    private static void ValidateTeacher(TeacherUpsertRequest request)
    {
        if (request.BranchId == Guid.Empty) throw AppException.BadRequest("Branch is required.");
        if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
            throw AppException.BadRequest("FirstName and LastName are required.");
    }

    private static void ValidateClassroom(ClassroomUpsertRequest request)
    {
        if (request.BranchId == Guid.Empty) throw AppException.BadRequest("Branch is required.");
        if (string.IsNullOrWhiteSpace(request.Name)) throw AppException.BadRequest("Name is required.");
    }
}

public interface IFinanceService
{
    Task<PagedResult<ChargeDto>> ListChargesAsync(Guid? branchId, Guid? studentId, string? status, PagedRequest paging, CancellationToken ct = default);
    Task<ChargeDto> GetChargeAsync(Guid id, CancellationToken ct = default);
    Task<ChargeDto> CreateChargeAsync(CreateChargeRequest request, CancellationToken ct = default);
    Task<PagedResult<PaymentDto>> ListPaymentsAsync(Guid? branchId, Guid? studentId, PagedRequest paging, CancellationToken ct = default);
    Task<PaymentDto> GetPaymentAsync(Guid id, CancellationToken ct = default);
    Task<PaymentDto> CreatePaymentAsync(CreatePaymentRequest request, CancellationToken ct = default);
    Task<PagedResult<ExpenseDto>> ListExpensesAsync(Guid? branchId, PagedRequest paging, CancellationToken ct = default);
    Task<ExpenseDto> CreateExpenseAsync(CreateExpenseRequest request, CancellationToken ct = default);
    Task DeleteExpenseAsync(Guid id, CancellationToken ct = default);
    Task<CashSessionDto> OpenCashSessionAsync(OpenCashSessionRequest request, CancellationToken ct = default);
    Task<CashSessionDto> GetCashSessionAsync(Guid id, CancellationToken ct = default);
    Task<CashSessionDto?> GetOpenCashSessionAsync(Guid branchId, string? shift, CancellationToken ct = default);
    Task<PagedResult<CashSessionDto>> ListCashSessionsAsync(Guid? branchId, PagedRequest paging, CancellationToken ct = default);
    Task<CashSessionDto> CloseCashSessionAsync(Guid id, CloseCashSessionRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<CashMovementDto>> ListMovementsAsync(Guid sessionId, CancellationToken ct = default);
    Task<CashAuditDto> SaveCashAuditAsync(Guid sessionId, SaveCashAuditRequest request, CancellationToken ct = default);
    Task<CashAuditDto?> GetCashAuditAsync(Guid sessionId, CancellationToken ct = default);
}

public sealed class FinanceService : IFinanceService
{
    private readonly IFinanceRepository _repo;
    private readonly ITenantContext _tenant;
    public FinanceService(IFinanceRepository repo, ITenantContext tenant) { _repo = repo; _tenant = tenant; }
    private (Guid TenantId, Guid UserId) Ctx() => TenantGuard.Require(_tenant);

    public async Task<PagedResult<ChargeDto>> ListChargesAsync(Guid? branchId, Guid? studentId, string? status, PagedRequest paging, CancellationToken ct = default)
    { var (t, _) = Ctx(); paging.Normalize(); return await _repo.ListChargesAsync(t, branchId, studentId, status, paging.Page, paging.PageSize, ct); }
    public async Task<ChargeDto> GetChargeAsync(Guid id, CancellationToken ct = default)
    { var (t, _) = Ctx(); return await _repo.GetChargeAsync(t, id, ct) ?? throw AppException.NotFound("Charge not found."); }
    public Task<ChargeDto> CreateChargeAsync(CreateChargeRequest request, CancellationToken ct = default)
    { var (t, u) = Ctx(); return SqlExec.RunAsync(() => _repo.CreateChargeAsync(t, Guid.NewGuid(), request, u, ct)); }
    public async Task<PagedResult<PaymentDto>> ListPaymentsAsync(Guid? branchId, Guid? studentId, PagedRequest paging, CancellationToken ct = default)
    { var (t, _) = Ctx(); paging.Normalize(); return await _repo.ListPaymentsAsync(t, branchId, studentId, paging.Page, paging.PageSize, ct); }
    public async Task<PaymentDto> GetPaymentAsync(Guid id, CancellationToken ct = default)
    { var (t, _) = Ctx(); return await _repo.GetPaymentAsync(t, id, ct) ?? throw AppException.NotFound("Payment not found."); }
    public Task<PaymentDto> CreatePaymentAsync(CreatePaymentRequest request, CancellationToken ct = default)
    { var (t, u) = Ctx(); return SqlExec.RunAsync(() => _repo.CreatePaymentAsync(t, Guid.NewGuid(), request, u, ct)); }
    public async Task<PagedResult<ExpenseDto>> ListExpensesAsync(Guid? branchId, PagedRequest paging, CancellationToken ct = default)
    { var (t, _) = Ctx(); paging.Normalize(); return await _repo.ListExpensesAsync(t, branchId, paging.Page, paging.PageSize, ct); }
    public Task<ExpenseDto> CreateExpenseAsync(CreateExpenseRequest request, CancellationToken ct = default)
    { var (t, u) = Ctx(); return SqlExec.RunAsync(() => _repo.CreateExpenseAsync(t, Guid.NewGuid(), request, u, ct)); }
    public Task DeleteExpenseAsync(Guid id, CancellationToken ct = default)
    { var (t, u) = Ctx(); return SqlExec.RunAsync(() => _repo.SoftDeleteExpenseAsync(t, id, u, ct)); }
    public Task<CashSessionDto> OpenCashSessionAsync(OpenCashSessionRequest request, CancellationToken ct = default)
    { var (t, u) = Ctx(); return SqlExec.RunAsync(() => _repo.OpenCashSessionAsync(t, Guid.NewGuid(), u, request, u, ct)); }
    public async Task<CashSessionDto> GetCashSessionAsync(Guid id, CancellationToken ct = default)
    { var (t, _) = Ctx(); return await _repo.GetCashSessionAsync(t, id, ct) ?? throw AppException.NotFound("Cash session not found."); }
    public Task<CashSessionDto?> GetOpenCashSessionAsync(Guid branchId, string? shift, CancellationToken ct = default)
    { var (t, u) = Ctx(); return _repo.GetOpenCashSessionAsync(t, branchId, u, shift, ct); }
    public async Task<PagedResult<CashSessionDto>> ListCashSessionsAsync(Guid? branchId, PagedRequest paging, CancellationToken ct = default)
    { var (t, _) = Ctx(); paging.Normalize(); return await _repo.ListCashSessionsAsync(t, branchId, paging.Page, paging.PageSize, ct); }
    public Task<CashSessionDto> CloseCashSessionAsync(Guid id, CloseCashSessionRequest request, CancellationToken ct = default)
    { var (t, u) = Ctx(); return SqlExec.RunAsync(() => _repo.CloseCashSessionAsync(t, id, request.Notes, u, ct)); }
    public Task<IReadOnlyList<CashMovementDto>> ListMovementsAsync(Guid sessionId, CancellationToken ct = default)
    { var (t, _) = Ctx(); return _repo.ListMovementsAsync(t, sessionId, ct); }
    public Task<CashAuditDto> SaveCashAuditAsync(Guid sessionId, SaveCashAuditRequest request, CancellationToken ct = default)
    { var (t, u) = Ctx(); return SqlExec.RunAsync(() => _repo.SaveCashAuditAsync(t, Guid.NewGuid(), sessionId, request, u, ct)); }
    public Task<CashAuditDto?> GetCashAuditAsync(Guid sessionId, CancellationToken ct = default)
    { var (t, _) = Ctx(); return _repo.GetCashAuditAsync(t, sessionId, ct); }
}

public interface IReportService
{
    Task<IReadOnlyList<IncomeExpenseRow>> IncomeExpenseAsync(Guid? branchId, DateTime from, DateTime to, CancellationToken ct = default);
    Task<EnrollmentReportDto> EnrollmentAsync(Guid? branchId, Guid? schoolCycleId, CancellationToken ct = default);
    Task<MorosityReportDto> MorosityAsync(Guid? branchId, CancellationToken ct = default);
    Task<IReadOnlyList<PaymentMethodReportRow>> PaymentMethodsAsync(Guid? branchId, DateTime from, DateTime to, CancellationToken ct = default);
    Task<IReadOnlyList<ConceptReportRow>> ConceptsAsync(Guid? branchId, DateTime from, DateTime to, CancellationToken ct = default);
    Task<IReadOnlyList<BranchReportRow>> ByBranchAsync(DateTime from, DateTime to, CancellationToken ct = default);
    Task<(byte[] Content, string ContentType, string FileName)> ExportIncomeExpensePdfAsync(Guid? branchId, DateTime from, DateTime to, CancellationToken ct = default);
    Task<(byte[] Content, string ContentType, string FileName)> ExportIncomeExpenseExcelAsync(Guid? branchId, DateTime from, DateTime to, CancellationToken ct = default);
}

public sealed class ReportService : IReportService
{
    private readonly IReportRepository _repo;
    private readonly ITenantContext _tenant;
    public ReportService(IReportRepository repo, ITenantContext tenant)
    {
        _repo = repo;
        _tenant = tenant;
        QuestPDF.Settings.License = LicenseType.Community;
    }
    private (Guid TenantId, Guid UserId) Ctx() => TenantGuard.Require(_tenant);

    public Task<IReadOnlyList<IncomeExpenseRow>> IncomeExpenseAsync(Guid? branchId, DateTime from, DateTime to, CancellationToken ct = default)
    { var (t, _) = Ctx(); return _repo.IncomeExpenseAsync(t, branchId, from, to, ct); }
    public Task<EnrollmentReportDto> EnrollmentAsync(Guid? branchId, Guid? schoolCycleId, CancellationToken ct = default)
    { var (t, _) = Ctx(); return _repo.EnrollmentAsync(t, branchId, schoolCycleId, ct); }
    public Task<MorosityReportDto> MorosityAsync(Guid? branchId, CancellationToken ct = default)
    { var (t, _) = Ctx(); return _repo.MorosityAsync(t, branchId, ct); }
    public Task<IReadOnlyList<PaymentMethodReportRow>> PaymentMethodsAsync(Guid? branchId, DateTime from, DateTime to, CancellationToken ct = default)
    { var (t, _) = Ctx(); return _repo.PaymentMethodsAsync(t, branchId, from, to, ct); }
    public Task<IReadOnlyList<ConceptReportRow>> ConceptsAsync(Guid? branchId, DateTime from, DateTime to, CancellationToken ct = default)
    { var (t, _) = Ctx(); return _repo.ConceptsAsync(t, branchId, from, to, ct); }
    public Task<IReadOnlyList<BranchReportRow>> ByBranchAsync(DateTime from, DateTime to, CancellationToken ct = default)
    { var (t, _) = Ctx(); return _repo.ByBranchAsync(t, from, to, ct); }

    public async Task<(byte[] Content, string ContentType, string FileName)> ExportIncomeExpensePdfAsync(Guid? branchId, DateTime from, DateTime to, CancellationToken ct = default)
    {
        var rows = await IncomeExpenseAsync(branchId, from, to, ct);
        var bytes = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(40);
                page.Header().Text("SchoolCore — Ingresos y Egresos").SemiBold().FontSize(16);
                page.Content().Table(table =>
                {
                    table.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); c.RelativeColumn(); });
                    table.Header(h => { h.Cell().Text("Periodo"); h.Cell().Text("Ingresos"); h.Cell().Text("Egresos"); });
                    foreach (var r in rows)
                    {
                        table.Cell().Text(r.Period);
                        table.Cell().Text(r.Income.ToString("N2"));
                        table.Cell().Text(r.Expense.ToString("N2"));
                    }
                });
            });
        }).GeneratePdf();
        return (bytes, "application/pdf", $"income-expense-{from:yyyyMM}-{to:yyyyMM}.pdf");
    }

    public async Task<(byte[] Content, string ContentType, string FileName)> ExportIncomeExpenseExcelAsync(Guid? branchId, DateTime from, DateTime to, CancellationToken ct = default)
    {
        var rows = await IncomeExpenseAsync(branchId, from, to, ct);
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("IncomeExpense");
        ws.Cell(1, 1).Value = "Period";
        ws.Cell(1, 2).Value = "Income";
        ws.Cell(1, 3).Value = "Expense";
        var i = 2;
        foreach (var r in rows)
        {
            ws.Cell(i, 1).Value = r.Period;
            ws.Cell(i, 2).Value = r.Income;
            ws.Cell(i, 3).Value = r.Expense;
            i++;
        }
        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return (ms.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"income-expense-{from:yyyyMM}-{to:yyyyMM}.xlsx");
    }
}

public interface INotificationService
{
    Task<PagedResult<NotificationDto>> ListAsync(bool unreadOnly, PagedRequest paging, CancellationToken ct = default);
    Task MarkReadAsync(Guid id, CancellationToken ct = default);
    Task MarkAllReadAsync(CancellationToken ct = default);
    Task<NotificationDto> CreateAsync(CreateNotificationRequest request, CancellationToken ct = default);
}

public sealed class NotificationService : INotificationService
{
    private readonly INotificationRepository _repo;
    private readonly ITenantContext _tenant;
    public NotificationService(INotificationRepository repo, ITenantContext tenant) { _repo = repo; _tenant = tenant; }
    private (Guid TenantId, Guid UserId) Ctx() => TenantGuard.Require(_tenant);

    public async Task<PagedResult<NotificationDto>> ListAsync(bool unreadOnly, PagedRequest paging, CancellationToken ct = default)
    { var (t, u) = Ctx(); paging.Normalize(); return await _repo.ListAsync(t, u, unreadOnly, paging.Page, paging.PageSize, ct); }
    public Task MarkReadAsync(Guid id, CancellationToken ct = default)
    { var (t, u) = Ctx(); return SqlExec.RunAsync(() => _repo.MarkReadAsync(t, u, id, ct)); }
    public Task MarkAllReadAsync(CancellationToken ct = default)
    { var (t, u) = Ctx(); return _repo.MarkAllReadAsync(t, u, ct); }
    public Task<NotificationDto> CreateAsync(CreateNotificationRequest request, CancellationToken ct = default)
    { var (t, _) = Ctx(); return SqlExec.RunAsync(() => _repo.CreateAsync(t, Guid.NewGuid(), request, ct)); }
}
