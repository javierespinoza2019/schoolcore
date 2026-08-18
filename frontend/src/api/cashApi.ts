import { apiClient } from '@/api/apiClient';
import { buildQuery, fetchOrFallback, isGuid, unwrapList } from '@/api/helpers';
import type { ApiResponse, FetchResult, PagedResult } from '@/api/types';
import type { ArqueoCaja, CorteCaja, MovimientoCaja } from '@/mocks/caja';
import { arqueosCaja, cortesCaja, movimientosCaja, resumenCajaHoy } from '@/mocks/caja';
import { isDevelopment } from '@/config/env';

/** Normaliza CashSessionDto → shape UI (corte). */
function normalizeSession(raw: Record<string, unknown>): CorteCaja {
  const status = String(raw.status ?? raw.estado ?? 'open');
  const shift = String(raw.shift ?? raw.turno ?? 'morning');
  const opening = Number(raw.openingAmount ?? raw.montoInicial ?? 0);
  const income = Number(raw.totalIncome ?? raw.totalIngresos ?? 0);
  const expense = Number(raw.totalExpense ?? raw.totalEgresos ?? 0);
  const closing = raw.closingAmount != null ? Number(raw.closingAmount) : opening + income - expense;
  return {
    id: String(raw.id ?? ''),
    fecha: String(raw.openedAt ?? raw.fecha ?? '').slice(0, 10),
    turno: shift === 'afternoon' || shift === 'vespertino' ? 'vespertino' : 'matutino',
    usuario: String(raw.userId ?? raw.usuario ?? ''),
    montoInicial: opening,
    totalIngresos: income,
    totalEgresos: expense,
    montoFinal: closing,
    diferencia: Number(raw.differenceAmount ?? raw.diferencia ?? 0),
    estado: status === 'open' || status === 'abierto' ? 'abierto' : status === 'conciliado' ? 'conciliado' : 'cerrado',
    // API no expone conteo; UI usa movimientos cuando es 0/undefined.
    transacciones: raw.transacciones != null ? Number(raw.transacciones) : undefined,
  } as CorteCaja;
}

function parseDenomJson(raw: unknown): { denominacion: number; cantidad: number }[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((row) => {
      const r = (row ?? {}) as Record<string, unknown>;
      return {
        denominacion: Number(r.denominacion ?? r.denomination ?? r.value ?? 0),
        cantidad: Number(r.cantidad ?? r.quantity ?? r.count ?? 0),
      };
    });
  } catch {
    return [];
  }
}

/** Normaliza CashAuditDto → ArqueoCaja UI. */
function normalizeAudit(raw: Record<string, unknown>, sessionId?: string): ArqueoCaja {
  return {
    id: String(raw.id ?? ''),
    corteId: String(raw.cashSessionId ?? raw.corteId ?? sessionId ?? ''),
    fecha: String(raw.createdAt ?? raw.fecha ?? '').slice(0, 10),
    usuario: String(raw.createdByName ?? raw.usuario ?? raw.userId ?? ''),
    billetes: parseDenomJson(raw.billsJson ?? raw.billetes),
    monedas: parseDenomJson(raw.coinsJson ?? raw.monedas),
    totalEfectivo: Number(raw.totalCash ?? raw.totalEfectivo ?? 0),
    totalTarjeta: Number(raw.totalCard ?? raw.totalTarjeta ?? 0),
    totalTransferencia: Number(raw.totalTransfer ?? raw.totalTransferencia ?? 0),
    totalCheque: Number(raw.totalCheck ?? raw.totalCheque ?? 0),
    totalSistema: Number(raw.systemTotal ?? raw.totalSistema ?? 0),
    diferencia: Number(raw.differenceAmount ?? raw.diferencia ?? 0),
    observaciones: raw.observations != null || raw.observaciones != null
      ? String(raw.observations ?? raw.observaciones)
      : undefined,
  };
}

/** GET /cash-sessions */
export async function listCashSessions(params: {
  branchId?: string | null;
}): Promise<FetchResult<CorteCaja[]>> {
  const q = buildQuery(params);
  const result = await fetchOrFallback<PagedResult<Record<string, unknown>> | Record<string, unknown>[]>(
    () => apiClient(`/cash-sessions${q}`),
    () => cortesCaja as unknown as Record<string, unknown>[]
  );
  const items = unwrapList(result.data).map((x) => normalizeSession(x as Record<string, unknown>));
  return { data: items, source: result.source, message: result.message };
}

