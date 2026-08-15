import { apiClient, apiDownload, triggerBrowserDownload } from '@/api/apiClient';
import { buildQuery } from '@/api/helpers';
import type { FetchResult } from '@/api/types';

export interface ReportFilters {
  branchId?: string | null;
  cycleId?: string | null;
  reportType?: string;
  from?: string;
  to?: string;
  compare?: boolean;
}

export interface ReportKpi {
  ingresosTotales: number;
  alumnosActivos: number;
  morosidadTotal: number;
  morosidadPorcentaje: number;
  morosidadAlumnos: number;
  /** Sin serie histórica real en MVP → null (no inventar %). */
  ingresosVariacion: number | null;
  alumnosVariacion: number | null;
  morosidadVariacion: number | null;
  nuevosInscritos: number | null;
  nuevosVariacion: number | null;
}

export interface IngresoMensualRow {
  mes: string;
  ingresos: number;
  egresos: number;
  meta: number;
}

export interface AlumnosNivelRow {
  nivel: string;
  alumnos: number;
  color: string;
}

export interface AlumnosSucursalRow {
  sucursal: string;
  alumnos: number;
  profesores: number;
  salones: number;
  capacidad: number;
  ingresos: number;
  morosidad: number;
}

export interface PagoMetodoRow {
  metodo: string;
  monto: number;
  porcentaje: number;
  transacciones: number;
}

export interface MorosidadNivelRow {
  nivel: string;
  monto: number;
  alumnos: number;
  porcentaje: number;
}

export interface ConceptoIngresoRow {
  concepto: string;
  monto: number;
  color: string;
}

export interface MorosidadItemRow {
  nombre: string;
  grado: string;
  monto: number;
  meses: number;
}

export interface ReportsBundle {
  kpi: ReportKpi;
  ingresosMensuales: IngresoMensualRow[];
  alumnosPorNivel: AlumnosNivelRow[];
  alumnosPorSucursal: AlumnosSucursalRow[];
  pagosPorMetodo: PagoMetodoRow[];
  morosidadPorNivel: MorosidadNivelRow[];
  conceptosIngreso: ConceptoIngresoRow[];
  morosidadItems: MorosidadItemRow[];
  /** Retención no existe en API MVP. */
  retencionPorGrado: Array<{ grado: string; retencion: number; nuevos: number }>;
}

const LEVEL_COLORS = ['bg-amber-500', 'bg-emerald-500', 'bg-primary-500', 'bg-accent-500', 'bg-rose-500', 'bg-sky-500'];
const CONCEPT_COLORS = [
  'bg-primary-500',
  'bg-accent-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-sky-500',
  'bg-violet-500',
];

export const emptyReportsBundle: ReportsBundle = {
  kpi: {
    ingresosTotales: 0,
    alumnosActivos: 0,
    morosidadTotal: 0,
    morosidadPorcentaje: 0,
    morosidadAlumnos: 0,
    ingresosVariacion: null,
    alumnosVariacion: null,
    morosidadVariacion: null,
    nuevosInscritos: null,
    nuevosVariacion: null,
  },
  ingresosMensuales: [],
  alumnosPorNivel: [],
  alumnosPorSucursal: [],
  pagosPorMetodo: [],
  morosidadPorNivel: [],
  conceptosIngreso: [],
  morosidadItems: [],
  retencionPorGrado: [],
};

/** Convierte `YYYY-MM` o `YYYY-MM-DD` a rango ISO date. */
export function resolveReportRange(filters: ReportFilters): { from: string; to: string } {
  const now = new Date();
  const defaultFrom = `${now.getFullYear()}-01-01`;
  const defaultTo = now.toISOString().slice(0, 10);

  const fromRaw = (filters.from || defaultFrom).trim();
  const toRaw = (filters.to || defaultTo).trim();

  const from = fromRaw.length === 7 ? `${fromRaw}-01` : fromRaw;
  let to = toRaw;
  if (toRaw.length === 7) {
    const [y, m] = toRaw.split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    to = `${toRaw}-${String(last).padStart(2, '0')}`;
  }
  return { from, to };
}

function asArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  return [];
}

function asObj<T extends object>(data: unknown): T | null {
  if (data && typeof data === 'object' && !Array.isArray(data)) return data as T;
  return null;
}

function shortMonthLabel(period: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(period);
  if (m) {
    const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const idx = Number(m[2]) - 1;
    return labels[idx] ?? period;
  }
  return period.slice(0, 3) || period;
}

