export interface PagoConcepto {
  id: string;
  alumnoId: string;
  alumnoNombre: string;
  concepto: string;
  tipo: 'colegiatura' | 'inscripcion' | 'reinscripcion' | 'uniforme' | 'libros' | 'utiles' | 'comedor' | 'transporte' | 'taller' | 'otro';
  monto: number;
  fechaVencimiento: string;
  estado: 'pagado' | 'pendiente' | 'vencido' | 'anulado';
  montoPagado: number;
  fechaPago?: string;
  folio?: string;
  metodoPago?: string;
  /** posted | voided (API payment status) */
  paymentStatus?: string;
  voidReason?: string;
}

export interface IngresoEgreso {
  mes: string;
  ingresos: number;
  egresos: number;
  meta: number;
}

export interface EstadoCuenta {
  alumnoId: string;
  alumnoNombre: string;
  saldoPendiente: number;
  totalPagado: number;
  conceptos: PagoConcepto[];
}

export interface EgresoItem {
  id: string;
  concepto: string;
  categoria: string;
  monto: number;
  fecha: string;
  proveedor: string;
  comprobante?: string;
}

export const egresosRecientes: EgresoItem[] = [
  { id: 'egr-1', concepto: 'Nómina administrativa Julio', categoria: 'Nómina', monto: 2800, fecha: '2026-07-31', proveedor: 'Staff Interno' },
  { id: 'egr-2', concepto: 'Servicio de internet Julio', categoria: 'Servicios', monto: 650, fecha: '2026-07-28', proveedor: 'TelNor' },
  { id: 'egr-3', concepto: 'Electricidad Julio', categoria: 'Servicios', monto: 520, fecha: '2026-07-25', proveedor: 'CFE' },
  { id: 'egr-4', concepto: 'Papelería y material didáctico', categoria: 'Materiales', monto: 350, fecha: '2026-07-20', proveedor: 'OfficeDepot' },
  { id: 'egr-5', concepto: 'Nómina administrativa Junio', categoria: 'Nómina', monto: 2800, fecha: '2026-06-30', proveedor: 'Staff Interno' },
  { id: 'egr-6', concepto: 'Mantenimiento aires acondicionados', categoria: 'Mantenimiento', monto: 480, fecha: '2026-06-15', proveedor: 'ClimaControl' },
];

export const categoriasEgreso = ['Nómina', 'Servicios', 'Materiales', 'Mantenimiento'];

// 3 alumnos: Carlos (0 deuda), Sofía (0 deuda, 15% beca), Diego (2 meses vencidos: jun + jul)
// Colegiaturas: Carlos $4,500, Sofía $3,825 (beca 15%), Diego $4,500
// Datos realistas para un colegio pequeño de 3 estudiantes

export const ingresosEgresos: IngresoEgreso[] = [
  { mes: 'Ene', ingresos: 10830, egresos: 3200, meta: 12825 },
  { mes: 'Feb', ingresos: 12825, egresos: 3150, meta: 12825 },
  { mes: 'Mar', ingresos: 12825, egresos: 3400, meta: 12825 },
  { mes: 'Abr', ingresos: 12825, egresos: 3250, meta: 12825 },
  { mes: 'May', ingresos: 12825, egresos: 3500, meta: 12825 },
  { mes: 'Jun', ingresos: 8325, egresos: 3450, meta: 12825 },
  { mes: 'Jul', ingresos: 8325, egresos: 4370, meta: 12825 },
];

export const ingresosPorConcepto = [
  { concepto: 'Colegiaturas', monto: 8325, porcentaje: 65, color: 'bg-primary-500' },
  { concepto: 'Inscripciones', monto: 0, porcentaje: 0, color: 'bg-accent-500' },
  { concepto: 'Libros y Útiles', monto: 2200, porcentaje: 17, color: 'bg-amber-500' },
  { concepto: 'Uniformes', monto: 0, porcentaje: 0, color: 'bg-emerald-500' },
  { concepto: 'Comedor', monto: 0, porcentaje: 0, color: 'bg-sky-500' },
  { concepto: 'Talleres', monto: 0, porcentaje: 0, color: 'bg-violet-500' },
  { concepto: 'Transporte', monto: 0, porcentaje: 0, color: 'bg-rose-500' },
];

