import { apiClient, apiDownload, triggerBrowserDownload } from '@/api/apiClient';
import { buildQuery, fetchOrFallback, unwrapList } from '@/api/helpers';
import type { ApiResponse, FetchResult, PagedResult } from '@/api/types';
import type { EstadoCuenta, EgresoItem, IngresoEgreso, PagoConcepto } from '@/mocks/finanzas';
import { estadoCuentaPorAlumno } from '@/mocks/finanzas';

/** Caja v1: pago parcial NO soportado. */
export const CASH_V1_PARTIAL_PAYMENTS = false;

export interface FinanceSummary {
  ingresosMes: number;
  ingresosMesAnterior: number;
  egresosMes: number;
  egresosMesAnterior: number;
  saldoPendiente: number;
  saldoVencido: number;
  pagosHoy: number;
  montoHoy: number;
  tasaMoratoria: number;
  alumnosConAdeudo: number;
  totalAlumnos: number;
}

export interface ConceptoIngreso {
  concepto: string;
  monto: number;
  porcentaje: number;
  color: string;
}

const CONCEPT_COLORS = [
  'bg-primary-500',
  'bg-accent-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-rose-500',
];

const EMPTY_SUMMARY: FinanceSummary = {
  ingresosMes: 0,
  ingresosMesAnterior: 0,
  egresosMes: 0,
  egresosMesAnterior: 0,
  saldoPendiente: 0,
  saldoVencido: 0,
  pagosHoy: 0,
  montoHoy: 0,
  tasaMoratoria: 5,
  alumnosConAdeudo: 0,
  totalAlumnos: 0,
};