/** GET /cash-sessions/open — requiere branchId. `null` = sin sesión abierta (OK). */
export async function getOpenCashSession(branchId?: string | null): Promise<FetchResult<CorteCaja | null>> {
  if (!isGuid(branchId)) {
    return {
      data: isDevelopment ? cortesCaja.find((c) => c.estado === 'abierto') ?? null : null,
      source: isDevelopment ? 'fallback' : 'api',
      message: 'branchId requerido',
    };
  }
  const q = buildQuery({ branchId });
  const res = await apiClient<Record<string, unknown> | null>(`/cash-sessions/open${q}`);
  if (!res.success) {
    if (isDevelopment) {
      return {
        data: cortesCaja.find((c) => c.estado === 'abierto') ?? null,
        source: 'fallback',
        message: res.message,
      };
    }
    return { data: null, source: 'api', message: res.message };
  }
  if (!res.data) return { data: null, source: 'api', message: res.message };
  return { data: normalizeSession(res.data), source: 'api', message: res.message };
}

/** POST /cash-sessions/open */
export async function openCashSession(payload: {
  branchId: string;
  shift?: string;
  initialAmount: number;
  notes?: string;
}): Promise<ApiResponse<CorteCaja>> {
  const res = await apiClient<Record<string, unknown>>('/cash-sessions/open', {
    method: 'POST',
    body: {
      branchId: payload.branchId,
      shift: payload.shift ?? 'morning',
      openingAmount: payload.initialAmount,
      notes: payload.notes,
    },
  });
  if (res.success && res.data) return { ...res, data: normalizeSession(res.data) };
  return { ...res, data: null };
}

/**
 * Caja v1: arqueo obligatorio antes del cierre.
 * 1) PUT /cash-sessions/:id/audit
 * 2) POST /cash-sessions/:id/close
 */
export async function closeCashSession(
  sessionId: string,
  arqueo: Partial<ArqueoCaja> & {
    billsJson?: string;
    coinsJson?: string;
    totalCash?: number;
    totalCard?: number;
    totalTransfer?: number;
    totalCheck?: number;
    observations?: string;
    notes?: string;
  }
): Promise<ApiResponse<CorteCaja>> {
  const auditBody = {
    billsJson: arqueo.billsJson ?? (arqueo.billetes ? JSON.stringify(arqueo.billetes) : undefined),
    coinsJson: arqueo.coinsJson ?? (arqueo.monedas ? JSON.stringify(arqueo.monedas) : undefined),
    totalCash: Number(arqueo.totalCash ?? arqueo.totalEfectivo ?? 0),
    totalCard: Number(arqueo.totalCard ?? arqueo.totalTarjeta ?? 0),
    totalTransfer: Number(arqueo.totalTransfer ?? arqueo.totalTransferencia ?? 0),
    totalCheck: Number(arqueo.totalCheck ?? arqueo.totalCheque ?? 0),
    observations: arqueo.observations ?? arqueo.observaciones,
  };

  const auditRes = await apiClient(`/cash-sessions/${sessionId}/audit`, {
    method: 'PUT',
    body: auditBody,
  });
  if (!auditRes.success) {
    return { success: false, data: null, message: auditRes.message, errors: auditRes.errors ?? [] };
  }

  const res = await apiClient<Record<string, unknown>>(`/cash-sessions/${sessionId}/close`, {
    method: 'POST',
    body: { notes: arqueo.notes ?? arqueo.observaciones },
  });
  if (res.success && res.data) return { ...res, data: normalizeSession(res.data) };
  return { ...res, data: null };
}

