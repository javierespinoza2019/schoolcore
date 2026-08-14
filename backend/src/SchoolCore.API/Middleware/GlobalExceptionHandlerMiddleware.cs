using System.Net;
using System.Text.Json;
using Microsoft.Data.SqlClient;
using SchoolCore.Common.Exceptions;
using SchoolCore.Common.Responses;

namespace SchoolCore.API.Middleware;

/// <summary>
/// Middleware global de excepciones → HTTP semántico + ApiResponse.
/// Detalle expuesto en Development/QA o si App:ExposeErrorDetails=true.
/// </summary>
public sealed class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;
    private readonly IHostEnvironment _environment;
    private readonly IConfiguration _configuration;

    public GlobalExceptionHandlerMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionHandlerMiddleware> logger,
        IHostEnvironment environment,
        IConfiguration configuration)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
        _configuration = configuration;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        if (exception is not AppException)
        {
            _logger.LogError(exception, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);
        }
        else
        {
            _logger.LogWarning(exception, "Handled application exception for {Method} {Path}", context.Request.Method, context.Request.Path);
        }

        var exposeDetails =
            _environment.IsDevelopment()
            || _environment.IsEnvironment("QA")
            || _configuration.GetValue("App:ExposeErrorDetails", false);

        var (status, message, errors) = MapException(exception, exposeDetails);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)status;

        var payload = ApiResponse.Fail(message, errors);
        var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }

    private static (HttpStatusCode Status, string Message, IReadOnlyList<string> Errors) MapException(
        Exception exception,
        bool exposeDetails)
    {
        switch (exception)
        {
            case AppException app:
                return ((HttpStatusCode)app.StatusCode, app.Message, app.Errors);

            case UnauthorizedAccessException:
                return (HttpStatusCode.Unauthorized, "Unauthorized.", new[] { "Unauthorized." });

            case KeyNotFoundException:
                return (HttpStatusCode.NotFound, exception.Message, new[] { exception.Message });

            case ArgumentException:
                return (HttpStatusCode.BadRequest, exception.Message, new[] { exception.Message });

            case InvalidOperationException:
                return (HttpStatusCode.Conflict, exception.Message, new[] { exception.Message });

            case SqlException sql:
            {
                var detail = $"SQL error {sql.Number}: {sql.Message}";
                if (exposeDetails)
                {
                    return (HttpStatusCode.InternalServerError, detail, new[] { detail });
                }

                return (
                    HttpStatusCode.InternalServerError,
                    "A database error occurred.",
                    new[] { "A database error occurred." });
            }

            default:
            {
                if (exposeDetails)
                {
                    var detail = exception.Message;
                    var errors = new List<string> { detail };
                    if (exception.InnerException is not null)
                    {
                        errors.Add(exception.InnerException.Message);
                    }

                    return (HttpStatusCode.InternalServerError, detail, errors);
                }

                return (
                    HttpStatusCode.InternalServerError,
                    "An unexpected error occurred.",
                    new[] { "An unexpected error occurred." });
            }
        }
    }
}