function yearRange() {
  const now = new Date();
  const from = `${now.getFullYear()}-01-01`;
  const to = now.toISOString().slice(0, 10);
  return { from, to, now };
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function parsePeriodToMonthKey(period: string): string | null {
  const p = period.trim();
  if (/^\d{4}-\d{2}/.test(p)) return p.slice(0, 7);
  const months: Record<string, number> = {
    ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
    jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
    jan: 0, apr: 3, aug: 7, dec: 11,
  };
  const low = p.toLowerCase().slice(0, 3);
  if (low in months) {
    const y = new Date().getFullYear();
    return `${y}-${String(months[low] + 1).padStart(2, '0')}`;
  }
  return null;
}

function shortMonthLabel(period: string): string {
  const key = parsePeriodToMonthKey(period);
  if (!key) return period.slice(0, 3);
  const [, m] = key.split('-');
  const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return labels[Number(m) - 1] ?? period;
}

/** Alineado con CreatePaymentRequest del BE (+ campos UI opcionales). */
export interface RegisterPaymentRequest {
  branchId?: string;
  studentId: string;
  chargeId?: string;
  amount: number;
  paymentMethodId?: string;
  cashSessionId?: string;
  reference?: string;
  idempotencyKey?: string;
  notes?: string;
  concept?: string;
  type?: string;
  paymentDate?: string;
  paymentMethod?: string;
  folio?: string;
}

/** KPIs derivados de reports + charges (sin mocks engañosos). */
export async function getFinanceSummary(params: {
  branchId?: string | null;
  cycleId?: string | null;
}): Promise<FetchResult<FinanceSummary>> {
  void params.cycleId;
  const { from, to, now } = yearRange();
  const thisKey = monthKey(now);
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevKey = monthKey(prev);
  const today = to;

  try {
    const qIe = buildQuery({ branchId: params.branchId, from, to });
    const qMor = buildQuery({ branchId: params.branchId });
    const qPay = buildQuery({ branchId: params.branchId, page: 1, pageSize: 200 });
    const qCh = buildQuery({ branchId: params.branchId, page: 1, pageSize: 200 });

    const [ieRes, morRes, payRes, chRes] = await Promise.all([
      apiClient<Record<string, unknown>[]>(`/reports/income-expense${qIe}`),
      apiClient<{ items?: Record<string, unknown>[] }>(`/reports/morosity${qMor}`),
      apiClient<PagedResult<Record<string, unknown>> | Record<string, unknown>[]>(`/payments${qPay}`),
      apiClient<PagedResult<Record<string, unknown>> | Record<string, unknown>[]>(`/charges${qCh}`),
    ]);

    const rows = ieRes.success && Array.isArray(ieRes.data) ? ieRes.data : [];
    let ingresosMes = 0;
    let ingresosMesAnterior = 0;
    let egresosMes = 0;
    let egresosMesAnterior = 0;
    for (const raw of rows) {
      const period = String(raw.period ?? raw.Period ?? '');
      const key = parsePeriodToMonthKey(period) ?? period.slice(0, 7);
      const income = Number(raw.income ?? raw.Income ?? 0);
      const expense = Number(raw.expense ?? raw.Expense ?? 0);
      if (key === thisKey) {
        ingresosMes += income;
        egresosMes += expense;
      } else if (key === prevKey) {
        ingresosMesAnterior += income;
        egresosMesAnterior += expense;
      }
    }

    const morItemsRaw = morRes.success
      ? (Array.isArray(morRes.data) ? morRes.data : morRes.data?.items ?? [])
      : [];
    const morItems = morItemsRaw as Record<string, unknown>[];
    const alumnosAdeudo = new Set(
      morItems.map((x) => String(x.studentId ?? '')).filter(Boolean)
    );
    const saldoVencido = morItems.reduce((s, x) => s + Number(x.netAmount ?? 0), 0);

    const payments = payRes.success ? unwrapList(payRes.data) : [];
    const pagosHoyList = payments.filter((p) => {
      const paid = String((p as Record<string, unknown>).paidAt ?? '').slice(0, 10);
      return paid === today;
    });
    const montoHoy = pagosHoyList.reduce(
      (s, p) => s + Number((p as Record<string, unknown>).amount ?? 0),
      0
    );

    const charges = chRes.success ? unwrapList(chRes.data) : [];
    const saldoPendiente = charges
      .filter((c) => {
        const st = String((c as Record<string, unknown>).status ?? '').toLowerCase();
        return st !== 'paid' && st !== 'pagado' && st !== 'cancelled' && st !== 'canceled';
      })
      .reduce((s, c) => s + Number((c as Record<string, unknown>).netAmount ?? (c as Record<string, unknown>).grossAmount ?? 0), 0);

    return {
      data: {
        ...EMPTY_SUMMARY,
        ingresosMes,
        ingresosMesAnterior,
        egresosMes,
        egresosMesAnterior,
        saldoPendiente: saldoPendiente || saldoVencido,
        saldoVencido,
        pagosHoy: pagosHoyList.length,
        montoHoy,
        alumnosConAdeudo: alumnosAdeudo.size,
        totalAlumnos: 0,
      },
      source: 'api',
    };
  } catch {
    return { data: EMPTY_SUMMARY, source: 'api', message: 'Resumen financiero sin datos' };
  }
}

/** GET /payments */
export async function listPayments(params: {
  branchId?: string | null;
  cycleId?: string | null;
  studentId?: string;
  status?: string;
}): Promise<FetchResult<PagoConcepto[]>> {
  const q = buildQuery({
    branchId: params.branchId,
    studentId: params.studentId,
    page: 1,
    pageSize: 100,
  });
  const result = await fetchOrFallback<PagedResult<Record<string, unknown>> | Record<string, unknown>[]>(
    () => apiClient(`/payments${q}`),
    () => []
  );
  const items = unwrapList(result.data).map((raw) => {
    const r = raw as Record<string, unknown>;
    const paidAt = String(r.paidAt ?? r.fecha ?? '').slice(0, 10);
    return {
      id: String(r.id ?? ''),
      alumnoId: String(r.studentId ?? ''),
      alumnoNombre: String(r.studentName ?? r.alumno ?? ''),
      concepto: String(r.conceptName ?? r.concepto ?? ''),
      tipo: 'otro',
      monto: Number(r.amount ?? r.monto ?? 0),
      fechaVencimiento: paidAt,
      estado: 'pagado',
      montoPagado: Number(r.amount ?? r.monto ?? 0),
      fechaPago: paidAt,
      folio: String(r.folio ?? ''),
      metodoPago: String(r.paymentMethodName ?? r.metodo ?? ''),
    } as unknown as PagoConcepto;
  });
  return { data: items, source: result.source, message: result.message };
}

/** Estado de cuenta: derivado de charges del alumno (sin endpoint dedicado). */
export async function getAccountStatement(
  studentId: string
): Promise<FetchResult<EstadoCuenta | null>> {
  const q = buildQuery({ studentId, page: 1, pageSize: 200 });
  const result = await fetchOrFallback<PagedResult<Record<string, unknown>> | Record<string, unknown>[]>(
    () => apiClient(`/charges${q}`),
    () => []
  );
  if (result.source === 'api') {
    const charges = unwrapList(result.data);
    const pending = charges
      .filter((c) => String((c as Record<string, unknown>).status) !== 'paid')
      .reduce((sum, c) => sum + Number((c as Record<string, unknown>).netAmount ?? 0), 0);
    const paid = charges
      .filter((c) => String((c as Record<string, unknown>).status) === 'paid')
      .reduce((sum, c) => sum + Number((c as Record<string, unknown>).netAmount ?? 0), 0);
    return {
      data: {
        alumnoId: studentId,
        alumnoNombre: String((charges[0] as Record<string, unknown> | undefined)?.studentName ?? ''),
        saldoPendiente: pending,
        totalPagado: paid,
        conceptos: [],
      } as EstadoCuenta,
      source: 'api',
    };
  }
  return { data: estadoCuentaPorAlumno[studentId] ?? null, source: 'fallback' };
}

export interface ChargeSummary {
  id: string;
  studentId: string;
  studentName: string;
  conceptName: string;
  conceptType: string;
  grossAmount: number;
  netAmount: number;
  status: string;
  dueDate: string;
  branchId: string;
}

function normalizeCharge(raw: Record<string, unknown>): ChargeSummary {
  return {
    id: String(raw.id ?? ''),
    studentId: String(raw.studentId ?? ''),
    studentName: String(raw.studentName ?? ''),
    conceptName: String(raw.conceptName ?? ''),
    conceptType: String(raw.conceptType ?? ''),
    grossAmount: Number(raw.grossAmount ?? 0),
    netAmount: Number(raw.netAmount ?? raw.grossAmount ?? 0),
    status: String(raw.status ?? 'pending'),
    dueDate: String(raw.dueDate ?? '').slice(0, 10),
    branchId: String(raw.branchId ?? ''),
  };
}

/** GET /charges */
export async function listCharges(params: {
  branchId?: string | null;
  studentId?: string | null;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<FetchResult<ChargeSummary[]>> {
  const q = buildQuery({
    branchId: params.branchId,
    studentId: params.studentId,
    status: params.status,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 100,
  });
  const result = await fetchOrFallback<PagedResult<Record<string, unknown>> | Record<string, unknown>[]>(
    () => apiClient(`/charges${q}`),
    () => []
  );
  const items = unwrapList(result.data).map((x) => normalizeCharge(x as Record<string, unknown>));
  return { data: items, source: result.source, message: result.message };
}

export interface CreateChargePayload {
  branchId: string;
  studentId: string;
  paymentConceptId?: string;
  conceptName: string;
  conceptType: string;
  grossAmount: number;
  scholarshipPercent?: number;
  dueDate: string;
  schoolCycleId?: string;
}

/** POST /charges */
export async function createCharge(
  payload: CreateChargePayload
): Promise<ApiResponse<ChargeSummary>> {
  const res = await apiClient<Record<string, unknown>>('/charges', {
    method: 'POST',
    body: {
      branchId: payload.branchId,
      studentId: payload.studentId,
      paymentConceptId: payload.paymentConceptId,
      conceptName: payload.conceptName,
      conceptType: payload.conceptType,
      grossAmount: payload.grossAmount,
      scholarshipPercent: payload.scholarshipPercent,
      dueDate: payload.dueDate,
      schoolCycleId: payload.schoolCycleId,
    },
  });
  if (res.success && res.data) {
    return { ...res, data: normalizeCharge(res.data) };
  }
  return { ...res, data: null };
}

/** POST /payments — cobro completo (sin parciales v1). */
export async function registerPayment(
  payload: RegisterPaymentRequest
): Promise<ApiResponse<PagoConcepto>> {
  if (!payload.chargeId || !payload.branchId) {
    return {
      success: false,
      data: null,
      message:
        'Para cobro real se requieren branchId y chargeId (cargo previo). Sin ellos la UI puede guardar local temporal.',
      errors: ['Validation'],
    };
  }
  const res = await apiClient<Record<string, unknown>>('/payments', {
    method: 'POST',
    body: {
      branchId: payload.branchId,
      studentId: payload.studentId,
      chargeId: payload.chargeId,
      cashSessionId: payload.cashSessionId,
      paymentMethodId: payload.paymentMethodId,
      amount: payload.amount,
      reference: payload.reference ?? payload.folio,
      idempotencyKey: payload.idempotencyKey,
      notes: payload.notes,
    },
  });
  if (res.success && res.data) {
    const r = res.data;
    const paidAt = String(r.paidAt ?? '').slice(0, 10);
    return {
      ...res,
      data: {
        id: String(r.id ?? ''),
        alumnoId: String(r.studentId ?? payload.studentId),
        alumnoNombre: String(r.studentName ?? ''),
        concepto: payload.concept ?? '',
        tipo: (payload.type as PagoConcepto['tipo']) ?? 'otro',
        monto: Number(r.amount ?? payload.amount),
        fechaVencimiento: paidAt,
        estado: 'pagado',
        montoPagado: Number(r.amount ?? payload.amount),
        fechaPago: paidAt,
        folio: String(r.folio ?? payload.folio ?? ''),
        metodoPago: String(r.paymentMethodName ?? payload.paymentMethod ?? ''),
      } as unknown as PagoConcepto,
    };
  }
  return { ...res, data: null };
}

export async function getRevenueChart(params: {
  branchId?: string | null;
  cycleId?: string | null;
}): Promise<FetchResult<IngresoEgreso[]>> {
  void params.cycleId;
  const { from, to } = yearRange();
  const q = buildQuery({ branchId: params.branchId, from, to });
  const result = await fetchOrFallback<Record<string, unknown>[]>(
    () => apiClient(`/reports/income-expense${q}`),
    () => []
  );
  const data = unwrapList(result.data).map((raw) => {
    const r = raw as Record<string, unknown>;
    const period = String(r.period ?? r.Period ?? '');
    return {
      mes: shortMonthLabel(period),
      ingresos: Number(r.income ?? r.Income ?? 0),
      egresos: Number(r.expense ?? r.Expense ?? 0),
      meta: 0,
    } satisfies IngresoEgreso;
  });
  return { data, source: result.source, message: result.message };
}

export async function getRevenueByConcept(params: {
  branchId?: string | null;
}): Promise<FetchResult<ConceptoIngreso[]>> {
  const { from, to } = yearRange();
  const q = buildQuery({ branchId: params.branchId, from, to });
  const result = await fetchOrFallback<Record<string, unknown>[]>(
    () => apiClient(`/reports/concepts${q}`),
    () => []
  );
  const rows = unwrapList(result.data).map((raw) => {
    const r = raw as Record<string, unknown>;
    return {
      concepto: String(r.conceptName ?? r.ConceptName ?? 'Concepto'),
      monto: Number(r.paidAmount ?? r.PaidAmount ?? 0),
    };
  });
  const total = rows.reduce((s, r) => s + r.monto, 0) || 1;
  const data: ConceptoIngreso[] = rows.map((r, i) => ({
    ...r,
    porcentaje: Math.round((r.monto / total) * 100),
    color: CONCEPT_COLORS[i % CONCEPT_COLORS.length],
  }));
  return { data, source: result.source, message: result.message };
}

function normalizeExpense(raw: Record<string, unknown>): EgresoItem {
  return {
    id: String(raw.id ?? ''),
    concepto: String(raw.concept ?? raw.concepto ?? ''),
    categoria: String(raw.category ?? raw.categoria ?? 'Otros'),
    monto: Number(raw.amount ?? raw.monto ?? 0),
    fecha: String(raw.expenseDate ?? raw.fecha ?? '').slice(0, 10),
    proveedor: String(raw.vendor ?? raw.proveedor ?? '—'),
    comprobante: raw.reference ? String(raw.reference) : undefined,
  };
}

/** GET /expenses */
export async function listExpenses(params: {
  branchId?: string | null;
}): Promise<FetchResult<EgresoItem[]>> {
  const q = buildQuery({ branchId: params.branchId, page: 1, pageSize: 100 });
  const result = await fetchOrFallback<PagedResult<Record<string, unknown>> | Record<string, unknown>[]>(
    () => apiClient(`/expenses${q}`),
    () => []
  );
  const items = unwrapList(result.data).map((x) => normalizeExpense(x as Record<string, unknown>));
  return { data: items, source: result.source, message: result.message };
}

/** Export vía reportes income-expense. */
export async function exportFinanceReport(params: {
  branchId?: string | null;
  format?: 'xlsx' | 'pdf' | 'csv';
  from?: string;
  to?: string;
}): Promise<boolean> {
  const from = params.from ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const to = params.to ?? new Date().toISOString().slice(0, 10);
  const format = params.format === 'pdf' ? 'pdf' : 'excel';
  const q = buildQuery({ branchId: params.branchId, from, to });
  const file = await apiDownload(`/reports/income-expense/export/${format}${q}`, {
    filenameHint: format === 'pdf' ? 'finanzas.pdf' : 'finanzas.xlsx',
  });
  if (!file) return false;
  triggerBrowserDownload(file.blob, file.filename);
  return true;
}
