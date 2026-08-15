using System.Data;
using System.Data.Common;
using Dapper;

namespace SchoolCore.DataAccess.Repositories;

public interface IRolePermissionRepository
{
    Task<int> CountAsync(CancellationToken ct = default);
    Task<IReadOnlyList<(string ViewCode, string ActionCode)>> ListByRoleCodesAsync(
        IEnumerable<string> roleCodes, CancellationToken ct = default);
    Task<IReadOnlyList<(string ViewCode, string ActionCode)>> ListByRoleIdAsync(
        Guid roleId, CancellationToken ct = default);
    Task<IReadOnlyList<(string ViewCode, string ActionCode)>> ReplaceForRoleAsync(
        Guid roleId, IEnumerable<(string ViewCode, string ActionCode)> permissions, CancellationToken ct = default);
}

public sealed class RolePermissionRepository : IRolePermissionRepository
{
    private readonly ISqlConnectionFactory _factory;

    public RolePermissionRepository(ISqlConnectionFactory factory) => _factory = factory;

    private async Task<DbConnection> OpenAsync(CancellationToken ct) =>
        (DbConnection)await _factory.CreateOpenConnectionAsync(ct);

    public async Task<int> CountAsync(CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        return await conn.ExecuteScalarAsync<int>(new CommandDefinition(
            "sp_RolePermission_Count",
            commandType: CommandType.StoredProcedure,
            cancellationToken: ct));
    }

    public async Task<IReadOnlyList<(string ViewCode, string ActionCode)>> ListByRoleCodesAsync(
        IEnumerable<string> roleCodes, CancellationToken ct = default)
    {
        var csv = string.Join(',', roleCodes
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .Select(c => c.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase));
        if (string.IsNullOrEmpty(csv)) return Array.Empty<(string, string)>();

        await using var conn = await OpenAsync(ct);
        var rows = await conn.QueryAsync<(string ViewCode, string ActionCode)>(new CommandDefinition(
            "sp_RolePermission_ListByRoleCodes",
            new { RoleCodesCsv = csv },
            commandType: CommandType.StoredProcedure,
            cancellationToken: ct));
        return rows.AsList();
    }

    public async Task<IReadOnlyList<(string ViewCode, string ActionCode)>> ListByRoleIdAsync(
        Guid roleId, CancellationToken ct = default)
    {
        await using var conn = await OpenAsync(ct);
        var rows = await conn.QueryAsync<(string ViewCode, string ActionCode)>(new CommandDefinition(
            "sp_RolePermission_ListByRoleId",
            new { RoleId = roleId },
            commandType: CommandType.StoredProcedure,
            cancellationToken: ct));
        return rows.AsList();
    }

    public async Task<IReadOnlyList<(string ViewCode, string ActionCode)>> ReplaceForRoleAsync(
        Guid roleId, IEnumerable<(string ViewCode, string ActionCode)> permissions, CancellationToken ct = default)
    {
        var payload = System.Text.Json.JsonSerializer.Serialize(
            permissions.Select(p => new { viewCode = p.ViewCode, actionCode = p.ActionCode }));

        await using var conn = await OpenAsync(ct);
        var rows = await conn.QueryAsync<(string ViewCode, string ActionCode)>(new CommandDefinition(
            "sp_RolePermission_ReplaceForRole",
            new { RoleId = roleId, PermissionsJson = payload },
            commandType: CommandType.StoredProcedure,
            cancellationToken: ct));
        return rows.AsList();
    }
}