export const pagosRecientes: PagoConcepto[] = [
  { id: 'p1', alumnoId: 'STU-2024-0001', alumnoNombre: 'Carlos Ruiz', concepto: 'Colegiatura Julio 2026', tipo: 'colegiatura', monto: 4500, fechaVencimiento: '2026-07-05', estado: 'pagado', montoPagado: 4500, fechaPago: '2026-07-01', folio: 'FOL-071', metodoPago: 'Transferencia' },
  { id: 'p2', alumnoId: 'STU-2024-0002', alumnoNombre: 'Sofía Torres', concepto: 'Colegiatura Julio 2026', tipo: 'colegiatura', monto: 3825, fechaVencimiento: '2026-07-05', estado: 'pagado', montoPagado: 3825, fechaPago: '2026-07-03', folio: 'FOL-072', metodoPago: 'Tarjeta' },
  { id: 'p3', alumnoId: 'STU-2024-0003', alumnoNombre: 'Diego López', concepto: 'Colegiatura Julio 2026', tipo: 'colegiatura', monto: 4500, fechaVencimiento: '2026-07-05', estado: 'vencido', montoPagado: 0 },
  { id: 'p4', alumnoId: 'STU-2024-0003', alumnoNombre: 'Diego López', concepto: 'Colegiatura Junio 2026', tipo: 'colegiatura', monto: 4500, fechaVencimiento: '2026-06-05', estado: 'vencido', montoPagado: 0 },
  { id: 'p5', alumnoId: 'STU-2024-0001', alumnoNombre: 'Carlos Ruiz', concepto: 'Colegiatura Junio 2026', tipo: 'colegiatura', monto: 4500, fechaVencimiento: '2026-06-05', estado: 'pagado', montoPagado: 4500, fechaPago: '2026-06-01', folio: 'FOL-065', metodoPago: 'Tarjeta' },
  { id: 'p6', alumnoId: 'STU-2024-0002', alumnoNombre: 'Sofía Torres', concepto: 'Colegiatura Junio 2026', tipo: 'colegiatura', monto: 3825, fechaVencimiento: '2026-06-05', estado: 'pagado', montoPagado: 3825, fechaPago: '2026-06-02', folio: 'FOL-066', metodoPago: 'Tarjeta' },
  { id: 'p7', alumnoId: 'STU-2024-0003', alumnoNombre: 'Diego López', concepto: 'Colegiatura Mayo 2026', tipo: 'colegiatura', monto: 4500, fechaVencimiento: '2026-05-05', estado: 'pagado', montoPagado: 4500, fechaPago: '2026-05-05', folio: 'FOL-059', metodoPago: 'Efectivo' },
  { id: 'p8', alumnoId: 'STU-2024-0001', alumnoNombre: 'Carlos Ruiz', concepto: 'Colegiatura Mayo 2026', tipo: 'colegiatura', monto: 4500, fechaVencimiento: '2026-05-05', estado: 'pagado', montoPagado: 4500, fechaPago: '2026-05-01', folio: 'FOL-058', metodoPago: 'Efectivo' },
  { id: 'p9', alumnoId: 'STU-2024-0001', alumnoNombre: 'Carlos Ruiz', concepto: 'Inscripción 2026', tipo: 'inscripcion', monto: 3800, fechaVencimiento: '2026-01-15', estado: 'pagado', montoPagado: 3800, fechaPago: '2026-01-10', folio: 'FOL-001', metodoPago: 'Transferencia' },
  { id: 'p10', alumnoId: 'STU-2024-0002', alumnoNombre: 'Sofía Torres', concepto: 'Inscripción 2026', tipo: 'inscripcion', monto: 3230, fechaVencimiento: '2026-01-15', estado: 'pagado', montoPagado: 3230, fechaPago: '2026-01-12', folio: 'FOL-003', metodoPago: 'Transferencia' },
  { id: 'p11', alumnoId: 'STU-2024-0003', alumnoNombre: 'Diego López', concepto: 'Inscripción 2026', tipo: 'inscripcion', monto: 3800, fechaVencimiento: '2026-01-15', estado: 'pagado', montoPagado: 3800, fechaPago: '2026-01-08', folio: 'FOL-004', metodoPago: 'Transferencia' },
  { id: 'p12', alumnoId: 'STU-2024-0001', alumnoNombre: 'Carlos Ruiz', concepto: 'Libros Semestre 2026-B', tipo: 'libros', monto: 2200, fechaVencimiento: '2026-01-20', estado: 'pagado', montoPagado: 2200, fechaPago: '2026-01-15', folio: 'FOL-002', metodoPago: 'Tarjeta' },
];

