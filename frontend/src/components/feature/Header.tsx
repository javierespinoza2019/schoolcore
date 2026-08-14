import { useSidebar } from '@/hooks/useSidebar';
import GlobalSearch from '@/components/feature/GlobalSearch';
import ThemeToggle from '@/components/feature/ThemeToggle';
import ContextSwitcher from '@/components/feature/ContextSwitcher';
import { ThemeMode } from '@/hooks/useTheme';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useSchoolContext } from '@/context/SchoolContext';
import { labelForTimeZone } from '@/lib/timeZones';

interface HeaderProps {
  theme: ThemeMode;
  onThemeChange: (t: ThemeMode) => void;
}

function initialsFromUser(firstName?: string, lastName?: string, email?: string): string {
  const a = firstName?.trim()?.[0];
  const b = lastName?.trim()?.[0];
  if (a && b) return `${a}${b}`.toUpperCase();
  if (a) return a.toUpperCase();
  return (email?.trim()?.[0] || '?').toUpperCase();
}

export default function Header({ theme, onThemeChange }: HeaderProps) {
  const { mobileOpen, setMobileOpen } = useSidebar();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { effectiveTimeZone, deviceDiffersFromBusiness, deviceTimeZone } = useSchoolContext();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.email
    : 'Usuario';
  const displayEmail = user?.email || '';
  const initials = initialsFromUser(user?.firstName, user?.lastName, user?.email);
  const tzShort = effectiveTimeZone.effectiveTimeZoneId.replace('America/', '');

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  const notifications = [
    { id: 1, icon: 'ri-error-warning-line', color: '#f59e0b', text: '3 colegiaturas vencieron hoy', time: 'Hace 10 min', read: false },
    { id: 2, icon: 'ri-user-add-line', color: '#3b82f6', text: 'Nueva inscripción: Carlos Ruiz', time: 'Hace 1 hora', read: false },
    { id: 3, icon: 'ri-money-dollar-circle-line', color: '#10b981', text: 'Pago recibido: $4,500 MXN', time: 'Hace 2 horas', read: false },
    { id: 4, icon: 'ri-calendar-check-line', color: '#8b5cf6', text: 'Recordatorio: Junta de profesores mañana', time: 'Hace 5 horas', read: true },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-14 border-b border-secondary-200/70 bg-background-50 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-md text-foreground-500 hover:bg-background-100 transition-colors cursor-pointer"
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          <i className={mobileOpen ? 'ri-close-line' : 'ri-menu-line'} />
        </button>

        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-md bg-primary-500 flex items-center justify-center lg:hidden">
            <i className="ri-graduation-cap-fill text-white text-sm" />
          </div>
        </div>

        <div className="hidden lg:block">
          <ContextSwitcher />
        </div>

        <span
          className="hidden md:inline-flex items-center gap-1 max-w-[11rem] truncate rounded-md border border-secondary-200 bg-background-100 px-2 py-1 text-3xs text-foreground-600"
          title={`${labelForTimeZone(effectiveTimeZone.effectiveTimeZoneId)} (${effectiveTimeZone.source})${
            deviceDiffersFromBusiness ? ` · Dispositivo: ${deviceTimeZone}` : ''
          }`}
        >
          <i className="ri-time-line text-foreground-400" />
          {tzShort}
          {deviceDiffersFromBusiness && (
            <i className="ri-information-line text-amber-500" title="La zona del dispositivo difiere de la de negocio" />
          )}
        </span>

        <div className="hidden sm:block">
          <GlobalSearch />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <div className="sm:hidden">
          <button className="w-9 h-9 flex items-center justify-center rounded-md text-foreground-400 hover:bg-background-100 transition-colors cursor-pointer" aria-label="Buscar">
            <i className="ri-search-line" />
          </button>
        </div>

        <div className="lg:hidden">
          <ContextSwitcher />
        </div>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative w-9 h-9 flex items-center justify-center rounded-md text-foreground-500 hover:text-foreground-800 hover:bg-background-100 transition-colors cursor-pointer"
            aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ''}`}
            aria-haspopup="true"
            aria-expanded={notifOpen}
          >
            <i className="ri-notification-3-line" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-background-50" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-background-50 border border-secondary-200 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-secondary-100">
                <p className="text-sm font-semibold text-foreground-800">Notificaciones</p>
                <span className="inline-flex items-center font-medium rounded-full whitespace-nowrap px-1.5 py-0.5 text-3xs bg-primary-100 text-primary-700">
                  {unreadCount} nuevas
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer border-b border-secondary-100/50 last:border-0 ${
                      n.read ? 'hover:bg-background-100' : 'bg-primary-50/40 hover:bg-primary-50'
                    }`}
                    onClick={() => setNotifOpen(false)}
                  >
                    <div className="relative w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${n.color}15` }}>
                      <i className={n.icon} style={{ color: n.color }} />
                      {!n.read && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary-500 border-2 border-background-50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground-800">{n.text}</p>
                      <p className="text-3xs text-foreground-400 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-secondary-100">
                <button
                  onClick={() => { setNotifOpen(false); navigate('/notificaciones'); }}
                  className="w-full text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors cursor-pointer"
                >
                  Ver todas las notificaciones
                </button>
              </div>
            </div>
          )}
        </div>

        <ThemeToggle theme={theme} onThemeChange={onThemeChange} />

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-1.5 pr-1.5 py-1 rounded-lg hover:bg-background-100 transition-colors cursor-pointer"
            aria-label="Menú de perfil"
            aria-haspopup="true"
            aria-expanded={profileOpen}
          >
            <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-2xs font-bold text-primary-600">{initials}</span>
            </div>
            <i className="ri-arrow-down-s-line text-xs text-foreground-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-background-50 border border-secondary-200 rounded-lg shadow-xl z-50 py-1 animate-fade-in">
              <div className="px-3 py-2 border-b border-secondary-100">
                <p className="text-xs font-medium text-foreground-800">{displayName}</p>
                <p className="text-3xs text-foreground-500">{displayEmail}</p>
              </div>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">
                <i className="ri-user-settings-line" /> Mi Perfil
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">
                <i className="ri-shield-check-line" /> Seguridad
              </button>
              <div className="border-t border-secondary-100 mt-1 pt-1">
                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  <i className="ri-logout-box-line" /> Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
