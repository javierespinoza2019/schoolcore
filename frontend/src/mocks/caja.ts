export interface CorteCaja {
  id: string;
  fecha: string;
  turno: 'matutino' | 'vespertino';
  usuario: string;
  montoInicial: number;
  totalIngresos: number;
  totalEgresos: number;
  montoFinal: number;
  diferencia: number;
  estado: 'abierto' | 'cerrado' | 'conciliado';
  transacciones: number;
}

export interface MovimientoCaja {
  id: string;
  corteId: string;
  hora: string;
  tipo: 'ingreso' | 'egreso';
  categoria: string;
  concepto: string;
  monto: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia' | 'cheque';
  referencia?: string;
  alumno?: string;
  usuario: string;
}

export interface ArqueoCaja {
  id: string;
  corteId: string;
  fecha: string;
  usuario: string;
  billetes: { denominacion: number; cantidad: number }[];
  monedas: { denominacion: number; cantidad: number }[];
  totalEfectivo: number;
  totalTarjeta: number;
  totalTransferencia: number;
  totalCheque: number;
  totalSistema: number;
  diferencia: number;
  observaciones?: string;
}

export const cortesCaja: CorteCaja[] = [
  { id: 'c1', fecha: '2026-07-01', turno: 'matutino', usuario: 'María García', montoInicial: 2000, totalIngresos: 4500, totalEgresos: 500, montoFinal: 6000, diferencia: 0, estado: 'cerrado', transacciones: 2 },
  { id: 'c2', fecha: '2026-07-03', turno: 'matutino', usuario: 'María García', montoInicial: 2000, totalIngresos: 3825, totalEgresos: 350, montoFinal: 5475, diferencia: 0, estado: 'cerrado', transacciones: 2 },
  { id: 'c3', fecha: '2026-06-01', turno: 'matutino', usuario: 'María García', montoInicial: 2000, totalIngresos: 4500, totalEgresos: 300, montoFinal: 6200, diferencia: 0, estado: 'cerrado', transacciones: 2 },
  { id: 'c4', fecha: '2026-06-02', turno: 'matutino', usuario: 'María García', montoInicial: 2000, totalIngresos: 3825, totalEgresos: 200, montoFinal: 5625, diferencia: 0, estado: 'cerrado', transacciones: 2 },
  { id: 'c5', fecha: '2026-07-30', turno: 'matutino', usuario: 'María García', montoInicial: 2000, totalIngresos: 0, totalEgresos: 850, montoFinal: 0, diferencia: 0, estado: 'abierto', transacciones: 2 },
];

export const movimientosCaja: MovimientoCaja[] = [
  { id: 'm1', corteId: 'c1', hora: '08:15', tipo: 'ingreso', categoria: 'Colegiatura', concepto: 'Colegiatura Julio 2026 - Carlos Ruiz Mendoza', monto: 4500, metodoPago: 'transferencia', referencia: 'TRANS-71001', alumno: 'Carlos Ruiz Mendoza', usuario: 'María García' },
  { id: 'm2', corteId: 'c1', hora: '09:30', tipo: 'egreso', categoria: 'Gastos Operativos', concepto: 'Papelería Administrativa', monto: 500, metodoPago: 'efectivo', usuario: 'María García' },
  { id: 'm3', corteId: 'c2', hora: '08:45', tipo: 'ingreso', categoria: 'Colegiatura', concepto: 'Colegiatura Julio 2026 - Sofía Torres Hernández (Beca 15%)', monto: 3825, metodoPago: 'tarjeta', referencia: 'TERM-73001', alumno: 'Sofía Torres Hernández', usuario: 'María García' },
  { id: 'm4', corteId: 'c2', hora: '11:00', tipo: 'egreso', categoria: 'Servicios', concepto: 'Pago Servicio Limpieza', monto: 350, metodoPago: 'efectivo', usuario: 'María García' },
  { id: 'm5', corteId: 'c3', hora: '08:10', tipo: 'ingreso', categoria: 'Colegiatura', concepto: 'Colegiatura Junio 2026 - Carlos Ruiz Mendoza', monto: 4500, metodoPago: 'tarjeta', referencia: 'TERM-60101', alumno: 'Carlos Ruiz Mendoza', usuario: 'María García' },
  { id: 'm6', corteId: 'c3', hora: '10:00', tipo: 'egreso', categoria: 'Gastos Operativos', concepto: 'Material Didáctico', monto: 300, metodoPago: 'efectivo', usuario: 'María García' },
  { id: 'm7', corteId: 'c4', hora: '08:30', tipo: 'ingreso', categoria: 'Colegiatura', concepto: 'Colegiatura Junio 2026 - Sofía Torres Hernández (Beca 15%)', monto: 3825, metodoPago: 'tarjeta', referencia: 'TERM-60201', alumno: 'Sofía Torres Hernández', usuario: 'María García' },
  { id: 'm8', corteId: 'c4', hora: '09:15', tipo: 'egreso', categoria: 'Servicios', concepto: 'Recarga Extintores', monto: 200, metodoPago: 'efectivo', usuario: 'María García' },
  { id: 'm9', corteId: 'c5', hora: '09:00', tipo: 'egreso', categoria: 'Gastos Operativos', concepto: 'Compra de material de limpieza', monto: 450, metodoPago: 'efectivo', usuario: 'María García' },
  { id: 'm10', corteId: 'c5', hora: '10:30', tipo: 'egreso', categoria: 'Servicios', concepto: 'Mantenimiento de aires acondicionados', monto: 400, metodoPago: 'transferencia', referencia: 'TRANS-73002', usuario: 'María García' },
];

export const arqueosCaja: ArqueoCaja[] = [
  {
    id: 'a1', corteId: 'c1', fecha: '2026-07-01', usuario: 'María García',
    billetes: [
      { denominacion: 500, cantidad: 8 }, { denominacion: 200, cantidad: 10 },
      { denominacion: 100, cantidad: 5 }, { denominacion: 50, cantidad: 4 },
      { denominacion: 20, cantidad: 10 },
    ],
    monedas: [
      { denominacion: 10, cantidad: 20 }, { denominacion: 5, cantidad: 10 },
      { denominacion: 2, cantidad: 15 }, { denominacion: 1, cantidad: 10 },
    ],
    totalEfectivo: 4500, totalTarjeta: 0, totalTransferencia: 4500, totalCheque: 0,
    totalSistema: 6000, diferencia: 0, observaciones: 'Corte sin novedades',
  },
  {
    id: 'a2', corteId: 'c2', fecha: '2026-07-03', usuario: 'María García',
    billetes: [
      { denominacion: 500, cantidad: 4 }, { denominacion: 200, cantidad: 8 },
      { denominacion: 100, cantidad: 6 }, { denominacion: 50, cantidad: 3 },
      { denominacion: 20, cantidad: 8 },
    ],
    monedas: [
      { denominacion: 10, cantidad: 15 }, { denominacion: 5, cantidad: 8 },
      { denominacion: 2, cantidad: 10 }, { denominacion: 1, cantidad: 12 },
    ],
    totalEfectivo: 3475, totalTarjeta: 3825, totalTransferencia: 0, totalCheque: 0,
    totalSistema: 5475, diferencia: 0,
  },
];

export const resumenCajaHoy = {
  fecha: '2026-07-30',
  corteAbierto: 'María García',
  turno: 'Matutino',
  montoInicial: 2000,
  ingresosHoy: 0,
  egresosHoy: 850,
  transaccionesHoy: 2,
  efectivo: 0,
  tarjeta: 0,
  transferencia: 0,
  cheque: 0,
};