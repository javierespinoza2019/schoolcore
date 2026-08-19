/**
 * SchoolCore — catálogo único de estándares de campo (UI → API → BD).
 * Fase 0: fuente de verdad. Los módulos SOLO referencian `fieldId`.
 * No duplicar max/regex en modales; validators en fields.ts consumen esto.
 *
 * Referencias: HTML maxlength / autocomplete (WHATWG/MDN); nombres Unicode
 * (web.dev / \p{L}\p{M}); email type=email; tel con dígitos mínimos.
 */

export type FieldCharset =
  | 'personName' // Letras Unicode + marcas + espacio ' - .
  | 'email'
  | 'phone'
  | 'digits'
  | 'postalCodeMx'
  | 'code' // A-Z 0-9 _ -
  | 'textFree' // Sin controles ni < >
  | 'url' // http(s) absoluto (WHATWG type=url)
  | 'money'
  | 'password'
  | 'enum';

export interface FieldStandard {
  /** ID estable para agentes/orquestador. */
  id: string;
  label: string;
  minLen: number;
  maxLen: number;
  /** NVARCHAR(n) objetivo en BD (igual a maxLen salvo notas). */
  dbNVarChar: number | 'MAX' | null;
  charset: FieldCharset;
  requiredDefault: boolean;
  autocomplete?: string;
  htmlInputType?: 'text' | 'email' | 'tel' | 'password' | 'number' | 'date' | 'url';
  modules: string[];
  /** vs estado actual SchoolCore. */
  notes?: string;
}

