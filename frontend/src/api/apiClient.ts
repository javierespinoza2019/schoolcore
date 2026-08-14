import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
  setStoredUser,
} from '@/auth/tokenStorage';
import type { ApiResponse, RefreshResponse } from '@/api/types';
import { toAuthUser } from '@/api/types';
import { env } from '@/config/env';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiClientOptions extends Omit<RequestInit, 'body' | 'method'> {
  method?: HttpMethod;
  /** JSON serializable o FormData (multipart; no se fuerza Content-Type). */
  body?: unknown;
  /** Si true, no adjunta Bearer ni intenta refresh en 401. */
  skipAuth?: boolean;
}

function serializeBody(body: unknown): BodyInit | undefined {
  if (body === undefined) return undefined;
  if (body instanceof FormData) return body;
  if (typeof body === 'string') return body;
  if (body instanceof Blob) return body;
  return JSON.stringify(body);
}

function getBaseUrl(): string {
  return env.apiBaseUrl;
}

function buildUrl(path: string): string {
  const base = getBaseUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

function loginRedirectPath(): string {
  const base = typeof __BASE_PATH__ !== 'undefined' ? __BASE_PATH__ : '/';
  const prefix = base.replace(/\/$/, '') || '';
  return `${prefix}/login`;
}

function redirectToLogin(): void {
  clearTokens();
  const target = loginRedirectPath();
  if (!window.location.pathname.endsWith('/login')) {
    window.location.assign(target);
  }
}

/** Refresh en vuelo para deduplicar 401 concurrentes. */
let refreshInFlight: Promise<boolean> | null = null;

async function tryRefreshOnce(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(buildUrl('/auth/refresh'), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const json = (await res.json()) as ApiResponse<RefreshResponse>;
      if (!res.ok || !json.success || !json.data?.accessToken || !json.data?.refreshToken) {
        return false;
      }

      setTokens(json.data.accessToken, json.data.refreshToken);
      if (json.data.userId) {
        setStoredUser(toAuthUser(json.data));
      }
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/**
 * Cliente HTTP con Bearer + reintento único vía refresh en 401.
 * Espera JSON camelCase alineado con ApiResponse&lt;T&gt;.
 */
export async function apiClient<T>(
  path: string,
  options: ApiClientOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, skipAuth = false, headers: customHeaders, ...rest } = options;

  const headers = new Headers(customHeaders);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const doFetch = () =>
    fetch(buildUrl(path), {
      ...rest,
      method,
      headers,
      body: serializeBody(body),
    });

  let response = await doFetch();

  if (response.status === 401 && !skipAuth) {
    // Sin refresh token (p.ej. pantalla de login / token basura): no redirigir ni disparar refresh.
    if (!getRefreshToken()) {
      clearTokens();
      return {
        success: false,
        data: null,
        message: 'No autorizado.',
        errors: ['Unauthorized'],
      };
    }

    const refreshed = await tryRefreshOnce();
    if (!refreshed) {
      redirectToLogin();
      return {
        success: false,
        data: null,
        message: 'Sesión expirada. Inicia sesión de nuevo.',
        errors: ['Unauthorized'],
      };
    }

    const newToken = getAccessToken();
    if (newToken) headers.set('Authorization', `Bearer ${newToken}`);
    response = await doFetch();

    if (response.status === 401) {
      redirectToLogin();
      return {
        success: false,
        data: null,
        message: 'Sesión expirada. Inicia sesión de nuevo.',
        errors: ['Unauthorized'],
      };
    }
  }

  let json: ApiResponse<T>;
  try {
    json = (await response.json()) as ApiResponse<T>;
  } catch {
    json = {
      success: false,
      data: null,
      message: 'Respuesta inválida del servidor.',
      errors: ['InvalidResponse'],
    };
  }

  if (!json.errors) json.errors = [];
  // Propagar status HTTP no-2xx como failure si el body no lo marcó
  if (!response.ok && json.success !== false) {
    json.success = false;
    if (!json.message) json.message = `HTTP ${response.status}`;
  }
  return json;
}

/**
 * Descarga binaria (PDF/Excel export) con Bearer + refresh.
 * Retorna null si falla.
 */
export async function apiDownload(
  path: string,
  options: { method?: HttpMethod; body?: unknown; filenameHint?: string } = {}
): Promise<{ blob: Blob; filename: string } | null> {
  const { method = 'GET', body } = options;
  const headers = new Headers({ Accept: '*/*' });
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const doFetch = () =>
    fetch(buildUrl(path), {
      method,
      headers,
      body: serializeBody(body),
    });

  let response = await doFetch();
  if (response.status === 401) {
    const refreshed = await tryRefreshOnce();
    if (!refreshed) {
      redirectToLogin();
      return null;
    }
    const newToken = getAccessToken();
    if (newToken) headers.set('Authorization', `Bearer ${newToken}`);
    response = await doFetch();
  }

  if (!response.ok) return null;

  const blob = await response.blob();
  const cd = response.headers.get('Content-Disposition') || '';
  const match = /filename\*?=(?:UTF-8'')?["']?([^"';\n]+)/i.exec(cd);
  const filename = match?.[1]?.trim() || options.filenameHint || 'export.bin';
  return { blob, filename };
}

/** Dispara descarga en el navegador. */
export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