export async function listCashMovements(sessionId: string): Promise<FetchResult<MovimientoCaja[]>> {
  const result = await fetchOrFallback<PagedResult<Record<string, unknown>> | Record<string, unknown>[]>(
    () => apiClient(`/cash-sessions/${sessionId}/movements`),
    () => movimientosCaja.filter((m) => m.corteId === sessionId) as unknown as Record<string, unknown>[]
  );
  const items = unwrapList(result.data).map((raw) => {
    const r = raw as Record<string, unknown>;
    // Already UI-shaped?
    if (r.corteId != null && r.concepto != null) {
      return r as unknown as MovimientoCaja;
    }
    const movementType = String(r.movementType ?? r.tipo ?? 'income').toLowerCase();
    const occurred = String(r.occurredAt ?? '');
    const time = occurred.includes('T') ? occurred.slice(11, 16) : '';
    const method = String(r.paymentMethodName ?? r.metodoPago ?? 'efectivo').toLowerCase();
    return {
      id: String(r.id ?? ''),
      corteId: String(r.cashSessionId ?? sessionId),
      hora: time || '—',
      tipo: movementType === 'expense' || movementType === 'egreso' ? 'egreso' : 'ingreso',
      categoria: String(r.category ?? r.categoria ?? ''),
      concepto: String(r.concept ?? r.concepto ?? ''),
      monto: Number(r.amount ?? r.monto ?? 0),
      metodoPago: (method.includes('tarjeta') || method.includes('card')
        ? 'tarjeta'
        : method.includes('transfer')
          ? 'transferencia'
          : method.includes('cheque')
            ? 'cheque'
            : 'efectivo') as MovimientoCaja['metodoPago'],
      referencia: String(r.reference ?? r.referencia ?? '') || undefined,
      alumno: String(r.studentName ?? r.alumno ?? '') || undefined,
      usuario: String(r.createdByName ?? r.usuario ?? r.createdBy ?? '') || '—',
    } satisfies MovimientoCaja;
  });
  return { data: items, source: result.source, message: result.message };
}

/** Movimientos se generan al registrar pagos/egresos; no hay POST genérico en BE. */
export async function createCashMovement(
  _sessionId: string,
  _payload: Partial<MovimientoCaja>
): Promise<ApiResponse<MovimientoCaja>> {
  return {
    success: false,
    data: null,
    message: 'Los movimientos de caja se crean vía pagos/egresos en el backend.',
    errors: ['NotSupported'],
  };
}

/** Lista arqueos vía GET audit por sesión (sin mock en QA/prod). */
export async function listArqueos(params: {
  branchId?: string | null;
}): Promise<FetchResult<ArqueoCaja[]>> {
  const sessions = await listCashSessions(params);
  if (sessions.source !== 'api') {
    return {
      data: isDevelopment ? arqueosCaja : [],
      source: isDevelopment ? 'fallback' : 'api',
      message: sessions.message,
    };
  }
  if (!sessions.data.length) {
    return { data: [], source: 'api', message: sessions.message };
  }

  const audits: ArqueoCaja[] = [];
  for (const s of sessions.data) {
    const res = await apiClient<Record<string, unknown> | null>(`/cash-sessions/${s.id}/audit`);
    if (res.success && res.data) {
      audits.push(normalizeAudit(res.data as Record<string, unknown>, s.id));
    }
  }
  return { data: audits, source: 'api' };
}

/** Resumen hoy: derivado del corte abierto (sin mock engañoso en QA/prod). */
export async function getCashSummaryToday(branchId?: string | null): Promise<FetchResult<typeof resumenCajaHoy>> {
  const empty = {
    fecha: new Date().toISOString().slice(0, 10),
    corteAbierto: 'Sin corte abierto',
    turno: '—',
    montoInicial: 0,
    ingresosHoy: 0,
    egresosHoy: 0,
    transaccionesHoy: 0,
    efectivo: 0,
    tarjeta: 0,
    transferencia: 0,
    cheque: 0,
  };

  const open = await getOpenCashSession(branchId);
  if (open.source === 'api' && open.data) {
    return {
      data: {
        ...empty,
        corteAbierto: open.data.usuario || '—',
        turno: open.data.turno === 'vespertino' ? 'Vespertino' : 'Matutino',
        montoInicial: open.data.montoInicial ?? 0,
        ingresosHoy: open.data.totalIngresos ?? 0,
        egresosHoy: open.data.totalEgresos ?? 0,
        fecha: open.data.fecha || empty.fecha,
      },
      source: 'api',
    };
  }
  if (open.source === 'api') {
    return { data: empty, source: 'api', message: open.message };
  }
  return {
    data: isDevelopment ? resumenCajaHoy : empty,
    source: isDevelopment ? 'fallback' : 'api',
    message: open.message,
  };
}
