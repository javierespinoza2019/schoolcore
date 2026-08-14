import { apiClient } from '@/api/apiClient';
import { buildQuery, fetchOrFallback, isGuid } from '@/api/helpers';
import type { FetchResult } from '@/api/types';
import {
  kpiData,
  paymentDistribution,
  recentActivity,
  revenueData,
} from '@/mocks/dashboard';

export interface DashboardKpis {
  kpis: typeof kpiData;
  paymentDistribution: typeof paymentDistribution;
  recentActivity: typeof recentActivity;
  revenueData: typeof revenueData;
}

const mockDashboard: DashboardKpis = {
  kpis: kpiData,
  paymentDistribution,
  recentActivity,
  revenueData,
};

/** GET /dashboard/kpis — omite branchId/cycleId inválidos (p.ej. "0"). */
export async function getDashboardKpis(params: {
  branchId?: string | null;
  cycleId?: string | null;
}): Promise<FetchResult<DashboardKpis>> {
  const q = buildQuery({
    branchId: isGuid(params.branchId) ? params.branchId : undefined,
    cycleId: isGuid(params.cycleId) ? params.cycleId : undefined,
  });
  return fetchOrFallback(() => apiClient(`/dashboard/kpis${q}`), () => mockDashboard);
}
