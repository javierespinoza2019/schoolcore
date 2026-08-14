export const reportesKPI = {
  ingresosTotales: 4825000,
  ingresosVariacion: 8.3,
  alumnosActivos: 2432,
  alumnosVariacion: 4.1,
  morosidadTotal: 324500,
  morosidadPorcentaje: 6.7,
  morosidadVariacion: -1.2,
  nuevosInscritos: 187,
  nuevosVariacion: 12.6,
};

export const ingresosSparkline = [380, 395, 410, 420, 430, 445, 460, 470, 490, 520, 510, 482];
export const alumnosSparkline = [2180, 2210, 2245, 2270, 2300, 2320, 2345, 2370, 2390, 2405, 2420, 2432];
export const morosidadSparkline = [8.9, 8.5, 8.2, 7.9, 7.7, 7.4, 7.2, 7.0, 6.9, 6.8, 6.8, 6.7];
export const inscritosSparkline = [12, 18, 22, 15, 20, 25, 16, 19, 24, 17, 21, 187];

export const ingresosMensuales = [
  { mes: 'Ene', ingresos: 380000, egresos: 210000, meta: 400000 },
  { mes: 'Feb', ingresos: 410000, egresos: 225000, meta: 400000 },
  { mes: 'Mar', ingresos: 395000, egresos: 240000, meta: 420000 },
  { mes: 'Abr', ingresos: 430000, egresos: 218000, meta: 420000 },
  { mes: 'May', ingresos: 445000, egresos: 260000, meta: 440000 },
  { mes: 'Jun', ingresos: 470000, egresos: 235000, meta: 460000 },
  { mes: 'Jul', ingresos: 520000, egresos: 280000, meta: 500000 },
  { mes: 'Ago', ingresos: 490000, egresos: 310000, meta: 510000 },
  { mes: 'Sep', ingresos: 380000, egresos: 245000, meta: 420000 },
  { mes: 'Oct', ingresos: 360000, egresos: 220000, meta: 400000 },
  { mes: 'Nov', ingresos: 340000, egresos: 250000, meta: 380000 },
  { mes: 'Dic', ingresos: 300000, egresos: 270000, meta: 350000 },
];

export const ingresosMensualesAnterior = [
  { mes: 'Ene', ingresos: 345000, egresos: 195000, meta: 380000 },
  { mes: 'Feb', ingresos: 378000, egresos: 210000, meta: 380000 },
  { mes: 'Mar', ingresos: 362000, egresos: 225000, meta: 400000 },
  { mes: 'Abr', ingresos: 398000, egresos: 205000, meta: 400000 },
  { mes: 'May', ingresos: 410000, egresos: 248000, meta: 420000 },
  { mes: 'Jun', ingresos: 435000, egresos: 220000, meta: 440000 },
  { mes: 'Jul', ingresos: 485000, egresos: 265000, meta: 480000 },
  { mes: 'Ago', ingresos: 455000, egresos: 295000, meta: 490000 },
  { mes: 'Sep', ingresos: 350000, egresos: 230000, meta: 400000 },
  { mes: 'Oct', ingresos: 332000, egresos: 205000, meta: 380000 },
  { mes: 'Nov', ingresos: 315000, egresos: 235000, meta: 360000 },
  { mes: 'Dic', ingresos: 278000, egresos: 255000, meta: 330000 },
];

