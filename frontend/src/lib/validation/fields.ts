/**
 * Validators que consumen el catálogo fieldStandards (única fuente de max/charset).
 * Los módulos deben preferir validateField(fieldId) o estos helpers.
 */
import {
  CODE_RE,
  FIELD_STANDARDS,
  getFieldStandard,
  PERSON_NAME_RE,
  TEXT_FREE_RE,
  type FieldStandard,
} from './fieldStandards';

/** Límites derivados del catálogo (compat con maxLength={FieldLimits.x}). */
export const FieldLimits = {
  name: FIELD_STANDARDS['person.firstName'].maxLen,
  nameMin: FIELD_STANDARDS['person.firstName'].minLen,
  email: FIELD_STANDARDS['person.email'].maxLen,
  phone: FIELD_STANDARDS['person.phone'].maxLen,
  phoneDigitsMin: 8,
  address: FIELD_STANDARDS['person.address'].maxLen,
  addressBranch: FIELD_STANDARDS['org.branchAddress'].maxLen,
  occupation: FIELD_STANDARDS['person.occupation'].maxLen,
  allergies: FIELD_STANDARDS['person.allergies'].maxLen,
  medicalNotes: FIELD_STANDARDS['person.medicalNotes'].maxLen,
  grade: FIELD_STANDARDS['academic.grade'].maxLen,
  group: FIELD_STANDARDS['academic.group'].maxLen,
  bloodType: FIELD_STANDARDS['person.bloodType'].maxLen,
  specialty: FIELD_STANDARDS['academic.specialty'].maxLen,
  schedule: FIELD_STANDARDS['academic.scheduleNotes'].maxLen,
  classroomName: FIELD_STANDARDS['academic.classroomName'].maxLen,
  building: FIELD_STANDARDS['academic.building'].maxLen,
  city: FIELD_STANDARDS['org.city'].maxLen,
  state: FIELD_STANDARDS['org.state'].maxLen,
  postalCode: FIELD_STANDARDS['org.postalCode'].maxLen,
  directorName: FIELD_STANDARDS['org.directorName'].maxLen,
  fullName: FIELD_STANDARDS['person.fullName'].maxLen,
  cycleName: FIELD_STANDARDS['org.cycleName'].maxLen,
  emailSubject: FIELD_STANDARDS['org.emailSubject'].maxLen,
  paymentMethodName: FIELD_STANDARDS['finance.paymentMethodName'].maxLen,
  paymentMethodInfo: FIELD_STANDARDS['finance.paymentMethodInfo'].maxLen,
  paymentConceptName: FIELD_STANDARDS['finance.paymentConceptName'].maxLen,
  cashNotes: FIELD_STANDARDS['finance.cashNotes'].maxLen,
  subjects: FIELD_STANDARDS['academic.subjects'].maxLen,
  levelName: FIELD_STANDARDS['academic.levelName'].maxLen,
  branchName: FIELD_STANDARDS['org.branchName'].maxLen,
  branchCode: FIELD_STANDARDS['org.branchCode'].maxLen,
  taxId: FIELD_STANDARDS['org.taxId'].maxLen,
  website: FIELD_STANDARDS['org.website'].maxLen,
  institutionDisplayName: FIELD_STANDARDS['org.institutionDisplayName'].maxLen,
  legalName: FIELD_STANDARDS['org.legalName'].maxLen,
  paymentNotes: FIELD_STANDARDS['finance.paymentNotes'].maxLen,
  reverseReason: FIELD_STANDARDS['finance.reverseReason'].maxLen,
  expenseConcept: FIELD_STANDARDS['finance.expenseConcept'].maxLen,
  reference: FIELD_STANDARDS['finance.reference'].maxLen,
  password: FIELD_STANDARDS['auth.password'].maxLen,
  passwordMin: FIELD_STANDARDS['auth.password'].minLen,
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function phoneDigitCount(value: string): number {
  return value.replace(/[\s\-+()]/g, '').length;
}

export function isValidEmailFormat(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

function charsetError(std: FieldStandard, value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  switch (std.charset) {
    case 'personName':
      if (!PERSON_NAME_RE.test(v)) {
        return `${std.label}: solo letras, espacios y ' - . (sin números ni símbolos)`;
      }
      return null;
    case 'email':
      if (!isValidEmailFormat(v)) return 'Formato de correo inválido';
      return null;
    case 'phone':
      if (phoneDigitCount(v) < FieldLimits.phoneDigitsMin) return 'Mínimo 8 dígitos';
      return null;
    case 'postalCodeMx':
      if (!/^\d{5}$/.test(v)) return 'Debe ser 5 dígitos';
      return null;
    case 'code':
      if (!CODE_RE.test(v)) return `${std.label}: use letras, números, _ o -`;
      return null;
    case 'url': {
      if (!TEXT_FREE_RE.test(v)) return `${std.label}: no se permiten caracteres de control ni < >`;
      try {
        const parsed = new URL(v);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return 'Usa una URL válida (https://…)';
        }
      } catch {
        return 'Usa una URL válida (https://…)';
      }
      return null;
    }
    case 'textFree':
      if (!TEXT_FREE_RE.test(v)) return `${std.label}: no se permiten caracteres de control ni < >`;
      return null;
    case 'money': {
      const n = Number(v);
      if (!Number.isFinite(n) || n <= 0) return 'Ingresa un número válido mayor a 0';
      if (v.replace(/\D/g, '').length > (std.maxLen || 16)) return `Máximo ${std.maxLen} dígitos`;
      return null;
    }
    case 'password':
      return null; // complexity in validatePassword
    case 'digits':
      if (!/^\d+$/.test(v)) return `${std.label}: solo dígitos`;
      return null;
    case 'enum':
      return null;
    default:
      return null;
  }
}

/** Valida por fieldId del catálogo. null = OK. */
export function validateField(
  fieldId: string,
  value: string,
  opts?: { required?: boolean; label?: string }
): string | null {
  const std = getFieldStandard(fieldId);
  const required = opts?.required ?? std.requiredDefault;
  const label = opts?.label ?? std.label;
  const v = value.trim();

  if (!v) {
    return required ? `${label} es obligatorio` : null;
  }
  if (v.length < std.minLen && std.minLen > 0 && required) {
    return `Mínimo ${std.minLen} caracteres`;
  }
  if (std.minLen > 0 && v.length < std.minLen && !required) {
    // optional but partially filled — still enforce min when non-empty for personName etc.
    if (std.charset === 'personName' || std.charset === 'postalCodeMx') {
      return `Mínimo ${std.minLen} caracteres`;
    }
  }
  if (v.length > std.maxLen) return `Máximo ${std.maxLen} caracteres`;
  return charsetError(std, v);
}

/** null = válido. Usa person.firstName charset. */
export function validateRequiredName(value: string, label = 'El nombre'): string | null {
  return validateField('person.firstName', value, { required: true, label });
}

/** Apellido / nombre opcional con mismo charset. */
export function validateOptionalName(value: string, label = 'El nombre'): string | null {
  return validateField('person.firstName', value, { required: false, label });
}

export function validateEmail(value: string, required: boolean): string | null {
  return validateField('person.email', value, { required });
}

export function validatePhone(value: string, required: boolean, label = 'El teléfono'): string | null {
  return validateField('person.phone', value, { required, label });
}

export function validateMaxLen(value: string, max: number, label: string): string | null {
  if (value.trim().length > max) return `${label}: máximo ${max} caracteres`;
  return null;
}

/** Texto libre: max + textFree charset. */
export function validateTextFree(value: string, max: number, label: string, required = false): string | null {
  const v = value.trim();
  if (!v) return required ? `${label} es obligatorio` : null;
  if (v.length > max) return `${label}: máximo ${max} caracteres`;
  if (!TEXT_FREE_RE.test(v)) return `${label}: no se permiten caracteres de control ni < >`;
  return null;
}

export function validateBirthDate(value: string, required = true): string | null {
  if (!value.trim()) return required ? 'La fecha de nacimiento es obligatoria' : null;
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return 'Fecha inválida';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d > today) return 'La fecha de nacimiento no puede ser futura';
  const min = new Date(today);
  min.setFullYear(min.getFullYear() - 100);
  if (d < min) return 'La fecha de nacimiento no es realista (máx. 100 años)';
  return null;
}

export function validatePositiveNumber(value: string, label: string): string | null {
  return validateField('finance.amount', value, { required: true, label });
}

export function validatePostalCodeMx(value: string, required = true): string | null {
  return validateField('org.postalCode', value, { required });
}

/** BR-03: mínimo 8, máx 128, 1 mayúscula, 1 minúscula, 1 dígito. */
export function validatePassword(value: string): string | null {
  if (!value) return 'La contraseña es obligatoria';
  if (value.length < FieldLimits.passwordMin) return `Mínimo ${FieldLimits.passwordMin} caracteres`;
  if (value.length > FieldLimits.password) return `Máximo ${FieldLimits.password} caracteres`;
  if (!/[A-ZÁÉÍÓÚÑ]/.test(value)) return 'Debe incluir al menos una mayúscula';
  if (!/[a-záéíóúñ]/.test(value)) return 'Debe incluir al menos una minúscula';
  if (!/\d/.test(value)) return 'Debe incluir al menos un dígito';
  return null;
}

export function assignError(
  errors: Record<string, string>,
  key: string,
  message: string | null
): void {
  if (message) errors[key] = message;
}
