import { apiClient } from '@/api/apiClient';
import { buildQuery, fetchOrFallback, unwrapList } from '@/api/helpers';
import type { ApiResponse, FetchResult, PagedResult } from '@/api/types';
import type { Parent } from '@/mocks/padres';
import { parents as mockParents } from '@/mocks/padres';

export interface ParentListParams {
  branchId?: string | null;
  page?: number;
  pageSize?: number;
  search?: string;
}

/** Normaliza GuardianDto (BE) → Parent (UI mock shape). */
function normalizeParent(raw: Record<string, unknown>): Parent {
  const first = String(raw.firstName ?? '');
  const last = String(raw.lastName ?? '');
  const fullName = String(raw.fullName ?? `${first} ${last}`.trim());
  return {
    id: String(raw.id ?? ''),
    firstName: first,
    lastName: last,
    fullName: fullName || String(raw.nombre ?? ''),
    email: String(raw.email ?? ''),
    phone: String(raw.phone ?? raw.telefono ?? ''),
    occupation: String(raw.occupation ?? ''),
    address: String(raw.address ?? ''),
    status: (String(raw.status ?? 'active') as Parent['status']) || 'active',
    childrenCount: Number(raw.childrenCount ?? 0),
    childrenIds: (raw.childrenIds as string[]) ?? [],
    childrenNames: (raw.childrenNames as string[]) ?? [],
    createdAt: String(raw.createdAt ?? '').slice(0, 10),
  };
}

function toGuardianUpsert(payload: Partial<Parent>) {
  return {
    firstName: payload.firstName ?? '',
    lastName: payload.lastName ?? '',
    email: payload.email,
    phone: payload.phone,
    occupation: (payload as { occupation?: string }).occupation,
    address: (payload as { address?: string }).address,
    status: payload.status ?? 'active',
  };
}

/** GET /guardians (alias UI: parents) */
export async function listParents(params: ParentListParams = {}): Promise<FetchResult<Parent[]>> {
  const q = buildQuery({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 100,
    search: params.search,
  });
  const result = await fetchOrFallback<PagedResult<Record<string, unknown>> | Record<string, unknown>[]>(
    () => apiClient(`/guardians${q}`),
    () => mockParents as unknown as Record<string, unknown>[]
  );
  const items = unwrapList(result.data).map((x) => normalizeParent(x as Record<string, unknown>));
  if (result.source === 'api') return { data: items, source: 'api', message: result.message };
  return { data: items.length ? items : mockParents, source: 'fallback', message: result.message };
}

export async function getParent(id: string): Promise<FetchResult<Parent | null>> {
  const result = await fetchOrFallback<Record<string, unknown> | null>(
    () => apiClient(`/guardians/${id}`),
    () => (mockParents.find((p) => p.id === id) as unknown as Record<string, unknown>) ?? null
  );
  if (!result.data) return { data: null, source: result.source, message: result.message };
  return { data: normalizeParent(result.data), source: result.source, message: result.message };
}

export async function createParent(payload: Partial<Parent>): Promise<ApiResponse<Parent>> {
  const res = await apiClient<Record<string, unknown>>('/guardians', {
    method: 'POST',
    body: toGuardianUpsert(payload),
  });
  if (res.success && res.data) return { ...res, data: normalizeParent(res.data) };
  return { ...res, data: null };
}

export async function updateParent(id: string, payload: Partial<Parent>): Promise<ApiResponse<Parent>> {
  const res = await apiClient<Record<string, unknown>>(`/guardians/${id}`, {
    method: 'PUT',
    body: toGuardianUpsert(payload),
  });
  if (res.success && res.data) return { ...res, data: normalizeParent(res.data) };
  return { ...res, data: null };
}

export async function deleteParent(id: string): Promise<ApiResponse<null>> {
  return apiClient<null>(`/guardians/${id}`, { method: 'DELETE' });
}

/** Vincula alumno ↔ tutor vía POST /students/:studentId/guardians */
export async function linkStudent(
  parentId: string,
  studentId: string,
  relationship?: string
): Promise<ApiResponse<null>> {
  return apiClient<null>(`/students/${studentId}/guardians`, {
    method: 'POST',
    body: {
      guardianId: parentId,
      relationship: relationship ?? 'padre',
      isPrimary: false,
    },
  });
}