type BeIncomeRow = { period?: string; income?: number; expense?: number };
type BeEnrollment = {
  byLevel?: Array<{ levelName?: string; studentCount?: number }>;
  byBranch?: Array<{ branchName?: string; studentCount?: number }>;
};
type BeMorosity = {
  items?: Array<{
    studentName?: string;
    levelName?: string;
    netAmount?: number;
    moraInfoDays?: number | null;
  }>;
  byLevel?: Array<{ levelName?: string; overdueCount?: number; overdueAmount?: number }>;
};
type BeMethod = { methodName?: string; paymentCount?: number; totalAmount?: number };
type BeConcept = { conceptName?: string; paidAmount?: number; pendingAmount?: number };
type BeBranch = {
  branchName?: string;
  activeStudents?: number;
  income?: number;
  outstanding?: number;
};

function mapBundle(raw: {
  income: unknown;
  enrollment: unknown;
  morosity: unknown;
  methods: unknown;
  concepts: unknown;
  byBranch: unknown;
}): ReportsBundle {
  const incomeRows = asArray<BeIncomeRow>(raw.income).map((r) => ({
    mes: shortMonthLabel(String(r.period ?? '')),
    ingresos: Number(r.income) || 0,
    egresos: Number(r.expense) || 0,
    meta: 0,
  }));

  const enrollment = asObj<BeEnrollment>(raw.enrollment);
  const alumnosPorNivel = (enrollment?.byLevel ?? []).map((r, i) => ({
    nivel: String(r.levelName || 'Sin nivel'),
    alumnos: Number(r.studentCount) || 0,
    color: LEVEL_COLORS[i % LEVEL_COLORS.length],
  }));

  const morosity = asObj<BeMorosity>(raw.morosity);
  const morosidadPorNivel = (morosity?.byLevel ?? []).map((r) => {
    const monto = Number(r.overdueAmount) || 0;
    const alumnos = Number(r.overdueCount) || 0;
    return {
      nivel: String(r.levelName || 'Sin nivel'),
      monto,
      alumnos,
      porcentaje: 0,
    };
  });
  const morosidadItems = (morosity?.items ?? []).slice(0, 50).map((r) => ({
    nombre: String(r.studentName || 'Alumno'),
    grado: String(r.levelName || '—'),
    monto: Number(r.netAmount) || 0,
    meses: Math.max(1, Math.ceil((Number(r.moraInfoDays) || 0) / 30)),
  }));

  const methodRows = asArray<BeMethod>(raw.methods);
  const methodsTotal = methodRows.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0);
  const pagosPorMetodo = methodRows.map((r) => {
    const monto = Number(r.totalAmount) || 0;
    return {
      metodo: String(r.methodName || 'Otro'),
      monto,
      porcentaje: methodsTotal > 0 ? Math.round((monto / methodsTotal) * 1000) / 10 : 0,
      transacciones: Number(r.paymentCount) || 0,
    };
  });

  const conceptosIngreso = asArray<BeConcept>(raw.concepts).map((r, i) => ({
    concepto: String(r.conceptName || 'Concepto'),
    monto: Number(r.paidAmount) || 0,
    color: CONCEPT_COLORS[i % CONCEPT_COLORS.length],
  }));

  const branchRows = asArray<BeBranch>(raw.byBranch);
  const enrollmentBranch = enrollment?.byBranch ?? [];
  const alumnosPorSucursal: AlumnosSucursalRow[] =
    branchRows.length > 0
      ? branchRows.map((r) => {
          const ingresos = Number(r.income) || 0;
          const outstanding = Number(r.outstanding) || 0;
          return {
            sucursal: String(r.branchName || 'Sucursal'),
            alumnos: Number(r.activeStudents) || 0,
            profesores: 0,
            salones: 0,
            capacidad: 0,
            ingresos,
            morosidad: ingresos > 0 ? Math.round((outstanding / ingresos) * 1000) / 10 : 0,
          };
        })
      : enrollmentBranch.map((r) => ({
          sucursal: String(r.branchName || 'Sucursal'),
          alumnos: Number(r.studentCount) || 0,
          profesores: 0,
          salones: 0,
          capacidad: 0,
          ingresos: 0,
          morosidad: 0,
        }));

  const ingresosTotales = incomeRows.reduce((s, r) => s + r.ingresos, 0);
  const alumnosActivos = alumnosPorNivel.reduce((s, r) => s + r.alumnos, 0);
  const morosidadTotal = morosidadPorNivel.reduce((s, r) => s + r.monto, 0);
  const morosidadAlumnos = morosidadPorNivel.reduce((s, r) => s + r.alumnos, 0);
  const morosidadPorcentaje =
    ingresosTotales > 0 ? Math.round((morosidadTotal / ingresosTotales) * 1000) / 10 : 0;

  const byNivelMap = new Map(alumnosPorNivel.map((n) => [n.nivel.toLowerCase(), n.alumnos]));
  for (const row of morosidadPorNivel) {
    const base = byNivelMap.get(row.nivel.toLowerCase()) || 0;
    row.porcentaje = base > 0 ? Math.round((row.alumnos / base) * 1000) / 10 : 0;
  }

  return {
    kpi: {
      ingresosTotales,
      alumnosActivos,
      morosidadTotal,
      morosidadPorcentaje,
      morosidadAlumnos,
      ingresosVariacion: null,
      alumnosVariacion: null,
      morosidadVariacion: null,
      nuevosInscritos: null,
      nuevosVariacion: null,
    },
    ingresosMensuales: incomeRows,
    alumnosPorNivel,
    alumnosPorSucursal,
    pagosPorMetodo,
    morosidadPorNivel,
    conceptosIngreso,
    morosidadItems,
    retencionPorGrado: [],
  };
}

