using SchoolCore.Business.Security;
using SchoolCore.Common.Security;
using SchoolCore.DataAccess.Repositories;
using SchoolCore.Models.Dtos.Dashboard;

namespace SchoolCore.Business.Services;

public interface IDashboardService
{
    Task<DashboardKpisDto> GetKpisAsync(Guid? branchId, Guid? schoolCycleId, CancellationToken ct = default);
}

/// <summary>KPIs del dashboard derivados de alumnos, reportes y cobros (sin mocks).</summary>
public sealed class DashboardService : IDashboardService
{
    private readonly IPeopleRepository _people;
    private readonly IFinanceRepository _finance;
    private readonly IReportRepository _reports;
    private readonly ITenantContext _tenant;

    private static readonly string[] MonthLabels =
        ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    public DashboardService(
        IPeopleRepository people,
        IFinanceRepository finance,
        IReportRepository reports,
        ITenantContext tenant)
    {
        _people = people;
        _finance = finance;
        _reports = reports;
        _tenant = tenant;
    }

    public async Task<DashboardKpisDto> GetKpisAsync(Guid? branchId, Guid? schoolCycleId, CancellationToken ct = default)
    {
        _ = schoolCycleId;
        var (tenantId, _) = TenantGuard.Require(_tenant);
        var utcNow = DateTime.UtcNow;
        var monthStart = new DateTime(utcNow.Year, utcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var from6 = monthStart.AddMonths(-5);

        var studentsPage = await _people.ListStudentsAsync(tenantId, branchId, "active", 1, 1, null, ct);
        var totalAlumnos = studentsPage.TotalCount;

        var incomeExpense = await _reports.IncomeExpenseAsync(tenantId, branchId, from6, utcNow, ct);
        var thisPeriod = $"{utcNow.Year:D4}-{utcNow.Month:D2}";
        var prev = monthStart.AddMonths(-1);
        var prevPeriod = $"{prev.Year:D4}-{prev.Month:D2}";
        var incomeThis = incomeExpense.FirstOrDefault(r => r.Period == thisPeriod)?.Income ?? 0m;
        var incomePrev = incomeExpense.FirstOrDefault(r => r.Period == prevPeriod)?.Income ?? 0m;

        var chargesAll = await _finance.ListChargesAsync(tenantId, branchId, null, null, 1, 200, ct);
        var pendingAmount = chargesAll.Items
            .Where(c => string.Equals(c.Status, "pending", StringComparison.OrdinalIgnoreCase)
                     || string.Equals(c.Status, "overdue", StringComparison.OrdinalIgnoreCase))
            .Sum(c => c.NetAmount);
        var paidAmount = chargesAll.Items
            .Where(c => string.Equals(c.Status, "paid", StringComparison.OrdinalIgnoreCase))
            .Sum(c => c.NetAmount);
        var grossCharges = paidAmount + pendingAmount;
        var collectionRate = grossCharges > 0 ? Math.Round(paidAmount / grossCharges * 100m, 0) : (decimal?)null;

        var morosity = await _reports.MorosityAsync(tenantId, branchId, ct);
        var overdueByStudent = morosity.Items
            .GroupBy(i => i.StudentId)
            .Select(g => g.Max(x => x.MoraInfoDays ?? 0))
            .ToList();
        var bucket1 = overdueByStudent.Count(d => d is >= 1 and <= 15);
        var bucket2 = overdueByStudent.Count(d => d is >= 16 and <= 30);
        var bucket3 = overdueByStudent.Count(d => d > 30);
        var overdueStudents = overdueByStudent.Count;
        var alCorriente = Math.Max(0, totalAlumnos - overdueStudents);

        var incomeTrend = incomePrev <= 0
            ? (incomeThis > 0 ? "up" : "neutral")
            : incomeThis >= incomePrev ? "up" : "down";
        var incomeDeltaPct = incomePrev > 0
            ? Math.Round((incomeThis - incomePrev) / incomePrev * 100m, 0)
            : 0m;

        var payments = await _finance.ListPaymentsAsync(tenantId, branchId, null, 1, 8, ct);
        var activity = payments.Items
            .Where(p => !string.Equals(p.Status, "voided", StringComparison.OrdinalIgnoreCase))
            .Select(p => new DashboardActivityItemDto
            {
                Id = p.Id.ToString(),
                Text = $"Cobro {p.Folio} — {p.StudentName ?? "Alumno"}",
                User = p.PaymentMethodName ?? "Caja",
                Time = p.PaidAt.ToString("yyyy-MM-dd HH:mm"),
                Icon = "ri-money-dollar-circle-line",
                Color = "success",
                Amount = p.Amount.ToString("C0", System.Globalization.CultureInfo.GetCultureInfo("es-MX"))
            })
            .ToList();

        var revenue = incomeExpense
            .OrderBy(r => r.Period)
            .Select(r =>
            {
                var parts = r.Period.Split('-');
                var monthIdx = parts.Length == 2 && int.TryParse(parts[1], out var m) ? m - 1 : 0;
                var label = monthIdx is >= 0 and < 12 ? MonthLabels[monthIdx] : r.Period;
                return new DashboardRevenuePointDto
                {
                    Month = label,
                    Ingresos = r.Income,
                    Egresos = r.Expense
                };
            })
            .ToList();

        return new DashboardKpisDto
        {
            Kpis =
            [
                new DashboardKpiItemDto
                {
                    Id = "total-alumnos",
                    Label = "Total Alumnos",
                    Value = totalAlumnos.ToString("N0"),
                    Sub = branchId.HasValue ? "Sucursal activa" : "Todas las sucursales",
                    Trend = "neutral",
                    Icon = "ri-user-star-line",
                    Color = "primary"
                },
                new DashboardKpiItemDto
                {
                    Id = "ingresos-mes",
                    Label = "Ingresos del Mes",
                    Value = incomeThis.ToString("C0", System.Globalization.CultureInfo.GetCultureInfo("es-MX")),
                    Sub = incomePrev > 0 ? $"{(incomeDeltaPct >= 0 ? "+" : "")}{incomeDeltaPct}% vs mes anterior" : "Sin mes anterior",
                    Trend = incomeTrend,
                    Icon = "ri-money-dollar-circle-line",
                    Color = "success"
                },
                new DashboardKpiItemDto
                {
                    Id = "colegiaturas-pendientes",
                    Label = "Colegiaturas Pendientes",
                    Value = pendingAmount.ToString("C0", System.Globalization.CultureInfo.GetCultureInfo("es-MX")),
                    Sub = $"{overdueStudents} alumnos con mora",
                    Trend = overdueStudents > 0 ? "down" : "neutral",
                    Icon = "ri-error-warning-line",
                    Color = "warning"
                },
                new DashboardKpiItemDto
                {
                    Id = "tasa-cobranza",
                    Label = "Tasa de Cobranza",
                    Value = collectionRate.HasValue ? $"{collectionRate}%" : "—",
                    Sub = grossCharges > 0 ? "Pagado / cargos" : "Sin cargos",
                    Trend = collectionRate is >= 80 ? "up" : collectionRate is < 50 ? "down" : "neutral",
                    Icon = "ri-pie-chart-line",
                    Color = "accent"
                }
            ],
            PaymentDistribution =
            [
                new DashboardDistItemDto { Name = "Al corriente", Value = alCorriente, Color = "#10b981" },
                new DashboardDistItemDto { Name = "1-15 días", Value = bucket1, Color = "#f59e0b" },
                new DashboardDistItemDto { Name = "16-30 días", Value = bucket2, Color = "#f97316" },
                new DashboardDistItemDto { Name = "+30 días", Value = bucket3, Color = "#ef4444" }
            ],
            RecentActivity = activity,
            RevenueData = revenue
        };
    }
}
