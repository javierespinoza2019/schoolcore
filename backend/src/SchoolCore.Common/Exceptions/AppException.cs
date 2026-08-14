namespace SchoolCore.Common.Exceptions;

/// <summary>
/// Excepción de dominio con status HTTP semántico para el middleware.
/// </summary>
public sealed class AppException : Exception
{
    public int StatusCode { get; }
    public IReadOnlyList<string> Errors { get; }

    public AppException(int statusCode, string message, IEnumerable<string>? errors = null)
        : base(message)
    {
        StatusCode = statusCode;
        Errors = errors?.ToList() ?? new List<string> { message };
    }

    public static AppException BadRequest(string message, IEnumerable<string>? errors = null) =>
        new(400, message, errors);

    public static AppException Unauthorized(string message = "Unauthorized.") =>
        new(401, message);

    public static AppException Forbidden(string message) =>
        new(403, message);

    public static AppException Conflict(string message) =>
        new(409, message);

    public static AppException NotFound(string message) =>
        new(404, message);
}