export const conceptosAgrupados = {
  colegiatura: { total: 8325, cantidad: 3, pendientes: 0, vencidos: 2 },
  inscripcion: { total: 10830, cantidad: 3, pendientes: 0, vencidos: 0 },
  reinscripcion: { total: 0, cantidad: 0, pendientes: 0, vencidos: 0 },
  uniforme: { total: 0, cantidad: 0, pendientes: 0, vencidos: 0 },
  libros: { total: 2200, cantidad: 1, pendientes: 0, vencidos: 0 },
  utiles: { total: 0, cantidad: 0, pendientes: 0, vencidos: 0 },
  comedor: { total: 0, cantidad: 0, pendientes: 0, vencidos: 0 },
  transporte: { total: 0, cantidad: 0, pendientes: 0, vencidos: 0 },
  taller: { total: 0, cantidad: 0, pendientes: 0, vencidos: 0 },
};

export const resumenFinanciero = {
  ingresosMes: 8325,
  ingresosMesAnterior: 8325,
  egresosMes: 4370,
  egresosMesAnterior: 3450,
  saldoPendiente: 9000,
  saldoVencido: 9000,
  pagosHoy: 2,
  montoHoy: 8325,
  tasaMoratoria: 5,
  alumnosConAdeudo: 1,
  totalAlumnos: 3,
};

