import { useState, useCallback, useRef, useEffect } from 'react';
import MainLayout from '@/components/feature/MainLayout';
import Card from '@/components/base/Card';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import { useToast } from '@/components/base/Toast';
import KPIOverview from '@/pages/reportes/components/KPIOverview';
import ReportFilters, { generateCSV } from '@/pages/reportes/components/ReportFilters';
import DrillDownModal from '@/pages/reportes/components/DrillDownModal';
import {
  reportesKPI,
  ingresosSparkline,
  alumnosSparkline,
  morosidadSparkline,
  inscritosSparkline,
  ingresosMensuales,
  ingresosMensualesAnterior,
  alumnosPorNivel,
  alumnosPorSucursal,
  pagosPorMetodo,
  morosidadPorNivel,
  conceptosIngreso,
  retencionPorGrado,
  tiposReporte,
  drillDownIngresosPorConcepto,
  drillDownAlumnosPorGrado,
  drillDownMorosidadAlumnos,
} from '@/mocks/reportes';
import { useSchoolContext } from '@/context/SchoolContext';
import { useApiResource } from '@/hooks/useApiResource';
import { queryKeys } from '@/api/queryKeys';
import { exportReport, getReportsData } from '@/api/reportsApi';

type DrillDownTipo = 'conceptos' | 'alumnos' | 'morosidad' | 'sucursal';

function formatMXN(n: number): string {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 });
}

function formatPct(n: number): string {
  return `${n}%`;
}

