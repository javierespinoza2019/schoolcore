import { apiClient } from '@/api/apiClient';
import { buildQuery, fetchOrFallback, isGuid, unwrapList, unwrapTotalCount } from '@/api/helpers';
import type { ApiResponse, FetchResult, PagedResult } from '@/api/types';
import type { Profesor } from '@/mocks/profesores';
import { profesoresData } from '@/mocks/profesores';

export interface TeacherListParams {
  branchId?: string | null;
  page?: number;
  pageSize?: number;
  search?: string;
}

function fromApiStatus(status: string): string {
  const s = status.toLowerCase();
  if (s === 'suspended' || s === 'suspendido') return 'Suspendido';
  if (s === 'inactive' || s === 'inactivo') return 'Inactivo';
  return 'Activo';
}

function toApiStatus(estado: string): string {
  if (estado === 'Suspendido') return 'suspended';
  if (estado === 'Inactivo') return 'inactive';
  return 'active';
}

function parseSubjects(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof raw === 'string' && raw.trim()) {
    if (raw.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) return parsed.map(String).map((s) => s.trim()).filter(Boolean);
      } catch {
        /* fall through */
      }
    }
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function asDateInput(value: unknown): string {
  const s = String(value ?? '').trim();
  return s ? s.slice(0, 10) : '';
}

export function normalizeTeacher(raw: unknown): Profesor {
  const r = (raw ?? {}) as Record<string, unknown>;
  const firstName = String(r.firstName ?? r.nombre ?? '').trim();
  const lastName = String(r.lastName ?? '').trim();
  const nombre =
    String(r.nombre ?? '').trim() ||
    [firstName, lastName].filter(Boolean).join(' ').trim();

  return {
    id: String(r.id ?? ''),
    branchId: isGuid(r.branchId) ? String(r.branchId) : undefined,
    educationLevelId: isGuid(r.educationLevelId) ? String(r.educationLevelId) : undefined,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    nombre,
    email: String(r.email ?? ''),
    telefono: String(r.phone ?? r.telefono ?? ''),
    especialidad: String(r.specialty ?? r.especialidad ?? ''),
    materias: parseSubjects(r.subjectsJson ?? r.materias),
    tipoPago: String(r.employmentType ?? r.tipoPago ?? 'Nómina') || 'Nómina',
    salarioMensual: Number(r.monthlySalary ?? r.salarioMensual ?? 0),
    sucursal: String(r.branchName ?? r.sucursal ?? ''),
    nivel: String(r.educationLevelName ?? r.levelName ?? r.nivel ?? ''),
    estado: fromApiStatus(String(r.status ?? r.estado ?? 'active')),
    fechaIngreso: asDateInput(r.hireDate ?? r.fechaIngreso),
    horario: String(r.scheduleNotes ?? r.horario ?? ''),
    salones: Array.isArray(r.salones) ? (r.salones as string[]) : [],
    fotoUrl: String(r.fotoUrl ?? r.photoUrl ?? ''),
    certificaciones: Array.isArray(r.certificaciones) ? (r.certificaciones as string[]) : [],
    evaluacion: Number(r.evaluacion ?? 0),
  };
}

function toTeacherUpsert(payload: Partial<Profesor> & { branchId?: string; firstName?: string; lastName?: string }) {
  const first = payload.firstName?.trim();
  const last = payload.lastName?.trim();
  const split = !first || !last ? String(payload.nombre ?? '').trim().split(/\s+/) : [];
  return {
    branchId: payload.branchId,
    firstName: first || split.slice(0, -1).join(' ') || split[0] || '',
    lastName: last || (split.length > 1 ? split[split.length - 1] : ''),
    email: payload.email || null,
    phone: payload.telefono || null,
    specialty: payload.especialidad || null,
    subjectsJson: payload.materias?.length ? JSON.stringify(payload.materias) : null,
    employmentType: payload.tipoPago || null,
    monthlySalary: payload.salarioMensual ?? null,
    educationLevelId: isGuid(payload.educationLevelId) ? payload.educationLevelId : null,
    levelName: payload.nivel || null,
    status: payload.estado ? toApiStatus(payload.estado) : 'active',
    hireDate: payload.fechaIngreso?.slice(0, 10) || null,
    scheduleNotes: payload.horario || null,
    photoUrl: toStoredPhotoUrl(payload.fotoUrl),
  };
}

/** Solo GUID de documento o http(s). Nunca data URL. */
function toStoredPhotoUrl(value?: string | null): string | null {
  const s = (value ?? '').trim();
  if (!s || s.startsWith('data:')) return null;
  if (isGuid(s) || s.startsWith('http://') || s.startsWith('https://')) return s;
  return null;
}

/** POST /documents — foto del profesor (entityType distinto al expediente). */
export async function uploadTeacherPhoto(
  teacherId: string,
  file: File
): Promise<ApiResponse<string>> {
  const form = new FormData();
  form.append('file', file);
  form.append('entityType', 'teacher-photo');
  form.append('entityId', teacherId);
  const res = await apiClient<Record<string, unknown>>('/documents', { method: 'POST', body: form });
  if (res.success && res.data) {
    const id = String(res.data.id ?? '');
    return { ...res, data: isGuid(id) ? id : null };
  }
  return { ...res, data: null };
}

/** GET /teachers */
export async function listTeachers(params: TeacherListParams = {}): Promise<FetchResult<Profesor[]>> {
  const q = buildQuery({
    branchId: params.branchId,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 100,
    search: params.search,
  });
  const result = await fetchOrFallback<PagedResult<unknown> | unknown[]>(
    () => apiClient(`/teachers${q}`),
    () => profesoresData
  );
  const items = unwrapList(result.data).map((x) => normalizeTeacher(x));
  const totalCount = unwrapTotalCount(result.data, items.length);
  if (result.source === 'api') return { data: items, totalCount, source: 'api', message: result.message };
  return {
    data: items.length ? items : profesoresData,
    totalCount: items.length ? totalCount : profesoresData.length,
    source: 'fallback',
    message: result.message,
  };
}

export async function getTeacher(id: string | number): Promise<ApiResponse<Profesor>> {
  const res = await apiClient<unknown>(`/teachers/${id}`);
  if (res.success && res.data) return { ...res, data: normalizeTeacher(res.data) };
  return { ...res, data: null };
}

export async function createTeacher(
  payload: Partial<Profesor> & { branchId?: string; firstName?: string; lastName?: string }
): Promise<ApiResponse<Profesor>> {
  const res = await apiClient<unknown>('/teachers', { method: 'POST', body: toTeacherUpsert(payload) });
  if (res.success && res.data) return { ...res, data: normalizeTeacher(res.data) };
  return { ...res, data: null };
}

export async function updateTeacher(
  id: string | number,
  payload: Partial<Profesor> & { branchId?: string; firstName?: string; lastName?: string }
): Promise<ApiResponse<Profesor>> {
  const res = await apiClient<unknown>(`/teachers/${id}`, { method: 'PUT', body: toTeacherUpsert(payload) });
  if (res.success && res.data) return { ...res, data: normalizeTeacher(res.data) };
  return { ...res, data: null };
}

export async function deleteTeacher(id: string | number): Promise<ApiResponse<null>> {
  return apiClient<null>(`/teachers/${id}`, { method: 'DELETE' });
}
