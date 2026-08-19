import { useState, useEffect } from 'react';
import MainLayout from '@/components/feature/MainLayout';
import Card from '@/components/base/Card';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Select from '@/components/base/Select';
import EmptyState from '@/components/base/EmptyState';
import { useToast } from '@/components/base/Toast';
import { notificationCategories } from '@/mocks/notificaciones';
import { useApiResource } from '@/hooks/useApiResource';
import { queryKeys } from '@/api/queryKeys';
import * as notificationsApi from '@/api/notificationsApi';
import type { AppNotification } from '@/api/notificationsApi';

const categoryColorMap: Record<string, string> = {
  pagos: 'bg-amber-50 text-amber-700 border-amber-200',
  inscripciones: 'bg-primary-50 text-primary-700 border-primary-200',
  profesores: 'bg-accent-50 text-accent-700 border-accent-200',
  alumnos: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sistema: 'bg-secondary-100 text-secondary-700 border-secondary-200',
  general: 'bg-secondary-100 text-secondary-700 border-secondary-200',
};

export default function NotificacionesPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [showUnread, setShowUnread] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const notifQ = useApiResource({
    queryKey: queryKeys.notifications.list({ category: categoryFilter, unreadOnly: showUnread }),
    queryFn: () =>
      notificationsApi.listNotifications({
        category: categoryFilter === 'todas' ? undefined : categoryFilter,
        unreadOnly: showUnread || undefined,
        search: search || undefined,
      }),
    errorToast: 'Error al cargar notificaciones',
  });

  useEffect(() => {
    if (notifQ.data) setNotifications(notifQ.data);
  }, [notifQ.data]);

  const handleMarkAllRead = async () => {
    const res = await notificationsApi.markAllNotificationsRead();
    if (!res.success) {
      showToast(res.message || 'No se pudieron marcar como leídas', 'error');
      return;
    }
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    showToast('Todas marcadas como leídas', 'success');
  };

  const handleMarkRead = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.read) return;
    const res = await notificationsApi.markNotificationRead(id);
    if (!res.success) {
      showToast(res.message || 'No se pudo marcar como leída', 'error');
      return;
    }
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const filtered = notifications.filter((n) => {
    if (categoryFilter !== 'todas' && n.category !== categoryFilter) return false;
    if (showUnread && n.read) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        (n.alumno && n.alumno.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <MainLayout>
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground-900">Notificaciones</h1>
          <p className="text-xs text-foreground-500 mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} sin leer de ${notifications.length} notificaciones`
              : 'Todas las notificaciones leídas'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => void handleMarkAllRead()} icon="ri-check-double-line">
              Marcar todas leídas
            </Button>
          )}
        </div>
      </div>

      <Card padding="sm" className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1 w-full sm:w-auto">
          <Input
            placeholder="Buscar notificaciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon="ri-search-line"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={notificationCategories}
            className="w-full sm:w-36"
          />
          <button
            type="button"
            onClick={() => setShowUnread(!showUnread)}
            className={`flex items-center gap-1.5 h-9 px-3 rounded-md text-xs font-medium border transition-all duration-150 cursor-pointer whitespace-nowrap ${
              showUnread
                ? 'bg-primary-50 text-primary-700 border-primary-300'
                : 'bg-background-50 text-foreground-500 border-secondary-200 hover:bg-background-100'
            }`}
          >
            <i className={`${showUnread ? 'ri-filter-fill' : 'ri-filter-line'} text-sm`} />
            <span className="hidden sm:inline">No leídas</span>
          </button>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon="ri-notification-off-line"
          title="Sin notificaciones"
          description={
            showUnread
              ? 'No tienes notificaciones sin leer.'
              : 'No se encontraron notificaciones con esos filtros.'
          }
        />
      ) : (
        <div className="space-y-1">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`group flex items-start gap-3 rounded-lg border transition-all duration-150 cursor-pointer ${
                n.read
                  ? 'bg-background-50 border-secondary-100 hover:border-secondary-200 hover:bg-background-100'
                  : 'bg-primary-50/50 border-primary-200 hover:border-primary-300'
              }`}
              onClick={() => void handleMarkRead(n.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') void handleMarkRead(n.id);
              }}
              aria-label={`${n.read ? '' : 'No leída: '}${n.title}`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0 p-3">
                <div className="relative flex-shrink-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${n.color}18` }}
                  >
                    <i className={n.icon} style={{ color: n.color, fontSize: '1rem' }} />
                  </div>
                  {!n.read && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary-500 border-2 border-background-50" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className={`text-sm ${n.read ? 'text-foreground-700' : 'text-foreground-900 font-semibold'}`}
                      >
                        {n.title}
                      </p>
                      <p className="text-xs text-foreground-500 mt-0.5 line-clamp-2 whitespace-normal">
                        {n.description}
                      </p>
                      {n.monto && (
                        <span className="inline-block mt-1.5 text-2xs font-mono font-medium text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                          {n.monto}
                        </span>
                      )}
                      {n.alumnos && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {n.alumnos.map((a) => (
                            <span
                              key={a}
                              className="text-2xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span
                        className={`text-3xs px-1.5 py-0.5 rounded-full border whitespace-nowrap ${categoryColorMap[n.category] || categoryColorMap.general}`}
                      >
                        {n.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-2xs text-foreground-400 flex items-center gap-1">
                      <i className="ri-time-line text-3xs" />
                      {n.time}
                    </span>
                    {n.linkUrl && (
                      <a
                        href={n.linkUrl}
                        onClick={(e) => e.stopPropagation()}
                        className="text-2xs text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap"
                      >
                        Abrir
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </MainLayout>
  );
}
