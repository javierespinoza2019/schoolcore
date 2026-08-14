import { apiClient, apiDownload, triggerBrowserDownload } from '@/api/apiClient';
import { buildQuery, fetchOrFallback, unwrapList } from '@/api/helpers';
import type { ApiResponse, FetchResult, PagedResult } from '@/api/types';
import type { EstadoCuenta, PagoConcepto } from '@/mocks/finanzas';
import {
  estadoCuentaPorAlumno,
  ingresosEgresos,
  ingresosPorConcepto,
  pagosRecientes,
  resumenFinanciero,
  egresosRecientes,
} from '@/mocks/finanzas';

/** Caja v1: pago parcial NO soportado. */
export const CASH_V1_PARTIAL_PAYMENTS = false;

export interface FinanceSummary {
  ingresosMes: number;
  egresosMes: number;
  saldoPendiente: number;
  tasaCobranza: number;
  [key: string]: unknown;
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
  /** Campos legacy UI. */
  concept?: string;
  type?: string;
  paymentDate?: string;
  paymentMethod?: string;
  folio?: string;
}

/** GET /payments — no hay /finance/summary en BE; se usa fallback para KPIs. */
export async function getFinanceSummary(params: {
  branchId?: string | null;
  cycleId?: string | null;
}): Promise<FetchResult<typeof resumenFinanciero>> {
  void params;
  return { data: resumenFinanciero, source: 'fallback', message: 'Endpoint /finance/summary no disponible; usar reports.' };
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
    () => pagosRecientes as unknown as Record<string, unknown>[]
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
  if (result.source === 'api') return { data: items, source: 'api', message: result.message };
  return { data: items.length ? items : pagosRecientes, source: 'fallback', message: result.message };
}

/** Estado de cuenta: derivado de charges del alumno (sin endpoint dedicado). */
export async function getAccountStatement(
  studentId: string
): Promise<FetchResult<EstadoCuenta | null>> {
  const q = buildQuery({ studentId, page: 1, pageSize: 200 });
  const result = await fetchOrFallback<PagedResult<Record<string, unknown>> | Record<string, unknown>[]>(
    () => apiClient(`/charges${q}`),
    () => null as unknown as Record<string, unknown>[]
  );
  if (result.source === 'api') {
    const charges = unwrapList(result.data);
    const pending = charges
      .filter((c) => String((c as Record<string, unknown>).status) !== 'paid')
      .reduce((sum, c) => sum + Number((c as Record<string, unknown>).netAmount ?? 0), 0);
    return {
      data: {
        ...(estadoCuentaPorAlumno[studentId] ?? ({} as EstadoCuenta)),
        alumnoId: studentId,
        saldoPendiente: pending,
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
}): Promise<FetchResult<typeof ingresosEgresos>> {
  void params;
  return { data: ingresosEgresos, source: 'fallback', message: 'Usar GET /reports/income-expense' };
}

export async function getRevenueByConcept(params: {
  branchId?: string | null;
}): Promise<FetchResult<typeof ingresosPorConcepto>> {
  void params;
  return { data: ingresosPorConcepto, source: 'fallback', message: 'Usar GET /reports/concepts' };
}

/** GET /expenses */
export async function listExpenses(params: {
  branchId?: string | null;
}): Promise<FetchResult<typeof egresosRecientes>> {
  const q = buildQuery({ branchId: params.branchId, page: 1, pageSize: 100 });
  const result = await fetchOrFallback(
    () => apiClient(`/expenses${q}`),
    () => egresosRecientes
  );
  if (result.source === 'api') {
    const items = unwrapList(result.data as PagedResult<unknown> | unknown[]);
    return { data: items as typeof egresosRecientes, source: 'api', message: result.message };
  }
  return { data: egresosRecientes, source: 'fallback', message: result.message };
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
