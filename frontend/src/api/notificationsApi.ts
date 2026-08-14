import { apiClient } from '@/api/apiClient';
import { buildQuery, fetchOrFallback, unwrapList } from '@/api/helpers';
import type { ApiResponse, FetchResult, PagedResult } from '@/api/types';
import { notificacionesData } from '@/mocks/notificaciones';

export type AppNotification = (typeof notificacionesData)[number];

export interface NotificationListParams {
  category?: string;
  unreadOnly?: boolean;
  search?: string;
}

/** GET /notifications */
export async function listNotifications(
  params: NotificationListParams = {}
): Promise<FetchResult<AppNotification[]>> {
  const q = buildQuery(params as Record<string, unknown>);
  const result = await fetchOrFallback<PagedResult<AppNotification> | AppNotification[]>(
    () => apiClient(`/notifications${q}`),
    () => notificacionesData
  );
  const items = unwrapList(result.data);
  if (result.source === 'api') return { data: items, source: 'api', message: result.message };
  return { data: items.length ? items : notificacionesData, source: 'fallback', message: result.message };
}

export async function markNotificationRead(id: string | number): Promise<ApiResponse<null>> {
  return apiClient<null>(`/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllNotificationsRead(): Promise<ApiResponse<null>> {
  return apiClient<null>('/notifications/read-all', { method: 'POST' });
}

export async function deleteNotification(id: string | number): Promise<ApiResponse<null>> {
  return apiClient<null>(`/notifications/${id}`, { method: 'DELETE' });
}
