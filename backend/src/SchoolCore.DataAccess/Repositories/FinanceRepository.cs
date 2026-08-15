using System.Data;
using System.Data.Common;
using Dapper;
using SchoolCore.Models.Dtos.Common;
using SchoolCore.Models.Dtos.Finance;
using SchoolCore.Models.Dtos.Notifications;
using SchoolCore.Models.Dtos.Reports;

namespace SchoolCore.DataAccess.Repositories;

public interface IFinanceRepository
{
    Task<PagedResult<ChargeDto>> ListChargesAsync(Guid tenantId, Guid? branchId, Guid? studentId, string? status, int page, int pageSize, CancellationToken ct = default);
    Task<ChargeDto?> GetChargeAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<ChargeDto> CreateChargeAsync(Guid tenantId, Guid id, CreateChargeRequest request, Guid? userId, CancellationToken ct = default);

    Task<PagedResult<PaymentDto>> ListPaymentsAsync(Guid tenantId, Guid? branchId, Guid? studentId, int page, int pageSize, CancellationToken ct = default);
    Task<PaymentDto?> GetPaymentAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<PaymentDto> CreatePaymentAsync(Guid tenantId, Guid id, CreatePaymentRequest request, Guid? userId, CancellationToken ct = default);
    Task<PaymentDto> ReversePaymentAsync(Guid tenantId, Guid id, ReversePaymentRequest request, Guid? userId, CancellationToken ct = default);

    Task<PagedResult<ExpenseDto>> ListExpensesAsync(Guid tenantId, Guid? branchId, int page, int pageSize, CancellationToken ct = default);
    Task<ExpenseDto> CreateExpenseAsync(Guid tenantId, Guid id, CreateExpenseRequest request, Guid? userId, CancellationToken ct = default);
    Task SoftDeleteExpenseAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default);

    Task<CashSessionDto> OpenCashSessionAsync(Guid tenantId, Guid id, Guid userId, OpenCashSessionRequest request, Guid? actorId, CancellationToken ct = default);
    Task<CashSessionDto?> GetCashSessionAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<CashSessionDto?> GetOpenCashSessionAsync(Guid tenantId, Guid branchId, Guid userId, string? shift, CancellationToken ct = default);
    Task<PagedResult<CashSessionDto>> ListCashSessionsAsync(Guid tenantId, Guid? branchId, int page, int pageSize, CancellationToken ct = default);
    Task<CashSessionDto> CloseCashSessionAsync(Guid tenantId, Guid id, string? notes, Guid? userId, CancellationToken ct = default);
    Task<IReadOnlyList<CashMovementDto>> ListMovementsAsync(Guid tenantId, Guid sessionId, CancellationToken ct = default);
    Task<CashAuditDto> SaveCashAuditAsync(Guid tenantId, Guid id, Guid sessionId, SaveCashAuditRequest request, Guid? userId, CancellationToken ct = default);
    Task<CashAuditDto?> GetCashAuditAsync(Guid tenantId, Guid sessionId, CancellationToken ct = default);
}

public sealed class FinanceRepository : IFinanceRepository
{
    private readonly ISqlConnectionFactory _factory;
    public FinanceRepository(ISqlConnectionFactory factory) => _factory = factory;
    private async Task<DbConnection> OpenAsync(CancellationToken ct) => (DbConnection)await _factory.CreateOpenConnectionAsync(ct);

    public async Task<PagedResult<ChargeDto>> ListChargesAsync(Guid tenantId, Guid? branchId, Guid? studentId, string? status, int page, int pageSize, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var p = new DynamicParameters(new { TenantId = tenantId, BranchId = branchId, StudentId = studentId, Status = status, Page = page, PageSize = pageSize });
        var (items, total) = await DapperPaging.QueryPagedAsync<ChargeDto>(conn, "sp_Charge_List", p, ct);
        return DapperPaging.ToPagedResult(items, total, page, pageSize);
    }

