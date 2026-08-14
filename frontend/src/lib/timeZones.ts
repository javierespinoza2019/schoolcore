/** Catálogo cerrado México (alineado al backend). */
export const MEXICO_TIME_ZONES = [
  { id: 'America/Mexico_City', label: 'Ciudad de México / Centro (UTC−6)' },
  { id: 'America/Cancun', label: 'Cancún / Quintana Roo (UTC−5)' },
  { id: 'America/Mazatlan', label: 'Pacífico — Mazatlán (UTC−7)' },
  { id: 'America/Chihuahua', label: 'Chihuahua (UTC−7)' },
  { id: 'America/Hermosillo', label: 'Hermosillo / Sonora' },
  { id: 'America/Tijuana', label: 'Tijuana / Baja California (UTC−8)' },
] as const;

export const PLATFORM_DEFAULT_TIME_ZONE = 'America/Mexico_City';

export type TimeZoneSource = 'Branch' | 'Tenant' | 'Platform';

export interface EffectiveTimeZone {
  effectiveTimeZoneId: string;
  source: TimeZoneSource | string;
  tenantTimeZoneId?: string | null;
  branchTimeZoneId?: string | null;
}

/** Detecta zona IANA del dispositivo (solo sugerencia; no escribe en BD). */
export function detectDeviceTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

export function labelForTimeZone(id: string | null | undefined): string {
  if (!id) return 'Hereda de la institución';
  const found = MEXICO_TIME_ZONES.find((z) => z.id === id);
  return found?.label ?? id;
}

export function formatInTimeZone(
  utcIsoOrDate: string | Date,
  timeZoneId: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof utcIsoOrDate === 'string' ? new Date(utcIsoOrDate) : utcIsoOrDate;
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: timeZoneId || PLATFORM_DEFAULT_TIME_ZONE,
    dateStyle: 'short',
    timeStyle: 'short',
    ...options,
  }).format(date);
}
