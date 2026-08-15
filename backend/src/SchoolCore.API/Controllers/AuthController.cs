using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SchoolCore.Business.Services;
using SchoolCore.Common.Responses;
using SchoolCore.Common.Security;
using SchoolCore.Models.Dtos.Auth;

namespace SchoolCore.API.Controllers;

/// <summary>
/// Endpoints de autenticación staff (login, refresh, logout, reset password).
/// </summary>
[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IPermissionResolver _permissionResolver;

    public AuthController(IAuthService authService, IPermissionResolver permissionResolver)
    {
        _authService = authService;
        _permissionResolver = permissionResolver;
    }

    /// <summary>
    /// Inicia sesión y emite access + refresh tokens.
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("AuthLogin")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> LoginAsync(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(request, GetClientIp(), cancellationToken);
        return Ok(ApiResponse<LoginResponse>.Ok(result));
    }

    /// <summary>
    /// Renueva el access token usando un refresh token válido (rotación).
    /// </summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [EnableRateLimiting("AuthLogin")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> RefreshAsync(
        [FromBody] RefreshRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _authService.RefreshAsync(request, GetClientIp(), cancellationToken);
        return Ok(ApiResponse<LoginResponse>.Ok(result));
    }

    /// <summary>
    /// Revoca el refresh token presentado (cierre de sesión).
    /// </summary>
    [HttpPost("logout")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse>> LogoutAsync(
        [FromBody] LogoutRequest request,
        CancellationToken cancellationToken)
    {
        await _authService.LogoutAsync(request, cancellationToken);
        return Ok(ApiResponse.Ok("Logged out."));
    }

    /// <summary>
    /// Solicita correo de recuperación de contraseña (respuesta uniforme).
    /// </summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [EnableRateLimiting("ForgotPassword")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<ApiResponse>> ForgotPasswordAsync(
        [FromBody] ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        await _authService.ForgotPasswordAsync(request, cancellationToken);
        return Ok(ApiResponse.Ok("If the account exists, a password reset email has been sent."));
    }

    /// <summary>
    /// Establece una nueva contraseña con token de un uso e invalida refresh tokens.
    /// </summary>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    [EnableRateLimiting("ForgotPassword")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse>> ResetPasswordAsync(
        [FromBody] ResetPasswordRequest request,
        CancellationToken cancellationToken)
    {
        await _authService.ResetPasswordAsync(request, cancellationToken);
        return Ok(ApiResponse.Ok("Password updated."));
    }

    /// <summary>
    /// Devuelve claims del usuario autenticado (diagnóstico / FE bootstrap).
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<ApiResponse<object>> Me()
    {
        var data = new
        {
            userId = User.FindFirstValue(ClaimTypes.NameIdentifier),
            email = User.FindFirstValue(ClaimTypes.Email),
            tenantId = User.FindFirstValue(SchoolCore.Common.Security.SchoolCoreClaimTypes.TenantId),
            tenantCode = User.FindFirstValue(SchoolCore.Common.Security.SchoolCoreClaimTypes.TenantCode),
            roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToArray(),
            branchIds = User.FindAll(SchoolCore.Common.Security.SchoolCoreClaimTypes.BranchId).Select(c => c.Value).ToArray()
        };

        return Ok(ApiResponse<object>.Ok(data));
    }

    /// <summary>
    /// Permisos del usuario autenticado (ViewCode + acciones) desde RolePermission / fallback matriz.
    /// </summary>
    [HttpGet("me/permissions")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<object>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<object>>>> MyPermissions(CancellationToken cancellationToken)
    {
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value);
        var grants = await _permissionResolver.ResolveAsync(roles, cancellationToken);
        var payload = grants
            .Select(g => (object)new { viewCode = g.ViewCode, actions = g.Actions })
            .ToList();

        return Ok(ApiResponse<IReadOnlyList<object>>.Ok(payload));
    }

    private string? GetClientIp() =>
        HttpContext.Connection.RemoteIpAddress?.ToString();
}
