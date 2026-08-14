using System.Data;
using Dapper;
using SchoolCore.Models.Entities;

namespace SchoolCore.DataAccess.Repositories;

/// <summary>
/// Acceso a datos de autenticación vía Stored Procedures.
/// </summary>
public interface IAuthRepository
{
    Task<AuthUserLookup> GetUserByEmailAsync(string email, string? tenantCode, CancellationToken cancellationToken = default);
    Task<(int AccessFailedCount, DateTime? LockoutEndUtc)> UpdateLoginFailureAsync(Guid userId, Guid tenantId, int maxAttempts = 5, int lockoutMinutes = 15, CancellationToken cancellationToken = default);
    Task ResetAccessFailedAsync(Guid userId, Guid tenantId, CancellationToken cancellationToken = default);
    Task CreateRefreshTokenAsync(Guid id, Guid tenantId, Guid userId, string tokenHash, DateTime expiresAt, string? createdByIp, CancellationToken cancellationToken = default);
    Task<(RefreshToken? Token, AuthUserLookup Lookup)> GetRefreshTokenAsync(string tokenHash, CancellationToken cancellationToken = default);
    Task RevokeRefreshTokenAsync(string? tokenHash, Guid? userId, Guid? tenantId, CancellationToken cancellationToken = default);
    Task CreatePasswordResetTokenAsync(Guid id, Guid tenantId, Guid userId, string tokenHash, DateTime expiresAt, CancellationToken cancellationToken = default);
    Task<(Guid? UserId, Guid? TenantId, bool Success)> ConsumePasswordResetTokenAsync(string tokenHash, CancellationToken cancellationToken = default);
    Task<int> UpdatePasswordAsync(Guid userId, Guid tenantId, string passwordHash, Guid? updatedBy, CancellationToken cancellationToken = default);
}

