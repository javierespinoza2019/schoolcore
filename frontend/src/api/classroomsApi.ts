import { apiClient } from '@/api/apiClient';
import { buildQuery, fetchOrFallback, humanLabel, isGuid, unwrapList, unwrapTotalCount } from '@/api/helpers';
import type { ApiResponse, FetchResult, PagedResult } from '@/api/types';
import type { Salon, SalonGrupo } from '@/mocks/salones';
import { salonesData } from '@/mocks/salones';

export interface ClassroomListParams {
  branchId?: string | null;
  cycleId?: string | null;
  page?: number;
  pageSize?: number;
  search?: string;
}

function fromApiStatus(status: string): Salon['estado'] {
  const s = status.toLowerCase();
  if (s === 'maintenance' || s === 'mantenimiento') return 'Mantenimiento';
  if (s === 'full' || s === 'lleno') return 'Lleno';
  return 'Disponible';
}

function toApiStatus(estado: string): string {
  if (estado === 'Mantenimiento') return 'maintenance';
  if (estado === 'Lleno') return 'full';
  return 'available';
}

function asRoomType(value: string): Salon['tipo'] {
  if (value === 'Laboratorio' || value === 'Taller' || value === 'Auditorio' || value === 'Deportivo') {
    return value;
  }
  return 'Regular';
}

function parseEquipment(r: Record<string, unknown>): string[] {
  if (Array.isArray(r.equipmentJson)) return (r.equipmentJson as unknown[]).map(String);
  if (typeof r.equipmentJson === 'string' && r.equipmentJson.trim().startsWith('[')) {
    try {
      return (JSON.parse(r.equipmentJson) as unknown[]).map(String);
    } catch {
      return [];
    }
  }
  if (typeof r.equipamiento === 'string') {
    return r.equipamiento.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (Array.isArray(r.equipamiento)) return (r.equipamiento as unknown[]).map(String);
  return [];
}

function parseGroups(raw: unknown): SalonGrupo[] | undefined {
  if (!raw) return undefined;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return undefined;
    return parsed.map((g) => {
      const row = (g ?? {}) as Record<string, unknown>;
      const profesorRaw = String(row.profesor ?? row.teacherId ?? '').trim();
      return {
        grupo: String(row.grupo ?? ''),
        grado: String(row.grado ?? ''),
        nivel: humanLabel(row.educationLevelName ?? row.levelName ?? row.nivel),
        horario: String(row.horario ?? ''),
        profesor: profesorRaw && profesorRaw !== 'Sin asignar' ? profesorRaw : undefined,
      };
    });
  } catch {
    return undefined;
  }
}

export function normalizeClassroom(raw: unknown, branchNameFallback = ''): Salon {
  const r = (raw ?? {}) as Record<string, unknown>;
  const teacherId = isGuid(r.teacherId) ? String(r.teacherId) : undefined;
  const teacherName = String(r.teacherName ?? r.assignedTeacherName ?? r.profesorAsignado ?? '').trim();

  return {
    id: String(r.id ?? ''),
    branchId: String(r.branchId ?? ''),
    educationLevelId: isGuid(r.educationLevelId) ? String(r.educationLevelId) : undefined,
    teacherId,
    nombre: String(r.name ?? r.nombre ?? ''),
    nivel: humanLabel(r.educationLevelName ?? r.levelName ?? r.nivel),
    grado: humanLabel(r.grade ?? r.grado),
    grupo: humanLabel(r.groupCode ?? r.grupo),
    capacidad: Number(r.capacity ?? r.capacidad ?? 0),
    ocupados: Number(r.occupied ?? r.ocupados ?? 0),
    sucursal: humanLabel(r.branchName ?? r.sucursal) || humanLabel(branchNameFallback),
    estado: fromApiStatus(String(r.status ?? r.estado ?? 'available')),
    tipo: asRoomType(String(r.roomType ?? r.tipo ?? 'Regular')),
    edificio: String(r.building ?? r.edificio ?? ''),
    piso: Number(r.floorNumber ?? r.piso ?? 0),
    equipamiento: parseEquipment(r),
    profesorAsignado: humanLabel(teacherName) || 'Sin asignar',
    horarioClase: String(r.scheduleNotes ?? r.horarioClase ?? ''),
    gruposAsignados: parseGroups(r.assignedGroupsJson ?? r.gruposAsignados),
  };
}

function toClassroomUpsert(payload: Partial<Salon> & { branchId?: string }) {
  const teacherRaw = String(payload.teacherId || payload.profesorAsignado || '').trim();
  const teacherIsGuid = isGuid(teacherRaw);
  const teacherLabel =
    !teacherIsGuid && teacherRaw && teacherRaw !== 'Sin asignar' ? teacherRaw : null;

  return {
    branchId: payload.branchId,
    name: payload.nombre,
    educationLevelId: isGuid(payload.educationLevelId) ? payload.educationLevelId : null,
    levelName: payload.nivel || null,
    grade: payload.grado,
    groupCode: payload.grupo,
    capacity: payload.capacidad ?? 0,
    occupied: payload.ocupados !== undefined ? payload.ocupados : null,
    roomType: payload.tipo,
    building: payload.edificio,
    floorNumber: payload.piso,
    status: payload.estado ? toApiStatus(payload.estado) : 'available',
    teacherId: teacherIsGuid ? teacherRaw : null,
    assignedTeacherName: teacherLabel,
    scheduleNotes: payload.horarioClase,
    equipmentJson: payload.equipamiento?.length ? JSON.stringify(payload.equipamiento) : null,
    assignedGroupsJson: payload.gruposAsignados?.length ? JSON.stringify(payload.gruposAsignados) : null,
  };
}

/** GET /classrooms */
export async function listClassrooms(
  params: ClassroomListParams = {}
): Promise<FetchResult<Salon[]>> {
  const q = buildQuery({
    branchId: params.branchId,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 100,
    search: params.search,
  });
  const result = await fetchOrFallback<PagedResult<unknown> | unknown[]>(
    () => apiClient(`/classrooms${q}`),
    () => salonesData
  );
  const items = unwrapList(result.data).map((x) => normalizeClassroom(x));
  const totalCount = unwrapTotalCount(result.data, items.length);
  if (result.source === 'api') return { data: items, totalCount, source: 'api', message: result.message };
  return {
    data: items.length ? items : salonesData,
    totalCount: items.length ? totalCount : salonesData.length,
    source: 'fallback',
    message: result.message,
  };
}

export async function createClassroom(payload: Partial<Salon> & { branchId?: string }): Promise<ApiResponse<Salon>> {
  const res = await apiClient<unknown>('/classrooms', { method: 'POST', body: toClassroomUpsert(payload) });
  if (res.success && res.data) return { ...res, data: normalizeClassroom(res.data) };
  return { ...res, data: null };
}

export async function updateClassroom(
  id: string | number,
  payload: Partial<Salon> & { branchId?: string }
): Promise<ApiResponse<Salon>> {
  const res = await apiClient<unknown>(`/classrooms/${id}`, { method: 'PUT', body: toClassroomUpsert(payload) });
  if (res.success && res.data) return { ...res, data: normalizeClassroom(res.data) };
  return { ...res, data: null };
}

export async function deleteClassroom(id: string | number): Promise<ApiResponse<null>> {
  return apiClient<null>(`/classrooms/${id}`, { method: 'DELETE' });
}