export const drillDownIngresosPorConcepto: Record<string, { concepto: string; monto: number; color: string }[]> = {
  Ene: [{ concepto: 'Colegiaturas', monto: 228000, color: 'bg-primary-500' }, { concepto: 'Inscripciones', monto: 72000, color: 'bg-accent-500' }, { concepto: 'Uniformes', monto: 25000, color: 'bg-emerald-500' }, { concepto: 'Libros', monto: 22000, color: 'bg-amber-500' }, { concepto: 'Comedor', monto: 18000, color: 'bg-rose-500' }, { concepto: 'Otros', monto: 15000, color: 'bg-sky-500' }],
  Feb: [{ concepto: 'Colegiaturas', monto: 246000, color: 'bg-primary-500' }, { concepto: 'Inscripciones', monto: 78000, color: 'bg-accent-500' }, { concepto: 'Uniformes', monto: 28000, color: 'bg-emerald-500' }, { concepto: 'Libros', monto: 24000, color: 'bg-amber-500' }, { concepto: 'Comedor', monto: 19000, color: 'bg-rose-500' }, { concepto: 'Otros', monto: 15000, color: 'bg-sky-500' }],
  Mar: [{ concepto: 'Colegiaturas', monto: 237000, color: 'bg-primary-500' }, { concepto: 'Inscripciones', monto: 75000, color: 'bg-accent-500' }, { concepto: 'Uniformes', monto: 26000, color: 'bg-emerald-500' }, { concepto: 'Libros', monto: 23000, color: 'bg-amber-500' }, { concepto: 'Comedor', monto: 20000, color: 'bg-rose-500' }, { concepto: 'Otros', monto: 14000, color: 'bg-sky-500' }],
  Abr: [{ concepto: 'Colegiaturas', monto: 258000, color: 'bg-primary-500' }, { concepto: 'Inscripciones', monto: 82000, color: 'bg-accent-500' }, { concepto: 'Uniformes', monto: 30000, color: 'bg-emerald-500' }, { concepto: 'Libros', monto: 26000, color: 'bg-amber-500' }, { concepto: 'Comedor', monto: 21000, color: 'bg-rose-500' }, { concepto: 'Otros', monto: 13000, color: 'bg-sky-500' }],
  May: [{ concepto: 'Colegiaturas', monto: 267000, color: 'bg-primary-500' }, { concepto: 'Inscripciones', monto: 85000, color: 'bg-accent-500' }, { concepto: 'Uniformes', monto: 31000, color: 'bg-emerald-500' }, { concepto: 'Libros', monto: 27000, color: 'bg-amber-500' }, { concepto: 'Comedor', monto: 22000, color: 'bg-rose-500' }, { concepto: 'Otros', monto: 13000, color: 'bg-sky-500' }],
  Jun: [{ concepto: 'Colegiaturas', monto: 282000, color: 'bg-primary-500' }, { concepto: 'Inscripciones', monto: 89000, color: 'bg-accent-500' }, { concepto: 'Uniformes', monto: 33000, color: 'bg-emerald-500' }, { concepto: 'Libros', monto: 28000, color: 'bg-amber-500' }, { concepto: 'Comedor', monto: 24000, color: 'bg-rose-500' }, { concepto: 'Otros', monto: 14000, color: 'bg-sky-500' }],
  Jul: [{ concepto: 'Colegiaturas', monto: 312000, color: 'bg-primary-500' }, { concepto: 'Inscripciones', monto: 99000, color: 'bg-accent-500' }, { concepto: 'Uniformes', monto: 36000, color: 'bg-emerald-500' }, { concepto: 'Libros', monto: 31000, color: 'bg-amber-500' }, { concepto: 'Comedor', monto: 26000, color: 'bg-rose-500' }, { concepto: 'Otros', monto: 16000, color: 'bg-sky-500' }],
  Ago: [{ concepto: 'Colegiaturas', monto: 294000, color: 'bg-primary-500' }, { concepto: 'Inscripciones', monto: 93000, color: 'bg-accent-500' }, { concepto: 'Uniformes', monto: 34000, color: 'bg-emerald-500' }, { concepto: 'Libros', monto: 29000, color: 'bg-amber-500' }, { concepto: 'Comedor', monto: 25000, color: 'bg-rose-500' }, { concepto: 'Otros', monto: 15000, color: 'bg-sky-500' }],
  Sep: [{ concepto: 'Colegiaturas', monto: 228000, color: 'bg-primary-500' }, { concepto: 'Inscripciones', monto: 72000, color: 'bg-accent-500' }, { concepto: 'Uniformes', monto: 27000, color: 'bg-emerald-500' }, { concepto: 'Libros', monto: 22000, color: 'bg-amber-500' }, { concepto: 'Comedor', monto: 19000, color: 'bg-rose-500' }, { concepto: 'Otros', monto: 12000, color: 'bg-sky-500' }],
  Oct: [{ concepto: 'Colegiaturas', monto: 216000, color: 'bg-primary-500' }, { concepto: 'Inscripciones', monto: 68000, color: 'bg-accent-500' }, { concepto: 'Uniformes', monto: 25000, color: 'bg-emerald-500' }, { concepto: 'Libros', monto: 21000, color: 'bg-amber-500' }, { concepto: 'Comedor', monto: 18000, color: 'bg-rose-500' }, { concepto: 'Otros', monto: 12000, color: 'bg-sky-500' }],
  Nov: [{ concepto: 'Colegiaturas', monto: 204000, color: 'bg-primary-500' }, { concepto: 'Inscripciones', monto: 65000, color: 'bg-accent-500' }, { concepto: 'Uniformes', monto: 24000, color: 'bg-emerald-500' }, { concepto: 'Libros', monto: 20000, color: 'bg-amber-500' }, { concepto: 'Comedor', monto: 17000, color: 'bg-rose-500' }, { concepto: 'Otros', monto: 10000, color: 'bg-sky-500' }],
  Dic: [{ concepto: 'Colegiaturas', monto: 180000, color: 'bg-primary-500' }, { concepto: 'Inscripciones', monto: 57000, color: 'bg-accent-500' }, { concepto: 'Uniformes', monto: 21000, color: 'bg-emerald-500' }, { concepto: 'Libros', monto: 18000, color: 'bg-amber-500' }, { concepto: 'Comedor', monto: 15000, color: 'bg-rose-500' }, { concepto: 'Otros', monto: 9000, color: 'bg-sky-500' }],
};

