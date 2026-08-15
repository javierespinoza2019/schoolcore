using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using SchoolCore.Common.Security;
using SchoolCore.DataAccess.Repositories;

namespace SchoolCore.Business.Services;

public interface IPermissionResolver
{
    Task<IReadOnlyList<RolePermissionMatrix.Grant>> ResolveAsync(
        IEnumerable<string> roleCodes, CancellationToken cancellationToken = default);

    Task<bool> HasAsync(
        IEnumerable<string> roleCodes, string viewCode, string action, CancellationToken cancellationToken = default);

    void InvalidateCache();
}

/// <summary>
/// Resuelve permisos desde BD (RolePermission); si la tabla está vacía, usa matriz C# (migración).
/// </summary>
public sealed class PermissionResolver : IPermissionResolver
{
    private readonly IRolePermissionRepository _repo;
    private readonly IMemoryCache _cache;
    private readonly ILogger<PermissionResolver> _logger;

    public PermissionResolver(
        IRolePermissionRepository repo,
        IMemoryCache cache,
        ILogger<PermissionResolver> logger)
    {
        _repo = repo;
        _cache = cache;
        _logger = logger;
    }

    public async Task<IReadOnlyList<RolePermissionMatrix.Grant>> ResolveAsync(
        IEnumerable<string> roleCodes, CancellationToken cancellationToken = default)
    {
        var roles = Normalize(roleCodes);
        if (roles.Count == 0) return Array.Empty<RolePermissionMatrix.Grant>();

        if (roles.Contains("SuperAdmin", StringComparer.OrdinalIgnoreCase))
            return [new RolePermissionMatrix.Grant("*", ["*"])];

        var ver = _cache.GetOrCreate("rp:ver", e =>
        {
            e.Priority = CacheItemPriority.NeverRemove;
            return 0L;
        });
        var cacheKey = $"rp:{ver}:" + string.Join('|', roles.OrderBy(r => r, StringComparer.OrdinalIgnoreCase));
        if (_cache.TryGetValue(cacheKey, out IReadOnlyList<RolePermissionMatrix.Grant>? cached) && cached is not null)
            return cached;

        var useDb = await UseDatabaseAsync(cancellationToken);
        IReadOnlyList<RolePermissionMatrix.Grant> grants;
        if (!useDb)
        {
            _logger.LogDebug("RolePermission table empty — falling back to C# matrix.");
            grants = RolePermissionMatrix.Resolve(roles);
        }
        else
        {
            var rows = await _repo.ListByRoleCodesAsync(roles, cancellationToken);
            grants = Aggregate(rows);
        }

        _cache.Set(cacheKey, grants, TimeSpan.FromMinutes(2));
        return grants;
    }

    public async Task<bool> HasAsync(
        IEnumerable<string> roleCodes, string viewCode, string action, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(viewCode) || string.IsNullOrWhiteSpace(action))
            return false;

        var grants = await ResolveAsync(roleCodes, cancellationToken);
        foreach (var g in grants)
        {
            var viewOk = g.ViewCode == "*"
                || string.Equals(g.ViewCode, viewCode, StringComparison.OrdinalIgnoreCase);
            if (!viewOk) continue;
            if (g.Actions.Any(a => a == "*" || string.Equals(a, action, StringComparison.OrdinalIgnoreCase)))
                return true;
        }
        return false;
    }

    /// <summary>Invalida caché tras editar RolePermission en BD.</summary>
    public void InvalidateCache()
    {
        var next = (_cache.Get<long?>("rp:ver") ?? 0L) + 1;
        _cache.Set("rp:ver", next, new MemoryCacheEntryOptions { Priority = CacheItemPriority.NeverRemove });
        _cache.Remove("rp:has-rows");
        _logger.LogInformation("RolePermission cache invalidated (ver={Version}).", next);
    }

    private async Task<bool> UseDatabaseAsync(CancellationToken ct)
    {
        const string key = "rp:has-rows";
        if (_cache.TryGetValue(key, out bool has)) return has;
        var count = await _repo.CountAsync(ct);
        has = count > 0;
        _cache.Set(key, has, TimeSpan.FromMinutes(5));
        return has;
    }

    private static List<string> Normalize(IEnumerable<string> roleCodes) =>
        roleCodes
            .Where(r => !string.IsNullOrWhiteSpace(r))
            .Select(r => r.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

    private static IReadOnlyList<RolePermissionMatrix.Grant> Aggregate(
        IReadOnlyList<(string ViewCode, string ActionCode)> rows)
    {
        var map = new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase);
        foreach (var (view, action) in rows)
        {
            if (string.IsNullOrWhiteSpace(view) || string.IsNullOrWhiteSpace(action)) continue;
            if (!map.TryGetValue(view, out var set))
            {
                set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                map[view] = set;
            }
            set.Add(action);
        }

        return map
            .Select(kv => new RolePermissionMatrix.Grant(
                kv.Key,
                kv.Value.OrderBy(a => a, StringComparer.Ordinal).ToList()))
            .OrderBy(g => g.ViewCode, StringComparer.Ordinal)
            .ToList();
    }
}
