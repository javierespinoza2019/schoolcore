/** Límites alineados a NVARCHAR de SPs (SchoolCore). */
export const FieldLimits = {
  name: 100,
  nameMin: 2,
  email: 256,
  phone: 50,
  phoneDigitsMin: 8,
  address: 400,
  addressBranch: 300,
  occupation: 150,
  allergies: 500,
  medicalNotes: 1000,
  grade: 50,
  group: 50,
  bloodType: 10,
  specialty: 150,
  schedule: 500,
  classroomName: 100,
  building: 100,
  city: 100,
  state: 100,
  postalCode: 20,
  directorName: 200,
  branchName: 200,
  branchCode: 50,
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function phoneDigitCount(value: string): number {
  return value.replace(/[\s\-+()]/g, '').length;
}

export function isValidEmailFormat(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/** null = válido. */
export function validateRequiredName(value: string, label = 'El nombre'): string | null {
  const v = value.trim();
  if (!v) return `${label} es obligatorio`;
  if (v.length < FieldLimits.nameMin) return `Mínimo ${FieldLimits.nameMin} caracteres`;
  if (v.length > FieldLimits.name) return `Máximo ${FieldLimits.name} caracteres`;
  return null;
}

export function validateEmail(value: string, required: boolean): string | null {
  const v = value.trim();
  if (!v) return required ? 'El correo electrónico es obligatorio' : null;
  if (v.length > FieldLimits.email) return `Máximo ${FieldLimits.email} caracteres`;
  if (!isValidEmailFormat(v)) return 'Formato de correo inválido';
  return null;
}

export function validatePhone(value: string, required: boolean, label = 'El teléfono'): string | null {
  const v = value.trim();
  if (!v) return required ? `${label} es obligatorio` : null;
  if (v.length > FieldLimits.phone) return `Máximo ${FieldLimits.phone} caracteres`;
  if (phoneDigitCount(v) < FieldLimits.phoneDigitsMin) return 'Mínimo 8 dígitos';
  return null;
}

export function validateMaxLen(value: string, max: number, label: string): string | null {
  if (value.trim().length > max) return `${label}: máximo ${max} caracteres`;
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
  if (!value.trim()) return `${label} es obligatorio`;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return `Ingresa un número válido mayor a 0`;
  return null;
}

export function validatePostalCodeMx(value: string, required = true): string | null {
  const v = value.trim();
  if (!v) return required ? 'El código postal es obligatorio' : null;
  if (!/^\d{5}$/.test(v)) return 'Debe ser 5 dígitos';
  return null;
}

/** BR-03: mínimo 8, 1 mayúscula, 1 minúscula, 1 dígito. */
export function validatePassword(value: string): string | null {
  if (!value) return 'La contraseña es obligatoria';
  if (value.length < 8) return 'Mínimo 8 caracteres';
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