/// <inheritdoc />
public sealed class AuthRepository : IAuthRepository
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public AuthRepository(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<AuthUserLookup> GetUserByEmailAsync(string email, string? tenantCode, CancellationToken cancellationToken = default)
    {
        await using var connection = (System.Data.Common.DbConnection)await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                "sp_Auth_GetUserByEmail",
                new { Email = email, TenantCode = tenantCode },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));

        return await ReadUserLookupAsync(multi);
    }

    public async Task<(int AccessFailedCount, DateTime? LockoutEndUtc)> UpdateLoginFailureAsync(
        Guid userId,
        Guid tenantId,
        int maxAttempts = 5,
        int lockoutMinutes = 15,
        CancellationToken cancellationToken = default)
    {
        await using var connection = (System.Data.Common.DbConnection)await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var row = await connection.QuerySingleAsync<dynamic>(
            new CommandDefinition(
                "sp_Auth_UpdateLoginFailure",
                new
                {
                    UserId = userId,
                    TenantId = tenantId,
                    MaxAttempts = maxAttempts,
                    LockoutMinutes = lockoutMinutes
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));

        return ((int)row.AccessFailedCount, (DateTime?)row.LockoutEndUtc);
    }

    public async Task ResetAccessFailedAsync(Guid userId, Guid tenantId, CancellationToken cancellationToken = default)
    {
        await using var connection = (System.Data.Common.DbConnection)await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(
            new CommandDefinition(
                "sp_Auth_ResetAccessFailed",
                new { UserId = userId, TenantId = tenantId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));
    }

    public async Task CreateRefreshTokenAsync(
        Guid id,
        Guid tenantId,
        Guid userId,
        string tokenHash,
        DateTime expiresAt,
        string? createdByIp,
        CancellationToken cancellationToken = default)
    {
        await using var connection = (System.Data.Common.DbConnection)await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(
            new CommandDefinition(
                "sp_Auth_CreateRefreshToken",
                new
                {
                    Id = id,
                    TenantId = tenantId,
                    UserId = userId,
                    TokenHash = tokenHash,
                    ExpiresAt = expiresAt,
                    CreatedByIp = createdByIp
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));
    }

    public async Task<(RefreshToken? Token, AuthUserLookup Lookup)> GetRefreshTokenAsync(string tokenHash, CancellationToken cancellationToken = default)
    {
        await using var connection = (System.Data.Common.DbConnection)await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await using var multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                "sp_Auth_GetRefreshToken",
                new { TokenHash = tokenHash },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));

        var token = await multi.ReadFirstOrDefaultAsync<RefreshToken>();
        var lookup = await ReadUserLookupAsync(multi);
        return (token, lookup);
    }

    public async Task RevokeRefreshTokenAsync(string? tokenHash, Guid? userId, Guid? tenantId, CancellationToken cancellationToken = default)
    {
        await using var connection = (System.Data.Common.DbConnection)await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(
            new CommandDefinition(
                "sp_Auth_RevokeRefreshToken",
                new { TokenHash = tokenHash, UserId = userId, TenantId = tenantId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));
    }

    public async Task CreatePasswordResetTokenAsync(
        Guid id,
        Guid tenantId,
        Guid userId,
        string tokenHash,
        DateTime expiresAt,
        CancellationToken cancellationToken = default)
    {
        await using var connection = (System.Data.Common.DbConnection)await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(
            new CommandDefinition(
                "sp_Auth_CreatePasswordResetToken",
                new
                {
                    Id = id,
                    TenantId = tenantId,
                    UserId = userId,
                    TokenHash = tokenHash,
                    ExpiresAt = expiresAt
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));
    }

    public async Task<(Guid? UserId, Guid? TenantId, bool Success)> ConsumePasswordResetTokenAsync(string tokenHash, CancellationToken cancellationToken = default)
    {
        await using var connection = (System.Data.Common.DbConnection)await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var row = await connection.QuerySingleAsync<dynamic>(
            new CommandDefinition(
                "sp_Auth_ConsumePasswordResetToken",
                new { TokenHash = tokenHash },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));

        bool success = row.Success is bool b ? b : Convert.ToBoolean(row.Success);
        if (!success)
        {
            return (null, null, false);
        }

        return ((Guid?)row.UserId, (Guid?)row.TenantId, true);
    }

    public async Task<int> UpdatePasswordAsync(Guid userId, Guid tenantId, string passwordHash, Guid? updatedBy, CancellationToken cancellationToken = default)
    {
        await using var connection = (System.Data.Common.DbConnection)await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var row = await connection.QuerySingleAsync<dynamic>(
            new CommandDefinition(
                "sp_User_UpdatePassword",
                new
                {
                    UserId = userId,
                    TenantId = tenantId,
                    PasswordHash = passwordHash,
                    UpdatedBy = updatedBy
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));

        return (int)row.RowsAffected;
    }

    private static async Task<AuthUserLookup> ReadUserLookupAsync(SqlMapper.GridReader multi)
    {
        var user = await multi.ReadFirstOrDefaultAsync<AuthUserRecord>();
        // SP returns column RoleCode — map explicitly (ReadAsync<string> can fallar según driver)
        var roleRows = (await multi.ReadAsync<RoleCodeRow>()).ToList();
        var roles = roleRows
            .Select(r => r.RoleCode)
            .Where(r => !string.IsNullOrWhiteSpace(r))
            .ToList();
        var branches = (await multi.ReadAsync<Guid>()).ToList();

        if (user is null || user.Id == Guid.Empty)
        {
            return new AuthUserLookup
            {
                User = null,
                Roles = Array.Empty<string>(),
                BranchIds = Array.Empty<Guid>(),
                IsAmbiguous = user?.IsAmbiguous == true
            };
        }

        return new AuthUserLookup
        {
            User = user,
            Roles = roles,
            BranchIds = branches,
            IsAmbiguous = user.IsAmbiguous
        };
    }

    private sealed class RoleCodeRow
    {
        public string RoleCode { get; set; } = string.Empty;
    }
}
