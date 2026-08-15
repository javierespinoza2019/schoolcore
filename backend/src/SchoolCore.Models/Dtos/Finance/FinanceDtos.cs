namespace SchoolCore.Models.Dtos.Finance;

public sealed class ChargeDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid BranchId { get; set; }
    public Guid StudentId { get; set; }
    public string? StudentName { get; set; }
    public Guid? PaymentConceptId { get; set; }
    public string ConceptName { get; set; } = string.Empty;
    public string ConceptType { get; set; } = string.Empty;
    public decimal GrossAmount { get; set; }
    public decimal ScholarshipPercent { get; set; }
    public decimal NetAmount { get; set; }
    public decimal AmountPaid { get; set; }
    public DateTime DueDate { get; set; }
    public string Status { get; set; } = "pending";
    public Guid? SchoolCycleId { get; set; }
    public int? MoraInfoDays { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class CreateChargeRequest
{
    public Guid BranchId { get; set; }
    public Guid StudentId { get; set; }
    public Guid? PaymentConceptId { get; set; }
    public string ConceptName { get; set; } = string.Empty;
    public string ConceptType { get; set; } = "colegiatura";
    public decimal GrossAmount { get; set; }
    public decimal? ScholarshipPercent { get; set; }
    public DateTime DueDate { get; set; }
    public Guid? SchoolCycleId { get; set; }
}

public sealed class PaymentDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid BranchId { get; set; }
    public Guid StudentId { get; set; }
    public string? StudentName { get; set; }
    public Guid ChargeId { get; set; }
    public Guid? CashSessionId { get; set; }
    public Guid? PaymentMethodId { get; set; }
    public string? PaymentMethodName { get; set; }
    public decimal Amount { get; set; }
    public string Folio { get; set; } = string.Empty;
    public DateTime PaidAt { get; set; }
    public string? Reference { get; set; }
    public string? Notes { get; set; }
    /// <summary>posted | voided</summary>
    public string Status { get; set; } = "posted";
    public string? VoidReason { get; set; }
    public DateTime? VoidedAt { get; set; }
    public Guid? VoidedBy { get; set; }
    public Guid? ReverseCashSessionId { get; set; }
    public Guid? ReverseMovementId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class CreatePaymentRequest
{
    public Guid BranchId { get; set; }
    public Guid StudentId { get; set; }
    public Guid ChargeId { get; set; }
    /// <summary>BR-58B: siempre obligatorio (cualquier método de pago).</summary>
    public Guid CashSessionId { get; set; }
    public Guid? PaymentMethodId { get; set; }
    public decimal Amount { get; set; }
    public string? Reference { get; set; }
    public string? IdempotencyKey { get; set; }
    public string? Notes { get; set; }
}

public sealed class ReversePaymentRequest
{
    /// <summary>Motivo obligatorio del reverso contable (BR-59C).</summary>
    public string Reason { get; set; } = string.Empty;
    /// <summary>Opcional: corte abierto donde asentar el egreso/reverso.</summary>
    public Guid? ReverseCashSessionId { get; set; }
}

public sealed class ExpenseDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid BranchId { get; set; }
    public Guid? CashSessionId { get; set; }
    public string Concept { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; }
    public string? Vendor { get; set; }
    public Guid? PaymentMethodId { get; set; }
    public string? Reference { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class CreateExpenseRequest
{
    public Guid BranchId { get; set; }
    public Guid? CashSessionId { get; set; }
    public string Concept { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; }
    public string? Vendor { get; set; }
    public Guid? PaymentMethodId { get; set; }
    public string? Reference { get; set; }
}

public sealed class CashSessionDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid BranchId { get; set; }
    public Guid UserId { get; set; }
    public string Shift { get; set; } = "morning";
    public DateTime OpenedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public decimal OpeningAmount { get; set; }
    public decimal TotalIncome { get; set; }
    public decimal TotalExpense { get; set; }
    public decimal? ClosingAmount { get; set; }
    public decimal? DifferenceAmount { get; set; }
    public string Status { get; set; } = "open";
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class OpenCashSessionRequest
{
    public Guid BranchId { get; set; }
    public string Shift { get; set; } = "morning";
    public decimal OpeningAmount { get; set; }
    public string? Notes { get; set; }
}

public sealed class CloseCashSessionRequest
{
    public string? Notes { get; set; }
}

public sealed class CashMovementDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid CashSessionId { get; set; }
    public string MovementType { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Concept { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? PaymentMethodName { get; set; }
    public string? Reference { get; set; }
    public Guid? StudentId { get; set; }
    public Guid? PaymentId { get; set; }
    public Guid? ExpenseId { get; set; }
    public DateTime OccurredAt { get; set; }
}

public sealed class CashAuditDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid CashSessionId { get; set; }
    public string? BillsJson { get; set; }
    public string? CoinsJson { get; set; }
    public decimal TotalCash { get; set; }
    public decimal TotalCard { get; set; }
    public decimal TotalTransfer { get; set; }
    public decimal TotalCheck { get; set; }
    public decimal SystemTotal { get; set; }
    public decimal DifferenceAmount { get; set; }
    public string? Observations { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class SaveCashAuditRequest
{
    public string? BillsJson { get; set; }
    public string? CoinsJson { get; set; }
    public decimal TotalCash { get; set; }
    public decimal TotalCard { get; set; }
    public decimal TotalTransfer { get; set; }
    public decimal TotalCheck { get; set; }
    public string? Observations { get; set; }
}
