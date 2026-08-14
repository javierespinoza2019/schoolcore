namespace SchoolCore.Common.Time;

/// <summary>
/// Constantes y catálogo permitido de zonas IANA (México).
/// </summary>
public static class SchoolCoreTimeZones
{
    public const string PlatformDefault = "America/Mexico_City";

    public static readonly IReadOnlyList<string> AllowedIds =
    [
        "America/Mexico_City",
        "America/Cancun",
        "America/Mazatlan",
        "America/Chihuahua",
        "America/Hermosillo",
        "America/Tijuana"
    ];

    public static bool IsAllowed(string? timeZoneId) =>
        !string.IsNullOrWhiteSpace(timeZoneId) &&
        AllowedIds.Contains(timeZoneId, StringComparer.OrdinalIgnoreCase);
}
