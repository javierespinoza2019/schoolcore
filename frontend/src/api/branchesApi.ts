import { apiClient } from '@/api/apiClient';
import { buildQuery, fetchOrFallback, isGuid, unwrapList } from '@/api/helpers';
import type { ApiResponse, FetchResult, PagedResult } from '@/api/types';
import type { Sucursal } from '@/mocks/sucursales';
import { sucursalesData } from '@/mocks/sucursales';

export type BranchDto = Sucursal & { id: string | number };

function asDateInput(value: unknown): string {
  const s = String(value ?? '').trim();
  if (!s) return '';
  return s.slice(0, 10);
}

function asLevels(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((x) => String(x).trim()).filter(Boolean);
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function asOperationalStatus(raw: Record<string, unknown>): Sucursal['estadoOperativo'] {
  const status = String(raw.operationalStatus ?? raw.estadoOperativo ?? '').trim();
  if (status === 'Mantenimiento' || status === 'Próxima Apertura' || status === 'Operando') {
    return status;
  }
  if (raw.isActive === false) return 'Mantenimiento';
  return 'Operando';
}

function toBranchBody(payload: Partial<Sucursal>, code: string) {
  const opened = payload.fechaApertura?.trim().slice(0, 10);
  return {
    name: payload.nombre,
    code,
    isActive: payload.estadoOperativo !== 'Mantenimiento',
    address: payload.direccion,
    city: payload.ciudad,
    state: payload.estado,
    postalCode: payload.codigoPostal,
    phone: payload.telefono,
    email: payload.email,
    timeZoneId: payload.timeZoneId ?? null,
    directorName: payload.director?.trim() || null,
    directorEmail: payload.directorEmail?.trim() || null,
    directorPhone: payload.directorTelefono?.trim() || null,
    capacity: payload.capacidadTotal ?? null,
    openedAt: opened || null,
    area: payload.superficie?.trim() || null,
    levels: Array.isArray(payload.niveles) ? payload.niveles.join(', ') : null,
    operationalStatus: payload.estadoOperativo || 'Operando',
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

function normalizeBranch(raw: Record<string, unknown>): Sucursal {
  const rawId = raw.id ?? raw.Id;
  // Preservar GUID como string. Number(guid) → NaN → 0 rompía timezone/kpis.
  const id =
    typeof rawId === 'number' && Number.isFinite(rawId)
      ? rawId
      : String(rawId ?? '').trim();

  return {
    id,
    code: String(raw.code ?? raw.Code ?? '').trim() || undefined,
    nombre: String(raw.nombre ?? raw.name ?? ''),
    direccion: String(raw.direccion ?? raw.address ?? ''),
    ciudad: String(raw.ciudad ?? raw.city ?? ''),
    estado: String(raw.estado ?? raw.state ?? ''),
    codigoPostal: String(raw.codigoPostal ?? raw.postalCode ?? ''),
    telefono: String(raw.telefono ?? raw.phone ?? ''),
    email: String(raw.email ?? ''),
    director: String(raw.director ?? raw.directorName ?? ''),
    directorEmail: String(raw.directorEmail ?? ''),
    directorTelefono: String(raw.directorTelefono ?? raw.directorPhone ?? ''),
    capacidadTotal: Number(raw.capacidadTotal ?? raw.capacity ?? 0),
    alumnosInscritos: Number(raw.alumnosInscritos ?? raw.enrolledStudents ?? 0),
    profesoresActivos: Number(raw.profesoresActivos ?? raw.activeTeachers ?? 0),
    salones: Number(raw.salones ?? raw.classrooms ?? 0),
    niveles: asLevels(raw.niveles ?? raw.levels),
    estadoOperativo: asOperationalStatus(raw),
    fechaApertura: asDateInput(raw.fechaApertura ?? raw.openedAt),
    superficie: String(raw.superficie ?? raw.area ?? ''),
    lat: Number(raw.lat ?? 0),
    lng: Number(raw.lng ?? 0),
    instalaciones: (raw.instalaciones as string[]) ?? (raw.facilities as string[]) ?? [],
    fotoUrl: String(raw.fotoUrl ?? raw.photoUrl ?? ''),
    timeZoneId:
      raw.timeZoneId === undefined || raw.timeZoneId === null || raw.timeZoneId === ''
        ? null
        : String(raw.timeZoneId),
  };
}

/** GET /branches — lista de sucursales del tenant. */
export async function listBranches(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<FetchResult<Sucursal[]>> {
  const q = buildQuery(params ?? {});
  const result = await fetchOrFallback<PagedResult<Record<string, unknown>> | Record<string, unknown>[]>(
    () => apiClient(`/branches${q}`),
    () => sucursalesData as unknown as Record<string, unknown>[]
  );
  const items = unwrapList(result.data).map((x) => normalizeBranch(x as Record<string, unknown>));
  // Si API devolvió vacío real, respetar empty (no forzar mock)
  if (result.source === 'api') {
    return { data: items, source: 'api', message: result.message };
  }
  return { data: items.length ? items : sucursalesData, source: 'fallback', message: result.message };
}

export async function getBranch(id: string | number): Promise<ApiResponse<Sucursal>> {
  const res = await apiClient<Record<string, unknown>>(`/branches/${id}`);
  if (res.success && res.data) {
    return { ...res, data: normalizeBranch(res.data) };
  }
  return { ...res, data: null };
}

function uniqueBranchCode(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 8);
  const suffix = Date.now().toString(36).toUpperCase();
  return `${slug || 'BR'}${suffix}`.slice(0, 20);
}

export async function createBranch(payload: Partial<Sucursal>): Promise<ApiResponse<Sucursal>> {
  const explicitCode = (payload as { code?: string }).code?.trim();
  const res = await apiClient<Record<string, unknown>>('/branches', {
    method: 'POST',
    body: toBranchBody(payload, explicitCode || uniqueBranchCode(String(payload.nombre ?? 'BR'))),
  });
  if (res.success && res.data) return { ...res, data: normalizeBranch(res.data) };
  return { ...res, data: null };
}

export async function updateBranch(
  id: string | number,
  payload: Partial<Sucursal>
): Promise<ApiResponse<Sucursal>> {
  let code = (payload.code ?? (payload as { code?: string }).code)?.trim();
  if (!code) {
    const current = await getBranch(id);
    code = current.data?.code?.trim();
  }
  if (!code) {
    return {
      success: false,
      data: null,
      message: 'No se pudo obtener el código de la sucursal',
      errors: ['Code is required.'],
    };
  }

  const res = await apiClient<Record<string, unknown>>(`/branches/${id}`, {
    method: 'PUT',
    body: toBranchBody(payload, code),
  });
  if (res.success && res.data) return { ...res, data: normalizeBranch(res.data) };
  return { ...res, data: null };
}

export async function deleteBranch(id: string | number): Promise<ApiResponse<null>> {
  return apiClient<null>(`/branches/${id}`, { method: 'DELETE' });
}

/** POST /documents — foto de sucursal (entityType distinto al expediente). */
export async function uploadBranchPhoto(
  branchId: string,
  file: File
): Promise<ApiResponse<string>> {
  const form = new FormData();
  form.append('file', file);
  form.append('entityType', 'branch-photo');
  form.append('entityId', branchId);
  const res = await apiClient<Record<string, unknown>>('/documents', { method: 'POST', body: form });
  if (res.success && res.data) {
    const id = String(res.data.id ?? '');
    return { ...res, data: isGuid(id) ? id : null };
  }
  return { ...res, data: null };
}
