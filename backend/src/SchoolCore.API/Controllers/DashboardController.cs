using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolCore.Business.Services;
using SchoolCore.Common.Responses;
using SchoolCore.Models.Dtos.Dashboard;

namespace SchoolCore.API.Controllers;

/// <summary>Dashboard KPIs derivados de datos reales (alumnos, cobros, reportes).</summary>
[ApiController]
[Authorize]
[Route("api/dashboard")]
public sealed class DashboardController : ControllerBase
{
    private readonly IDashboardService _service;

    public DashboardController(IDashboardService service) => _service = service;

    [HttpGet("kpis")]
    [ProducesResponseType(typeof(ApiResponse<DashboardKpisDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<DashboardKpisDto>>> GetKpis(
        [FromQuery] Guid? branchId,
        [FromQuery] Guid? cycleId,
        CancellationToken ct)
        => Ok(ApiResponse<DashboardKpisDto>.Ok(await _service.GetKpisAsync(branchId, cycleId, ct)));
}
