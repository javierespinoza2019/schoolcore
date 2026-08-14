namespace SchoolCore.Common.Options;

/// <summary>
/// Configuración JWT (Issuer, Audience, Secret, expiraciones).
/// </summary>
public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public string Secret { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; set; } = 60;
    public int RefreshTokenDays { get; set; } = 7;
}

/// <summary>
/// Configuración SMTP para envío de correo.
/// </summary>
public sealed class SmtpOptions
{
    public const string SectionName = "Smtp";

    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool EnableSsl { get; set; } = true;
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromAddress { get; set; } = "noreply@school-core.net";
    public string FromDisplayName { get; set; } = "SchoolCore";
}

/// <summary>
/// URLs públicas de la aplicación.
/// </summary>
public sealed class AppOptions
{
    public const string SectionName = "App";

    public string PublicWebBaseUrl { get; set; } = "https://app.school-core.net";
    public string PublicApiBaseUrl { get; set; } = "https://api.school-core.net";
}

/// <summary>
/// Configuración de almacenamiento de documentos en disco local.
/// </summary>
public sealed class DocumentsOptions
{
    public const string SectionName = "Documents";

    public string RootPath { get; set; } = "documents";
    public long MaxFileSizeBytes { get; set; } = 5 * 1024 * 1024;
    public string[] AllowedExtensions { get; set; } = [".pdf", ".png", ".jpg", ".jpeg"];
}
