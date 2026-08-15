import { apiClient } from '@/api/apiClient';
import { buildQuery, fetchOrFallback, unwrapList } from '@/api/helpers';
import type { ApiResponse, FetchResult, PagedResult } from '@/api/types';
import { notificacionesData } from '@/mocks/notificaciones';

/** Vista de UI unificada (API real + mocks DEV). */
export interface AppNotification {
  id: string;
  icon: string;
  color: string;
  title: string;
  description: string;
  time: string;
  date: string;
  read: boolean;
  category: string;
  alumnos?: string[];
  matricula?: string;
  monto?: string;
  alumno?: string;
  actionLabel?: string;
  linkUrl?: string | null;
}

export interface NotificationListParams {
  category?: string;
  unreadOnly?: boolean;
  search?: string;
}

const categoryIconMap: Record<string, string> = {
  pagos: 'ri-money-dollar-circle-line',
  inscripciones: 'ri-file-list-3-line',
  profesores: 'ri-user-voice-line',
  alumnos: 'ri-user-star-line',
  sistema: 'ri-settings-3-line',
  general: 'ri-notification-3-line',
};

const categoryColorHex: Record<string, string> = {
  pagos: '#f59e0b',
  inscripciones: '#3b82f6',
  profesores: '#8b5cf6',
  alumnos: '#10b981',
  sistema: '#64748b',
  general: '#64748b',
};

function relativeTime(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const diffMin = Math.round((Date.now() - t) / 60000);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.round(h / 24);
  return `Hace ${d} d`;
}

function normalizeNotification(raw: unknown): AppNotification | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = String(r.id ?? '').trim();
  if (!id) return null;

  const category = String(r.category ?? 'general').toLowerCase();
  const createdAt = String(r.createdAt ?? r.date ?? '');
  const title = String(r.title ?? '');
  const description = String(r.body ?? r.description ?? '');
  const isRead = Boolean(r.isRead ?? r.read);

  // Mock DEV shape already rich
  if (typeof r.icon === 'string' && r.icon) {
    return {
      id,
      icon: String(r.icon),
      color: String(r.color ?? categoryColorHex[category] ?? '#64748b'),
      title,
      description,
      time: String(r.time ?? relativeTime(createdAt)),
      date: createdAt,
      read: isRead,
      category,
      alumnos: Array.isArray(r.alumnos) ? (r.alumnos as string[]) : undefined,
      matricula: r.matricula ? String(r.matricula) : undefined,
      monto: r.monto ? String(r.monto) : undefined,
      alumno: r.alumno ? String(r.alumno) : undefined,
      actionLabel: r.actionLabel ? String(r.actionLabel) : undefined,
      linkUrl: r.linkUrl != null ? String(r.linkUrl) : null,
    };
  }

  return {
    id,
    icon: categoryIconMap[category] || categoryIconMap.general,
    color: categoryColorHex[category] || categoryColorHex.general,
    title,
    description,
    time: relativeTime(createdAt),
    date: createdAt,
    read: isRead,
    category,
    linkUrl: r.linkUrl != null ? String(r.linkUrl) : null,
  };
}

function normalizeMockList(): AppNotification[] {
  return notificacionesData
    .map((n) => normalizeNotification({ ...n, id: String(n.id), body: n.description, isRead: n.read }))
    .filter((n): n is AppNotification => n !== null);
}

/** GET /notifications — normaliza DTO BE (Body/IsRead/Guid) a AppNotification. */
export async function listNotifications(
  params: NotificationListParams = {}
): Promise<FetchResult<AppNotification[]>> {
  const q = buildQuery(params as Record<string, unknown>);
  const result = await fetchOrFallback<PagedResult<Record<string, unknown>> | Record<string, unknown>[]>(
    () => apiClient(`/notifications${q}`),
    () => normalizeMockList() as unknown as Record<string, unknown>[]
  );

  if (result.source === 'fallback') {
    return { data: normalizeMockList(), source: 'fallback', message: result.message };
  }

  const items = unwrapList(result.data)
    .map((row) => normalizeNotification(row))
    .filter((n): n is AppNotification => n !== null);

  return { data: items, source: 'api', message: result.message };
}

export async function markNotificationRead(id: string): Promise<ApiResponse<null>> {
  return apiClient<null>(`/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllNotificationsRead(): Promise<ApiResponse<null>> {
  return apiClient<null>('/notifications/read-all', { method: 'POST' });
}