/**
 * Agrega endpoints BE reales. Sin fallback a mocks (BR-85).
 */
export async function getReportsData(filters: ReportFilters): Promise<FetchResult<ReportsBundle>> {
  const { from, to } = resolveReportRange(filters);
  const branchId = filters.branchId;
  const schoolCycleId = filters.cycleId;

  try {
    const [income, enrollment, morosity, methods, concepts, byBranch] = await Promise.all([
      apiClient(`/reports/income-expense${buildQuery({ branchId, from, to })}`),
      apiClient(`/reports/enrollment${buildQuery({ branchId, schoolCycleId })}`),
      apiClient(`/reports/morosity${buildQuery({ branchId })}`),
      apiClient(`/reports/payment-methods${buildQuery({ branchId, from, to })}`),
      apiClient(`/reports/concepts${buildQuery({ branchId, from, to })}`),
      apiClient(`/reports/by-branch${buildQuery({ from, to })}`),
    ]);

    // Siempre vacío honesto (nunca mocks). source=api aunque todos fallen.
    return {
      data: mapBundle({
        income: income.success ? income.data : [],
        enrollment: enrollment.success ? enrollment.data : { byLevel: [], byBranch: [] },
        morosity: morosity.success ? morosity.data : { items: [], byLevel: [] },
        methods: methods.success ? methods.data : [],
        concepts: concepts.success ? concepts.data : [],
        byBranch: byBranch.success ? byBranch.data : [],
      }),
      source: 'api',
    };
  } catch {
    return { data: emptyReportsBundle, source: 'api' };
  }
}

/** Export PDF/Excel de income-expense. Sin CSV mock. */
export async function exportReport(
  filters: ReportFilters & { format?: 'pdf' | 'xlsx' | 'csv' }
): Promise<boolean> {
  const { from, to } = resolveReportRange(filters);
  const format = filters.format === 'pdf' ? 'pdf' : 'excel';
  const q = buildQuery({ branchId: filters.branchId, from, to });
  const file = await apiDownload(`/reports/income-expense/export/${format}${q}`, {
    filenameHint: `reporte_${filters.reportType || 'income-expense'}.${format === 'pdf' ? 'pdf' : 'xlsx'}`,
  });
  if (!file) return false;
  triggerBrowserDownload(file.blob, file.filename);
  return true;
}

export const tiposReporte = [
  { id: 'ingresos', label: 'Ingresos y Egresos', icon: 'ri-money-dollar-circle-line' },
  { id: 'alumnos', label: 'Matrícula', icon: 'ri-user-star-line' },
  { id: 'morosidad', label: 'Morosidad', icon: 'ri-error-warning-line' },
  { id: 'pagos', label: 'Métodos de Pago', icon: 'ri-bank-card-line' },
  { id: 'conceptos', label: 'Ingresos por Concepto', icon: 'ri-pie-chart-2-line' },
  { id: 'sucursales', label: 'Por Sucursal', icon: 'ri-store-2-line' },
] as const;

export const fechaPresets = [
  { id: 'ultimo-mes', label: 'Último mes' },
  { id: 'ultimo-trimestre', label: 'Último trimestre' },
  { id: 'ultimo-semestre', label: 'Último semestre' },
  { id: 'este-ano', label: 'Este año' },
  { id: 'ano-anterior', label: 'Año anterior' },
  { id: 'personalizado', label: 'Personalizado' },
] as const;