export const drillDownAlumnosPorGrado: Record<string, { grado: string; alumnos: number; color: string }[]> = {
  Preescolar: [{ grado: '1° Preescolar', alumnos: 105, color: 'bg-amber-400' }, { grado: '2° Preescolar', alumnos: 112, color: 'bg-amber-500' }, { grado: '3° Preescolar', alumnos: 103, color: 'bg-amber-600' }],
  Primaria: [{ grado: '1°', alumnos: 155, color: 'bg-emerald-400' }, { grado: '2°', alumnos: 148, color: 'bg-emerald-450' }, { grado: '3°', alumnos: 152, color: 'bg-emerald-500' }, { grado: '4°', alumnos: 145, color: 'bg-emerald-550' }, { grado: '5°', alumnos: 140, color: 'bg-emerald-600' }, { grado: '6°', alumnos: 150, color: 'bg-emerald-650' }],
  Secundaria: [{ grado: '1°', alumnos: 215, color: 'bg-primary-400' }, { grado: '2°', alumnos: 208, color: 'bg-primary-500' }, { grado: '3°', alumnos: 197, color: 'bg-primary-600' }],
  Preparatoria: [{ grado: '4° Prep', alumnos: 165, color: 'bg-accent-400' }, { grado: '5° Prep', alumnos: 160, color: 'bg-accent-500' }, { grado: '6° Prep', alumnos: 155, color: 'bg-accent-600' }],
  Universidad: [{ grado: '1° Uni', alumnos: 45, color: 'bg-rose-400' }, { grado: '2° Uni', alumnos: 40, color: 'bg-rose-500' }, { grado: '3° Uni', alumnos: 37, color: 'bg-rose-600' }],
};

export const drillDownMorosidadAlumnos: { nombre: string; grado: string; monto: number; meses: number }[] = [
  { nombre: 'Ana María García López', grado: '3° Primaria', monto: 8500, meses: 3 },
  { nombre: 'Carlos Eduardo Mendoza Ruiz', grado: '2° Secundaria', monto: 7200, meses: 2 },
  { nombre: 'Laura Fernanda Díaz Morales', grado: '5° Primaria', monto: 6800, meses: 2 },
  { nombre: 'José Miguel Torres Hernández', grado: '1° Secundaria', monto: 6500, meses: 2 },
  { nombre: 'María José Ramírez Castro', grado: '4° Prep', monto: 6200, meses: 3 },
  { nombre: 'Diego Alejandro Vargas Luna', grado: '3° Secundaria', monto: 5800, meses: 1 },
  { nombre: 'Sofía Valentina Ortiz Peña', grado: '2° Primaria', monto: 5500, meses: 2 },
  { nombre: 'Luis Fernando Rojas Aguilar', grado: '6° Primaria', monto: 5200, meses: 1 },
  { nombre: 'Valentina Isabel Cruz Soto', grado: '5° Prep', monto: 4800, meses: 2 },
  { nombre: 'Mateo Sebastián Flores Gil', grado: '1° Uni', monto: 4500, meses: 1 },
];

export const alumnosPorNivel = [
  { nivel: 'Preescolar', alumnos: 320, color: 'bg-amber-500' },
  { nivel: 'Primaria', alumnos: 890, color: 'bg-emerald-500' },
  { nivel: 'Secundaria', alumnos: 620, color: 'bg-primary-500' },
  { nivel: 'Preparatoria', alumnos: 480, color: 'bg-accent-500' },
  { nivel: 'Universidad', alumnos: 122, color: 'bg-rose-500' },
];