export default function Reportes() {
  const [reporteActivo, setReporteActivo] = useState('ingresos');
  const [sucursalFiltro, setSucursalFiltro] = useState('todas');
  const [periodoDesde, setPeriodoDesde] = useState('2026-01');
  const [periodoHasta, setPeriodoHasta] = useState('2026-07');
  const [comparativa, setComparativa] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const { branchId, cycleId } = useSchoolContext();

  const reportsQ = useApiResource({
    queryKey: queryKeys.reports.data({
      branchId,
      cycleId,
      reportType: reporteActivo,
      from: periodoDesde,
      to: periodoHasta,
      compare: comparativa,
    }),
    queryFn: () =>
      getReportsData({
        branchId: sucursalFiltro === 'todas' ? branchId : sucursalFiltro,
        cycleId,
        reportType: reporteActivo,
        from: periodoDesde,
        to: periodoHasta,
        compare: comparativa,
      }),
    errorToast: 'Error al cargar reportes',
  });

  const kpi = reportsQ.data?.kpi ?? reportesKPI;
  const chartIngresos = reportsQ.data?.ingresosMensuales ?? ingresosMensuales;

  useEffect(() => {
    // sync loading flag with query
    setLoading(reportsQ.isFetching);
  }, [reportsQ.isFetching]);

  const [drillOpen, setDrillOpen] = useState(false);
  const [drillTitle, setDrillTitle] = useState('');
  const [drillSubtitle, setDrillSubtitle] = useState('');
  const [drillTipo, setDrillTipo] = useState<DrillDownTipo>('conceptos');
  const [drillData, setDrillData] = useState<any[]>([]);

  const [hoveredBar, setHoveredBar] = useState<{ x: number; y: number; label: string; value: string; sub?: string } | null>(null);

  const openDrillDown = useCallback((tipo: DrillDownTipo, titulo: string, subtitulo: string, data: any[]) => {
    setDrillTipo(tipo);
    setDrillTitle(titulo);
    setDrillSubtitle(subtitulo);
    setDrillData(data);
    setDrillOpen(true);
  }, []);

  const closeDrillDown = useCallback(() => setDrillOpen(false), []);

  const cambiarReporte = (id: string) => {
    setLoading(true);
    setReporteActivo(id);
    setTimeout(() => setLoading(false), 350);
  };

  const handleExportCSV = useCallback(async () => {
    const ok = await exportReport({
      branchId: sucursalFiltro === 'todas' ? branchId : sucursalFiltro,
      cycleId,
      reportType: reporteActivo,
      from: periodoDesde,
      to: periodoHasta,
      format: 'csv',
    });
    if (ok) {
      showToast('Reporte exportado', 'success');
      return;
    }
    const csv = generateCSV(reporteActivo);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const nombreReporte = tiposReporte.find((t) => t.id === reporteActivo)?.label || 'reporte';
    link.download = `${nombreReporte.replace(/\s+/g, '_')}_${periodoDesde}_${periodoHasta}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Export local (endpoint /reports/export no disponible)', 'info');
  }, [branchId, cycleId, periodoDesde, periodoHasta, reporteActivo, showToast, sucursalFiltro]);

  const handlePrint = useCallback(() => {
    showToast('Abriendo vista de impresión...', 'info');
    window.print();
  }, [showToast]);

  const maxIngreso = Math.max(
    ...chartIngresos.map((d) => Math.max(d.ingresos, d.meta, d.egresos)),
    ...(comparativa ? ingresosMensualesAnterior.map((d) => Math.max(d.ingresos, d.meta, d.egresos)) : [])
  );
  const maxAlumnos = Math.max(...alumnosPorNivel.map((d) => d.alumnos));
  const maxRetencion = 100;

  const totalPagosMetodo = pagosPorMetodo.reduce((s, d) => s + d.monto, 0);
  let acumulado = 0;
  const segmentosPagos = pagosPorMetodo.map((d) => {
    const start = acumulado;
    acumulado += (d.monto / totalPagosMetodo) * 100;
    return { ...d, start, end: acumulado };
  });

  const kpiCards = [
    {
      label: 'Ingresos Acumulados',
      value: formatMXN(kpi.ingresosTotales),
      change: `+${kpi.ingresosVariacion}% vs año anterior`,
      positive: true,
      icon: 'ri-money-dollar-circle-line',
      iconColor: 'text-primary-500',
      sparklineData: ingresosSparkline,
      sparklineColor: 'oklch(var(--primary-500))',
      onClick: () => cambiarReporte('ingresos'),
    },
    {
      label: 'Alumnos Activos',
      value: kpi.alumnosActivos.toLocaleString(),
      change: `+${kpi.alumnosVariacion}% vs ciclo anterior`,
      positive: true,
      icon: 'ri-user-star-line',
      iconColor: 'text-emerald-500',
      sparklineData: alumnosSparkline,
      sparklineColor: '#10b981',
      onClick: () => cambiarReporte('alumnos'),
    },
    {
      label: 'Tasa de Morosidad',
      value: formatPct(kpi.morosidadPorcentaje),
      change: `${kpi.morosidadVariacion > 0 ? '+' : ''}${kpi.morosidadVariacion}pp`,
      positive: kpi.morosidadVariacion <= 0,
      icon: 'ri-error-warning-line',
      iconColor: 'text-amber-500',
      sparklineData: morosidadSparkline,
      sparklineColor: '#f59e0b',
      onClick: () => cambiarReporte('morosidad'),
    },
    {
      label: 'Nuevos Inscritos',
      value: kpi.nuevosInscritos.toString(),
      change: `+${kpi.nuevosVariacion}% vs ciclo anterior`,
      positive: true,
      icon: 'ri-user-add-line',
      iconColor: 'text-accent-500',
      sparklineData: inscritosSparkline,
      sparklineColor: 'oklch(var(--accent-500))',
      onClick: () => cambiarReporte('alumnos'),
    },
  ];

  const renderBarTooltip = (x: number, y: number, label: string, value: string, sub?: string) => {
    const left = Math.min(x, 640);
    return (
      <div
        className="absolute z-20 bg-foreground-900 text-background-50 text-2xs px-2.5 py-1.5 rounded-lg pointer-events-none whitespace-nowrap shadow-lg"
        style={{ left: `${left}px`, top: `${y - 38}px`, transform: 'translateX(-50%)' }}
      >
        <p className="font-semibold">{label}</p>
        <p className="text-background-300">{value}</p>
        {sub && <p className="text-background-400 text-3xs">{sub}</p>}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-lg font-bold text-foreground-900 tracking-tight">Reportes</h1>
            <p className="text-xs text-foreground-500 mt-0.5">Análisis detallado del desempeño institucional</p>
          </div>
        </div>

        <div className="mb-5">
          <KPIOverview cards={kpiCards} />
        </div>

        <div className="flex flex-col gap-3 mb-5">
          <div className="flex items-center gap-1.5 bg-background-100 rounded-lg p-1 flex-wrap">
            {tiposReporte.map((t) => (
              <button
                key={t.id}
                onClick={() => cambiarReporte(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  reporteActivo === t.id
                    ? 'bg-background-50 text-foreground-900 shadow-sm'
                    : 'text-foreground-500 hover:text-foreground-700'
                }`}
              >
                <i className={`${t.icon} text-sm`} />
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
            comparativa={comparativa}
            setComparativa={setComparativa}
            reporteActivo={reporteActivo}
            onExportCSV={handleExportCSV}
            onPrint={handlePrint}
          />
        </div>

        <div className={`transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          {reporteActivo === 'ingresos' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <Card className="lg:col-span-2" padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground-900">
                      {comparativa ? 'Ingresos 2026 vs 2025' : 'Ingresos vs Egresos Mensuales'}
                    </h3>
                    <p className="text-xs text-foreground-500 mt-0.5">Acumulado enero - diciembre 2026</p>
                  </div>
                  <div className="flex items-center gap-3 text-2xs">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary-500" /> Ingresos</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400" /> Egresos</span>
                    {comparativa && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary-300/60" /> 2025</span>}
                    {!comparativa && <span className="flex items-center gap-1"><span className="w-0 h-4 border-l-2 border-dashed border-foreground-300" /> Meta</span>}
                  </div>
                </div>
                <div className="relative" style={{ height: '280px' }}>
                  <svg viewBox="0 0 740 280" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                    {[0, 25, 50, 75, 100].map((pct, i) => (
                      <g key={i}>
                        <line x1="40" y1={20 + (220 * (1 - pct / 100))} x2="730" y2={20 + (220 * (1 - pct / 100))} stroke="#e5e7eb" strokeWidth="1" />
                        <text x="34" y={24 + (220 * (1 - pct / 100))} textAnchor="end" fill="#9ca3af" fontSize="9">
                          ${((maxIngreso / 1000) * pct / 100).toFixed(0)}k
                        </text>
                      </g>
                    ))}
                    {ingresosMensuales.map((d, i) => {
                      const step = (730 - 45) / (ingresosMensuales.length - 1);
                      const x = 45 + i * step;
                      const barW = comparativa ? 10 : 18;
                      const ih = (d.ingresos / maxIngreso) * 220;
                      const eh = (d.egresos / maxIngreso) * 220;
                      const mh = (d.meta / maxIngreso) * 220;
                      const prev = comparativa ? ingresosMensualesAnterior[i] : null;
                      const pih = prev ? (prev.ingresos / maxIngreso) * 220 : 0;
                      return (
                        <g key={i}>
                          <rect
                            x={comparativa ? x - barW - 5 : x - barW - 2}
                            y={240 - ih}
                            width={barW}
                            height={ih}
                            rx="3"
                            fill="oklch(var(--primary-500))"
                            opacity="0.85"
                            className="cursor-pointer hover:opacity-100 transition-opacity"
                            onClick={() => {
                              const detalle = drillDownIngresosPorConcepto[d.mes];
                              if (detalle) openDrillDown('conceptos', `Desglose de Ingresos — ${d.mes} 2026`, `Total: ${formatMXN(d.ingresos)}`, detalle);
                            }}
                            onMouseEnter={(e) => setHoveredBar({ x: e.clientX, y: e.clientY, label: `${d.mes} Ingresos`, value: formatMXN(d.ingresos) })}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            <title>{d.mes} Ingresos: {formatMXN(d.ingresos)}</title>
                          </rect>
                          <rect
                            x={comparativa ? x + 3 : x + 2}
                            y={240 - eh}
                            width={barW}
                            height={eh}
                            rx="3"
                            fill="#fb7185"
                            opacity="0.75"
                            className="cursor-pointer hover:opacity-90 transition-opacity"
                            onMouseEnter={(e) => setHoveredBar({ x: e.clientX, y: e.clientY, label: `${d.mes} Egresos`, value: formatMXN(d.egresos) })}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            <title>{d.mes} Egresos: {formatMXN(d.egresos)}</title>
                          </rect>
                          {comparativa && prev && (
                            <rect
                              x={x - barW - 5}
                              y={240 - pih}
                              width={barW}
                              height={pih}
                              rx="3"
                              fill="oklch(var(--primary-500) / 0.35)"
                              className="cursor-pointer hover:opacity-50 transition-opacity"
                            >
                              <title>{d.mes} 2025: {formatMXN(prev.ingresos)}</title>
                            </rect>
                          )}
                          {!comparativa && (
                            <line x1={x - barW - 4} y1={240 - mh} x2={x + barW + 4} y2={240 - mh} stroke="#9ca3af" strokeWidth="1" strokeDasharray="4,3" />
                          )}
                          <text x={x} y={258} textAnchor="middle" fill="#6b7280" fontSize="9">{d.mes}</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <p className="text-2xs text-foreground-400 mt-2 text-center">Haz clic en cualquier barra de ingresos para ver el desglose por concepto</p>
              </Card>

              <Card padding="lg">
                <h3 className="text-sm font-semibold text-foreground-900 mb-4">Ingresos por Concepto</h3>
                <div className="space-y-3">
                  {conceptosIngreso.map((c, i) => {
                    const pct = ((c.monto / reportesKPI.ingresosTotales) * 100).toFixed(1);
                    return (
                      <div key={i} className="cursor-pointer group" onClick={() => {
                        const detalle = drillDownIngresosPorConcepto['Jul'];
                        if (detalle) {
                          const filtrado = detalle.filter((d) => d.concepto === c.concepto);
                          openDrillDown('conceptos', `Detalle: ${c.concepto}`, `Total acumulado: ${formatMXN(c.monto)}`, filtrado.length > 0 ? filtrado : [{ concepto: c.concepto, monto: c.monto, color: c.color }]);
                        }
                      }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-foreground-700 group-hover:text-foreground-900 transition-colors">{c.concepto}</span>
                          <span className="text-xs font-medium text-foreground-900">{formatMXN(c.monto)} <span className="text-foreground-400">({pct}%)</span></span>
                        </div>
                        <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 group-hover:opacity-80 ${c.color}`} style={{ width: `${Math.max(parseFloat(pct), 4)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {reporteActivo === 'alumnos' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card padding="lg">
                <h3 className="text-sm font-semibold text-foreground-900 mb-4">Alumnos por Nivel Educativo</h3>
                <div className="space-y-3">
                  {alumnosPorNivel.map((n, i) => {
                    const pct = ((n.alumnos / reportesKPI.alumnosActivos) * 100).toFixed(1);
                    return (
                      <div
                        key={i}
                        className="cursor-pointer group"
                        onClick={() => {
                          const detalle = drillDownAlumnosPorGrado[n.nivel];
                          if (detalle) openDrillDown('alumnos', `Desglose: ${n.nivel}`, `${n.alumnos} alumnos — ${pct}% del total`, detalle);
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-foreground-700 group-hover:text-foreground-900 transition-colors">{n.nivel}</span>
                          <span className="text-xs font-medium text-foreground-900">{n.alumnos.toLocaleString()} alumnos <span className="text-foreground-400">({pct}%)</span></span>
                        </div>
                        <div className="h-3 bg-secondary-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 group-hover:opacity-80 ${n.color}`} style={{ width: `${Math.max(parseFloat(pct), 4)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-2xs text-foreground-400 mt-3 text-center">Haz clic en cualquier nivel para ver el desglose por grado</p>
              </Card>

              <Card padding="lg">
                <h3 className="text-sm font-semibold text-foreground-900 mb-4">Tasa de Retención por Grado</h3>
                <div className="relative" style={{ height: '280px' }}>
                  <svg viewBox="0 0 400 280" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                    {[0, 25, 50, 75, 100].map((pct, i) => (
                      <g key={i}>
                        <line x1="10" y1={30 + (220 * (1 - pct / 100))} x2="390" y2={30 + (220 * (1 - pct / 100))} stroke="#e5e7eb" strokeWidth="1" />
                        <text x="6" y={34 + (220 * (1 - pct / 100))} textAnchor="end" fill="#9ca3af" fontSize="8">{pct}%</text>
                      </g>
                    ))}
                    {retencionPorGrado.map((r, i, arr) => {
                      const x = 35 + i * ((390 - 35) / (arr.length - 1));
                      const barW = 22;
                      const rh = (r.retencion / maxRetencion) * 220;
                      const nh = Math.max(r.nuevos * 1.2, 3);
                      return (
                        <g key={i}>
                          <rect
                            x={x - barW / 2 - 1}
                            y={250 - rh}
                            width={barW / 2}
                            height={rh}
                            rx="2"
                            fill="oklch(var(--primary-500))"
                            opacity="0.8"
                            className="cursor-pointer hover:opacity-100 transition-opacity"
                            onMouseEnter={(e) => setHoveredBar({ x: e.clientX, y: e.clientY, label: r.grado, value: `Retención: ${r.retencion}%`, sub: `${r.nuevos} nuevos` })}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            <title>{r.grado}: {r.retencion}%</title>
                          </rect>
                          <rect
                            x={x + 1}
                            y={250 - nh}
                            width={barW / 2}
                            height={nh}
                            rx="2"
                            fill="oklch(var(--accent-500))"
                            opacity="0.55"
                          >
                            <title>{r.grado} Nuevos: {r.nuevos}</title>
                          </rect>
                          <text x={x} y={268} textAnchor="middle" fill="#6b7280" fontSize="7" transform={`rotate(-30, ${x}, 268)`}>{r.grado}</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <div className="flex items-center gap-3 text-2xs mt-2 justify-center">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary-500/80" /> Retención %</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-accent-500/55" /> Nuevos</span>
                </div>
              </Card>
            </div>
          )}

          {reporteActivo === 'morosidad' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <Card className="lg:col-span-2" padding="lg">
                <h3 className="text-sm font-semibold text-foreground-900 mb-4">Morosidad por Nivel Educativo</h3>
                <div className="space-y-4">
                  {morosidadPorNivel.map((m, i) => {
                    const pct = ((m.monto / reportesKPI.morosidadTotal) * 100).toFixed(1);
                    return (
                      <div
                        key={i}
                        className="cursor-pointer group"
                        onClick={() => openDrillDown('morosidad', `Alumnos con adeudo — ${m.nivel}`, `${m.alumnos} alumnos · ${formatMXN(m.monto)}`, drillDownMorosidadAlumnos.filter((a) => a.grado.includes(m.nivel.split(' ')[0]) || m.nivel === 'Preescolar' && a.grado.includes('Preescolar') || m.nivel === 'Universidad' && a.grado.includes('Uni')).slice(0, m.alumnos))}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-foreground-800 group-hover:text-foreground-900 transition-colors">{m.nivel}</span>
                            <Badge variant="warning" size="sm">{m.alumnos} alumnos</Badge>
                            <span className="text-2xs text-foreground-400">{m.porcentaje}% del nivel</span>
                          </div>
                          <span className="text-xs font-semibold text-foreground-900">{formatMXN(m.monto)} <span className="text-foreground-400 font-normal">({pct}%)</span></span>
                        </div>
                        <div className="h-4 bg-secondary-100 rounded-full overflow-hidden relative">
                          <div
                            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-amber-400 to-red-400 group-hover:from-amber-500 group-hover:to-red-500"
                            style={{ width: `${Math.max(parseFloat(pct), 5)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  icon="ri-list-unordered"
                  onClick={() => openDrillDown('morosidad', 'Todos los alumnos con adeudo', `${drillDownMorosidadAlumnos.length} alumnos · ${formatMXN(drillDownMorosidadAlumnos.reduce((s, a) => s + a.monto, 0))}`, drillDownMorosidadAlumnos)}
                >
                  Ver todos los alumnos con adeudo
                </Button>
              </Card>
              <Card padding="lg">
                <h3 className="text-sm font-semibold text-foreground-900 mb-4">Resumen de Morosidad</h3>
                <div className="space-y-3">
                  <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                    <p className="text-2xl font-bold text-red-600">{formatMXN(reportesKPI.morosidadTotal)}</p>
                    <p className="text-xs text-red-500 mt-0.5">Total en mora</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                    <p className="text-lg font-bold text-amber-600">{drillDownMorosidadAlumnos.length}</p>
                    <p className="text-xs text-amber-500 mt-0.5">Alumnos con adeudo</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                    <p className="text-lg font-bold text-emerald-600">{formatPct(reportesKPI.morosidadPorcentaje)}</p>
                    <p className="text-xs text-emerald-500 mt-0.5">Tasa de morosidad</p>
                  </div>
                  <div className="bg-background-100 rounded-lg p-4 border border-secondary-200/70">
                    <p className="text-xs text-foreground-500 mb-2">Meses promedio de atraso</p>
                    <p className="text-lg font-bold text-foreground-900">{(drillDownMorosidadAlumnos.reduce((s, a) => s + a.meses, 0) / drillDownMorosidadAlumnos.length).toFixed(1)}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    icon="ri-mail-send-line"
                    onClick={() => showToast(`Enviando ${drillDownMorosidadAlumnos.length} recordatorios de pago...`, 'info')}
                  >
                    Enviar recordatorios masivos
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {reporteActivo === 'pagos' && (
            <Card padding="lg">
              <h3 className="text-sm font-semibold text-foreground-900 mb-5">Distribución de Pagos por Método</h3>
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="relative" style={{ width: '220px', height: '220px' }}>
                  <svg viewBox="0 0 220 220" className="w-full h-full">
                    {segmentosPagos.map((seg, i) => {
                      const startAngle = (seg.start / 100) * 360 - 90;
                      const endAngle = (seg.end / 100) * 360 - 90;
                      const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;
                      const r = 90;
                      const cx = 110;
                      const cy = 110;
                      const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180);
                      const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180);
                      const x2 = cx + r * Math.cos((endAngle * Math.PI) / 180);
                      const y2 = cy + r * Math.sin((endAngle * Math.PI) / 180);
                      const colorMap = ['oklch(var(--primary-500))', 'oklch(var(--accent-500))', '#10b981', '#f59e0b'];
                      return (
                        <g
                          key={i}
                          className="cursor-pointer"
                          onMouseEnter={(e) => setHoveredBar({ x: e.clientX, y: e.clientY, label: seg.metodo, value: formatMXN(seg.monto), sub: `${seg.porcentaje}% · ${seg.transacciones} transacciones` })}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          <path
                            d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={colorMap[i]}
                            opacity="0.85"
                            className="hover:opacity-100 transition-opacity"
                          >
                            <title>{seg.metodo}: {formatMXN(seg.monto)} ({seg.porcentaje}%)</title>
                          </path>
                        </g>
                      );
                    })}
                    <circle cx="110" cy="110" r="52" fill="oklch(var(--background-50))" />
                    <text x="110" y="106" textAnchor="middle" fill="oklch(var(--foreground-900))" fontSize="17" fontWeight="bold">{formatMXN(totalPagosMetodo / 1000)}k</text>
                    <text x="110" y="122" textAnchor="middle" fill="oklch(var(--foreground-500))" fontSize="9">Total Pagado</text>
                  </svg>
                </div>
                <div className="flex-1 space-y-3 w-full">
                  {pagosPorMetodo.map((p, i) => {
                    const COLORS = ['bg-primary-500', 'bg-accent-500', 'bg-emerald-500', 'bg-amber-500'];
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${COLORS[i]}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-foreground-700">{p.metodo}</span>
                            <span className="text-xs font-medium text-foreground-900">{formatMXN(p.monto)}</span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <div className="h-1.5 bg-secondary-100 rounded-full overflow-hidden flex-1 mr-2">
                              <div className={`h-full rounded-full ${COLORS[i]}`} style={{ width: `${p.porcentaje}%` }} />
                            </div>
                            <span className="text-2xs text-foreground-400">{p.transacciones.toLocaleString()} trans.</span>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-foreground-500 w-10 text-right">{p.porcentaje}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          {reporteActivo === 'conceptos' && (
            <div>
              <Card padding="lg" className="mb-5">
                <h3 className="text-sm font-semibold text-foreground-900 mb-5">Desglose de Ingresos por Concepto</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {conceptosIngreso.map((c, i) => {
                    const pct = ((c.monto / reportesKPI.ingresosTotales) * 100).toFixed(1);
                    return (
                      <div
                        key={i}
                        className="bg-background-50 border border-secondary-200/70 rounded-lg p-4 cursor-pointer hover:shadow-sm transition-shadow duration-200"
                        onClick={() => {
                          const detalle = drillDownIngresosPorConcepto['Jul'];
                          if (detalle) {
                            const filtrado = detalle.filter((d) => d.concepto === c.concepto);
                            openDrillDown('conceptos', `Detalle: ${c.concepto}`, `Total acumulado: ${formatMXN(c.monto)}`, filtrado.length > 0 ? filtrado : [{ concepto: c.concepto, monto: c.monto, color: c.color }]);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${c.color}`} />
                          <span className="text-xs font-medium text-foreground-800">{c.concepto}</span>
                        </div>
                        <p className="text-lg font-bold text-foreground-900">{formatMXN(c.monto)}</p>
                        <p className="text-2xs text-foreground-500">{pct}% del total</p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {reporteActivo === 'sucursales' && (
            <div>
              <Card padding="lg">
                <h3 className="text-sm font-semibold text-foreground-900 mb-4">Distribución por Sucursal</h3>
                <div className="overflow-x-auto">
                  <table className="w-full responsive-table">
                    <thead>
                      <tr className="border-b border-secondary-200/70">
                        <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-left" scope="col">Sucursal</th>
                        <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-right" scope="col">Alumnos</th>
                        <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-right" scope="col">Ingresos</th>
                        <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-right" scope="col">Profesores</th>
                        <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-right" scope="col">Salones</th>
                        <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-left" scope="col">Ocupación</th>
                        <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-center" scope="col">Morosidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alumnosPorSucursal.map((s, i) => {
                        const maxSuc = Math.max(...alumnosPorSucursal.map((x) => x.alumnos));
                        const pct = ((s.alumnos / maxSuc) * 100);
                        const ocupacion = ((s.alumnos / s.capacidad) * 100).toFixed(0);
                        const colores = ['bg-accent-500', 'bg-emerald-500', 'bg-primary-500', 'bg-amber-500', 'bg-rose-400'];
                        return (
                          <tr
                            key={i}
                            className="border-b border-secondary-100/70 last:border-0 cursor-pointer hover:bg-secondary-50/50 transition-colors"
                            onClick={() => openDrillDown('sucursal', `Detalle: ${s.sucursal}`, `${s.alumnos} alumnos · ${s.profesores} profesores`, [{ ...s }])}
                          >
                            <td className="px-4 py-3" data-label="Sucursal">
                              <span className="text-sm font-medium text-foreground-800">{s.sucursal}</span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-foreground-900" data-label="Alumnos">{s.alumnos.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-sm text-foreground-700" data-label="Ingresos">{formatMXN(s.ingresos)}</td>
                            <td className="px-4 py-3 text-right text-sm text-foreground-700" data-label="Profesores">{s.profesores}</td>
                            <td className="px-4 py-3 text-right text-sm text-foreground-700" data-label="Salones">{s.salones}</td>
                            <td className="px-4 py-3" data-label="Ocupación">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-secondary-100 rounded-full overflow-hidden max-w-[100px]">
                                  <div className={`h-full rounded-full ${colores[i]}`} style={{ width: `${ocupacion}%` }} />
                                </div>
                                <span className="text-xs text-foreground-500">{ocupacion}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center" data-label="Morosidad">
                              <Badge variant={s.morosidad > 7 ? 'warning' : 'success'} size="sm">{s.morosidad}%</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-2xs text-foreground-400 mt-3 text-center">Haz clic en cualquier sucursal para ver el detalle completo</p>
              </Card>
            </div>
          )}
        </div>

        <DrillDownModal
          open={drillOpen}
          onClose={closeDrillDown}
          title={drillTitle}
          subtitle={drillSubtitle}
          tipo={drillTipo}
          data={drillData}
        />
      </div>
    </MainLayout>
  );
}