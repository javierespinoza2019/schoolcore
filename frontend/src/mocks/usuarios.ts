export interface UsuarioSistema {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  rolId: string;
  activo: boolean;
  ultimoAcceso: string;
  telefono: string;
  sucursal: string;
  avatar: string | null;
  fechaCreacion: string;
}

export const usuariosSistema: UsuarioSistema[] = [
  { id: 'usr-1', nombre: 'Ricardo Mendoza', email: 'ricardo.mendoza@SchoolCore.io', rol: 'Super Admin', rolId: 'rol-1', activo: true, ultimoAcceso: '2026-08-04T09:15:00', telefono: '+52 55 1111 2233', sucursal: 'Campus Norte', avatar: null, fechaCreacion: '2023-01-10' },
  { id: 'usr-2', nombre: 'Lucía Fernández', email: 'lucia.fernandez@SchoolCore.io', rol: 'Super Admin', rolId: 'rol-1', activo: true, ultimoAcceso: '2026-08-03T18:30:00', telefono: '+52 55 2222 3344', sucursal: 'Campus Sur', avatar: null, fechaCreacion: '2023-01-10' },
  { id: 'usr-3', nombre: 'Carlos Ortega', email: 'carlos.ortega@SchoolCore.io', rol: 'Director', rolId: 'rol-2', activo: true, ultimoAcceso: '2026-08-04T08:00:00', telefono: '+52 55 3333 4455', sucursal: 'Campus Norte', avatar: null, fechaCreacion: '2023-02-15' },
  { id: 'usr-4', nombre: 'María Elena Gómez', email: 'maria.gomez@SchoolCore.io', rol: 'Director', rolId: 'rol-2', activo: true, ultimoAcceso: '2026-08-04T07:45:00', telefono: '+52 55 4444 5566', sucursal: 'Campus Sur', avatar: null, fechaCreacion: '2023-03-01' },
  { id: 'usr-5', nombre: 'Alejandra Silva', email: 'alejandra.silva@SchoolCore.io', rol: 'Director', rolId: 'rol-2', activo: true, ultimoAcceso: '2026-08-02T16:20:00', telefono: '+52 55 5555 6677', sucursal: 'Campus Oriente', avatar: null, fechaCreacion: '2024-01-05' },
  { id: 'usr-6', nombre: 'Javier Núñez', email: 'javier.nunez@SchoolCore.io', rol: 'Coordinador', rolId: 'rol-3', activo: true, ultimoAcceso: '2026-08-04T10:30:00', telefono: '+52 55 6666 7788', sucursal: 'Campus Norte', avatar: null, fechaCreacion: '2023-06-20' },
  { id: 'usr-7', nombre: 'Patricia Vega', email: 'patricia.vega@SchoolCore.io', rol: 'Coordinador', rolId: 'rol-3', activo: true, ultimoAcceso: '2026-08-03T14:00:00', telefono: '+52 55 7777 8899', sucursal: 'Campus Sur', avatar: null, fechaCreacion: '2023-08-12' },
  { id: 'usr-8', nombre: 'Daniel Rojas', email: 'daniel.rojas@SchoolCore.io', rol: 'Coordinador', rolId: 'rol-3', activo: false, ultimoAcceso: '2026-06-15T11:00:00', telefono: '+52 55 8888 9900', sucursal: 'Campus Oriente', avatar: null, fechaCreacion: '2024-03-18' },
  { id: 'usr-9', nombre: 'Fernanda López', email: 'fernanda.lopez@SchoolCore.io', rol: 'Cajero', rolId: 'rol-4', activo: true, ultimoAcceso: '2026-08-04T09:00:00', telefono: '+52 55 9999 0011', sucursal: 'Campus Norte', avatar: null, fechaCreacion: '2023-09-01' },
  { id: 'usr-10', nombre: 'Roberto Castillo', email: 'roberto.castillo@SchoolCore.io', rol: 'Cajero', rolId: 'rol-4', activo: true, ultimoAcceso: '2026-08-03T17:45:00', telefono: '+52 55 1010 1122', sucursal: 'Campus Sur', avatar: null, fechaCreacion: '2024-02-10' },
  { id: 'usr-11', nombre: 'Gabriela Torres', email: 'gabriela.torres@SchoolCore.io', rol: 'Cajero', rolId: 'rol-4', activo: true, ultimoAcceso: '2026-07-30T13:15:00', telefono: '+52 55 2020 2233', sucursal: 'Campus Oriente', avatar: null, fechaCreacion: '2024-05-22' },
  { id: 'usr-12', nombre: 'Miguel Ángel Herrera', email: 'miguel.herrera@SchoolCore.io', rol: 'Profesor', rolId: 'rol-5', activo: true, ultimoAcceso: '2026-08-04T07:00:00', telefono: '+52 55 3030 3344', sucursal: 'Campus Norte', avatar: null, fechaCreacion: '2023-05-08' },
  { id: 'usr-13', nombre: 'Diana Guerrero', email: 'diana.guerrero@SchoolCore.io', rol: 'Profesor', rolId: 'rol-5', activo: false, ultimoAcceso: '2026-05-20T09:00:00', telefono: '+52 55 4040 4455', sucursal: 'Campus Sur', avatar: null, fechaCreacion: '2024-04-15' },
];

export const modulosPermisos = [
  { id: 'mod-dash', nombre: 'Dashboard', descripcion: 'Acceso al panel principal con KPIs y gráficas' },
  { id: 'mod-alum', nombre: 'Alumnos', descripcion: 'Gestión de alumnos, expedientes, documentos y pagos' },
  { id: 'mod-padr', nombre: 'Padres / Tutores', descripcion: 'Gestión de padres, tutores y vinculación con alumnos' },
  { id: 'mod-prof', nombre: 'Profesores', descripcion: 'Gestión de profesores, horarios y asignaciones' },
  { id: 'mod-saln', nombre: 'Salones', descripcion: 'Gestión de salones, capacidad y asignación' },
  { id: 'mod-sucu', nombre: 'Sucursales', descripcion: 'Gestión de sucursales y edificios' },
  { id: 'mod-insc', nombre: 'Inscripciones', descripcion: 'Proceso de inscripción de nuevos alumnos' },
  { id: 'mod-fina', nombre: 'Finanzas', descripcion: 'Control financiero, estado de cuenta y facturación' },
  { id: 'mod-caja', nombre: 'Caja', descripcion: 'Módulo de caja, cobros y cortes de caja' },
  { id: 'mod-repo', nombre: 'Reportes', descripcion: 'Generación y exportación de reportes' },
  { id: 'mod-noti', nombre: 'Notificaciones', descripcion: 'Gestión de avisos, recordatorios y comunicados' },
  { id: 'mod-conf', nombre: 'Configuración', descripcion: 'Acceso a configuración general del sistema' },
];

export const permisosPorRol: Record<string, string[]> = {
  'rol-1': ['mod-dash','mod-alum','mod-padr','mod-prof','mod-saln','mod-sucu','mod-insc','mod-fina','mod-caja','mod-repo','mod-noti','mod-conf'],
  'rol-2': ['mod-dash','mod-alum','mod-padr','mod-prof','mod-saln','mod-sucu','mod-insc','mod-fina','mod-caja','mod-repo','mod-noti'],
  'rol-3': ['mod-dash','mod-alum','mod-padr','mod-prof','mod-saln','mod-insc','mod-noti'],
  'rol-4': ['mod-dash','mod-alum','mod-fina','mod-caja','mod-noti'],
  'rol-5': ['mod-dash','mod-alum','mod-prof','mod-saln','mod-noti'],
};