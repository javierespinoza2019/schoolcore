import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '@/api/types';
import type { PermissionAction } from '@/permissions/PermissionContext';

export interface PermissionGrant {
  viewCode: string;
  actions: PermissionAction[];
}

/**
 * GET /auth/me/permissions — permisos del usuario autenticado.
 * Si el backend aún no lo expone, el PermissionContext mantiene stub.
 */
export async function fetchMyPermissions(): Promise<ApiResponse<PermissionGrant[] | string[]>> {
  return apiClient<PermissionGrant[] | string[]>('/auth/me/permissions');
}
