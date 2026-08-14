using SchoolCore.Common.Time;
using Xunit;

namespace SchoolCore.Tests;

/// <summary>
/// Garantiza integridad de conversión UTC ↔ zona de negocio (sin doble conversión / sin corrupción).
/// </summary>
public class TimeZoneIntegrityTests
{
    private readonly ITimeZoneService _tz = new TimeZoneService();

    [Theory]
    [InlineData("America/Mexico_City")]
    [InlineData("America/Cancun")]
    [InlineData("America/Tijuana")]
    public void RoundTrip_LocalToUtcToLocal_PreservesWallClock(string zoneId)
    {
        var local = new DateTime(2026, 8, 8, 10, 0, 0, DateTimeKind.Unspecified);
        var utc = _tz.ToUtc(local, zoneId);
        var back = _tz.ToLocal(utc, zoneId);

        Assert.Equal(DateTimeKind.Utc, utc.Kind);
        Assert.Equal(local, back);
    }

    [Fact]
    public void SameWallClock_DifferentZones_ProduceDifferentUtc()
    {
        var wall = new DateTime(2026, 8, 8, 10, 0, 0, DateTimeKind.Unspecified);
        var cdmx = _tz.ToUtc(wall, "America/Mexico_City");
        var cancun = _tz.ToUtc(wall, "America/Cancun");

        Assert.NotEqual(cdmx, cancun);
        Assert.Equal(wall, _tz.ToLocal(cdmx, "America/Mexico_City"));
        Assert.Equal(wall, _tz.ToLocal(cancun, "America/Cancun"));
    }

    [Fact]
    public void ChangingDisplayZone_DoesNotMutateStoredUtc()
    {
        var storedUtc = _tz.ToUtc(new DateTime(2026, 8, 8, 23, 30, 0), "America/Mexico_City");
        var before = storedUtc;

        // Simula cambio de config de zona: solo cambia el formateo
        var shownInCancun = _tz.ToLocal(storedUtc, "America/Cancun");

        Assert.Equal(before, storedUtc);
        Assert.NotEqual(shownInCancun, _tz.ToLocal(storedUtc, "America/Mexico_City"));
    }

    [Fact]
    public void BusinessDate_NearUtcMidnight_UsesEffectiveZone()
    {
        // 2026-08-09 05:00 UTC ≈ 2026-08-08 23:00 in Mexico City (UTC-6)
        var utc = new DateTime(2026, 8, 9, 5, 0, 0, DateTimeKind.Utc);
        var businessDate = _tz.GetBusinessDate(utc, "America/Mexico_City");

        Assert.Equal(new DateOnly(2026, 8, 8), businessDate);

        var (start, end) = _tz.GetUtcRangeForBusinessDate(new DateOnly(2026, 8, 8), "America/Mexico_City");
        Assert.True(utc >= start && utc < end);
    }

    [Fact]
    public void DateOnly_Calendar_IsIndependentOfZoneConversion()
    {
        var date = new DateOnly(2026, 8, 15);
        Assert.Equal("2026-08-15", date.ToString("yyyy-MM-dd"));
    }

    [Fact]
    public void DisallowedTimeZone_Throws()
    {
        Assert.Throws<ArgumentException>(() => _tz.GetTimeZoneInfo("Europe/Paris"));
    }

    [Fact]
    public void Catalog_ContainsPlatformDefault()
    {
        Assert.Contains(SchoolCoreTimeZones.PlatformDefault, SchoolCoreTimeZones.AllowedIds);
    }
}
