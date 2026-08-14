import { apiClient } from '@/api/apiClient';
import { fetchOrFallback, unwrapList } from '@/api/helpers';
import type { ApiResponse, FetchResult, PagedResult } from '@/api/types';
import { ciclosEscolares } from '@/mocks/configuracion';

export interface AcademicCycle {
  id: string;
  nombre: string;
  inicio: string;
  fin: string;
  activo: boolean;
}

function normalizeCycle(raw: Record<string, unknown>): AcademicCycle {
  return {
    id: String(raw.id ?? ''),
    nombre: String(raw.nombre ?? raw.name ?? ''),
    inicio: String(raw.inicio ?? raw.startDate ?? '').slice(0, 10),
    fin: String(raw.fin ?? raw.endDate ?? '').slice(0, 10),
    activo: Boolean(raw.activo ?? raw.isActive ?? false),
  };
}

function toUpsertBody(payload: Partial<AcademicCycle> | Omit<AcademicCycle, 'id'>) {
  return {
    name: 'nombre' in payload ? payload.nombre : undefined,
    startDate: 'inicio' in payload ? payload.inicio : undefined,
    endDate: 'fin' in payload ? payload.fin : undefined,
    isActive: 'activo' in payload ? payload.activo : undefined,
  };
}

/** GET /school-cycles */
export async function listCycles(): Promise<FetchResult<AcademicCycle[]>> {
  const result = await fetchOrFallback<PagedResult<Record<string, unknown>> | Record<string, unknown>[]>(
    () => apiClient('/school-cycles'),
    () => ciclosEscolares as unknown as Record<string, unknown>[]
  );
  const items = unwrapList(result.data).map((x) => normalizeCycle(x as Record<string, unknown>));
  if (result.source === 'api') return { data: items, source: 'api', message: result.message };
  return { data: items.length ? items : ciclosEscolares, source: 'fallback', message: result.message };
}

export async function createCycle(payload: Omit<AcademicCycle, 'id'>): Promise<ApiResponse<AcademicCycle>> {
  const res = await apiClient<Record<string, unknown>>('/school-cycles', {
    method: 'POST',
    body: {
      name: payload.nombre,
      startDate: payload.inicio,
      endDate: payload.fin,
      isActive: payload.activo,
    },
  });
  if (res.success && res.data) return { ...res, data: normalizeCycle(res.data) };
  return { ...res, data: null };
}

export async function updateCycle(
  id: string,
  payload: Partial<AcademicCycle>
): Promise<ApiResponse<AcademicCycle>> {
  const res = await apiClient<Record<string, unknown>>(`/school-cycles/${id}`, {
    method: 'PUT',
    body: toUpsertBody(payload),
  });
  if (res.success && res.data) return { ...res, data: normalizeCycle(res.data) };
  return { ...res, data: null };
}

export async function deleteCycle(id: string): Promise<ApiResponse<null>> {
  return apiClient<null>(`/school-cycles/${id}`, { method: 'DELETE' });
}
