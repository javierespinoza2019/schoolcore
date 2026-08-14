import { useEffect } from 'react';
import MainLayout from '@/components/feature/MainLayout';
import { SkeletonCard } from '@/components/base/Skeleton';
import Card from '@/components/base/Card';
import KPICard from './components/KPICard';
import RevenueChart from './components/RevenueChart';
import RecentActivity from './components/RecentActivity';
import MiniCalendar from './components/MiniCalendar';
import { useAuth } from '@/auth/AuthContext';
import { useSchoolContext } from '@/context/SchoolContext';
import { useApiResource } from '@/hooks/useApiResource';
import { queryKeys } from '@/api/queryKeys';
import { getDashboardKpis } from '@/api/dashboardApi';

type DistItem = { name: string; value: number; color: string };

function PaymentDistributionCard({ distribution }: { distribution: DistItem[] }) {
  const total = distribution.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card padding="md">
      <h3 className="text-sm font-semibold text-foreground-800 mb-3">Estado de Pagos</h3>
      {distribution.length === 0 || total === 0 ? (
        <p className="text-xs text-foreground-400 py-4 text-center">Sin datos de pagos aún</p>
      ) : (
        <>
          <div className="space-y-2.5">
            {distribution.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="flex-1 text-xs text-foreground-600">{item.name}</span>
                <span className="text-xs font-semibold text-foreground-800">{item.value}</span>
                <span className="text-2xs text-foreground-400 w-10 text-right">
                  {total > 0 ? ((item.value / total) * 100).toFixed(0) : '0'}%
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-secondary-100">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-secondary-100 overflow-hidden flex">
                {distribution.map((item) => (
                  <div
                    key={item.name}
                    style={{
                      width: total > 0 ? `${(item.value / total) * 100}%` : '0%',
                      backgroundColor: item.color,
                    }}
                    className="h-full transition-all duration-500"
                  />
                ))}
              </div>
            </div>
            <p className="text-3xs text-foreground-400 mt-1.5">
              {distribution[0]?.value ?? 0} al corriente de {total} alumnos
            </p>
          </div>
        </>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { branchId, cycleId, branch, cycle } = useSchoolContext();

  const dashQ = useApiResource({
    queryKey: queryKeys.dashboard.kpis({ branchId, cycleId }),
    queryFn: () => getDashboardKpis({ branchId, cycleId }),
    errorToast: 'No se pudieron cargar los KPIs del dashboard',
  });

  const kpis = dashQ.data?.kpis ?? [];
  const distribution = dashQ.data?.paymentDistribution ?? [];
  const recentActivity = dashQ.data?.recentActivity ?? [];
  const revenueData = dashQ.data?.revenueData ?? [];
  const firstName = user?.firstName || 'Usuario';

  useEffect(() => {
    // noop — query keys already include branch/cycle
  }, [branchId, cycleId]);

  return (
    <MainLayout>
      <div className="space-y-5 max-w-[1440px] mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-foreground-500 mt-0.5">
              Bienvenido/a, {firstName}
              {cycle ? (
                <>
                  {' '}
                  — <span className="text-foreground-600 font-medium">{cycle.name}</span>
                </>
              ) : null}
            </p>
          </div>
          {branch && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background-50 border border-secondary-200 text-xs text-foreground-600 whitespace-nowrap">
              <i className="ri-store-2-line text-sm" />
              <span>{branch.name}</span>
            </div>
          )}
        </div>

        {dashQ.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : kpis.length === 0 ? (
          <Card padding="md">
            <p className="text-xs text-foreground-400 py-6 text-center">
              Sin KPIs disponibles aún. Los indicadores se calcularán cuando haya datos operativos.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => (
              <div
                key={kpi.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
              >
                <KPICard
                  {...kpi}
                  trend={(kpi.trend as 'up' | 'down' | 'neutral') || 'neutral'}
                />
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <MiniCalendar />
          </div>
          <div>
            <PaymentDistributionCard distribution={distribution} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-3">
            <RecentActivity items={recentActivity} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-3">
            <RevenueChart data={revenueData} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
