import { apiClient } from '@/api/apiClient';
import { buildQuery, isGuid } from '@/api/helpers';
import type { FetchResult } from '@/api/types';
import { isDevelopment } from '@/config/env';

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

/** GET /dashboard/kpis — datos reales desde API (empty state si vacío). */
export async function getDashboardKpis(params: {
  branchId?: string | null;
  cycleId?: string | null;
}): Promise<FetchResult<DashboardKpis>> {
  const q = buildQuery({
    branchId: isGuid(params.branchId) ? params.branchId : undefined,
    cycleId: isGuid(params.cycleId) ? params.cycleId : undefined,
  });
  const res = await apiClient<DashboardKpis>(`/dashboard/kpis${q}`);
  if (res.success && res.data) {
    return {
      data: {
        kpis: res.data.kpis ?? [],
        paymentDistribution: res.data.paymentDistribution ?? [],
        recentActivity: res.data.recentActivity ?? [],
        revenueData: res.data.revenueData ?? [],
      },
      source: 'api',
      message: res.message,
    };
  }
  if (isDevelopment) {
    return { data: emptyDashboard, source: 'fallback', message: res.message };
  }
  throw new Error(res.message || 'No se pudieron cargar los KPIs');
}
