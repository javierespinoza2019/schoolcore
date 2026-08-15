import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '@/hooks/useSidebar';
import { useAuth } from '@/auth/AuthContext';
import { usePermissions } from '@/permissions/PermissionContext';
import { ViewCodes } from '@/permissions/viewCodes';
import type { FeatureFlagId } from '@/config/features';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import { env } from '@/config/env';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: string;
  badgeVariant?: 'primary' | 'accent' | 'warning';
  children?: NavItem[];
  featureFlag?: FeatureFlagId;
  viewCode?: string;
}

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: 'Principal',
    items: [
      { label: 'Dashboard', path: '/', icon: 'ri-dashboard-line', viewCode: ViewCodes.DASHBOARD },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { label: 'Alumnos', path: '/alumnos', icon: 'ri-user-star-line', viewCode: ViewCodes.STUDENTS },
      { label: 'Padres', path: '/padres', icon: 'ri-user-heart-line', viewCode: ViewCodes.PARENTS },
      { label: 'Profesores', path: '/profesores', icon: 'ri-user-voice-line', viewCode: ViewCodes.TEACHERS },
      { label: 'Salones', path: '/salones', icon: 'ri-building-2-line', viewCode: ViewCodes.CLASSROOMS },
      { label: 'Sucursales', path: '/sucursales', icon: 'ri-store-2-line', viewCode: ViewCodes.BRANCHES },
    ],
  },
  {
    label: 'Procesos',
    items: [
      { label: 'Inscripciones', path: '/inscripciones', icon: 'ri-file-list-3-line', viewCode: ViewCodes.ENROLLMENTS },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      { label: 'Finanzas', path: '/finanzas', icon: 'ri-money-dollar-circle-line', viewCode: ViewCodes.FINANCE },
      { label: 'Caja', path: '/caja', icon: 'ri-money-dollar-box-line', viewCode: ViewCodes.CASH },
    ],
  },
  {
    label: 'Análisis',
    items: [
      { label: 'Reportes', path: '/reportes', icon: 'ri-bar-chart-2-line', viewCode: ViewCodes.REPORTS },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { label: 'Notificaciones', path: '/notificaciones', icon: 'ri-notification-3-line', viewCode: ViewCodes.NOTIFICATIONS },
      {
        label: 'Asistente IA',
        path: '/asistente-ia',
        icon: 'ri-robot-2-line',
        featureFlag: 'aiAssistant',
        viewCode: ViewCodes.AI_ASSISTANT,
      },
      { label: 'Configuración', path: '/configuracion', icon: 'ri-settings-3-line', viewCode: ViewCodes.SETTINGS },
    ],
  },
];

function initialsFromUser(firstName?: string, lastName?: string, email?: string): string {
  const a = firstName?.trim()?.[0];
  const b = lastName?.trim()?.[0];
  if (a && b) return `${a}${b}`.toUpperCase();
  if (a) return a.toUpperCase();
  return (email?.trim()?.[0] || '?').toUpperCase();
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const { user } = useAuth();
  const { can, usingRealPermissions, isLoadingPermissions } = usePermissions();
  const { isEnabled } = useFeatureFlags();

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.featureFlag && !isEnabled(item.featureFlag)) return false;
        if (!item.viewCode) return true;
        // Mientras cargan permisos reales, no ocultar (evita flash vacío).
        if (isLoadingPermissions) return true;
        if (!usingRealPermissions) return true;
        return can(item.viewCode, 'view');
      }),
    }))
    .filter((section) => section.items.length > 0);

  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.email
    : 'Usuario';
  const displayRole = user?.roles?.[0] || 'Staff';
  const initials = initialsFromUser(user?.firstName, user?.lastName, user?.email);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 h-14 border-b border-secondary-200/70`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-7 h-7 rounded-md bg-primary-500 flex items-center justify-center">
              <i className="ri-graduation-cap-fill text-white text-sm" />
            </div>
            <span className="text-sm font-semibold text-foreground-900 tracking-tight">{env.appName}</span>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-md bg-primary-500 flex items-center justify-center cursor-pointer" onClick={() => navigate('/')}>
            <i className="ri-graduation-cap-fill text-white text-sm" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="hidden lg:flex w-6 h-6 items-center justify-center rounded text-foreground-400 hover:text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer"
          >
            <i className="ri-layout-left-line text-sm" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5" aria-label="Navegación principal">
        {visibleSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="px-3 mb-1 text-3xs font-semibold text-foreground-400 uppercase tracking-wider">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMobileOpen(false); }}
                  className={`w-full flex items-center gap-3 rounded-md transition-all duration-150 cursor-pointer whitespace-nowrap group ${
                    collapsed ? 'justify-center px-0 py-2' : 'px-3 py-2'
                  } ${
                    isActive(item.path)
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-foreground-600 hover:bg-background-100 hover:text-foreground-800'
                  }`}
                  title={collapsed ? item.label : undefined}
                  aria-current={isActive(item.path) ? 'page' : undefined}
                >
                  <div className={`w-5 h-5 flex items-center justify-center flex-shrink-0 ${collapsed ? 'text-base' : ''}`}>
                    <i className={`${item.icon} ${collapsed ? 'text-lg' : 'text-base'}`} />
                  </div>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left text-sm">{item.label}</span>
                      {item.badge && (
                        <span className={`text-3xs px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${
                          item.badgeVariant === 'warning' ? 'bg-amber-100 text-amber-700' :
                          item.badgeVariant === 'accent' ? 'bg-accent-100 text-accent-700' :
                          'bg-secondary-150 text-secondary-600'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="px-3 py-3 border-t border-secondary-200/70">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-secondary-50">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary-600">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground-800 truncate">{displayName}</p>
              <p className="text-3xs text-foreground-500 truncate">{displayRole}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside
        className={`hidden lg:flex flex-col h-screen fixed left-0 top-0 z-30 bg-background-50 border-r border-secondary-200/70 transition-all duration-300 ${
          collapsed ? 'w-[64px]' : 'w-[240px]'
        }`}
      >
        {sidebarContent}
      </aside>

      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="hidden lg:flex fixed left-[64px] top-3 z-40 w-6 h-6 items-center justify-center rounded-full bg-background-50 border border-secondary-200 shadow-sm text-foreground-400 hover:text-foreground-600 transition-all cursor-pointer"
        >
          <i className="ri-arrow-right-s-line text-xs" />
        </button>
      )}

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-[260px] bg-background-50 border-r border-secondary-200/70 z-50 animate-slide-in">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}