/** Regex JS (flag u) — personName. Bloquea digitos y basura tipo * / +. */
export const PERSON_NAME_RE = /^[\p{L}\p{M}]+(?:[ '\-.][\p{L}\p{M}]+)*$/u;

/** Texto libre: sin controles ni markup. */
export const TEXT_FREE_RE = /^[^\p{C}<>]*$/u;

/** Códigos operativos. */
export const CODE_RE = /^[A-Za-z0-9][A-Za-z0-9_\-]*$/;

/**
 * Catálogo MVP. maxLen = UI = API = BD (salvo dbNVarChar distinto documentado).
 */
export const FIELD_STANDARDS: Record<string, FieldStandard> = {
  'person.firstName': {
    id: 'person.firstName',
    label: 'Nombre',
    minLen: 2,
    maxLen: 100,
    dbNVarChar: 100,
    charset: 'personName',
    requiredDefault: true,
    autocomplete: 'given-name',
    htmlInputType: 'text',
    modules: ['alumnos', 'inscripciones', 'padres', 'profesores', 'config'],
    notes: 'Charset PERSON_NAME_RE en UI+API. Unicode (W3C i18n), no ASCII-only.',
  },
  'person.lastName': {
    id: 'person.lastName',
    label: 'Apellidos',
    minLen: 2,
    maxLen: 100,
    dbNVarChar: 100,
    charset: 'personName',
    requiredDefault: true,
    autocomplete: 'family-name',
    htmlInputType: 'text',
    modules: ['alumnos', 'inscripciones', 'padres', 'profesores', 'config'],
    notes: 'Inscripción: paterno/materno usan el mismo estándar (materno puede requiredDefault false).',
  },
  'person.email': {
    id: 'person.email',
    label: 'Correo',
    minLen: 3,
    maxLen: 256,
    dbNVarChar: 256,
    charset: 'email',
    requiredDefault: false,
    autocomplete: 'email',
    htmlInputType: 'email',
    modules: ['alumnos', 'inscripciones', 'padres', 'profesores', 'config', 'sucursales'],
  },
  'person.phone': {
    id: 'person.phone',
    label: 'Teléfono',
    minLen: 8,
    maxLen: 50,
    dbNVarChar: 50,
    charset: 'phone',
    requiredDefault: false,
    autocomplete: 'tel',
    htmlInputType: 'tel',
    modules: ['alumnos', 'inscripciones', 'padres', 'profesores', 'config', 'sucursales'],
    notes: 'Mínimo 8 dígitos (ya en FE); maxlength 50 alinea BD.',
  },
  'person.address': {
    id: 'person.address',
    label: 'Dirección',
    minLen: 0,
    maxLen: 400,
    dbNVarChar: 400,
    charset: 'textFree',
    requiredDefault: false,
    autocomplete: 'street-address',
    htmlInputType: 'text',
    modules: ['alumnos', 'inscripciones', 'padres', 'config'],
  },
  'person.allergies': {
    id: 'person.allergies',
    label: 'Alergias',
    minLen: 0,
    maxLen: 500,
    dbNVarChar: 500,
    charset: 'textFree',
    requiredDefault: false,
    modules: ['alumnos', 'inscripciones'],
  },
  'person.medicalNotes': {
    id: 'person.medicalNotes',
    label: 'Notas médicas',
    minLen: 0,
    maxLen: 1000,
    dbNVarChar: 1000,
    charset: 'textFree',
    requiredDefault: false,
    modules: ['alumnos', 'inscripciones'],
  },
  'person.bloodType': {
    id: 'person.bloodType',
    label: 'Tipo de sangre',
    minLen: 0,
    maxLen: 5,
    dbNVarChar: 5,
    charset: 'textFree',
    requiredDefault: false,
    modules: ['alumnos'],
    notes: 'Optimización BD: hoy NVARCHAR(10) → 5 (O+/AB+).',
  },
  'person.fullName': {
    id: 'person.fullName',
    label: 'Nombre completo',
    minLen: 2,
    maxLen: 201,
    dbNVarChar: null,
    charset: 'personName',
    requiredDefault: true,
    autocomplete: 'name',
    htmlInputType: 'text',
    modules: ['config'],
    notes: 'UI staff (se parte en FirstName 100 + LastName 100).',
  },
  'person.occupation': {
    id: 'person.occupation',
    label: 'Ocupación',
    minLen: 0,
    maxLen: 150,
    dbNVarChar: 150,
    charset: 'textFree',
    requiredDefault: false,
    modules: ['padres'],
  },
  'academic.grade': {
    id: 'academic.grade',
    label: 'Grado',
    minLen: 1,
    maxLen: 20,
    dbNVarChar: 20,
    charset: 'textFree',
    requiredDefault: true,
    modules: ['alumnos', 'inscripciones', 'salones'],
    notes: 'Optimización: hoy NVARCHAR(50) → 20.',
  },
  'academic.group': {
    id: 'academic.group',
    label: 'Grupo',
    minLen: 1,
    maxLen: 10,
    dbNVarChar: 10,
    charset: 'code',
    requiredDefault: true,
    modules: ['alumnos', 'inscripciones', 'salones'],
    notes: 'Optimización: hoy NVARCHAR(50) → 10 (A, B, Todos).',
  },
  'academic.levelName': {
    id: 'academic.levelName',
    label: 'Nivel (nombre)',
    minLen: 1,
    maxLen: 100,
    dbNVarChar: 100,
    charset: 'textFree',
    requiredDefault: false,
    modules: ['alumnos', 'config'],
  },
  'academic.subjects': {
    id: 'academic.subjects',
    label: 'Materias',
    minLen: 1,
    maxLen: 400,
    dbNVarChar: 'MAX',
    charset: 'textFree',
    requiredDefault: true,
    modules: ['profesores'],
    notes: 'JSON/lista en SubjectsJson; tope UI 400.',
  },
  'academic.specialty': {
    id: 'academic.specialty',
    label: 'Especialidad',
    minLen: 0,
    maxLen: 150,
    dbNVarChar: 150,
    charset: 'textFree',
    requiredDefault: false,
    modules: ['profesores'],
  },
  'academic.scheduleNotes': {
    id: 'academic.scheduleNotes',
    label: 'Horario / notas',
    minLen: 0,
    maxLen: 500,
    dbNVarChar: 500,
    charset: 'textFree',
    requiredDefault: false,
    modules: ['profesores', 'salones'],
  },
  'academic.classroomName': {
    id: 'academic.classroomName',
    label: 'Nombre salón',
    minLen: 1,
    maxLen: 100,
    dbNVarChar: 100,
    charset: 'textFree',
    requiredDefault: true,
    modules: ['salones'],
  },
  'academic.building': {
    id: 'academic.building',
    label: 'Edificio',
    minLen: 0,
    maxLen: 100,
    dbNVarChar: 100,
    charset: 'textFree',
    requiredDefault: false,
    modules: ['salones'],
  },
  'org.branchName': {
    id: 'org.branchName',
    label: 'Nombre sucursal',
    minLen: 2,
    maxLen: 200,
    dbNVarChar: 200,
    charset: 'textFree',
    requiredDefault: true,
    modules: ['sucursales', 'config'],
  },
  'org.branchCode': {
    id: 'org.branchCode',
    label: 'Código sucursal',
    minLen: 1,
    maxLen: 20,
    dbNVarChar: 20,
    charset: 'code',
    requiredDefault: true,
    modules: ['sucursales'],
    notes: 'Optimización: hoy NVARCHAR(50) → 20.',
  },
  'org.branchAddress': {
    id: 'org.branchAddress',
    label: 'Dirección sucursal',
    minLen: 0,
    maxLen: 300,
    dbNVarChar: 300,
    charset: 'textFree',
    requiredDefault: false,
    modules: ['sucursales'],
  },
  'org.city': {
    id: 'org.city',
    label: 'Ciudad',
    minLen: 0,
    maxLen: 100,
    dbNVarChar: 100,
    charset: 'textFree',
    requiredDefault: false,
    modules: ['sucursales'],
  },
  'org.state': {
    id: 'org.state',
    label: 'Estado',
    minLen: 0,
    maxLen: 100,
    dbNVarChar: 100,
    charset: 'textFree',
    requiredDefault: false,
    modules: ['sucursales'],
  },
  'org.postalCode': {
    id: 'org.postalCode',
    label: 'Código postal',
    minLen: 5,
    maxLen: 5,
    dbNVarChar: 10,
    charset: 'postalCodeMx',
    requiredDefault: false,
    autocomplete: 'postal-code',
    modules: ['sucursales'],
    notes: 'UI exactamente 5 dígitos; BD NVARCHAR(10) margen.',
  },
  'org.institutionDisplayName': {
    id: 'org.institutionDisplayName',
    label: 'Nombre institución',
    minLen: 2,
    maxLen: 200,
    dbNVarChar: 200,
    charset: 'textFree',
    requiredDefault: true,
    modules: ['config'],
  },
  'org.legalName': {
    id: 'org.legalName',
    label: 'Razón social',
    minLen: 0,
    maxLen: 300,
    dbNVarChar: 300,
    charset: 'textFree',
    requiredDefault: false,
    modules: ['config'],
  },
  'org.taxId': {
    id: 'org.taxId',
    label: 'RFC / TaxId',
    minLen: 0,
    maxLen: 20,
    dbNVarChar: 20,
    charset: 'code',
    requiredDefault: false,
    modules: ['config'],
    notes: 'Optimización: hoy NVARCHAR(50) → 20 (RFC MX 12–13).',
  },
  'org.website': {
    id: 'org.website',
    label: 'Sitio web',
    minLen: 0,
    maxLen: 300,
    dbNVarChar: 300,
    charset: 'url',
    requiredDefault: false,
    htmlInputType: 'url',
    autocomplete: 'url',
    modules: ['config'],
  },
  'org.directorName': {
    id: 'org.directorName',
    label: 'Nombre del director',
    minLen: 2,
    maxLen: 200,
    dbNVarChar: 200,
    charset: 'personName',
    requiredDefault: false,
    autocomplete: 'name',
    htmlInputType: 'text',
    modules: ['sucursales'],
  },
  'org.cycleName': {
    id: 'org.cycleName',
    label: 'Nombre del ciclo',
    minLen: 2,
    maxLen: 200,
    dbNVarChar: 200,
    charset: 'textFree',
    requiredDefault: true,
    modules: ['config'],
  },
  'org.emailSubject': {
    id: 'org.emailSubject',
    label: 'Asunto de correo',
    minLen: 1,
    maxLen: 300,
    dbNVarChar: 300,
    charset: 'textFree',
    requiredDefault: true,
    modules: ['config'],
  },
  'finance.paymentMethodName': {
    id: 'finance.paymentMethodName',
    label: 'Método de pago',
    minLen: 1,
    maxLen: 150,
    dbNVarChar: 150,
    charset: 'textFree',
    requiredDefault: true,
    modules: ['config'],
  },
  'finance.paymentMethodInfo': {
    id: 'finance.paymentMethodInfo',
    label: 'Información del método',
    minLen: 1,
    maxLen: 500,
    dbNVarChar: 500,
    charset: 'textFree',
    requiredDefault: true,
    modules: ['config'],
  },
  'finance.paymentConceptName': {
    id: 'finance.paymentConceptName',
    label: 'Concepto de pago',
    minLen: 1,
    maxLen: 200,
    dbNVarChar: 200,
    charset: 'textFree',
    requiredDefault: true,
    modules: ['config'],
  },
  'finance.cashNotes': {
    id: 'finance.cashNotes',
    label: 'Notas de caja',
    minLen: 0,
    maxLen: 500,
    dbNVarChar: 500,
    charset: 'textFree',
    requiredDefault: false,
    modules: ['caja'],
  },
  'finance.paymentNotes': {
    id: 'finance.paymentNotes',
    label: 'Notas de pago',
    minLen: 0,
    maxLen: 500,
    dbNVarChar: 500,
    charset: 'textFree',
    requiredDefault: false,
    modules: ['finanzas', 'caja'],
  },
  'finance.reverseReason': {
    id: 'finance.reverseReason',
    label: 'Motivo de reverso',
    minLen: 5,
    maxLen: 500,
    dbNVarChar: 500,
    charset: 'textFree',
    requiredDefault: true,
    modules: ['finanzas'],
    notes: 'BR-59C min 5; confirmar columna VoidReason en 017.',
  },
  'finance.expenseConcept': {
    id: 'finance.expenseConcept',
    label: 'Concepto egreso',
    minLen: 1,
    maxLen: 200,
    dbNVarChar: 200,
    charset: 'textFree',
    requiredDefault: true,
    modules: ['finanzas', 'caja'],
  },
  'finance.reference': {
    id: 'finance.reference',
    label: 'Referencia',
    minLen: 0,
    maxLen: 100,
    dbNVarChar: 100,
    charset: 'textFree',
    requiredDefault: false,
    modules: ['finanzas', 'caja'],
  },
  'finance.amount': {
    id: 'finance.amount',
    label: 'Monto',
    minLen: 1,
    maxLen: 16,
    dbNVarChar: null,
    charset: 'money',
    requiredDefault: true,
    htmlInputType: 'number',
    modules: ['finanzas', 'caja', 'inscripciones'],
    notes: 'DECIMAL en BD; UI valida > 0.',
  },
  'auth.password': {
    id: 'auth.password',
    label: 'Contraseña',
    minLen: 8,
    maxLen: 128,
    dbNVarChar: null,
    charset: 'password',
    requiredDefault: true,
    htmlInputType: 'password',
    autocomplete: 'new-password',
    modules: ['auth', 'config'],
    notes: 'BR-03; hash en BD no el cleartext.',
  },
  'enrollment.number': {
    id: 'enrollment.number',
    label: 'Matrícula',
    minLen: 1,
    maxLen: 50,
    dbNVarChar: 50,
    charset: 'code',
    requiredDefault: true,
    modules: ['alumnos', 'inscripciones'],
    notes: 'Generada por sistema; readonly en UI.',
  },
};

export function getFieldStandard(id: string): FieldStandard {
  const s = FIELD_STANDARDS[id];
  if (!s) throw new Error(`Unknown field standard: ${id}`);
  return s;
}

/** Campos que acortan BD respecto al schema actual (requieren script + precheck). */
export const DB_SHRINK_CANDIDATES = [
  'person.bloodType',
  'academic.grade',
  'academic.group',
  'org.branchCode',
  'org.taxId',
] as const;
