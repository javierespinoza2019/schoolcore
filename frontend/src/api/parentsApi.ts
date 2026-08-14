import { apiClient } from '@/api/apiClient';
import { buildQuery, fetchOrFallback, isGuid, unwrapList } from '@/api/helpers';
import type { ApiResponse, FetchResult, PagedResult } from '@/api/types';
import type { Parent } from '@/mocks/padres';
import { parents as mockParents } from '@/mocks/padres';
import type { Student } from '@/mocks/alumnos';

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
  const childrenIds = Array.isArray(raw.childrenIds)
    ? (raw.childrenIds as unknown[]).map(String)
    : [];
  const childrenNames = Array.isArray(raw.childrenNames)
    ? (raw.childrenNames as unknown[]).map(String)
    : [];
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
    childrenCount: Number(raw.childrenCount ?? childrenIds.length ?? 0),
    childrenIds,
    childrenNames,
    createdAt: String(raw.createdAt ?? '').slice(0, 10),
  };
}

/** Normaliza alumno vinculado a tutor → Student mínimo para UI. */
export function normalizeLinkedStudent(raw: Record<string, unknown>): Student {
  const first = String(raw.firstName ?? '');
  const last = String(raw.lastName ?? '');
  const fullName = `${first} ${last}`.trim();
  return {
    id: String(raw.id ?? ''),
    enrollment: String(raw.enrollmentNumber ?? raw.enrollment ?? ''),
    firstName: first,
    lastName: last,
    fullName: fullName || 'Alumno',
    email: String(raw.email ?? ''),
    phone: String(raw.phone ?? ''),
    birthDate: String(raw.birthDate ?? ''),
    age: Number(raw.age ?? 0),
    gender: (String(raw.gender ?? 'M') as 'M' | 'F') || 'M',
    bloodType: String(raw.bloodType ?? ''),
    address: String(raw.address ?? ''),
    level: String(raw.levelName ?? raw.level ?? ''),
    grade: String(raw.grade ?? ''),
    group: String(raw.groupCode ?? raw.group ?? ''),
    branchId: String(raw.branchId ?? ''),
    branchName: String(raw.branchName ?? ''),
    photo: String(raw.photoUrl ?? raw.photo ?? ''),
    status: (String(raw.status ?? 'active') as Student['status']) || 'active',
    enrollmentDate: String(raw.enrollmentDate ?? '').slice(0, 10),
    scholarship: Number(raw.scholarshipPercent ?? raw.scholarship ?? 0),
    allergies: [],
    medicalNotes: '',
    balance: 0,
    lastPayment: '',
    parents: [],
    documents: [],
    timeline: [],
    payments: [],
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

export async function getParent(id: string): Promise<ApiResponse<Parent>> {
  if (!isGuid(id)) {
    return { success: false, data: null, message: 'Identificador de tutor inválido.', errors: ['InvalidId'] };
  }
  const res = await apiClient<Record<string, unknown>>(`/guardians/${id}`);
  if (res.success && res.data) return { ...res, data: normalizeParent(res.data) };
  return { ...res, data: null };
}

/** GET /guardians/:id/students */
export async function listParentStudents(parentId: string): Promise<ApiResponse<Student[]>> {
  if (!isGuid(parentId)) {
    return { success: false, data: null, message: 'Identificador de tutor inválido.', errors: ['InvalidId'] };
  }
  const res = await apiClient<unknown[]>(`/guardians/${parentId}/students`);
  if (!res.success) return { ...res, data: null };
  const items = unwrapList(res.data).map((x) => normalizeLinkedStudent(x as Record<string, unknown>));
  return { ...res, data: items };
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

/** Desvincula alumno ↔ tutor vía DELETE /students/:studentId/guardians/:guardianId */
export async function unlinkStudent(parentId: string, studentId: string): Promise<ApiResponse<null>> {
  return apiClient<null>(`/students/${studentId}/guardians/${parentId}`, { method: 'DELETE' });
}
