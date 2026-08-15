import { useCallback, useMemo, useState } from 'react';
import MainLayout from '@/components/feature/MainLayout';
import Card from '@/components/base/Card';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import EmptyState from '@/components/base/EmptyState';
import { useToast } from '@/components/base/Toast';
import KPIOverview from '@/pages/reportes/components/KPIOverview';
import ReportFilters from '@/pages/reportes/components/ReportFilters';
import DrillDownModal from '@/pages/reportes/components/DrillDownModal';
import { useSchoolContext } from '@/context/SchoolContext';
import { useApiResource } from '@/hooks/useApiResource';
import { queryKeys } from '@/api/queryKeys';
import {
  emptyReportsBundle,
  exportReport,
  getReportsData,
  tiposReporte,
  type ReportsBundle,
} from '@/api/reportsApi';
import { isGuid } from '@/api/helpers';

type DrillDownTipo = 'conceptos' | 'alumnos' | 'morosidad' | 'sucursal';

function formatMXN(n: number): string {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 });
}

function formatPct(n: number): string {
  return `${n}%`;
}

function defaultMonthRange(): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const fromDate = new Date(y, now.getMonth() - 5, 1);
  return {
    from: `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}`,
    to: `${y}-${m}`,
  };
}

function ChartEmpty({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center mb-3">
        <i className="ri-bar-chart-box-line text-xl text-foreground-400" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-foreground-700">{title}</p>
      <p className="text-xs text-foreground-500 mt-1 max-w-sm">
        Cuando haya movimientos reales en este periodo, verás las gráficas aquí. No se muestran datos de demostración.
      </p>
    </div>
  );
}

