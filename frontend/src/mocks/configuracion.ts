export interface RolPermiso {
  id: string;
  nombre: string;
  usuarios: number;
  descripcion: string;
  /** Role.Code del backend (p.ej. Cashier). */
  code?: string;
}

export const configInstitucion = {
  nombre: 'SchoolCore',
  nombreCompleto: 'SchoolCore - Centro Educativo Integral',
  rfc: 'ENI201215ABC',
  telefono: '+52 55 1234 5678',
  email: 'contacto@SchoolCore.io',
  sitioWeb: 'https://SchoolCore.io',
  direccion: 'Av. Paseo de la Reforma 222, Juárez, 06600 CDMX',
  logo: null,
  timeZoneId: 'America/Mexico_City',
};

export const ciclosEscolares = [
  { id: 'ciclo-1', nombre: 'Ciclo 2026-2027', inicio: '2026-08-15', fin: '2027-07-10', activo: true },
  { id: 'ciclo-2', nombre: 'Ciclo 2025-2026', inicio: '2025-08-17', fin: '2026-07-12', activo: false },
  { id: 'ciclo-3', nombre: 'Ciclo 2024-2025', inicio: '2024-08-19', fin: '2025-07-14', activo: false },
];

export const metodosPago = [
  { id: 'met-1', nombre: 'Transferencia Bancaria', activo: true, info: 'BBVA - Cuenta: 0192837465 - CLABE: 012180001928374650' },
  { id: 'met-2', nombre: 'Efectivo en Caja', activo: true, info: 'Disponible en todas las sucursales' },
  { id: 'met-3', nombre: 'Tarjeta Débito/Crédito', activo: true, info: 'Visa, Mastercard, American Express — Comisión: 2.9%' },
  { id: 'met-4', nombre: 'Cheque', activo: true, info: 'A nombre de SchoolCore Centro Educativo Integral' },
  { id: 'met-5', nombre: 'Domiciliación', activo: false, info: 'Próximamente disponible' },
];

export interface ConceptoPagoNivel {
  nivelId: string;
  nivelNombre: string;
  monto: number;
}

export interface ConceptoPago {
  id: string;
  nombre: string;
  monto: number;
  tipo: string;
  activo: boolean;
  diferenciadoPorNivel: boolean;
  montosPorNivel: ConceptoPagoNivel[];
}

