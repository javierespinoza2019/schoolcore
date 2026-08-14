import { apiClient } from '@/api/apiClient';
import { buildQuery, fetchOrFallback, isGuid } from '@/api/helpers';
import type { FetchResult } from '@/api/types';

export interface DashboardKpiItem {
  id: string;
  label: string;
  value: string;
  sub: string;
  trend: string;
  icon: string;
  color: string;
}

export interface DashboardDistItem {
  name: string;
  value: number;
  color: string;
}

export interface DashboardActivityItem {
  id: string;
  text: string;
  user: string;
  time: string;
  icon: string;
  color: string;
  amount?: string;
}

export interface DashboardRevenuePoint {
  month: string;
  ingresos: number;
  egresos: number;
  meta?: number;
}

export interface DashboardKpis {
  kpis: DashboardKpiItem[];
  paymentDistribution: DashboardDistItem[];
  recentActivity: DashboardActivityItem[];
  revenueData: DashboardRevenuePoint[];
}

const emptyDashboard: DashboardKpis = {
  kpis: [],
  paymentDistribution: [],
  recentActivity: [],
  revenueData: [],
};

/** GET /dashboard/kpis — empty state real si no hay datos (sin mock engañoso). */
export async function getDashboardKpis(params: {
  branchId?: string | null;
  cycleId?: string | null;
}): Promise<FetchResult<DashboardKpis>> {
  const q = buildQuery({
    branchId: isGuid(params.branchId) ? params.branchId : undefined,
    cycleId: isGuid(params.cycleId) ? params.cycleId : undefined,
  });
  return fetchOrFallback(() => apiClient(`/dashboard/kpis${q}`), () => emptyDashboard, {
    allowFallback: true,
  });
}
