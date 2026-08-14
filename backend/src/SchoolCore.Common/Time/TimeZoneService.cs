namespace SchoolCore.Common.Time;

/// <summary>
/// Conversión única de frontera: hora de negocio ↔ UTC.
/// No reescribe historial; solo transforma valores en memoria.
/// </summary>
public interface ITimeZoneService
{
    /// <summary>Convierte pared local de negocio a UTC (Kind=Utc).</summary>
    DateTime ToUtc(DateTime localWallClock, string timeZoneId);

    /// <summary>Convierte UTC a pared local de negocio (Kind=Unspecified).</summary>
    DateTime ToLocal(DateTime utc, string timeZoneId);

    /// <summary>Día civil de negocio para un instante UTC.</summary>
    DateOnly GetBusinessDate(DateTime utc, string timeZoneId);

    /// <summary>Rango UTC [start, end) que cubre un día civil en la zona dada.</summary>
    (DateTime StartUtc, DateTime EndUtcExclusive) GetUtcRangeForBusinessDate(DateOnly businessDate, string timeZoneId);

    /// <summary>Resuelve IANA id o lanza si no está permitido / no existe en el SO.</summary>
    TimeZoneInfo GetTimeZoneInfo(string timeZoneId);
}

/// <inheritdoc />
public sealed class TimeZoneService : ITimeZoneService
{
    public DateTime ToUtc(DateTime localWallClock, string timeZoneId)
    {
        var tz = GetTimeZoneInfo(timeZoneId);
        var unspecified = DateTime.SpecifyKind(localWallClock, DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(unspecified, tz);
    }

    public DateTime ToLocal(DateTime utc, string timeZoneId)
    {
        var tz = GetTimeZoneInfo(timeZoneId);
        var utcValue = utc.Kind switch
        {
            DateTimeKind.Utc => utc,
            DateTimeKind.Local => utc.ToUniversalTime(),
            _ => DateTime.SpecifyKind(utc, DateTimeKind.Utc)
        };
        return TimeZoneInfo.ConvertTimeFromUtc(utcValue, tz);
    }

    public DateOnly GetBusinessDate(DateTime utc, string timeZoneId)
    {
        var local = ToLocal(utc, timeZoneId);
        return DateOnly.FromDateTime(local);
    }

    public (DateTime StartUtc, DateTime EndUtcExclusive) GetUtcRangeForBusinessDate(DateOnly businessDate, string timeZoneId)
    {
        var tz = GetTimeZoneInfo(timeZoneId);
        var startLocal = businessDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
        var endLocal = businessDate.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
        return (TimeZoneInfo.ConvertTimeToUtc(startLocal, tz), TimeZoneInfo.ConvertTimeToUtc(endLocal, tz));
    }

    public TimeZoneInfo GetTimeZoneInfo(string timeZoneId)
    {
        var id = string.IsNullOrWhiteSpace(timeZoneId)
            ? SchoolCoreTimeZones.PlatformDefault
            : timeZoneId.Trim();

        if (!SchoolCoreTimeZones.IsAllowed(id))
        {
            throw new ArgumentException($"Time zone '{id}' is not allowed.", nameof(timeZoneId));
        }

        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(id);
        }
        catch (TimeZoneNotFoundException ex)
        {
            throw new ArgumentException($"Time zone '{id}' is not available on this server.", nameof(timeZoneId), ex);
        }
    }
}