export const alumnosPorSucursal = [
  { sucursal: 'Campus Norte', alumnos: 680, profesores: 22, salones: 18, capacidad: 750, ingresos: 1350000, morosidad: 4.8 },
  { sucursal: 'Campus Sur', alumnos: 720, profesores: 25, salones: 21, capacidad: 800, ingresos: 1480000, morosidad: 5.2 },
  { sucursal: 'Campus Oriente', alumnos: 510, profesores: 18, salones: 15, capacidad: 580, ingresos: 1020000, morosidad: 7.1 },
  { sucursal: 'Campus Poniente', alumnos: 395, profesores: 14, salones: 12, capacidad: 450, ingresos: 780000, morosidad: 8.5 },
  { sucursal: 'Extensión Toluca', alumnos: 127, profesores: 7, salones: 6, capacidad: 200, ingresos: 195000, morosidad: 9.2 },
];

export const pagosPorMetodo = [
  { metodo: 'Transferencia', monto: 2120000, porcentaje: 44, transacciones: 1250 },
  { metodo: 'Efectivo', monto: 1447500, porcentaje: 30, transacciones: 980 },
  { metodo: 'Tarjeta', monto: 964000, porcentaje: 20, transacciones: 720 },
  { metodo: 'Cheque', monto: 293500, porcentaje: 6, transacciones: 85 },
];

export const morosidadPorNivel = [
  { nivel: 'Preescolar', monto: 28000, alumnos: 18, porcentaje: 5.6 },
  { nivel: 'Primaria', monto: 112000, alumnos: 67, porcentaje: 7.5 },
  { nivel: 'Secundaria', monto: 96500, alumnos: 52, porcentaje: 8.4 },
  { nivel: 'Preparatoria', monto: 68000, alumnos: 34, porcentaje: 7.1 },
  { nivel: 'Universidad', monto: 20000, alumnos: 16, porcentaje: 13.1 },
];

export const conceptosIngreso = [
  { concepto: 'Colegiaturas', monto: 2895000, color: 'bg-primary-500' },
  { concepto: 'Inscripciones', monto: 845000, color: 'bg-accent-500' },
  { concepto: 'Uniformes', monto: 320000, color: 'bg-emerald-500' },
  { concepto: 'Libros', monto: 285000, color: 'bg-amber-500' },
  { concepto: 'Comedor', monto: 210000, color: 'bg-rose-500' },
  { concepto: 'Talleres', monto: 170000, color: 'bg-sky-500' },
  { concepto: 'Transporte', monto: 100000, color: 'bg-violet-500' },
];

export const retencionPorGrado = [
  { grado: '1° Primaria', retencion: 98, nuevos: 145 },
  { grado: '2° Primaria', retencion: 96, nuevos: 32 },
  { grado: '3° Primaria', retencion: 94, nuevos: 28 },
  { grado: '4° Primaria', retencion: 91, nuevos: 22 },
  { grado: '5° Primaria', retencion: 89, nuevos: 18 },
  { grado: '6° Primaria', retencion: 92, nuevos: 15 },
  { grado: '1° Secundaria', retencion: 88, nuevos: 48 },
  { grado: '2° Secundaria', retencion: 85, nuevos: 22 },
  { grado: '3° Secundaria', retencion: 90, nuevos: 14 },
];

export const tiposReporte = [
  { id: 'ingresos', label: 'Ingresos y Egresos', icon: 'ri-money-dollar-circle-line' },
  { id: 'alumnos', label: 'Matrícula y Retención', icon: 'ri-user-star-line' },
  { id: 'morosidad', label: 'Morosidad', icon: 'ri-error-warning-line' },
  { id: 'pagos', label: 'Métodos de Pago', icon: 'ri-bank-card-line' },
  { id: 'conceptos', label: 'Ingresos por Concepto', icon: 'ri-pie-chart-2-line' },
  { id: 'sucursales', label: 'Por Sucursal', icon: 'ri-store-2-line' },
];

export const sucursalesReporte = [
  { id: 'todas', label: 'Todas las sucursales' },
  { id: 'norte', label: 'Campus Norte' },
  { id: 'sur', label: 'Campus Sur' },
  { id: 'oriente', label: 'Campus Oriente' },
  { id: 'poniente', label: 'Campus Poniente' },
  { id: 'toluca', label: 'Extensión Toluca' },
];

export const fechaPresets = [
  { id: 'ultimo-mes', label: 'Último mes' },
  { id: 'ultimo-trimestre', label: 'Último trimestre' },
  { id: 'ultimo-semestre', label: 'Último semestre' },
  { id: 'este-ano', label: 'Este año' },
  { id: 'ano-anterior', label: 'Año anterior' },
  { id: 'personalizado', label: 'Personalizado' },
];