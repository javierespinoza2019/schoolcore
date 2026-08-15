import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '@/api/types';
import type { PermissionAction } from '@/permissions/PermissionContext';
import { ViewCodes, type ViewCode } from '@/permissions/viewCodes';

export interface PermissionGrant {
  viewCode: string;
  actions: PermissionAction[] | string[];
}

export interface RolePermissionGrant {
  viewCode: string;
  actions: string[];
}

export const PERMISSION_ACTIONS = [
  'view',
  'create',
  'edit',
  'delete',
  'export',
  'approve',
] as const;

export const EDITABLE_VIEWS: { code: ViewCode; label: string; description: string }[] = [
  { code: ViewCodes.DASHBOARD, label: 'Dashboard', description: 'Panel principal y KPIs' },
  { code: ViewCodes.STUDENTS, label: 'Alumnos', description: 'Expedientes, documentos y pagos' },
  { code: ViewCodes.PARENTS, label: 'Padres / Tutores', description: 'Tutores y vínculos' },
  { code: ViewCodes.TEACHERS, label: 'Profesores', description: 'Plantel docente' },
  { code: ViewCodes.CLASSROOMS, label: 'Salones', description: 'Grupos y capacidad' },
  { code: ViewCodes.BRANCHES, label: 'Sucursales', description: 'Campus y edificios' },
  { code: ViewCodes.ENROLLMENTS, label: 'Inscripciones', description: 'Alta de alumnos' },
  { code: ViewCodes.FINANCE, label: 'Finanzas', description: 'Cargos, pagos y egresos' },
  { code: ViewCodes.CASH, label: 'Caja', description: 'Cortes y arqueo' },
  { code: ViewCodes.REPORTS, label: 'Reportes', description: 'Consultas y exportación' },
  { code: ViewCodes.NOTIFICATIONS, label: 'Notificaciones', description: 'Avisos in-app' },
  { code: ViewCodes.SETTINGS, label: 'Configuración', description: 'Catálogos, usuarios y flags' },
];

/** GET /auth/me/permissions — permisos del usuario autenticado. */
export async function fetchMyPermissions(): Promise<ApiResponse<PermissionGrant[] | string[]>> {
  return apiClient<PermissionGrant[] | string[]>('/auth/me/permissions');
}

/** GET /role-permissions/{roleId} */
export async function getRolePermissions(roleId: string): Promise<ApiResponse<RolePermissionGrant[]>> {
  return apiClient<RolePermissionGrant[]>(`/role-permissions/${roleId}`);
}

/** PUT /role-permissions/{roleId} */
export async function replaceRolePermissions(
  roleId: string,
  grants: RolePermissionGrant[]
): Promise<ApiResponse<RolePermissionGrant[]>> {
  return apiClient<RolePermissionGrant[]>(`/role-permissions/${roleId}`, {
    method: 'PUT',
    body: { grants },
  });
}
