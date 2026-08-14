import { apiClient, apiDownload, triggerBrowserDownload } from '@/api/apiClient';
import { buildQuery, fetchOrFallback } from '@/api/helpers';
import type { FetchResult } from '@/api/types';
import {
  alumnosPorNivel,
  alumnosPorSucursal,
  conceptosIngreso,
  ingresosMensuales,
  morosidadPorNivel,
  pagosPorMetodo,
  reportesKPI,
  retencionPorGrado,
} from '@/mocks/reportes';

export interface ReportFilters {
  branchId?: string | null;
  cycleId?: string | null;
  reportType?: string;
  from?: string;
  to?: string;
  compare?: boolean;
}

export interface ReportsBundle {
  kpi: typeof reportesKPI;
  ingresosMensuales: typeof ingresosMensuales;
  alumnosPorNivel: typeof alumnosPorNivel;
  alumnosPorSucursal: typeof alumnosPorSucursal;
  pagosPorMetodo: typeof pagosPorMetodo;
  morosidadPorNivel: typeof morosidadPorNivel;
  conceptosIngreso: typeof conceptosIngreso;
  retencionPorGrado: typeof retencionPorGrado;
}

const mockBundle: ReportsBundle = {
  kpi: reportesKPI,
  ingresosMensuales,
  alumnosPorNivel,
  alumnosPorSucursal,
  pagosPorMetodo,
  morosidadPorNivel,
  conceptosIngreso,
  retencionPorGrado,
};

function defaultRange(filters: ReportFilters) {
  const from = filters.from ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const to = filters.to ?? new Date().toISOString().slice(0, 10);
  return { from, to };
}

/**
 * Agrega endpoints BE reales:
 * /reports/income-expense, enrollment, morosity, payment-methods, concepts, by-branch
 */
export async function getReportsData(filters: ReportFilters): Promise<FetchResult<ReportsBundle>> {
  const { from, to } = defaultRange(filters);
  const base = { branchId: filters.branchId, from, to, schoolCycleId: filters.cycleId };

  try {
    const [income, enrollment, morosity, methods, concepts, byBranch] = await Promise.all([
      apiClient(`/reports/income-expense${buildQuery({ branchId: base.branchId, from, to })}`),
      apiClient(`/reports/enrollment${buildQuery({ branchId: base.branchId, schoolCycleId: base.schoolCycleId })}`),
      apiClient(`/reports/morosity${buildQuery({ branchId: base.branchId })}`),
      apiClient(`/reports/payment-methods${buildQuery({ branchId: base.branchId, from, to })}`),
      apiClient(`/reports/concepts${buildQuery({ branchId: base.branchId, from, to })}`),
      apiClient(`/reports/by-branch${buildQuery({ from, to })}`),
    ]);

    const anyOk = [income, enrollment, morosity, methods, concepts, byBranch].some((r) => r.success);
    if (!anyOk) {
      return fetchOrFallback(() => apiClient(`/reports${buildQuery(filters as Record<string, unknown>)}`), () => mockBundle);
    }

    return {
      data: {
        ...mockBundle,
        // Conserva forma UI; datos crudos BE se mezclan cuando existan arrays/objetos útiles
        ingresosMensuales: Array.isArray(income.data) ? (income.data as typeof ingresosMensuales) : mockBundle.ingresosMensuales,
        pagosPorMetodo: Array.isArray(methods.data) ? (methods.data as typeof pagosPorMetodo) : mockBundle.pagosPorMetodo,
        conceptosIngreso: Array.isArray(concepts.data) ? (concepts.data as typeof conceptosIngreso) : mockBundle.conceptosIngreso,
        alumnosPorSucursal: Array.isArray(byBranch.data) ? (byBranch.data as typeof alumnosPorSucursal) : mockBundle.alumnosPorSucursal,
        morosidadPorNivel: morosity.data ? (morosity.data as typeof morosidadPorNivel) : mockBundle.morosidadPorNivel,
        alumnosPorNivel: enrollment.data ? (enrollment.data as typeof alumnosPorNivel) : mockBundle.alumnosPorNivel,
      },
      source: 'api',
    };
  } catch {
    return { data: mockBundle, source: 'fallback' };
  }
}

/** Export PDF/Excel de income-expense. */
export async function exportReport(
  filters: ReportFilters & { format?: 'pdf' | 'xlsx' | 'csv' }
): Promise<boolean> {
  const { from, to } = defaultRange(filters);
  const format = filters.format === 'pdf' ? 'pdf' : 'excel';
  const q = buildQuery({ branchId: filters.branchId, from, to });
  const file = await apiDownload(`/reports/income-expense/export/${format}${q}`, {
    filenameHint: `reporte_${filters.reportType || 'income-expense'}.${format === 'pdf' ? 'pdf' : 'xlsx'}`,
  });
  if (!file) return false;
  triggerBrowserDownload(file.blob, file.filename);
  return true;
}
