using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolCore.Common.Responses;

namespace SchoolCore.API.Controllers;

/// <summary>
/// Dashboard KPIs (stub MVP alineado al FE hasta reportes reales).
/// </summary>
[ApiController]
[Authorize]
[Route("api/dashboard")]
public sealed class DashboardController : ControllerBase
{
    /// <summary>
    /// GET /api/dashboard/kpis — payload vacío/cero para empty state real (sin mocks del servidor).
    /// </summary>
    [HttpGet("kpis")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<ApiResponse<object>> GetKpis(
        [FromQuery] Guid? branchId,
        [FromQuery] Guid? cycleId)
    {
        _ = branchId;
        _ = cycleId;

        var data = new
        {
            kpis = new object[]
            {
                new { id = "total-alumnos", label = "Total Alumnos", value = "0", sub = "Sin datos", trend = "neutral", icon = "ri-user-star-line", color = "primary" },
                new { id = "ingresos-mes", label = "Ingresos del Mes", value = "$0", sub = "Sin datos", trend = "neutral", icon = "ri-money-dollar-circle-line", color = "success" },
                new { id = "colegiaturas-pendientes", label = "Colegiaturas Pendientes", value = "$0", sub = "Sin datos", trend = "neutral", icon = "ri-error-warning-line", color = "warning" },
                new { id = "tasa-cobranza", label = "Tasa de Cobranza", value = "—", sub = "Sin datos", trend = "neutral", icon = "ri-pie-chart-line", color = "accent" },
            },
            paymentDistribution = new object[]
            {
                new { name = "Al corriente", value = 0, color = "#10b981" },
                new { name = "1-15 días", value = 0, color = "#f59e0b" },
                new { name = "16-30 días", value = 0, color = "#f97316" },
                new { name = "+30 días", value = 0, color = "#ef4444" },
            },
            recentActivity = Array.Empty<object>(),
            revenueData = Array.Empty<object>(),
        };

        return Ok(ApiResponse<object>.Ok(data));
    }
}
