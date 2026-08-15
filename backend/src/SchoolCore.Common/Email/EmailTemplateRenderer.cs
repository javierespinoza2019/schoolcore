namespace SchoolCore.Common.Email;

/// <summary>Sustitución simple de variables {{Name}} en plantillas de correo.</summary>
public static class EmailTemplateRenderer
{
    public static string Render(string template, IReadOnlyDictionary<string, string?> variables)
    {
        if (string.IsNullOrEmpty(template)) return string.Empty;
        var result = template;
        foreach (var (key, value) in variables)
        {
            result = result.Replace("{{" + key + "}}", value ?? string.Empty, StringComparison.OrdinalIgnoreCase);
        }
        return result;
    }
}

public static class EmailTemplateKeys
{
    public const string PasswordReset = "PasswordReset";
}
