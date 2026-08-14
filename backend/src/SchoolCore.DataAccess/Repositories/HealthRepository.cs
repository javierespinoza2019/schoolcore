using System.Data;
using Dapper;

namespace SchoolCore.DataAccess.Repositories;

/// <summary>
/// Contrato base de repositorio (solo Stored Procedures).
/// </summary>
public interface IHealthRepository
{
    Task<DateTime> GetUtcDateAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Health check vía SP sp_System_GetUtcDate (fase 0 stub-friendly).
/// </summary>
public sealed class HealthRepository : IHealthRepository
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public HealthRepository(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<DateTime> GetUtcDateAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = (System.Data.Common.DbConnection)await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        // Fallback si el SP aún no existe: SELECT SYSUTCDATETIME()
        try
        {
            return await connection.QuerySingleAsync<DateTime>(
                new CommandDefinition(
                    "sp_System_GetUtcDate",
                    commandType: CommandType.StoredProcedure,
                    cancellationToken: cancellationToken));
        }
        catch (Microsoft.Data.SqlClient.SqlException)
        {
            return await connection.QuerySingleAsync<DateTime>(
                new CommandDefinition(
                    "SELECT SYSUTCDATETIME()",
                    cancellationToken: cancellationToken));
        }
    }
}