export default function Reportes() {
  const initial = defaultMonthRange();
  const [reporteActivo, setReporteActivo] = useState('ingresos');
  const [sucursalFiltro, setSucursalFiltro] = useState('todas');
  const [periodoDesde, setPeriodoDesde] = useState(initial.from);
  const [periodoHasta, setPeriodoHasta] = useState(initial.to);
  const [exporting, setExporting] = useState(false);
  const { showToast } = useToast();
  const { branchId, cycleId } = useSchoolContext();

  const effectiveBranchId = sucursalFiltro === 'todas' ? branchId : sucursalFiltro;

  const reportsQ = useApiResource({
    queryKey: queryKeys.reports.data({
      branchId: effectiveBranchId,
      cycleId,
      reportType: reporteActivo,
      from: periodoDesde,
      to: periodoHasta,
    }),
    queryFn: () =>
      getReportsData({
        branchId: isGuid(effectiveBranchId) ? effectiveBranchId : null,
        cycleId,
        reportType: reporteActivo,
        from: periodoDesde,
        to: periodoHasta,
      }),
    errorToast: 'Error al cargar reportes',
  });

  const data: ReportsBundle = reportsQ.data ?? emptyReportsBundle;
  const kpi = data.kpi;
  const loading = reportsQ.isFetching;

  const [drillOpen, setDrillOpen] = useState(false);
  const [drillTitle, setDrillTitle] = useState('');
  const [drillSubtitle, setDrillSubtitle] = useState('');
  const [drillTipo, setDrillTipo] = useState<DrillDownTipo>('conceptos');
  const [drillData, setDrillData] = useState<unknown[]>([]);

  const openDrillDown = useCallback((tipo: DrillDownTipo, titulo: string, subtitulo: string, rows: unknown[]) => {
    if (!rows.length) {
      showToast('No hay detalle para este periodo', 'info');
      return;
    }
    setDrillTipo(tipo);
    setDrillTitle(titulo);
    setDrillSubtitle(subtitulo);
    setDrillData(rows);
    setDrillOpen(true);
  }, [showToast]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const ok = await exportReport({
        branchId: isGuid(effectiveBranchId) ? effectiveBranchId : null,
        cycleId,
        reportType: reporteActivo,
        from: periodoDesde,
        to: periodoHasta,
        format: 'xlsx',
      });
      if (ok) showToast('Reporte exportado', 'success');
      else showToast('No se pudo exportar el reporte desde el servidor', 'error');
    } finally {
      setExporting(false);
    }
  }, [cycleId, effectiveBranchId, periodoDesde, periodoHasta, reporteActivo, showToast]);

  const sparkIngresos = data.ingresosMensuales.map((r) => r.ingresos);
  const sparkAlumnos = data.alumnosPorNivel.map((r) => r.alumnos);
  const sparkMorosidad = data.morosidadPorNivel.map((r) => r.porcentaje);

  const kpiCards = useMemo(
    () => [
      {
        label: 'Ingresos del periodo',
        value: formatMXN(kpi.ingresosTotales),
        change: kpi.ingresosVariacion == null ? 'Sin comparativa histórica' : `${kpi.ingresosVariacion}%`,
        positive: true,
        icon: 'ri-money-dollar-circle-line',
        iconColor: 'text-primary-500',
        sparklineData: sparkIngresos,
        sparklineColor: 'oklch(var(--primary-500))',
        onClick: () => setReporteActivo('ingresos'),
      },
      {
        label: 'Alumnos activos',
        value: kpi.alumnosActivos.toLocaleString('es-MX'),
        change: kpi.alumnosVariacion == null ? 'Según ciclo/sucursal seleccionados' : `${kpi.alumnosVariacion}%`,
        positive: true,
        icon: 'ri-user-star-line',
        iconColor: 'text-emerald-500',
        sparklineData: sparkAlumnos,
        sparklineColor: '#10b981',
        onClick: () => setReporteActivo('alumnos'),
      },
      {
        label: 'Morosidad',
        value: formatMXN(kpi.morosidadTotal),
        change:
          kpi.morosidadAlumnos > 0
            ? `${kpi.morosidadAlumnos} cargos · ${formatPct(kpi.morosidadPorcentaje)} s/ingresos`
            : 'Sin cargos vencidos',
        positive: kpi.morosidadTotal === 0,
        icon: 'ri-error-warning-line',
        iconColor: 'text-amber-500',
        sparklineData: sparkMorosidad,
        sparklineColor: '#f59e0b',
        onClick: () => setReporteActivo('morosidad'),
      },
      {
        label: 'Nuevos inscritos',
        value: kpi.nuevosInscritos == null ? '—' : String(kpi.nuevosInscritos),
        change: 'Indicador no disponible en MVP',
        positive: true,
        icon: 'ri-user-add-line',
        iconColor: 'text-accent-500',
        sparklineData: [],
        sparklineColor: 'oklch(var(--accent-500))',
        onClick: () => setReporteActivo('alumnos'),
      },
    ],
    [kpi, sparkAlumnos, sparkIngresos, sparkMorosidad]
  );

  const maxIngreso = Math.max(1, ...data.ingresosMensuales.map((d) => Math.max(d.ingresos, d.egresos)));
  const maxAlumnos = Math.max(1, ...data.alumnosPorNivel.map((d) => d.alumnos));
  const totalPagos = data.pagosPorMetodo.reduce((s, d) => s + d.monto, 0);
  const totalConceptos = data.conceptosIngreso.reduce((s, d) => s + d.monto, 0);

  let acumulado = 0;
  const segmentosPagos = data.pagosPorMetodo.map((d) => {
    const start = acumulado;
    acumulado += totalPagos > 0 ? (d.monto / totalPagos) * 100 : 0;
    return { ...d, start, end: acumulado };
  });

  const renderTab = () => {
    if (reporteActivo === 'ingresos') {
      if (data.ingresosMensuales.length === 0) return <ChartEmpty title="Sin ingresos ni egresos en el periodo" />;
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-2" padding="lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground-900">Ingresos vs Egresos</h3>
                <p className="text-xs text-foreground-500 mt-0.5">
                  {periodoDesde} → {periodoHasta}
                </p>
              </div>
              <Badge variant="default" size="sm">
                API
              </Badge>
            </div>
            <div className="flex items-end gap-2 h-48">
              {data.ingresosMensuales.map((d) => (
                <div key={d.mes} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div className="w-full flex items-end gap-0.5 h-40">
                    <div
                      className="flex-1 bg-primary-400 rounded-t-sm min-h-[2px]"
                      style={{ height: `${(d.ingresos / maxIngreso) * 100}%` }}
                      title={`Ingresos ${formatMXN(d.ingresos)}`}
                    />
                    <div
                      className="flex-1 bg-rose-300 rounded-t-sm min-h-[2px]"
                      style={{ height: `${(d.egresos / maxIngreso) * 100}%` }}
                      title={`Egresos ${formatMXN(d.egresos)}`}
                    />
                  </div>
                  <span className="text-3xs text-foreground-400">{d.mes}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-3xs text-foreground-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-primary-400" /> Ingresos
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-rose-300" /> Egresos
              </span>
            </div>
          </Card>
          <Card padding="lg">
            <h3 className="text-sm font-semibold text-foreground-900 mb-3">Por concepto</h3>
            {data.conceptosIngreso.length === 0 ? (
              <p className="text-xs text-foreground-400 py-8 text-center">Sin conceptos cobrados</p>
            ) : (
              <div className="space-y-2">
                {data.conceptosIngreso.slice(0, 8).map((c) => (
                  <button
                    key={c.concepto}
                    type="button"
                    className="w-full flex items-center gap-2 text-left cursor-pointer hover:bg-background-100 rounded-md px-1 py-1"
                    onClick={() =>
                      openDrillDown('conceptos', 'Ingresos por concepto', periodoDesde, data.conceptosIngreso)
                    }
                  >
                    <span className={`w-2 h-2 rounded-full ${c.color}`} />
                    <span className="flex-1 text-xs text-foreground-700 truncate">{c.concepto}</span>
                    <span className="text-xs font-medium text-foreground-900">{formatMXN(c.monto)}</span>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      );
    }

    if (reporteActivo === 'alumnos') {
      if (data.alumnosPorNivel.length === 0) return <ChartEmpty title="Sin matrícula para este contexto" />;
      return (
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground-900">Alumnos por nivel</h3>
            <Button
              variant="ghost"
              size="xs"
              onClick={() =>
                openDrillDown(
                  'alumnos',
                  'Matrícula por nivel',
                  '',
                  data.alumnosPorNivel.map((n) => ({
                    grado: n.nivel,
                    alumnos: n.alumnos,
                    color: n.color,
                  }))
                )
              }
            >
              Ver detalle
            </Button>
          </div>
          <div className="space-y-3">
            {data.alumnosPorNivel.map((n) => (
              <div key={n.nivel}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-foreground-700">{n.nivel}</span>
                  <span className="font-medium text-foreground-900">{n.alumnos}</span>
                </div>
                <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${n.color}`}
                    style={{ width: `${(n.alumnos / maxAlumnos) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {data.retencionPorGrado.length === 0 && (
            <p className="text-xs text-foreground-400 mt-4 border-t border-secondary-100 pt-3">
              Retención por grado no está disponible en el MVP.
            </p>
          )}
        </Card>
      );
    }

    if (reporteActivo === 'morosidad') {
      if (data.morosidadPorNivel.length === 0 && data.morosidadItems.length === 0) {
        return <ChartEmpty title="Sin morosidad registrada" />;
      }
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card padding="lg">
            <h3 className="text-sm font-semibold text-foreground-900 mb-4">Morosidad por nivel</h3>
            {data.morosidadPorNivel.length === 0 ? (
              <p className="text-xs text-foreground-400 py-8 text-center">Sin agregados por nivel</p>
            ) : (
              <div className="space-y-3">
                {data.morosidadPorNivel.map((m) => (
                  <div key={m.nivel} className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-foreground-800">{m.nivel}</p>
                      <p className="text-foreground-400">{m.alumnos} cargos · {formatPct(m.porcentaje)}</p>
                    </div>
                    <span className="font-semibold text-foreground-900">{formatMXN(m.monto)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground-900">Cargos vencidos</h3>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => openDrillDown('morosidad', 'Detalle de morosidad', '', data.morosidadItems)}
              >
                Ver lista
              </Button>
            </div>
            {data.morosidadItems.length === 0 ? (
              <p className="text-xs text-foreground-400 py-8 text-center">Sin cargos vencidos</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {data.morosidadItems.slice(0, 12).map((item, i) => (
                  <div key={`${item.nombre}-${i}`} className="flex items-center justify-between text-xs border-b border-secondary-50 pb-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground-800 truncate">{item.nombre}</p>
                      <p className="text-foreground-400">{item.grado}</p>
                    </div>
                    <span className="font-semibold text-amber-700">{formatMXN(item.monto)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      );
    }

    if (reporteActivo === 'pagos') {
      if (data.pagosPorMetodo.length === 0) return <ChartEmpty title="Sin pagos en el periodo" />;
      return (
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-foreground-900 mb-4">Métodos de pago</h3>
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            <div
              className="w-40 h-40 rounded-full"
              style={{
                background: `conic-gradient(${segmentosPagos
                  .map((s, i) => {
                    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ef4444'];
                    return `${colors[i % colors.length]} ${s.start}% ${s.end}%`;
                  })
                  .join(', ')})`,
              }}
              aria-hidden="true"
            />
            <div className="flex-1 space-y-2 w-full">
              {data.pagosPorMetodo.map((p) => (
                <div key={p.metodo} className="flex items-center justify-between text-xs">
                  <span className="text-foreground-700">{p.metodo}</span>
                  <span className="text-foreground-500">
                    {p.transacciones} · {formatPct(p.porcentaje)}
                  </span>
                  <span className="font-semibold text-foreground-900">{formatMXN(p.monto)}</span>
                </div>
              ))}
              <p className="text-xs text-foreground-400 pt-2 border-t border-secondary-100">
                Total: {formatMXN(totalPagos)}
              </p>
            </div>
          </div>
        </Card>
      );
    }

    if (reporteActivo === 'conceptos') {
      if (data.conceptosIngreso.length === 0) return <ChartEmpty title="Sin ingresos por concepto" />;
      return (
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground-900">Ingresos por concepto</h3>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => openDrillDown('conceptos', 'Conceptos', '', data.conceptosIngreso)}
            >
              Detalle
            </Button>
          </div>
          <div className="space-y-3">
            {data.conceptosIngreso.map((c) => {
              const pct = totalConceptos > 0 ? (c.monto / totalConceptos) * 100 : 0;
              return (
                <div key={c.concepto}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-foreground-700 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${c.color}`} />
                      {c.concepto}
                    </span>
                    <span className="font-medium">{formatMXN(c.monto)}</span>
                  </div>
                  <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${c.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      );
    }

    if (reporteActivo === 'sucursales') {
      if (data.alumnosPorSucursal.length === 0) return <ChartEmpty title="Sin datos por sucursal" />;
      return (
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-foreground-900 mb-4">Resumen por sucursal</h3>
          <div className="overflow-x-auto">
            <table className="w-full responsive-table">
              <thead>
                <tr className="border-b border-secondary-200/70">
                  <th className="px-3 py-2 text-xs font-semibold text-foreground-500 text-left" scope="col">
                    Sucursal
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold text-foreground-500 text-right" scope="col">
                    Alumnos
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold text-foreground-500 text-right" scope="col">
                    Ingresos
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold text-foreground-500 text-right" scope="col">
                    Morosidad %
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.alumnosPorSucursal.map((s) => (
                  <tr key={s.sucursal} className="border-b border-secondary-100/70 last:border-0">
                    <td className="px-3 py-2.5 text-sm text-foreground-800" data-label="Sucursal">
                      {s.sucursal}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-right font-medium" data-label="Alumnos">
                      {s.alumnos}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-right" data-label="Ingresos">
                      {formatMXN(s.ingresos)}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-right" data-label="Morosidad">
                      {formatPct(s.morosidad)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-3xs text-foreground-400 mt-3">
            Profesores / salones / capacidad no se calculan en este reporte MVP.
          </p>
        </Card>
      );
    }

    return (
      <EmptyState
        icon="ri-file-chart-line"
        title="Reporte no disponible"
        description="Selecciona otro tipo de reporte."
      />
    );
  };

  return (
    <MainLayout>
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-lg font-bold text-foreground-900 tracking-tight">Reportes</h1>
            <p className="text-xs text-foreground-500 mt-0.5">
              Datos del servidor · {reportsQ.source === 'api' ? 'API' : 'sin datos'}
              {loading ? ' · actualizando…' : ''}
            </p>
          </div>
        </div>

        <div className="mb-5">
          <KPIOverview cards={kpiCards} />
        </div>

        <div className="flex flex-col gap-3 mb-5">
          <div className="flex items-center gap-1.5 bg-background-100 rounded-lg p-1 flex-wrap" role="tablist" aria-label="Tipos de reporte">
            {tiposReporte.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={reporteActivo === t.id}
                onClick={() => setReporteActivo(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  reporteActivo === t.id
                    ? 'bg-background-50 text-foreground-900 shadow-sm'
                    : 'text-foreground-500 hover:text-foreground-700'
                }`}
              >
                <i className={`${t.icon} text-sm`} aria-hidden="true" />
                {t.label}
              </button>
            ))}
          </div>

          <ReportFilters
            sucursalFiltro={sucursalFiltro}
            setSucursalFiltro={setSucursalFiltro}
            periodoDesde={periodoDesde}
            setPeriodoDesde={setPeriodoDesde}
            periodoHasta={periodoHasta}
            setPeriodoHasta={setPeriodoHasta}
            reporteActivo={reporteActivo}
            onExport={() => void handleExport()}
            onPrint={() => window.print()}
            exporting={exporting}
          />
        </div>

        <div className={`transition-opacity duration-200 ${loading ? 'opacity-60' : 'opacity-100'}`}>{renderTab()}</div>
      </div>

      <DrillDownModal
        open={drillOpen}
        onClose={() => setDrillOpen(false)}
        title={drillTitle}
        subtitle={drillSubtitle}
        tipo={drillTipo}
        data={drillData as never[]}
      />
    </MainLayout>
  );
}
