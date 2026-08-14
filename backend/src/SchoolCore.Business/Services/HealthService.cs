using SchoolCore.DataAccess.Repositories;

namespace SchoolCore.Business.Services;

/// <summary>
/// Servicio de salud de la aplicación.
/// </summary>
public interface IHealthService
{
    Task<object> GetStatusAsync(CancellationToken cancellationToken = default);
}

/// <inheritdoc />
public sealed class HealthService : IHealthService
{
    private readonly IHealthRepository _healthRepository;

    public HealthService(IHealthRepository healthRepository)
    {
        _healthRepository = healthRepository;
    }

    public async Task<object> GetStatusAsync(CancellationToken cancellationToken = default)
    {
        DateTime? dbUtc = null;
        string databaseStatus = "unknown";

        try
        {
            dbUtc = await _healthRepository.GetUtcDateAsync(cancellationToken);
            databaseStatus = "up";
        }
        catch
        {
            databaseStatus = "down";
        }

        return new
        {
            product = "SchoolCore",
            status = "ok",
            database = databaseStatus,
            databaseUtc = dbUtc,
            serverUtc = DateTime.UtcNow
        };
    }
}
