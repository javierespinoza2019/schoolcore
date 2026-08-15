/**
 * Feature flags SchoolCore.
 * Keys FE (camelCase) ↔ FeatureKey BD (PascalCase).
 * Defaults OFF; la fuente de verdad es GET /feature-flags (Branch > Tenant > Global).
 */

export const FEATURE_KEYS = {
  aiAssistant: 'AiAssistant',
  stripeModule: 'StripeModule',
  parentPortal: 'ParentPortal',
  teacherPortal: 'TeacherPortal',
  studentPortal: 'StudentPortal',
  cfdiModule: 'CfdiModule',
  advancedAcademics: 'AdvancedAcademics',
} as const;

export type FeatureFlagId = keyof typeof FEATURE_KEYS;

export const FEATURE_LABELS: Record<FeatureFlagId, string> = {
  aiAssistant: 'Asistente IA',
  stripeModule: 'Pagos Stripe',
  parentPortal: 'Portal padres',
  teacherPortal: 'Portal profesores',
  studentPortal: 'Portal alumnos',
  cfdiModule: 'CFDI / facturación',
  advancedAcademics: 'Académico avanzado',
};

/** Defaults seguros (OFF) si la API no responde o aún no cargó. */
export const DEFAULT_FEATURE_FLAGS: Record<FeatureFlagId, boolean> = {
  aiAssistant: false,
  stripeModule: false,
  parentPortal: false,
  teacherPortal: false,
  studentPortal: false,
  cfdiModule: false,
  advancedAcademics: false,
};

/** @deprecated Usar useFeatureFlags(). Mantiene compat para imports estáticos (defaults OFF). */
export const FEATURES = DEFAULT_FEATURE_FLAGS;

export function apiKeyToFeatureId(apiKey: string): FeatureFlagId | null {
  const entry = Object.entries(FEATURE_KEYS).find(
    ([, v]) => v.toLowerCase() === apiKey.trim().toLowerCase()
  );
  return entry ? (entry[0] as FeatureFlagId) : null;
}
