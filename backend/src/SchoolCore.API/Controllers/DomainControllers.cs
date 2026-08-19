using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolCore.Business.Services;
using SchoolCore.Common.Responses;
using SchoolCore.Models.Dtos.Academic;
using SchoolCore.Models.Dtos.Common;
using SchoolCore.Models.Dtos.Finance;
using SchoolCore.Models.Dtos.Notifications;
using SchoolCore.Models.Dtos.People;
using SchoolCore.Models.Dtos.Reports;

namespace SchoolCore.API.Controllers;

[ApiController]
[Authorize]
[Route("api")]
public sealed class PeopleController : ControllerBase
{
    private readonly IPeopleService _service;
    public PeopleController(IPeopleService service) => _service = service;

    [HttpGet("students")]
    public async Task<ActionResult<ApiResponse<PagedResult<StudentDto>>>> ListStudents([FromQuery] Guid? branchId, [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? search = null, CancellationToken ct = default)
        => Ok(ApiResponse<PagedResult<StudentDto>>.Ok(await _service.ListStudentsAsync(branchId, status, new PagedRequest { Page = page, PageSize = pageSize }, search, ct)));

    [HttpGet("students/{id:guid}")]
    public async Task<ActionResult<ApiResponse<StudentDto>>> GetStudent(Guid id, CancellationToken ct)
        => Ok(ApiResponse<StudentDto>.Ok(await _service.GetStudentAsync(id, ct)));

    [HttpPost("students")]
    public async Task<ActionResult<ApiResponse<StudentDto>>> CreateStudent([FromBody] StudentUpsertRequest request, CancellationToken ct)
        => Ok(ApiResponse<StudentDto>.Ok(await _service.CreateStudentAsync(request, ct)));

    [HttpPut("students/{id:guid}")]
    public async Task<ActionResult<ApiResponse<StudentDto>>> UpdateStudent(Guid id, [FromBody] StudentUpsertRequest request, CancellationToken ct)
        => Ok(ApiResponse<StudentDto>.Ok(await _service.UpdateStudentAsync(id, request, ct)));

    [HttpDelete("students/{id:guid}")]
    public async Task<ActionResult<ApiResponse>> DeleteStudent(Guid id, CancellationToken ct)
    { await _service.DeleteStudentAsync(id, ct); return Ok(ApiResponse.Ok("Student deleted.")); }

    [HttpGet("students/{id:guid}/guardians")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<GuardianDto>>>> ListStudentGuardians(Guid id, CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<GuardianDto>>.Ok(await _service.ListStudentGuardiansAsync(id, ct)));

    [HttpPost("students/{id:guid}/guardians")]
    public async Task<ActionResult<ApiResponse>> LinkGuardian(Guid id, [FromBody] LinkGuardianRequest request, CancellationToken ct)
    { await _service.LinkGuardianAsync(id, request, ct); return Ok(ApiResponse.Ok("Guardian linked.")); }

    [HttpDelete("students/{studentId:guid}/guardians/{guardianId:guid}")]
    public async Task<ActionResult<ApiResponse>> UnlinkGuardian(Guid studentId, Guid guardianId, CancellationToken ct)
    { await _service.UnlinkGuardianAsync(studentId, guardianId, ct); return Ok(ApiResponse.Ok("Guardian unlinked.")); }

    [HttpGet("guardians")]
    public async Task<ActionResult<ApiResponse<PagedResult<GuardianDto>>>> ListGuardians([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? search = null, CancellationToken ct = default)
        => Ok(ApiResponse<PagedResult<GuardianDto>>.Ok(await _service.ListGuardiansAsync(new PagedRequest { Page = page, PageSize = pageSize }, search, ct)));

    [HttpGet("guardians/{id:guid}")]
    public async Task<ActionResult<ApiResponse<GuardianDto>>> GetGuardian(Guid id, CancellationToken ct)
        => Ok(ApiResponse<GuardianDto>.Ok(await _service.GetGuardianAsync(id, ct)));

    [HttpGet("guardians/{id:guid}/students")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<GuardianLinkedStudentDto>>>> ListGuardianStudents(Guid id, CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<GuardianLinkedStudentDto>>.Ok(await _service.ListGuardianStudentsAsync(id, ct)));

    [HttpPost("guardians")]
    public async Task<ActionResult<ApiResponse<GuardianDto>>> CreateGuardian([FromBody] GuardianUpsertRequest request, CancellationToken ct)
        => Ok(ApiResponse<GuardianDto>.Ok(await _service.CreateGuardianAsync(request, ct)));

    [HttpPut("guardians/{id:guid}")]
    public async Task<ActionResult<ApiResponse<GuardianDto>>> UpdateGuardian(Guid id, [FromBody] GuardianUpsertRequest request, CancellationToken ct)
        => Ok(ApiResponse<GuardianDto>.Ok(await _service.UpdateGuardianAsync(id, request, ct)));

    [HttpDelete("guardians/{id:guid}")]
    public async Task<ActionResult<ApiResponse>> DeleteGuardian(Guid id, CancellationToken ct)
    { await _service.DeleteGuardianAsync(id, ct); return Ok(ApiResponse.Ok("Guardian deleted.")); }

    [HttpGet("documents")]
    public async Task<ActionResult<ApiResponse<PagedResult<DocumentDto>>>> ListDocuments([FromQuery] string? entityType, [FromQuery] Guid? entityId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default)
        => Ok(ApiResponse<PagedResult<DocumentDto>>.Ok(await _service.ListDocumentsAsync(entityType, entityId, new PagedRequest { Page = page, PageSize = pageSize }, ct)));

    [HttpPost("documents")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<DocumentDto>>> UploadDocument([FromForm] string entityType, [FromForm] Guid entityId, IFormFile file, CancellationToken ct)
    {
        await using var stream = file.OpenReadStream();
        var doc = await _service.UploadDocumentAsync(entityType, entityId, stream, file.FileName, file.ContentType, ct);
        return Ok(ApiResponse<DocumentDto>.Ok(doc));
    }

    [HttpGet("documents/{id:guid}/download")]
    public async Task<IActionResult> DownloadDocument(Guid id, CancellationToken ct)
    {
        var (meta, content) = await _service.DownloadDocumentAsync(id, ct);
        return File(content, meta.ContentType, meta.OriginalFileName);
    }

    [HttpDelete("documents/{id:guid}")]
    public async Task<ActionResult<ApiResponse>> DeleteDocument(Guid id, CancellationToken ct)
    { await _service.DeleteDocumentAsync(id, ct); return Ok(ApiResponse.Ok("Document deleted.")); }

    [HttpPatch("documents/{id:guid}/status")]
    public async Task<ActionResult<ApiResponse<DocumentDto>>> SetDocumentStatus(Guid id, [FromBody] DocumentSetStatusRequest request, CancellationToken ct)
        => Ok(ApiResponse<DocumentDto>.Ok(await _service.SetDocumentStatusAsync(id, request.Status, ct)));

    [HttpGet("timeline")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<TimelineEventDto>>>> ListTimeline([FromQuery] string entityType, [FromQuery] Guid entityId, CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<TimelineEventDto>>.Ok(await _service.ListTimelineAsync(entityType, entityId, ct)));

    [HttpPost("timeline")]
    public async Task<ActionResult<ApiResponse<TimelineEventDto>>> CreateTimeline([FromBody] TimelineEventCreateRequest request, CancellationToken ct)
        => Ok(ApiResponse<TimelineEventDto>.Ok(await _service.CreateTimelineAsync(request, ct)));
}

[ApiController]
[Authorize]
[Route("api")]
public sealed class AcademicController : ControllerBase
{
    private readonly IAcademicService _service;
    public AcademicController(IAcademicService service) => _service = service;

    [HttpGet("teachers")]
    public async Task<ActionResult<ApiResponse<PagedResult<TeacherDto>>>> ListTeachers([FromQuery] Guid? branchId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? search = null, CancellationToken ct = default)
        => Ok(ApiResponse<PagedResult<TeacherDto>>.Ok(await _service.ListTeachersAsync(branchId, new PagedRequest { Page = page, PageSize = pageSize }, search, ct)));

    [HttpGet("teachers/{id:guid}")]
    public async Task<ActionResult<ApiResponse<TeacherDto>>> GetTeacher(Guid id, CancellationToken ct)
        => Ok(ApiResponse<TeacherDto>.Ok(await _service.GetTeacherAsync(id, ct)));

    [HttpPost("teachers")]
    public async Task<ActionResult<ApiResponse<TeacherDto>>> CreateTeacher([FromBody] TeacherUpsertRequest request, CancellationToken ct)
        => Ok(ApiResponse<TeacherDto>.Ok(await _service.CreateTeacherAsync(request, ct)));

    [HttpPut("teachers/{id:guid}")]
    public async Task<ActionResult<ApiResponse<TeacherDto>>> UpdateTeacher(Guid id, [FromBody] TeacherUpsertRequest request, CancellationToken ct)
        => Ok(ApiResponse<TeacherDto>.Ok(await _service.UpdateTeacherAsync(id, request, ct)));

    [HttpDelete("teachers/{id:guid}")]
    public async Task<ActionResult<ApiResponse>> DeleteTeacher(Guid id, CancellationToken ct)
    { await _service.DeleteTeacherAsync(id, ct); return Ok(ApiResponse.Ok("Teacher deleted.")); }

    [HttpGet("classrooms")]
    public async Task<ActionResult<ApiResponse<PagedResult<ClassroomDto>>>> ListClassrooms([FromQuery] Guid? branchId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? search = null, CancellationToken ct = default)
        => Ok(ApiResponse<PagedResult<ClassroomDto>>.Ok(await _service.ListClassroomsAsync(branchId, new PagedRequest { Page = page, PageSize = pageSize }, search, ct)));

    [HttpGet("classrooms/{id:guid}")]
    public async Task<ActionResult<ApiResponse<ClassroomDto>>> GetClassroom(Guid id, CancellationToken ct)
        => Ok(ApiResponse<ClassroomDto>.Ok(await _service.GetClassroomAsync(id, ct)));

    [HttpPost("classrooms")]
    public async Task<ActionResult<ApiResponse<ClassroomDto>>> CreateClassroom([FromBody] ClassroomUpsertRequest request, CancellationToken ct)
        => Ok(ApiResponse<ClassroomDto>.Ok(await _service.CreateClassroomAsync(request, ct)));

    [HttpPut("classrooms/{id:guid}")]
    public async Task<ActionResult<ApiResponse<ClassroomDto>>> UpdateClassroom(Guid id, [FromBody] ClassroomUpsertRequest request, CancellationToken ct)
        => Ok(ApiResponse<ClassroomDto>.Ok(await _service.UpdateClassroomAsync(id, request, ct)));

    [HttpDelete("classrooms/{id:guid}")]
    public async Task<ActionResult<ApiResponse>> DeleteClassroom(Guid id, CancellationToken ct)
    { await _service.DeleteClassroomAsync(id, ct); return Ok(ApiResponse.Ok("Classroom deleted.")); }

    [HttpGet("enrollments")]
    public async Task<ActionResult<ApiResponse<PagedResult<EnrollmentDto>>>> ListEnrollments([FromQuery] Guid? branchId, [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default)
        => Ok(ApiResponse<PagedResult<EnrollmentDto>>.Ok(await _service.ListEnrollmentsAsync(branchId, status, new PagedRequest { Page = page, PageSize = pageSize }, ct)));

    [HttpGet("enrollments/{id:guid}")]
    public async Task<ActionResult<ApiResponse<EnrollmentDto>>> GetEnrollment(Guid id, CancellationToken ct)
        => Ok(ApiResponse<EnrollmentDto>.Ok(await _service.GetEnrollmentAsync(id, ct)));

    [HttpPost("enrollments")]
    public async Task<ActionResult<ApiResponse<EnrollmentDto>>> CreateEnrollment([FromBody] CreateEnrollmentRequest request, CancellationToken ct)
        => Ok(ApiResponse<EnrollmentDto>.Ok(await _service.CreateEnrollmentAsync(request, ct)));

    [HttpPut("enrollments/{id:guid}/wizard")]
    public async Task<ActionResult<ApiResponse<EnrollmentDto>>> SaveWizard(Guid id, [FromBody] SaveEnrollmentWizardRequest request, CancellationToken ct)
        => Ok(ApiResponse<EnrollmentDto>.Ok(await _service.SaveEnrollmentWizardAsync(id, request, ct)));

    [HttpPost("enrollments/{id:guid}/complete")]
    public async Task<ActionResult<ApiResponse<EnrollmentDto>>> Complete(Guid id, [FromBody] CompleteEnrollmentRequest request, CancellationToken ct)
        => Ok(ApiResponse<EnrollmentDto>.Ok(await _service.CompleteEnrollmentAsync(id, request, ct)));

    [HttpDelete("enrollments/{id:guid}")]
    public async Task<ActionResult<ApiResponse>> DeleteEnrollment(Guid id, CancellationToken ct)
    { await _service.DeleteEnrollmentAsync(id, ct); return Ok(ApiResponse.Ok("Enrollment deleted.")); }
}

[ApiController]
[Authorize]
[Route("api")]
public sealed class FinanceController : ControllerBase
{
    private readonly IFinanceService _service;
    public FinanceController(IFinanceService service) => _service = service;

    [HttpGet("charges")]
    public async Task<ActionResult<ApiResponse<PagedResult<ChargeDto>>>> ListCharges([FromQuery] Guid? branchId, [FromQuery] Guid? studentId, [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default)
        => Ok(ApiResponse<PagedResult<ChargeDto>>.Ok(await _service.ListChargesAsync(branchId, studentId, status, new PagedRequest { Page = page, PageSize = pageSize }, ct)));

    [HttpGet("charges/{id:guid}")]
    public async Task<ActionResult<ApiResponse<ChargeDto>>> GetCharge(Guid id, CancellationToken ct)
        => Ok(ApiResponse<ChargeDto>.Ok(await _service.GetChargeAsync(id, ct)));

    [HttpPost("charges")]
    public async Task<ActionResult<ApiResponse<ChargeDto>>> CreateCharge([FromBody] CreateChargeRequest request, CancellationToken ct)
        => Ok(ApiResponse<ChargeDto>.Ok(await _service.CreateChargeAsync(request, ct)));

    [HttpGet("payments")]
    public async Task<ActionResult<ApiResponse<PagedResult<PaymentDto>>>> ListPayments([FromQuery] Guid? branchId, [FromQuery] Guid? studentId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default)
        => Ok(ApiResponse<PagedResult<PaymentDto>>.Ok(await _service.ListPaymentsAsync(branchId, studentId, new PagedRequest { Page = page, PageSize = pageSize }, ct)));

    [HttpGet("payments/{id:guid}")]
    public async Task<ActionResult<ApiResponse<PaymentDto>>> GetPayment(Guid id, CancellationToken ct)
        => Ok(ApiResponse<PaymentDto>.Ok(await _service.GetPaymentAsync(id, ct)));

    [HttpPost("payments")]
    public async Task<ActionResult<ApiResponse<PaymentDto>>> CreatePayment([FromBody] CreatePaymentRequest request, CancellationToken ct)
        => Ok(ApiResponse<PaymentDto>.Ok(await _service.CreatePaymentAsync(request, ct)));

    [HttpPost("payments/{id:guid}/reverse")]
    public async Task<ActionResult<ApiResponse<PaymentDto>>> ReversePayment(Guid id, [FromBody] ReversePaymentRequest request, CancellationToken ct)
        => Ok(ApiResponse<PaymentDto>.Ok(await _service.ReversePaymentAsync(id, request, ct)));

    [HttpGet("expenses")]
    public async Task<ActionResult<ApiResponse<PagedResult<ExpenseDto>>>> ListExpenses([FromQuery] Guid? branchId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default)
        => Ok(ApiResponse<PagedResult<ExpenseDto>>.Ok(await _service.ListExpensesAsync(branchId, new PagedRequest { Page = page, PageSize = pageSize }, ct)));

    [HttpPost("expenses")]
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> CreateExpense([FromBody] CreateExpenseRequest request, CancellationToken ct)
        => Ok(ApiResponse<ExpenseDto>.Ok(await _service.CreateExpenseAsync(request, ct)));

    [HttpDelete("expenses/{id:guid}")]
    public async Task<ActionResult<ApiResponse>> DeleteExpense(Guid id, CancellationToken ct)
    { await _service.DeleteExpenseAsync(id, ct); return Ok(ApiResponse.Ok("Expense deleted.")); }

    [HttpGet("cash-sessions")]
    public async Task<ActionResult<ApiResponse<PagedResult<CashSessionDto>>>> ListSessions([FromQuery] Guid? branchId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default)
        => Ok(ApiResponse<PagedResult<CashSessionDto>>.Ok(await _service.ListCashSessionsAsync(branchId, new PagedRequest { Page = page, PageSize = pageSize }, ct)));

    [HttpGet("cash-sessions/{id:guid}")]
    public async Task<ActionResult<ApiResponse<CashSessionDto>>> GetSession(Guid id, CancellationToken ct)
        => Ok(ApiResponse<CashSessionDto>.Ok(await _service.GetCashSessionAsync(id, ct)));

    [HttpGet("cash-sessions/open")]
    public async Task<ActionResult<ApiResponse<CashSessionDto?>>> GetOpen([FromQuery] Guid branchId, [FromQuery] string? shift, CancellationToken ct)
        => Ok(ApiResponse<CashSessionDto?>.Ok(await _service.GetOpenCashSessionAsync(branchId, shift, ct)));

    [HttpPost("cash-sessions/open")]
    public async Task<ActionResult<ApiResponse<CashSessionDto>>> Open([FromBody] OpenCashSessionRequest request, CancellationToken ct)
        => Ok(ApiResponse<CashSessionDto>.Ok(await _service.OpenCashSessionAsync(request, ct)));

    [HttpPost("cash-sessions/{id:guid}/close")]
    public async Task<ActionResult<ApiResponse<CashSessionDto>>> Close(Guid id, [FromBody] CloseCashSessionRequest request, CancellationToken ct)
        => Ok(ApiResponse<CashSessionDto>.Ok(await _service.CloseCashSessionAsync(id, request, ct)));

    [HttpGet("cash-sessions/{id:guid}/movements")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CashMovementDto>>>> Movements(Guid id, CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<CashMovementDto>>.Ok(await _service.ListMovementsAsync(id, ct)));

    [HttpPut("cash-sessions/{id:guid}/audit")]
    public async Task<ActionResult<ApiResponse<CashAuditDto>>> SaveAudit(Guid id, [FromBody] SaveCashAuditRequest request, CancellationToken ct)
        => Ok(ApiResponse<CashAuditDto>.Ok(await _service.SaveCashAuditAsync(id, request, ct)));

    [HttpGet("cash-sessions/{id:guid}/audit")]
    public async Task<ActionResult<ApiResponse<CashAuditDto?>>> GetAudit(Guid id, CancellationToken ct)
        => Ok(ApiResponse<CashAuditDto?>.Ok(await _service.GetCashAuditAsync(id, ct)));
}

[ApiController]
[Authorize]
[Route("api/reports")]
public sealed class ReportsController : ControllerBase
{
    private readonly IReportService _service;
    public ReportsController(IReportService service) => _service = service;

    [HttpGet("income-expense")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<IncomeExpenseRow>>>> IncomeExpense([FromQuery] Guid? branchId, [FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<IncomeExpenseRow>>.Ok(await _service.IncomeExpenseAsync(branchId, from, to, ct)));

    [HttpGet("enrollment")]
    public async Task<ActionResult<ApiResponse<EnrollmentReportDto>>> Enrollment([FromQuery] Guid? branchId, [FromQuery] Guid? schoolCycleId, CancellationToken ct)
        => Ok(ApiResponse<EnrollmentReportDto>.Ok(await _service.EnrollmentAsync(branchId, schoolCycleId, ct)));

    [HttpGet("morosity")]
    public async Task<ActionResult<ApiResponse<MorosityReportDto>>> Morosity([FromQuery] Guid? branchId, CancellationToken ct)
        => Ok(ApiResponse<MorosityReportDto>.Ok(await _service.MorosityAsync(branchId, ct)));

    [HttpGet("payment-methods")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PaymentMethodReportRow>>>> PaymentMethods([FromQuery] Guid? branchId, [FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<PaymentMethodReportRow>>.Ok(await _service.PaymentMethodsAsync(branchId, from, to, ct)));

    [HttpGet("concepts")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ConceptReportRow>>>> Concepts([FromQuery] Guid? branchId, [FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<ConceptReportRow>>.Ok(await _service.ConceptsAsync(branchId, from, to, ct)));

    [HttpGet("by-branch")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BranchReportRow>>>> ByBranch([FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<BranchReportRow>>.Ok(await _service.ByBranchAsync(from, to, ct)));

    [HttpGet("income-expense/export/pdf")]
    public async Task<IActionResult> ExportPdf([FromQuery] Guid? branchId, [FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken ct)
    {
        var (content, contentType, fileName) = await _service.ExportIncomeExpensePdfAsync(branchId, from, to, ct);
        return File(content, contentType, fileName);
    }

    [HttpGet("income-expense/export/excel")]
    public async Task<IActionResult> ExportExcel([FromQuery] Guid? branchId, [FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken ct)
    {
        var (content, contentType, fileName) = await _service.ExportIncomeExpenseExcelAsync(branchId, from, to, ct);
        return File(content, contentType, fileName);
    }
}

[ApiController]
[Authorize]
[Route("api/notifications")]
public sealed class NotificationsController : ControllerBase
{
    private readonly INotificationService _service;
    public NotificationsController(INotificationService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<NotificationDto>>>> List([FromQuery] bool unreadOnly = false, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default)
        => Ok(ApiResponse<PagedResult<NotificationDto>>.Ok(await _service.ListAsync(unreadOnly, new PagedRequest { Page = page, PageSize = pageSize }, ct)));

    [HttpPost("{id:guid}/read")]
    public async Task<ActionResult<ApiResponse>> MarkRead(Guid id, CancellationToken ct)
    { await _service.MarkReadAsync(id, ct); return Ok(ApiResponse.Ok("Marked as read.")); }

    [HttpPost("read-all")]
    public async Task<ActionResult<ApiResponse>> MarkAll(CancellationToken ct)
    { await _service.MarkAllReadAsync(ct); return Ok(ApiResponse.Ok("All marked as read.")); }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<NotificationDto>>> Create([FromBody] CreateNotificationRequest request, CancellationToken ct)
        => Ok(ApiResponse<NotificationDto>.Ok(await _service.CreateAsync(request, ct)));
}
