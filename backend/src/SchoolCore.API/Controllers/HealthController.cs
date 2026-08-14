using Microsoft.AspNetCore.Mvc;
using SchoolCore.Business.Services;
using SchoolCore.Common.Responses;

namespace SchoolCore.API.Controllers;

/// <summary>
/// Health check de API / BD.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public sealed class HealthController : ControllerBase
{
    private readonly IHealthService _healthService;

    public HealthController(IHealthService healthService)
    {
        _healthService = healthService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> GetAsync(CancellationToken cancellationToken)
    {
        var data = await _healthService.GetStatusAsync(cancellationToken);
        return Ok(ApiResponse<object>.Ok(data));
    }
}
