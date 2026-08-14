using System.Data;
using System.Data.Common;
using Dapper;
using SchoolCore.Models.Dtos.Common;

namespace SchoolCore.DataAccess;

/// <summary>
/// Helpers Dapper para listados paginados vía SP con @TotalCount OUTPUT.
/// </summary>
public static class DapperPaging
{
    public static async Task<(IReadOnlyList<T> Items, int TotalCount)> QueryPagedAsync<T>(
        DbConnection connection,
        string procedureName,
        DynamicParameters parameters,
        CancellationToken cancellationToken = default)
    {
        parameters.Add("TotalCount", dbType: DbType.Int32, direction: ParameterDirection.Output);
        var items = (await connection.QueryAsync<T>(
            new CommandDefinition(procedureName, parameters, commandType: CommandType.StoredProcedure, cancellationToken: cancellationToken))).ToList();
        var total = parameters.Get<int>("TotalCount");
        return (items, total);
    }

    public static PagedResult<T> ToPagedResult<T>(IReadOnlyList<T> items, int total, int page, int pageSize) =>
        new()
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
}
