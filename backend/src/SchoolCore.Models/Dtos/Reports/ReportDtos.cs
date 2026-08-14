namespace SchoolCore.Models.Dtos.Reports;

public sealed class IncomeExpenseRow
{
    public string Period { get; set; } = string.Empty;
    public decimal Income { get; set; }
    public decimal Expense { get; set; }
}

public sealed class EnrollmentLevelRow
{
    public string LevelName { get; set; } = string.Empty;
    public int StudentCount { get; set; }
}

public sealed class EnrollmentBranchRow
{
    public string BranchName { get; set; } = string.Empty;
    public int StudentCount { get; set; }
}

public sealed class EnrollmentReportDto
{
    public IReadOnlyList<EnrollmentLevelRow> ByLevel { get; set; } = Array.Empty<EnrollmentLevelRow>();
    public IReadOnlyList<EnrollmentBranchRow> ByBranch { get; set; } = Array.Empty<EnrollmentBranchRow>();
}

public sealed class MorosityItemRow
{
    public Guid ChargeId { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string ConceptName { get; set; } = string.Empty;
    public decimal NetAmount { get; set; }
    public DateTime DueDate { get; set; }
    public int? MoraInfoDays { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? LevelName { get; set; }
}

public sealed class MorosityLevelRow
{
    public string LevelName { get; set; } = string.Empty;
    public int OverdueCount { get; set; }
    public decimal OverdueAmount { get; set; }
}

public sealed class MorosityReportDto
{
    public IReadOnlyList<MorosityItemRow> Items { get; set; } = Array.Empty<MorosityItemRow>();
    public IReadOnlyList<MorosityLevelRow> ByLevel { get; set; } = Array.Empty<MorosityLevelRow>();
}

public sealed class PaymentMethodReportRow
{
    public string MethodName { get; set; } = string.Empty;
    public int PaymentCount { get; set; }
    public decimal TotalAmount { get; set; }
}

public sealed class ConceptReportRow
{
    public string ConceptName { get; set; } = string.Empty;
    public string ConceptType { get; set; } = string.Empty;
    public int ChargeCount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal PendingAmount { get; set; }
}

public sealed class BranchReportRow
{
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public int ActiveStudents { get; set; }
    public decimal Income { get; set; }
    public decimal Expense { get; set; }
    public decimal Outstanding { get; set; }
}
