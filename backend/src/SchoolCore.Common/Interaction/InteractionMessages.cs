namespace SchoolCore.Common.Interaction;

/// <summary>Códigos y mensajes amigables de interacción entre módulos (alineados al FE).</summary>
public static class InteractionMessages
{
    public const string CtxNoBranch = "CTX_NO_BRANCH";
    public const string CtxNoCycle = "CTX_NO_CYCLE";
    public const string ValRequiredName = "VAL_REQUIRED_NAME";
    public const string ValRequiredEmail = "VAL_REQUIRED_EMAIL";
    public const string RelCrossBranch = "REL_CROSS_BRANCH";
    public const string RelGroupNoClassroom = "REL_GROUP_NO_CLASSROOM";

    private static readonly Dictionary<string, string> Messages = new(StringComparer.OrdinalIgnoreCase)
    {
        [CtxNoBranch] = "Selecciona o registra una sucursal antes de continuar.",
        [CtxNoCycle] = "Selecciona o registra un ciclo escolar antes de continuar.",
        [ValRequiredName] = "El nombre y los apellidos son obligatorios.",
        [ValRequiredEmail] = "El correo electrónico es obligatorio.",
        [RelCrossBranch] = "El tutor, profesor o salón debe pertenecer a la misma sucursal que el alumno.",
        [RelGroupNoClassroom] = "Ese grupo no está vinculado a ningún salón de esta sucursal. Vincula el grupo en Salones o elige otro.",
        ["FILE_EXT"] = "El tipo de archivo no está permitido. Usa PDF, PNG o JPG.",
        ["FILE_SIZE"] = "El archivo supera el tamaño máximo de 5 MB.",
        ["NOT_FOUND_STUDENT"] = "No se encontró el alumno.",
        ["NOT_FOUND_GUARDIAN"] = "No se encontró el tutor.",
        ["NOT_FOUND_TEACHER"] = "No se encontró el profesor.",
        ["BRANCH_REQUIRED"] = "Selecciona o registra una sucursal antes de continuar.",
        ["NAME_REQUIRED"] = "El nombre es obligatorio.",
        ["RATE_LIMITED"] = "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
        ["AUTH_PASSWORD_COMPLEXITY"] = "La contraseña no cumple los requisitos de seguridad.",
        ["AUTH_INVALID_RESET_TOKEN"] = "El enlace de recuperación no es válido o ha expirado.",
        ["AUTH_EMAIL_REQUIRED"] = "El correo electrónico es obligatorio.",
        ["CHARGE_AMOUNT"] = "El cargo debe ser mayor a 0.",
        ["ENR_DOCS_HINT"] = "La subida de archivos (PDF, PNG o JPG, máx. 5 MB) se hace en el expediente del alumno.",
        ["CASH_SESSION_REQUIRED"] = "Debes abrir un corte de caja antes de registrar el cobro.",
        ["CASH_SESSION_NOT_OPEN"] = "El corte de caja no está abierto para esta sucursal.",
        ["ENROLLMENT_DRAFT_ORPHAN"] = "Se creó un borrador de inscripción, pero no se pudo guardar el wizard. Revisa Inscripciones o reintenta.",
        ["PAYMENT_REVERSE_REASON"] = "Indica el motivo del reverso (mínimo 5 caracteres).",
        ["PAYMENT_ALREADY_VOIDED"] = "Este pago ya fue anulado.",
    };

    public static string Text(string code) =>
        Messages.TryGetValue(code, out var msg) ? msg : "No se pudo completar la operación. Revisa los datos e intenta de nuevo.";

    public static (string Message, string[] Errors) Error(string code) =>
        (Text(code), new[] { code, Text(code) });
}
