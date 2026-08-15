namespace SchoolCore.Common.Security;

/// <summary>
/// Matriz MVP ViewCode × acción por rol staff (login).
/// Fallback si RolePermission en BD aún no está sembrada; fuente de verdad: tabla + SPs.
/// </summary>
public static class RolePermissionMatrix
{
    private static readonly string[] AllActions = ["view", "create", "edit", "delete", "export", "approve"];
    private static readonly string[] ReadOnly = ["view"];
    private static readonly string[] ReadWrite = ["view", "create", "edit"];
    private static readonly string[] ReadWriteDelete = ["view", "create", "edit", "delete"];
    private static readonly string[] FinanceOps = ["view", "create", "edit", "export"];

    public sealed record Grant(string ViewCode, IReadOnlyList<string> Actions);

    /// <summary>Devuelve grants para los códigos de rol del JWT (p.ej. SuperAdmin, Cashier).</summary>
    public static IReadOnlyList<Grant> Resolve(IEnumerable<string> roleCodes)
    {
        var roles = roleCodes
            .Where(r => !string.IsNullOrWhiteSpace(r))
            .Select(r => r.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (roles.Count == 0)
            return Array.Empty<Grant>();

        if (roles.Contains("SuperAdmin"))
            return [new Grant("*", ["*"])];

        var map = new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase);

        void Add(string view, IEnumerable<string> actions)
        {
            if (!map.TryGetValue(view, out var set))
            {
                set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                map[view] = set;
            }
            foreach (var a in actions) set.Add(a);
        }

        // Director: operación completa excepto configuración de sistema (reservada a SuperAdmin).
        // Director: operación completa excepto configuración (reservada a SuperAdmin).
        if (roles.Contains("Director"))
        {
            foreach (var view in new[]
                     {
                         "dashboard", "students", "parents", "teachers", "classrooms", "branches",
                         "enrollments", "finance", "cash", "reports", "notifications"
                     })
                Add(view, AllActions);
        }

        if (roles.Contains("Coordinator"))
        {
            Add("dashboard", ReadOnly);
            Add("students", ReadWriteDelete);
            Add("parents", ReadWriteDelete);
            Add("teachers", ReadWriteDelete);
            Add("classrooms", ReadWriteDelete);
            Add("enrollments", ReadWrite);
            Add("reports", ReadOnly);
            Add("notifications", ReadOnly);
            Add("settings", ReadOnly);
        }

        if (roles.Contains("Cashier"))
        {
            Add("dashboard", ReadOnly);
            Add("students", ReadOnly);
            Add("finance", ["view", "create", "edit", "export", "approve"]);
            Add("cash", AllActions);
            Add("notifications", ReadOnly);
        }

        if (roles.Contains("Accountant"))
        {
            Add("dashboard", ReadOnly);
            Add("students", ReadOnly);
            Add("finance", AllActions);
            Add("cash", ReadOnly);
            Add("reports", ["view", "export"]);
            Add("notifications", ReadOnly);
            Add("settings", ReadOnly);
        }

        if (roles.Contains("Receptionist"))
        {
            Add("dashboard", ReadOnly);
            Add("students", ReadWrite);
            Add("parents", ReadWrite);
            Add("enrollments", ReadWrite);
            Add("notifications", ReadOnly);
        }

        return map
            .Select(kv => new Grant(kv.Key, kv.Value.OrderBy(a => a, StringComparer.Ordinal).ToList()))
            .OrderBy(g => g.ViewCode, StringComparer.Ordinal)
            .ToList();
    }

    /// <summary>True si alguno de los roles concede viewCode + action (o comodines).</summary>
    public static bool Has(IEnumerable<string> roleCodes, string viewCode, string action)
    {
        if (string.IsNullOrWhiteSpace(viewCode) || string.IsNullOrWhiteSpace(action))
            return false;

        var grants = Resolve(roleCodes);
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
}
