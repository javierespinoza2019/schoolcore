/**
 * Catálogo de ViewCodes MVP (ruta → vista).
 * Alinear con seed de permisos backend cuando esté disponible.
 */
export const ViewCodes = {
  DASHBOARD: 'dashboard',
  STUDENTS: 'students',
  PARENTS: 'parents',
  TEACHERS: 'teachers',
  CLASSROOMS: 'classrooms',
  BRANCHES: 'branches',
  ENROLLMENTS: 'enrollments',
  FINANCE: 'finance',
  CASH: 'cash',
  REPORTS: 'reports',
  NOTIFICATIONS: 'notifications',
  SETTINGS: 'settings',
  AI_ASSISTANT: 'ai_assistant',
} as const;

export type ViewCode = (typeof ViewCodes)[keyof typeof ViewCodes];

/** Mapa ruta (prefijo) → ViewCode para ProtectedRoute. */
export const ROUTE_VIEW_MAP: { path: string; view: ViewCode }[] = [
  { path: '/', view: ViewCodes.DASHBOARD },
  { path: '/alumnos', view: ViewCodes.STUDENTS },
  { path: '/padres', view: ViewCodes.PARENTS },
  { path: '/profesores', view: ViewCodes.TEACHERS },
  { path: '/salones', view: ViewCodes.CLASSROOMS },
  { path: '/sucursales', view: ViewCodes.BRANCHES },
  { path: '/inscripciones', view: ViewCodes.ENROLLMENTS },
  { path: '/finanzas', view: ViewCodes.FINANCE },
  { path: '/caja', view: ViewCodes.CASH },
  { path: '/reportes', view: ViewCodes.REPORTS },
  { path: '/notificaciones', view: ViewCodes.NOTIFICATIONS },
  { path: '/configuracion', view: ViewCodes.SETTINGS },
  { path: '/asistente-ia', view: ViewCodes.AI_ASSISTANT },
];

export function viewCodeForPath(pathname: string): ViewCode | null {
  if (pathname === '/' || pathname === '') return ViewCodes.DASHBOARD;
  const match = ROUTE_VIEW_MAP.filter((r) => r.path !== '/').find((r) =>
    pathname === r.path || pathname.startsWith(`${r.path}/`)
  );
  return match?.view ?? null;
}