    public async Task<ChargeDto?> GetChargeAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<ChargeDto>(new CommandDefinition("sp_Charge_GetById", new { TenantId = tenantId, Id = id }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<ChargeDto> CreateChargeAsync(Guid tenantId, Guid id, CreateChargeRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<ChargeDto>(new CommandDefinition("sp_Charge_Create", new
        {
            Id = id,
            TenantId = tenantId,
            request.BranchId,
            request.StudentId,
            request.PaymentConceptId,
            request.ConceptName,
            request.ConceptType,
            request.GrossAmount,
            request.ScholarshipPercent,
            request.DueDate,
            request.SchoolCycleId,
            CreatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<PagedResult<PaymentDto>> ListPaymentsAsync(Guid tenantId, Guid? branchId, Guid? studentId, int page, int pageSize, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var p = new DynamicParameters(new { TenantId = tenantId, BranchId = branchId, StudentId = studentId, Page = page, PageSize = pageSize });
        var (items, total) = await DapperPaging.QueryPagedAsync<PaymentDto>(conn, "sp_Payment_List", p, ct);
        return DapperPaging.ToPagedResult(items, total, page, pageSize);
    }

    public async Task<PaymentDto?> GetPaymentAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<PaymentDto>(new CommandDefinition("sp_Payment_GetById", new { TenantId = tenantId, Id = id }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<PaymentDto> CreatePaymentAsync(Guid tenantId, Guid id, CreatePaymentRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<PaymentDto>(new CommandDefinition("sp_Payment_Create", new
        {
            Id = id,
            TenantId = tenantId,
            request.BranchId,
            request.StudentId,
            request.ChargeId,
            request.CashSessionId,
            request.PaymentMethodId,
            request.Amount,
            request.Reference,
            request.IdempotencyKey,
            request.Notes,
            CreatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<PaymentDto> ReversePaymentAsync(Guid tenantId, Guid id, ReversePaymentRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<PaymentDto>(new CommandDefinition("sp_Payment_Reverse", new
        {
            TenantId = tenantId,
            Id = id,
            request.Reason,
            request.ReverseCashSessionId,
            UpdatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<PagedResult<ExpenseDto>> ListExpensesAsync(Guid tenantId, Guid? branchId, int page, int pageSize, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var p = new DynamicParameters(new { TenantId = tenantId, BranchId = branchId, Page = page, PageSize = pageSize });
        var (items, total) = await DapperPaging.QueryPagedAsync<ExpenseDto>(conn, "sp_Expense_List", p, ct);
        return DapperPaging.ToPagedResult(items, total, page, pageSize);
    }

    public async Task<ExpenseDto> CreateExpenseAsync(Guid tenantId, Guid id, CreateExpenseRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<ExpenseDto>(new CommandDefinition("sp_Expense_Create", new
        {
            Id = id,
            TenantId = tenantId,
            request.BranchId,
            request.CashSessionId,
            request.Concept,
            request.Category,
            request.Amount,
            request.ExpenseDate,
            request.Vendor,
            request.PaymentMethodId,
            request.Reference,
            CreatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task SoftDeleteExpenseAsync(Guid tenantId, Guid id, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition("sp_Expense_SoftDelete", new { TenantId = tenantId, Id = id, UpdatedBy = userId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<CashSessionDto> OpenCashSessionAsync(Guid tenantId, Guid id, Guid userId, OpenCashSessionRequest request, Guid? actorId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<CashSessionDto>(new CommandDefinition("sp_CashSession_Open", new
        {
            Id = id,
            TenantId = tenantId,
            request.BranchId,
            UserId = userId,
            request.Shift,
            request.OpeningAmount,
            request.Notes,
            CreatedBy = actorId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<CashSessionDto?> GetCashSessionAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<CashSessionDto>(new CommandDefinition("sp_CashSession_GetById", new { TenantId = tenantId, Id = id }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<CashSessionDto?> GetOpenCashSessionAsync(Guid tenantId, Guid branchId, Guid userId, string? shift, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<CashSessionDto>(new CommandDefinition("sp_CashSession_GetOpen", new { TenantId = tenantId, BranchId = branchId, UserId = userId, Shift = shift }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<PagedResult<CashSessionDto>> ListCashSessionsAsync(Guid tenantId, Guid? branchId, int page, int pageSize, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var p = new DynamicParameters(new { TenantId = tenantId, BranchId = branchId, Page = page, PageSize = pageSize });
        var (items, total) = await DapperPaging.QueryPagedAsync<CashSessionDto>(conn, "sp_CashSession_List", p, ct);
        return DapperPaging.ToPagedResult(items, total, page, pageSize);
    }

    public async Task<CashSessionDto> CloseCashSessionAsync(Guid tenantId, Guid id, string? notes, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<CashSessionDto>(new CommandDefinition("sp_CashSession_Close", new { TenantId = tenantId, Id = id, Notes = notes, UpdatedBy = userId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<IReadOnlyList<CashMovementDto>> ListMovementsAsync(Guid tenantId, Guid sessionId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var rows = await conn.QueryAsync<CashMovementDto>(new CommandDefinition("sp_CashMovement_ListBySession", new { TenantId = tenantId, CashSessionId = sessionId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<CashAuditDto> SaveCashAuditAsync(Guid tenantId, Guid id, Guid sessionId, SaveCashAuditRequest request, Guid? userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<CashAuditDto>(new CommandDefinition("sp_CashAudit_Save", new
        {
            Id = id,
            TenantId = tenantId,
            CashSessionId = sessionId,
            request.BillsJson,
            request.CoinsJson,
            request.TotalCash,
            request.TotalCard,
            request.TotalTransfer,
            request.TotalCheck,
            request.Observations,
            CreatedBy = userId
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<CashAuditDto?> GetCashAuditAsync(Guid tenantId, Guid sessionId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<CashAuditDto>(new CommandDefinition("sp_CashAudit_GetBySession", new { TenantId = tenantId, CashSessionId = sessionId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }
}

public interface IReportRepository
{
    Task<IReadOnlyList<IncomeExpenseRow>> IncomeExpenseAsync(Guid tenantId, Guid? branchId, DateTime from, DateTime to, CancellationToken ct = default);
    Task<EnrollmentReportDto> EnrollmentAsync(Guid tenantId, Guid? branchId, Guid? schoolCycleId, CancellationToken ct = default);
    Task<MorosityReportDto> MorosityAsync(Guid tenantId, Guid? branchId, CancellationToken ct = default);
    Task<IReadOnlyList<PaymentMethodReportRow>> PaymentMethodsAsync(Guid tenantId, Guid? branchId, DateTime from, DateTime to, CancellationToken ct = default);
    Task<IReadOnlyList<ConceptReportRow>> ConceptsAsync(Guid tenantId, Guid? branchId, DateTime from, DateTime to, CancellationToken ct = default);
    Task<IReadOnlyList<BranchReportRow>> ByBranchAsync(Guid tenantId, DateTime from, DateTime to, CancellationToken ct = default);
}

public sealed class ReportRepository : IReportRepository
{
    private readonly ISqlConnectionFactory _factory;
    public ReportRepository(ISqlConnectionFactory factory) => _factory = factory;
    private async Task<DbConnection> OpenAsync(CancellationToken ct) => (DbConnection)await _factory.CreateOpenConnectionAsync(ct);

    public async Task<IReadOnlyList<IncomeExpenseRow>> IncomeExpenseAsync(Guid tenantId, Guid? branchId, DateTime from, DateTime to, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var rows = await conn.QueryAsync<IncomeExpenseRow>(new CommandDefinition("sp_Report_IncomeExpense", new { TenantId = tenantId, BranchId = branchId, FromDate = from.Date, ToDate = to.Date }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<EnrollmentReportDto> EnrollmentAsync(Guid tenantId, Guid? branchId, Guid? schoolCycleId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await using var multi = await conn.QueryMultipleAsync(new CommandDefinition("sp_Report_Enrollment", new { TenantId = tenantId, BranchId = branchId, SchoolCycleId = schoolCycleId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
        return new EnrollmentReportDto
        {
            ByLevel = (await multi.ReadAsync<EnrollmentLevelRow>()).ToList(),
            ByBranch = (await multi.ReadAsync<EnrollmentBranchRow>()).ToList()
        };
    }

    public async Task<MorosityReportDto> MorosityAsync(Guid tenantId, Guid? branchId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await using var multi = await conn.QueryMultipleAsync(new CommandDefinition("sp_Report_Morosity", new { TenantId = tenantId, BranchId = branchId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
        return new MorosityReportDto
        {
            Items = (await multi.ReadAsync<MorosityItemRow>()).ToList(),
            ByLevel = (await multi.ReadAsync<MorosityLevelRow>()).ToList()
        };
    }

    public async Task<IReadOnlyList<PaymentMethodReportRow>> PaymentMethodsAsync(Guid tenantId, Guid? branchId, DateTime from, DateTime to, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var rows = await conn.QueryAsync<PaymentMethodReportRow>(new CommandDefinition("sp_Report_PaymentMethods", new { TenantId = tenantId, BranchId = branchId, FromDate = from.Date, ToDate = to.Date }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<IReadOnlyList<ConceptReportRow>> ConceptsAsync(Guid tenantId, Guid? branchId, DateTime from, DateTime to, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var rows = await conn.QueryAsync<ConceptReportRow>(new CommandDefinition("sp_Report_Concepts", new { TenantId = tenantId, BranchId = branchId, FromDate = from.Date, ToDate = to.Date }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<IReadOnlyList<BranchReportRow>> ByBranchAsync(Guid tenantId, DateTime from, DateTime to, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var rows = await conn.QueryAsync<BranchReportRow>(new CommandDefinition("sp_Report_ByBranch", new { TenantId = tenantId, FromDate = from.Date, ToDate = to.Date }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
        return rows.ToList();
    }
}

public interface INotificationRepository
{
    Task<PagedResult<NotificationDto>> ListAsync(Guid tenantId, Guid userId, bool unreadOnly, int page, int pageSize, CancellationToken ct = default);
    Task MarkReadAsync(Guid tenantId, Guid userId, Guid id, CancellationToken ct = default);
    Task MarkAllReadAsync(Guid tenantId, Guid userId, CancellationToken ct = default);
    Task<NotificationDto> CreateAsync(Guid tenantId, Guid id, CreateNotificationRequest request, CancellationToken ct = default);
}

public sealed class NotificationRepository : INotificationRepository
{
    private readonly ISqlConnectionFactory _factory;
    public NotificationRepository(ISqlConnectionFactory factory) => _factory = factory;
    private async Task<DbConnection> OpenAsync(CancellationToken ct) => (DbConnection)await _factory.CreateOpenConnectionAsync(ct);

    public async Task<PagedResult<NotificationDto>> ListAsync(Guid tenantId, Guid userId, bool unreadOnly, int page, int pageSize, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var p = new DynamicParameters(new { TenantId = tenantId, UserId = userId, UnreadOnly = unreadOnly, Page = page, PageSize = pageSize });
        var (items, total) = await DapperPaging.QueryPagedAsync<NotificationDto>(conn, "sp_Notification_List", p, ct);
        return DapperPaging.ToPagedResult(items, total, page, pageSize);
    }

    public async Task MarkReadAsync(Guid tenantId, Guid userId, Guid id, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition("sp_Notification_MarkRead", new { TenantId = tenantId, UserId = userId, Id = id }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task MarkAllReadAsync(Guid tenantId, Guid userId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        await conn.ExecuteAsync(new CommandDefinition("sp_Notification_MarkAllRead", new { TenantId = tenantId, UserId = userId }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<NotificationDto> CreateAsync(Guid tenantId, Guid id, CreateNotificationRequest request, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.QuerySingleAsync<NotificationDto>(new CommandDefinition("sp_Notification_Create", new
        {
            Id = id,
            TenantId = tenantId,
            request.UserId,
            request.Category,
            request.Title,
            request.Body,
            request.LinkUrl
        }, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }
}
