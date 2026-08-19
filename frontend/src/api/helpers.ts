import type { ApiResponse, FetchResult, PagedResult } from '@/api/types';
import { isDevelopment } from '@/config/env';

const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** True si el valor es un GUID (no "0", no números mock). */
export function isGuid(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  const s = String(value).trim();
  if (!s || s === '0') return false;
  return GUID_RE.test(s);
}

/** Etiqueta visible: vacío si el valor es un GUID técnico. */
export function humanLabel(value: unknown): string {
  const s = String(value ?? '').trim();
  if (!s || isGuid(s)) return '';
  return s;
}

/**
 * Construye query string omitiendo undefined/null/''.
 * Para keys branchId / schoolCycleId / cycleId solo envía GUIDs válidos (nunca "0").
 */
export function buildQuery(params: Record<string, unknown> = {}): string {
  const guidKeys = new Set(['branchid', 'schoolcycleid', 'cycleid']);
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (guidKeys.has(key.toLowerCase()) && !isGuid(value)) return;
    sp.set(key, String(value));
  });
  const q = sp.toString();
  return q ? `?${q}` : '';
}

/** Extrae items tanto de PagedResult como de arrays planos. */
export function unwrapList<T>(data: PagedResult<T> | T[] | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.items ?? [];
}

/** TotalCount del PagedResult; si es array plano usa itemsLength. */
export function unwrapTotalCount<T>(
  data: PagedResult<T> | T[] | null | undefined,
  itemsLength: number
): number {
  if (!data || Array.isArray(data)) return itemsLength;
  const n = Number(data.totalCount);
  return Number.isFinite(n) && n >= 0 ? n : itemsLength;
}

/**
 * Intenta la API; si falla, usa fallback mock **solo en development**.
 * En QA/Production nunca se permiten mocks (aunque se pase allowFallback).
 * Lista vacía de API = empty state real.
 */
export async function fetchOrFallback<T>(
  request: () => Promise<ApiResponse<T>>,
  fallback: T | (() => T),
  options?: { allowFallback?: boolean }
): Promise<FetchResult<T>> {
  // Fail-closed fuera de development: jamás mocks en QA/prod.
  const allowFallback = isDevelopment && options?.allowFallback !== false;

  try {
    const res = await request();
    if (res.success && res.data !== null && res.data !== undefined) {
      return { data: res.data, source: 'api', message: res.message };
    }

    if (allowFallback) {
      console.warn(
        '[SchoolCore API] Fallback mock —',
        res.message || res.errors?.join(', ') || 'sin data'
      );
      const data = typeof fallback === 'function' ? (fallback as () => T)() : fallback;
      return { data, source: 'fallback', message: res.message };
    }

    throw new Error(res.message || res.errors?.join(', ') || 'Request failed');
  } catch (err) {
    if (allowFallback) {
      console.warn('[SchoolCore API] Fallback mock por excepción:', err);
      const data = typeof fallback === 'function' ? (fallback as () => T)() : fallback;
      return { data, source: 'fallback', message: 'Endpoint no disponible' };
    }
    throw err;
  }
}

export function isApiSuccess<T>(res: ApiResponse<T>): res is ApiResponse<T> & { data: T } {
  return Boolean(res.success && res.data !== null && res.data !== undefined);
}