// Estado de cuenta por alumno (se genera dinámicamente)
export const estadoCuentaPorAlumno: Record<string, EstadoCuenta> = {
  'STU-2024-0001': {
    alumnoId: 'STU-2024-0001',
    alumnoNombre: 'Carlos Ruiz Mendoza',
    saldoPendiente: 0,
    totalPagado: 19500,
    conceptos: [
      { id: 'ec1-1', alumnoId: 'STU-2024-0001', alumnoNombre: 'Carlos Ruiz', concepto: 'Colegiatura Julio 2026', tipo: 'colegiatura', monto: 4500, fechaVencimiento: '2026-07-05', estado: 'pagado', montoPagado: 4500, fechaPago: '2026-07-01', folio: 'FOL-071', metodoPago: 'Transferencia' },
      { id: 'ec1-2', alumnoId: 'STU-2024-0001', alumnoNombre: 'Carlos Ruiz', concepto: 'Colegiatura Junio 2026', tipo: 'colegiatura', monto: 4500, fechaVencimiento: '2026-06-05', estado: 'pagado', montoPagado: 4500, fechaPago: '2026-06-01', folio: 'FOL-065', metodoPago: 'Tarjeta' },
      { id: 'ec1-3', alumnoId: 'STU-2024-0001', alumnoNombre: 'Carlos Ruiz', concepto: 'Colegiatura Mayo 2026', tipo: 'colegiatura', monto: 4500, fechaVencimiento: '2026-05-05', estado: 'pagado', montoPagado: 4500, fechaPago: '2026-05-01', folio: 'FOL-058', metodoPago: 'Efectivo' },
      { id: 'ec1-4', alumnoId: 'STU-2024-0001', alumnoNombre: 'Carlos Ruiz', concepto: 'Inscripción 2026', tipo: 'inscripcion', monto: 3800, fechaVencimiento: '2026-01-15', estado: 'pagado', montoPagado: 3800, fechaPago: '2026-01-10', folio: 'FOL-001', metodoPago: 'Transferencia' },
      { id: 'ec1-5', alumnoId: 'STU-2024-0001', alumnoNombre: 'Carlos Ruiz', concepto: 'Libros Semestre 2026-B', tipo: 'libros', monto: 2200, fechaVencimiento: '2026-01-20', estado: 'pagado', montoPagado: 2200, fechaPago: '2026-01-15', folio: 'FOL-002', metodoPago: 'Tarjeta' },
    ],
  },
  'STU-2024-0002': {
    alumnoId: 'STU-2024-0002',
    alumnoNombre: 'Sofía Torres Hernández',
    saldoPendiente: 0,
    totalPagado: 10880,
    conceptos: [
      { id: 'ec2-1', alumnoId: 'STU-2024-0002', alumnoNombre: 'Sofía Torres', concepto: 'Colegiatura Julio 2026', tipo: 'colegiatura', monto: 3825, fechaVencimiento: '2026-07-05', estado: 'pagado', montoPagado: 3825, fechaPago: '2026-07-03', folio: 'FOL-072', metodoPago: 'Tarjeta' },
      { id: 'ec2-2', alumnoId: 'STU-2024-0002', alumnoNombre: 'Sofía Torres', concepto: 'Colegiatura Junio 2026', tipo: 'colegiatura', monto: 3825, fechaVencimiento: '2026-06-05', estado: 'pagado', montoPagado: 3825, fechaPago: '2026-06-02', folio: 'FOL-066', metodoPago: 'Tarjeta' },
      { id: 'ec2-3', alumnoId: 'STU-2024-0002', alumnoNombre: 'Sofía Torres', concepto: 'Inscripción 2026', tipo: 'inscripcion', monto: 3230, fechaVencimiento: '2026-01-15', estado: 'pagado', montoPagado: 3230, fechaPago: '2026-01-12', folio: 'FOL-003', metodoPago: 'Transferencia' },
    ],
  },
  'STU-2024-0003': {
    alumnoId: 'STU-2024-0003',
    alumnoNombre: 'Diego López García',
    saldoPendiente: 9000,
    totalPagado: 8300,
    conceptos: [
      { id: 'ec3-1', alumnoId: 'STU-2024-0003', alumnoNombre: 'Diego López', concepto: 'Colegiatura Julio 2026', tipo: 'colegiatura', monto: 4500, fechaVencimiento: '2026-07-05', estado: 'vencido', montoPagado: 0 },
      { id: 'ec3-2', alumnoId: 'STU-2024-0003', alumnoNombre: 'Diego López', concepto: 'Colegiatura Junio 2026', tipo: 'colegiatura', monto: 4500, fechaVencimiento: '2026-06-05', estado: 'vencido', montoPagado: 0 },
      { id: 'ec3-3', alumnoId: 'STU-2024-0003', alumnoNombre: 'Diego López', concepto: 'Colegiatura Mayo 2026', tipo: 'colegiatura', monto: 4500, fechaVencimiento: '2026-05-05', estado: 'pagado', montoPagado: 4500, fechaPago: '2026-05-05', folio: 'FOL-059', metodoPago: 'Efectivo' },
      { id: 'ec3-4', alumnoId: 'STU-2024-0003', alumnoNombre: 'Diego López', concepto: 'Inscripción 2026', tipo: 'inscripcion', monto: 3800, fechaVencimiento: '2026-01-15', estado: 'pagado', montoPagado: 3800, fechaPago: '2026-01-08', folio: 'FOL-004', metodoPago: 'Transferencia' },
    ],
  },
};