export const conceptosPago: ConceptoPago[] = [
  {
    id: 'conc-1', nombre: 'Colegiatura Mensual', monto: 4500, tipo: 'mensual', activo: true, diferenciadoPorNivel: true,
    montosPorNivel: [
      { nivelId: 'niv-1', nivelNombre: 'Preescolar', monto: 3200 },
      { nivelId: 'niv-2', nivelNombre: 'Primaria', monto: 4500 },
      { nivelId: 'niv-3', nivelNombre: 'Secundaria', monto: 5800 },
      { nivelId: 'niv-4', nivelNombre: 'Preparatoria', monto: 6500 },
      { nivelId: 'niv-5', nivelNombre: 'Universidad', monto: 7800 },
    ],
  },
  {
    id: 'conc-2', nombre: 'Inscripción Anual', monto: 8500, tipo: 'unico', activo: true, diferenciadoPorNivel: true,
    montosPorNivel: [
      { nivelId: 'niv-1', nivelNombre: 'Preescolar', monto: 5500 },
      { nivelId: 'niv-2', nivelNombre: 'Primaria', monto: 8500 },
      { nivelId: 'niv-3', nivelNombre: 'Secundaria', monto: 9200 },
      { nivelId: 'niv-4', nivelNombre: 'Preparatoria', monto: 10500 },
      { nivelId: 'niv-5', nivelNombre: 'Universidad', monto: 12000 },
    ],
  },
  {
    id: 'conc-3', nombre: 'Uniforme Escolar', monto: 2500, tipo: 'unico', activo: true, diferenciadoPorNivel: true,
    montosPorNivel: [
      { nivelId: 'niv-1', nivelNombre: 'Preescolar', monto: 1800 },
      { nivelId: 'niv-2', nivelNombre: 'Primaria', monto: 2500 },
      { nivelId: 'niv-3', nivelNombre: 'Secundaria', monto: 2800 },
      { nivelId: 'niv-4', nivelNombre: 'Preparatoria', monto: 3200 },
      { nivelId: 'niv-5', nivelNombre: 'Universidad', monto: 3200 },
    ],
  },
  {
    id: 'conc-4', nombre: 'Libros y Material', monto: 3800, tipo: 'unico', activo: true, diferenciadoPorNivel: true,
    montosPorNivel: [
      { nivelId: 'niv-1', nivelNombre: 'Preescolar', monto: 2200 },
      { nivelId: 'niv-2', nivelNombre: 'Primaria', monto: 3800 },
      { nivelId: 'niv-3', nivelNombre: 'Secundaria', monto: 4500 },
      { nivelId: 'niv-4', nivelNombre: 'Preparatoria', monto: 5200 },
      { nivelId: 'niv-5', nivelNombre: 'Universidad', monto: 6200 },
    ],
  },
  {
    id: 'conc-5', nombre: 'Comedor Escolar', monto: 1800, tipo: 'mensual', activo: true, diferenciadoPorNivel: true,
    montosPorNivel: [
      { nivelId: 'niv-1', nivelNombre: 'Preescolar', monto: 1500 },
      { nivelId: 'niv-2', nivelNombre: 'Primaria', monto: 1800 },
      { nivelId: 'niv-3', nivelNombre: 'Secundaria', monto: 2000 },
      { nivelId: 'niv-4', nivelNombre: 'Preparatoria', monto: 2200 },
      { nivelId: 'niv-5', nivelNombre: 'Universidad', monto: 2500 },
    ],
  },
  { id: 'conc-6', nombre: 'Talleres Extracurriculares', monto: 1200, tipo: 'mensual', activo: true, diferenciadoPorNivel: false, montosPorNivel: [] },
  {
    id: 'conc-7', nombre: 'Transporte Escolar', monto: 1500, tipo: 'mensual', activo: true, diferenciadoPorNivel: true,
    montosPorNivel: [
      { nivelId: 'niv-1', nivelNombre: 'Preescolar', monto: 1200 },
      { nivelId: 'niv-2', nivelNombre: 'Primaria', monto: 1500 },
      { nivelId: 'niv-3', nivelNombre: 'Secundaria', monto: 1500 },
      { nivelId: 'niv-4', nivelNombre: 'Preparatoria', monto: 1800 },
      { nivelId: 'niv-5', nivelNombre: 'Universidad', monto: 2000 },
    ],
  },
  { id: 'conc-8', nombre: 'Seguro Escolar', monto: 950, tipo: 'anual', activo: true, diferenciadoPorNivel: false, montosPorNivel: [] },
];

export const nivelesEducativos = [
  { id: 'niv-1', nombre: 'Preescolar', grados: 3, activo: true },
  { id: 'niv-2', nombre: 'Primaria', grados: 6, activo: true },
  { id: 'niv-3', nombre: 'Secundaria', grados: 3, activo: true },
  { id: 'niv-4', nombre: 'Preparatoria', grados: 6, activo: true },
  { id: 'niv-5', nombre: 'Universidad', grados: 8, activo: true },
];

export const rolesPermisos = [
  { id: 'rol-1', nombre: 'Super Admin', usuarios: 2, descripcion: 'Acceso total al sistema' },
  { id: 'rol-2', nombre: 'Director', usuarios: 5, descripcion: 'Acceso a reportes, finanzas y gestión académica' },
  { id: 'rol-3', nombre: 'Coordinador', usuarios: 12, descripcion: 'Gestión de alumnos, profesores y salones' },
  { id: 'rol-4', nombre: 'Cajero', usuarios: 8, descripcion: 'Acceso a módulo de caja y cobros' },
  { id: 'rol-5', nombre: 'Profesor', usuarios: 86, descripcion: 'Acceso a sus grupos, calificaciones y horarios' },
];

export const notificacionesSettings = [
  { id: 'not-1', nombre: 'Recordatorio de pago', descripcion: '3 días antes del vencimiento', activo: true, canal: 'email' },
  { id: 'not-2', nombre: 'Aviso de morosidad', descripcion: 'Al vencer un pago', activo: true, canal: 'email' },
  { id: 'not-3', nombre: 'Confirmación de pago', descripcion: 'Al registrar un pago', activo: true, canal: 'email' },
  { id: 'not-4', nombre: 'Nueva inscripción', descripcion: 'Al completar una inscripción', activo: true, canal: 'email' },
  { id: 'not-5', nombre: 'Cumpleaños de alumnos', descripcion: 'Recordatorio semanal', activo: false, canal: 'push' },
  { id: 'not-6', nombre: 'Junta de profesores', descripcion: '24 horas antes', activo: false, canal: 'push' },
];