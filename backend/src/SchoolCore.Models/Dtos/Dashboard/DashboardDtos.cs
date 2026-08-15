namespace SchoolCore.Models.Dtos.Dashboard;

public sealed class DashboardKpiItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Sub { get; set; } = string.Empty;
    public string Trend { get; set; } = "neutral";
    public string Icon { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}

public sealed class DashboardDistItemDto
{
    public string Name { get; set; } = string.Empty;
    public int Value { get; set; }
    public string Color { get; set; } = string.Empty;
}

public sealed class DashboardActivityItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string User { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string? Amount { get; set; }
}

public sealed class DashboardRevenuePointDto
{
    public string Month { get; set; } = string.Empty;
    public decimal Ingresos { get; set; }
    public decimal Egresos { get; set; }
}

public sealed class DashboardKpisDto
{
    public IReadOnlyList<DashboardKpiItemDto> Kpis { get; set; } = Array.Empty<DashboardKpiItemDto>();
    public IReadOnlyList<DashboardDistItemDto> PaymentDistribution { get; set; } = Array.Empty<DashboardDistItemDto>();
    public IReadOnlyList<DashboardActivityItemDto> RecentActivity { get; set; } = Array.Empty<DashboardActivityItemDto>();
    public IReadOnlyList<DashboardRevenuePointDto> RevenueData { get; set; } = Array.Empty<DashboardRevenuePointDto>();
}
