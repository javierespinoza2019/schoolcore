using System.Text.RegularExpressions;

namespace SchoolCore.Common.Validation;

/// <summary>
/// Validadores compartidos (espejo de fields.ts / fieldStandards.ts).
/// Devuelve mensaje de error o null si es válido.
/// </summary>
public static partial class FieldValidator
{
    // Letras Unicode + marcas + espacio ' - .
    [GeneratedRegex(@"^[\p{L}\p{M}]+(?:[ '\-.][\p{L}\p{M}]+)*$", RegexOptions.CultureInvariant)]
    private static partial Regex PersonNameRegex();

    [GeneratedRegex(@"^[^\p{C}<>]*$", RegexOptions.CultureInvariant)]
    private static partial Regex TextFreeRegex();

    [GeneratedRegex(@"^[A-Za-z0-9][A-Za-z0-9_\-]*$", RegexOptions.CultureInvariant)]
    private static partial Regex CodeRegex();

    [GeneratedRegex(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", RegexOptions.CultureInvariant)]
    private static partial Regex EmailRegex();

    public static string? PersonName(string? value, string label, bool required = true, int maxLen = FieldStandards.PersonNameMax)
    {
        var v = value?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(v))
            return required ? $"{label} es obligatorio." : null;
        if (v.Length < FieldStandards.PersonNameMin)
            return $"Mínimo {FieldStandards.PersonNameMin} caracteres.";
        if (v.Length > maxLen)
            return $"Máximo {maxLen} caracteres.";
        if (!PersonNameRegex().IsMatch(v))
            return $"{label}: solo letras, espacios y ' - . (sin números ni símbolos).";
        return null;
    }

    public static string? Website(string? value)
    {
        var v = value?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(v))
            return null;
        if (v.Length > FieldStandards.WebsiteMax)
            return $"Máximo {FieldStandards.WebsiteMax} caracteres.";
        if (!TextFreeRegex().IsMatch(v))
            return "Sitio web: no se permiten caracteres de control ni < >.";
        if (!Uri.TryCreate(v, UriKind.Absolute, out var uri)
            || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            return "Usa una URL válida (https://…).";
        return null;
    }

    public static string? Email(string? value, bool required = false)
    {
        var v = value?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(v))
            return required ? "El correo electrónico es obligatorio." : null;
        if (v.Length > FieldStandards.EmailMax)
            return $"Máximo {FieldStandards.EmailMax} caracteres.";
        if (!EmailRegex().IsMatch(v))
            return "Formato de correo inválido.";
        return null;
    }

    public static string? Phone(string? value, bool required = false, string label = "El teléfono")
    {
        var v = value?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(v))
            return required ? $"{label} es obligatorio." : null;
        if (v.Length > FieldStandards.PhoneMax)
            return $"Máximo {FieldStandards.PhoneMax} caracteres.";
        var digits = 0;
        foreach (var c in v)
        {
            if (char.IsDigit(c)) digits++;
        }
        if (digits < FieldStandards.PhoneDigitsMin)
            return "Mínimo 8 dígitos.";
        return null;
    }

    public static string? TextFree(string? value, int maxLen, string label, bool required = false, int minLen = 0)
    {
        var v = value?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(v))
            return required ? $"{label} es obligatorio." : null;
        if (minLen > 0 && v.Length < minLen)
            return $"Mínimo {minLen} caracteres.";
        if (v.Length > maxLen)
            return $"{label}: máximo {maxLen} caracteres.";
        if (!TextFreeRegex().IsMatch(v))
            return $"{label}: no se permiten caracteres de control ni < >.";
        return null;
    }

    public static string? Code(string? value, int maxLen, string label, bool required = false)
    {
        var v = value?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(v))
            return required ? $"{label} es obligatorio." : null;
        if (v.Length > maxLen)
            return $"Máximo {maxLen} caracteres.";
        if (!CodeRegex().IsMatch(v))
            return $"{label}: use letras, números, _ o -.";
        return null;
    }

    public static string? PostalCodeMx(string? value, bool required = false)
    {
        var v = value?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(v))
            return required ? "El código postal es obligatorio." : null;
        if (v.Length is not 5 || !v.All(char.IsDigit))
            return "Debe ser 5 dígitos.";
        return null;
    }

    public static string? PositiveAmount(decimal amount, string label = "Monto")
    {
        if (amount <= 0)
            return $"{label}: debe ser mayor a 0.";
        return null;
    }

    public static string? Password(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return "La contraseña es obligatoria.";
        if (value.Length < FieldStandards.PasswordMin)
            return $"Mínimo {FieldStandards.PasswordMin} caracteres.";
        if (value.Length > FieldStandards.PasswordMax)
            return $"Máximo {FieldStandards.PasswordMax} caracteres.";
        if (!value.Any(c => char.IsUpper(c) || "ÁÉÍÓÚÑ".Contains(c)))
            return "Debe incluir al menos una mayúscula.";
        if (!value.Any(c => char.IsLower(c) || "áéíóúñ".Contains(c)))
            return "Debe incluir al menos una minúscula.";
        if (!value.Any(char.IsDigit))
            return "Debe incluir al menos un dígito.";
        return null;
    }

    public static void ThrowIfInvalid(params string?[] errors)
    {
        var list = errors.Where(e => !string.IsNullOrWhiteSpace(e)).Cast<string>().ToList();
        if (list.Count == 0) return;
        throw Exceptions.AppException.BadRequest(list[0], list);
    }
}
