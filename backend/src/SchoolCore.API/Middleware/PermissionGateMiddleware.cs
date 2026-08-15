using System.Security.Claims;
using System.Text.Json;
using SchoolCore.Business.Services;
using SchoolCore.Common.Responses;

namespace SchoolCore.API.Middleware;

/// <summary>
/// Autorización por ViewCode+acción vía IPermissionResolver (BD RolePermission, fallback matriz C#).
/// Corre tras Authentication; no aplica a auth anónimo ni health.
/// </summary>
public sealed class PermissionGateMiddleware
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly RequestDelegate _next;

    public PermissionGateMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, IPermissionResolver permissionResolver)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        if (!path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("/api/auth", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("/api/Health", StringComparison.OrdinalIgnoreCase)
            || path.Equals("/healthz", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        // Endpoints de contexto básicos: cualquier usuario autenticado.
        if (IsContextOnly(path))
        {
            await _next(context);
            return;
        }

        if (context.User?.Identity?.IsAuthenticated != true)
        {
            await _next(context); // [Authorize] devolverá 401
            return;
        }

        var required = ResolveRequirement(path, context.Request.Method);
        if (required is null)
        {
            await _next(context);
            return;
        }

        var roles = context.User.FindAll(ClaimTypes.Role).Select(c => c.Value);
        if (!await permissionResolver.HasAsync(roles, required.Value.ViewCode, required.Value.Action, context.RequestAborted))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(
                ApiResponse.Fail(
                    "No tienes permiso para esta operación.",
                    new[] { "FORBIDDEN", $"{required.Value.ViewCode}:{required.Value.Action}" }),
                JsonOpts);
            return;
        }

        await _next(context);
    }

    private static bool IsContextOnly(string path)
    {
        var p = path.ToLowerInvariant();
        return p.StartsWith("/api/timezones")
            || p.StartsWith("/api/context/");
    }

    private static (string ViewCode, string Action)? ResolveRequirement(string path, string method)
    {
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        // api / {resource} / ...
        if (segments.Length < 2 || !segments[0].Equals("api", StringComparison.OrdinalIgnoreCase))
            return null;

        var resource = segments[1].ToLowerInvariant();
        var rest = string.Join('/', segments.Skip(2)).ToLowerInvariant();
        var http = method.ToUpperInvariant();

        var action = http switch
        {
            "GET" => "view",
            "POST" => "create",
            "PUT" or "PATCH" => "edit",
            "DELETE" => "delete",
            _ => "view"
        };

        if (rest.Contains("reverse", StringComparison.Ordinal))
            action = "approve";
        else if (rest.Contains("export", StringComparison.Ordinal))
            action = "export";
        else if (resource == "cash-sessions" && (rest.Contains("close") || rest.Contains("audit")))
            action = "edit";

        var view = resource switch
        {
            "dashboard" => "dashboard",
            "students" or "documents" or "timeline" => "students",
            "guardians" => "parents",
            "teachers" => "teachers",
            "classrooms" => "classrooms",
            "enrollments" => "enrollments",
            "charges" or "payments" or "expenses" => "finance",
            "cash-sessions" => "cash",
            "reports" => "reports",
            "notifications" => "notifications",
            "branches" => "branches",
            "school-cycles" or "institution-settings" or "education-levels"
                or "payment-methods" or "payment-concepts" or "users" or "roles"
                or "email-templates" or "feature-flags" or "role-permissions" => "settings",
            _ => null
        };

        return view is null ? null : (view, action);
    }
}
