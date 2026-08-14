/**
 * Configuración de entorno (Vite).
 * Fuente de verdad: `.env.development` | `.env.qa` | `.env.production`
 * (+ overrides opcionales en `.env.local` / `.env.[mode].local`).
 */

export type AppEnv = 'development' | 'qa' | 'production';

function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/$/, '');
}

function resolveAppEnv(): AppEnv {
  const explicit = (import.meta.env.VITE_APP_ENV || '').trim().toLowerCase();
  if (explicit === 'development' || explicit === 'qa' || explicit === 'production') {
    return explicit;
  }

  const mode = (import.meta.env.MODE || '').toLowerCase();
  if (mode === 'development' || mode === 'qa' || mode === 'production') {
    return mode;
  }

  // Fallback: builds desconocidos se tratan como production
  return import.meta.env.PROD ? 'production' : 'development';
}

const apiBaseUrl = normalizeBaseUrl(String(import.meta.env.VITE_API_BASE_URL ?? ''));
const appEnv = resolveAppEnv();
const appName = String(import.meta.env.VITE_APP_NAME || 'SchoolCore').trim() || 'SchoolCore';

if (!apiBaseUrl) {
  throw new Error(
    `[SchoolCore] VITE_API_BASE_URL is missing for mode "${import.meta.env.MODE}". ` +
      'Define it in .env.development / .env.qa / .env.production.'
  );
}

/** True solo en ambiente de desarrollo local (no QA ni Production). */
export const isDevelopment = appEnv === 'development';

/** True en builds/servidores QA. */
export const isQa = appEnv === 'qa';

/** True en Production. */
export const isProduction = appEnv === 'production';

export const env = {
  /** development | qa | production (negocio SchoolCore). */
  appEnv,
  /** Vite MODE crudo. */
  mode: import.meta.env.MODE,
  appName,
  /** Base API sin slash final, p.ej. https://localhost:7141/api */
  apiBaseUrl,
  isDevelopment,
  isQa,
  isProduction,
} as const;

export type SchoolCoreEnv = typeof env;
