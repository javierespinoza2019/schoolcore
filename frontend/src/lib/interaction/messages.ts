/** Códigos estables de interacción entre módulos (FE + BE). */
export const InteractionCodes = {
  CTX_NO_TENANT: 'CTX_NO_TENANT',
  CTX_NO_BRANCH: 'CTX_NO_BRANCH',
  CTX_NO_CYCLE: 'CTX_NO_CYCLE',
  CTX_MODULE_NO_BRANCHES: 'CTX_MODULE_NO_BRANCHES',
  CTX_MODULE_NO_CYCLES: 'CTX_MODULE_NO_CYCLES',
  VAL_REQUIRED_NAME: 'VAL_REQUIRED_NAME',
  VAL_REQUIRED_EMAIL: 'VAL_REQUIRED_EMAIL',
  REL_CROSS_BRANCH: 'REL_CROSS_BRANCH',
  REL_GROUP_NO_CLASSROOM: 'REL_GROUP_NO_CLASSROOM',
  REL_STUDENT_NO_GUARDIAN: 'REL_STUDENT_NO_GUARDIAN',
  REL_STUDENT_NO_CLASSROOM: 'REL_STUDENT_NO_CLASSROOM',
  REL_STUDENT_NO_TEACHER: 'REL_STUDENT_NO_TEACHER',
  VAL_AGE_LEVEL: 'VAL_AGE_LEVEL',
  REL_GUARDIAN_NO_CHILDREN: 'REL_GUARDIAN_NO_CHILDREN',
  REL_TEACHER_NO_CLASSROOM: 'REL_TEACHER_NO_CLASSROOM',
  RATE_LIMITED: 'RATE_LIMITED',
  AUTH_PASSWORD_COMPLEXITY: 'AUTH_PASSWORD_COMPLEXITY',
  AUTH_INVALID_RESET_TOKEN: 'AUTH_INVALID_RESET_TOKEN',
  AUTH_EMAIL_REQUIRED: 'AUTH_EMAIL_REQUIRED',
  CHARGE_AMOUNT: 'CHARGE_AMOUNT',
  REL_ENROLLMENT_DOCS: 'REL_ENROLLMENT_DOCS',
  CASH_SESSION_REQUIRED: 'CASH_SESSION_REQUIRED',
  ENROLLMENT_DRAFT_ORPHAN: 'ENROLLMENT_DRAFT_ORPHAN',
  PAYMENT_REVERSE_REASON: 'PAYMENT_REVERSE_REASON',
  PAYMENT_ALREADY_VOIDED: 'PAYMENT_ALREADY_VOIDED',
} as const;

export type InteractionCode = (typeof InteractionCodes)[keyof typeof InteractionCodes];

export const INTERACTION_MESSAGES: Record<InteractionCode, string> = {
  CTX_NO_TENANT: 'Tu sesión no es válida. Vuelve a iniciar sesión.',
  CTX_NO_BRANCH: 'Selecciona o registra una sucursal antes de continuar.',
  CTX_NO_CYCLE: 'Selecciona o registra un ciclo escolar antes de continuar.',
  CTX_MODULE_NO_BRANCHES:
    'No hay sucursales. Crea al menos una en Sucursales para usar este módulo.',
  CTX_MODULE_NO_CYCLES:
    'No hay ciclos escolares. Crea al menos uno en Configuración / Ciclos para continuar.',
  VAL_REQUIRED_NAME: 'El nombre y los apellidos son obligatorios.',
  VAL_REQUIRED_EMAIL: 'El correo electrónico es obligatorio.',
  REL_CROSS_BRANCH:
    'El tutor, profesor o salón debe pertenecer a la misma sucursal que el alumno.',
  REL_GROUP_NO_CLASSROOM:
    'Ese grupo no está vinculado a ningún salón de esta sucursal. Vincula el grupo en Salones o elige otro.',
  REL_STUDENT_NO_GUARDIAN:
    'Se recomienda vincular al menos un tutor. Puedes guardar ahora y vincularlo después.',
  REL_STUDENT_NO_CLASSROOM:
    'No hay salón vinculado a este nivel, grado y grupo en la sucursal.',
  REL_STUDENT_NO_TEACHER:
    'No hay profesor asociado a este grupo/salón. Puedes continuar y asignarlo después.',
  VAL_AGE_LEVEL:
    'La edad del alumno no coincide con el rango típico de ese nivel. Revisa fecha de nacimiento y nivel.',
  REL_GUARDIAN_NO_CHILDREN:
    'Este tutor no tiene alumnos vinculados. Puedes vincularlos después.',
  REL_TEACHER_NO_CLASSROOM:
    'Este profesor no tiene salones asignados. Puedes asignarlo al editar salones.',
  RATE_LIMITED: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  AUTH_PASSWORD_COMPLEXITY:
    'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un dígito.',
  AUTH_INVALID_RESET_TOKEN: 'El enlace de recuperación no es válido o ha expirado.',
  AUTH_EMAIL_REQUIRED: 'El correo electrónico es obligatorio.',
  CHARGE_AMOUNT: 'El cargo debe ser mayor a 0.',
  REL_ENROLLMENT_DOCS:
    'Hay documentos recomendados sin marcar. La subida (PDF, PNG o JPG, máx. 5 MB) se hace en el expediente del alumno.',
  CASH_SESSION_REQUIRED: 'Debes abrir un corte de caja antes de registrar el cobro.',
  ENROLLMENT_DRAFT_ORPHAN:
    'Se creó un borrador de inscripción, pero no se pudo guardar el wizard. Revisa Inscripciones o reintenta.',
  PAYMENT_REVERSE_REASON: 'Indica el motivo del reverso (mínimo 5 caracteres).',
  PAYMENT_ALREADY_VOIDED: 'Este pago ya fue anulado.',
};

export function interactionMessage(code: InteractionCode | string): string {
  if (code in INTERACTION_MESSAGES) {
    return INTERACTION_MESSAGES[code as InteractionCode];
  }
  return code;
}

/** Extrae mensaje amigable desde ApiResponse (código en errors[] o message). */
export function friendlyApiError(res: {
  message?: string | null;
  errors?: string[] | null;
}): string {
  const errs = (res.errors ?? []).filter(Boolean);
  for (const e of errs) {
    if (e in INTERACTION_MESSAGES) return INTERACTION_MESSAGES[e as InteractionCode];
  }
  const msg = (res.message || '').trim();
  if (msg && !looksTechnical(msg)) return msg;
  for (const e of errs) {
    if (!looksTechnical(e)) return e;
  }
  return 'No se pudo completar la operación. Revisa los datos e intenta de nuevo.';
}

function looksTechnical(text: string): boolean {
  return /exception|sql|stack|sp_|dbo\.|at SchoolCore|Nullable|System\.Guid|HTTP\s*[45]\d{2}/i.test(text);
}
