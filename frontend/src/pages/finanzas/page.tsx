import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/feature/MainLayout';
import Card from '@/components/base/Card';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Select from '@/components/base/Select';
import DataTable, { Column } from '@/components/base/DataTable';
import { useToast } from '@/components/base/Toast';
import type { PagoConcepto } from '@/mocks/finanzas';
import RegistrarPagoModal from './components/RegistrarPagoModal';
import AlumnosAdeudoPanel from './components/AlumnosAdeudoPanel';
import EgresosSection from './components/EgresosSection';
import { useSchoolContext } from '@/context/SchoolContext';
import { useApiResource } from '@/hooks/useApiResource';
import { queryKeys } from '@/api/queryKeys';
import * as financeApi from '@/api/financeApi';
import type { FinanceSummary } from '@/api/financeApi';

type TabKey = 'general' | 'cobranza' | 'egresos';

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'general', label: 'Vista General', icon: 'ri-dashboard-line' },
  { key: 'cobranza', label: 'Cobranza', icon: 'ri-error-warning-line' },
  { key: 'egresos', label: 'Egresos', icon: 'ri-arrow-down-line' },
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

export default function Finanzas() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroAlumno, setFiltroAlumno] = useState('');
  const [modalPago, setModalPago] = useState(false);
  const [pagoAlumnoPreseleccionado, setPagoAlumnoPreseleccionado] = useState('');
  const [pagos, setPagos] = useState<PagoConcepto[]>([]);
  const [exportando, setExportando] = useState(false);
  const { showToast } = useToast();
  const { branchId, cycleId } = useSchoolContext();

  const summaryQ = useApiResource({
    queryKey: queryKeys.finance.summary({ branchId, cycleId }),
    queryFn: () => financeApi.getFinanceSummary({ branchId, cycleId }),
    errorToast: 'Error al cargar resumen financiero',
  });

  const revenueQ = useApiResource({
    queryKey: queryKeys.finance.revenue({ branchId, cycleId }),
    queryFn: () => financeApi.getRevenueChart({ branchId, cycleId }),
    errorToast: 'Error al cargar ingresos vs egresos',
  });

  const conceptsQ = useApiResource({
    queryKey: queryKeys.finance.concepts({ branchId }),
    queryFn: () => financeApi.getRevenueByConcept({ branchId }),
    errorToast: 'Error al cargar ingresos por concepto',
  });

  const expensesQ = useApiResource({
    queryKey: queryKeys.finance.expenses({ branchId }),
    queryFn: () => financeApi.listExpenses({ branchId }),
    errorToast: 'Error al cargar egresos',
  });

  const paymentsQ = useApiResource({
    queryKey: queryKeys.finance.payments({ branchId, cycleId }),
    queryFn: () => financeApi.listPayments({ branchId, cycleId }),
    errorToast: 'Error al cargar pagos',
  });

  useEffect(() => {
    if (paymentsQ.data) setPagos(paymentsQ.data);
  }, [paymentsQ.data]);

  const resumen = summaryQ.data ?? EMPTY_SUMMARY;
  const ingresosEgresos = revenueQ.data ?? [];
  const ingresosPorConcepto = conceptsQ.data ?? [];
  const egresos = expensesQ.data ?? [];

  const alumnosUnicos = useMemo(() => {
    const map = new Map<string, string>();
    pagos.forEach((p) => {
      if (p.alumnoId && p.alumnoNombre) map.set(p.alumnoId, p.alumnoNombre);
    });
    return Array.from(map.entries()).map(([id, nombre]) => ({ value: id, label: nombre }));
  }, [pagos]);

  const pagosFiltrados = useMemo(() => {
    let result = pagos;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.concepto.toLowerCase().includes(q) ||
          p.alumnoNombre.toLowerCase().includes(q) ||
          (p.folio && p.folio.toLowerCase().includes(q))
      );
    }
    if (filtroEstado) result = result.filter((p) => p.estado === filtroEstado);
    if (filtroAlumno) result = result.filter((p) => p.alumnoId === filtroAlumno);
    return result;
  }, [searchTerm, filtroEstado, filtroAlumno, pagos]);

  const handleRegistrarPago = useCallback(
    (pago: PagoConcepto) => {
      setPagos((prev) => [pago, ...prev]);
      void queryClient.invalidateQueries({ queryKey: queryKeys.finance.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.cash.all });
    },
    [queryClient]
  );

  const handleAbrirPagoPara = useCallback((alumnoId: string) => {
    setPagoAlumnoPreseleccionado(alumnoId);
    setModalPago(true);
  }, []);

  const totalPendiente = useMemo(() => {
    if (resumen.saldoPendiente > 0) return resumen.saldoPendiente;
    return pagos
      .filter((p) => p.estado === 'vencido' || p.estado === 'pendiente')
      .reduce((s, p) => s + (p.monto - p.montoPagado), 0);
  }, [pagos, resumen.saldoPendiente]);

  const handleExportarCSV = useCallback(async () => {
    setExportando(true);
    const ok = await financeApi.exportFinanceReport({ branchId, format: 'csv' });
    if (ok) {
      showToast('Exportación descargada', 'success');
      setExportando(false);
      return;
    }
    const headers = [
      'ID',
      'Alumno',
      'Concepto',
      'Tipo',
      'Monto',
      'Pagado',
      'Saldo',
      'Estado',
      'Vencimiento',
      'Fecha Pago',
      'Folio',
      'Método',
    ];
    const rows = pagosFiltrados.map((p) => [
      p.id,
      p.alumnoNombre,
      p.concepto,
      p.tipo,
      p.monto,
      p.montoPagado,
      p.monto - p.montoPagado,
      p.estado,
      p.fechaVencimiento,
      p.fechaPago || '',
      p.folio || '',
      p.metodoPago || '',
    ]);
    const bom = '\uFEFF';
    const csv =
      bom +
      [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join(
        '\n'
      );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fecha = new Date().toISOString().split('T')[0];
    a.download = `finanzas-pagos-${fecha}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Export local (endpoint de export no disponible)', 'info');
    setExportando(false);
  }, [branchId, pagosFiltrados, showToast]);

  const cambioIngresos =
    resumen.ingresosMesAnterior > 0
      ? (((resumen.ingresosMes - resumen.ingresosMesAnterior) / resumen.ingresosMesAnterior) * 100).toFixed(1)
      : '0';

  const maxIngreso =
    ingresosEgresos.length > 0
      ? Math.max(...ingresosEgresos.map((d) => Math.max(d.ingresos, d.egresos, d.meta || 0)), 1)
      : 1;
  const chartHeight = 180;

  const monthLabel = new Date()
    .toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
    .replace(/^\w/, (c) => c.toUpperCase());

  const columns: Column<PagoConcepto>[] = [
    {
      key: 'alumno',
      header: 'Alumno',
      sortable: true,
      width: '16%',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center text-3xs font-bold shrink-0">
            {row.alumnoNombre
              ? row.alumnoNombre
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
              : '—'}
          </div>
          <span className="text-xs text-foreground-700 truncate">{row.alumnoNombre || '—'}</span>
        </div>
      ),
    },
    {
      key: 'concepto',
      header: 'Concepto',
      sortable: true,
      width: '22%',
      render: (row) => (
        <div>
          <p className="text-xs font-medium text-foreground-800 truncate">{row.concepto}</p>
          <p className="text-2xs text-foreground-400">
            Vence:{' '}
            {row.fechaVencimiento
              ? new Date(row.fechaVencimiento).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
              : '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'monto',
      header: 'Monto',
      sortable: true,
      align: 'right',
      width: '12%',
      render: (row) => (
        <span className="text-xs font-medium text-foreground-800">${row.monto.toLocaleString('es-MX')}</span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      align: 'center',
      width: '11%',
      render: (row) => (
        <Badge
          variant={
            row.estado === 'pagado'
              ? 'success'
              : row.estado === 'pendiente'
                ? 'warning'
                : row.estado === 'parcial'
                  ? 'info'
                  : 'danger'
          }
          size="sm"
        >
          {row.estado === 'pagado'
            ? 'Pagado'
            : row.estado === 'pendiente'
              ? 'Pendiente'
              : row.estado === 'parcial'
                ? 'Parcial'
                : 'Vencido'}
        </Badge>
      ),
    },
    {
      key: 'metodo',
      header: 'Método',
      sortable: true,
      width: '11%',
      render: (row) => <span className="text-xs text-foreground-500">{row.metodoPago || '—'}</span>,
    },
    {
      key: 'folio',
      header: 'Folio',
      sortable: false,
      width: '14%',
      render: (row) => <span className="text-xs text-foreground-500">{row.folio || '—'}</span>,
    },
    {
      key: 'fechaPago',
      header: 'Fecha Pago',
      sortable: true,
      width: '14%',
      render: (row) => (
        <span className="text-xs text-foreground-500">
          {row.fechaPago
            ? new Date(row.fechaPago).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
            : '—'}
        </span>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="max-w-[1440px] mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-bold text-foreground-900 tracking-tight">Finanzas</h1>
            <p className="text-xs text-foreground-500 mt-0.5">{monthLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon="ri-download-2-line" onClick={handleExportarCSV} loading={exportando}>
              {exportando ? 'Exportando...' : 'Exportar CSV'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="ri-add-line"
              onClick={() => {
                setPagoAlumnoPreseleccionado('');
                setModalPago(true);
              }}
            >
              Registrar Pago
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <Card padding="md" className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('general')}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-foreground-500">Ingresos del Mes</span>
              <div className="w-7 h-7 flex items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
                <i className="ri-arrow-up-line text-sm" />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground-900">${resumen.ingresosMes.toLocaleString('es-MX')}</p>
            <p className="text-xs text-emerald-600 mt-0.5 font-medium">
              {parseFloat(cambioIngresos) >= 0 ? '+' : ''}
              {cambioIngresos}% vs mes anterior
            </p>
          </Card>
          <Card padding="md" className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('egresos')}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-foreground-500">Egresos del Mes</span>
              <div className="w-7 h-7 flex items-center justify-center rounded-md bg-amber-100 text-amber-600">
                <i className="ri-arrow-up-line text-sm" />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground-900">${resumen.egresosMes.toLocaleString('es-MX')}</p>
            <p className="text-xs text-amber-600 mt-0.5 font-medium">
              {resumen.egresosMesAnterior > 0
                ? `${(((resumen.egresosMes - resumen.egresosMesAnterior) / resumen.egresosMesAnterior) * 100).toFixed(1)}% vs mes anterior`
                : 'Sin comparación aún'}
            </p>
          </Card>
          <Card padding="md" className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('cobranza')}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-foreground-500">Saldo Pendiente</span>
              <div className="w-7 h-7 flex items-center justify-center rounded-md bg-red-100 text-red-600">
                <i className="ri-error-warning-line text-sm" />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground-900">${totalPendiente.toLocaleString('es-MX')}</p>
            <p className="text-xs text-red-600 mt-0.5 font-medium">
              {resumen.alumnosConAdeudo} alumno{resumen.alumnosConAdeudo === 1 ? '' : 's'} con adeudo
            </p>
          </Card>
          <Card padding="md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-foreground-500">Pagos Hoy</span>
              <div className="w-7 h-7 flex items-center justify-center rounded-md bg-primary-100 text-primary-600">
                <i className="ri-money-dollar-circle-line text-sm" />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground-900">{resumen.pagosHoy} pagos</p>
            <p className="text-xs text-foreground-500 mt-0.5">
              {monthLabel} · ${resumen.montoHoy.toLocaleString('es-MX')}
            </p>
          </Card>
        </div>

        <div className="flex items-center gap-1 mb-5 bg-secondary-100 rounded-full p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-background-50 text-foreground-900 shadow-sm'
                  : 'text-foreground-500 hover:text-foreground-700'
              }`}
            >
              <i className={`${tab.icon} text-xs`} />
              {tab.label}
              {tab.key === 'cobranza' && totalPendiente > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
            </button>
          ))}
        </div>

        {activeTab === 'general' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
              <Card className="lg:col-span-2" padding="md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground-900">Ingresos vs Egresos</h3>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-primary-500" /> Ingresos
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Egresos
                    </span>
                  </div>
                </div>
                {ingresosEgresos.length === 0 ? (
                  <p className="text-xs text-foreground-400 py-10 text-center">
                    Sin serie histórica aún. Aparecerá cuando haya pagos y egresos registrados.
                  </p>
                ) : (
                  <div className="relative" style={{ height: chartHeight }}>
                    <div className="absolute inset-0 flex items-end">
                      {ingresosEgresos.map((d) => {
                        const ingH = (d.ingresos / maxIngreso) * chartHeight;
                        const egrH = (d.egresos / maxIngreso) * chartHeight;
                        return (
                          <div
                            key={d.mes}
                            className="flex-1 flex flex-col items-center gap-0.5 relative"
                            style={{ height: chartHeight }}
                          >
                            <div className="w-full flex flex-col items-center justify-end" style={{ height: chartHeight }}>
                              <div
                                className="w-full max-w-[18px] bg-primary-500 rounded-t-sm transition-all duration-300 hover:bg-primary-600 cursor-pointer group relative"
                                style={{ height: Math.max(ingH, 2) }}
                              >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground-900 text-background-50 text-3xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                                  ${d.ingresos.toLocaleString('es-MX')}
                                </div>
                              </div>
                              <div
                                className="w-full max-w-[18px] bg-amber-500 rounded-b-sm transition-all duration-300 hover:bg-amber-600 cursor-pointer group relative"
                                style={{ height: Math.max(egrH - 2, 2) }}
                              >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground-900 text-background-50 text-3xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                                  ${d.egresos.toLocaleString('es-MX')}
                                </div>
                              </div>
                            </div>
                            <span className="text-3xs text-foreground-400 mt-1">{d.mes}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>

              <Card padding="md">
                <h3 className="text-sm font-semibold text-foreground-900 mb-4">Ingresos por Concepto</h3>
                {ingresosPorConcepto.length === 0 ? (
                  <p className="text-xs text-foreground-400 py-8 text-center">Sin ingresos por concepto aún</p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {ingresosPorConcepto.map((c) => (
                        <div key={c.concepto}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-foreground-600">{c.concepto}</span>
                            <span className="text-xs font-medium text-foreground-800">
                              ${c.monto.toLocaleString('es-MX')}
                            </span>
                          </div>
                          <div className="h-1.5 bg-secondary-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${c.color}`}
                              style={{ width: `${Math.min(c.porcentaje, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-secondary-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground-900">Total Recaudado</span>
                        <span className="text-sm font-bold text-foreground-900">
                          ${ingresosPorConcepto.reduce((s, c) => s + c.monto, 0).toLocaleString('es-MX')}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-5 mb-5">
              <Card padding="md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  <h3 className="text-sm font-semibold text-foreground-900">Pagos Recientes</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Input
                      icon="ri-search-line"
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-40"
                    />
                    <Select
                      options={[
                        { value: '', label: 'Todos' },
                        { value: 'pagado', label: 'Pagado' },
                        { value: 'pendiente', label: 'Pendiente' },
                        { value: 'vencido', label: 'Vencido' },
                        { value: 'parcial', label: 'Parcial' },
                      ]}
                      value={filtroEstado}
                      onChange={(e) => setFiltroEstado(e.target.value)}
                      className="w-28"
                    />
                    <Select
                      options={[{ value: '', label: 'Todos los alumnos' }, ...alumnosUnicos]}
                      value={filtroAlumno}
                      onChange={(e) => setFiltroAlumno(e.target.value)}
                      className="w-40"
                    />
                  </div>
                </div>
                <DataTable
                  columns={columns}
                  data={pagosFiltrados}
                  rowKey={(r) => r.id}
                  emptyMessage="No se encontraron pagos con esos filtros"
                />
              </Card>
            </div>
          </>
        )}

        {activeTab === 'cobranza' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
            <div className="lg:col-span-2">
              <AlumnosAdeudoPanel pagos={pagos} onRegistrarPago={handleAbrirPagoPara} />
            </div>
            <div className="lg:col-span-1">
              <Card padding="md">
                <h3 className="text-sm font-semibold text-foreground-900 mb-3">Resumen de Cobranza</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground-500">Total Vencido</span>
                    <span className="text-sm font-bold text-red-600">${totalPendiente.toLocaleString('es-MX')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground-500">Alumnos con Adeudo</span>
                    <span className="text-sm font-bold text-foreground-900">{resumen.alumnosConAdeudo}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground-500">Tasa Moratoria</span>
                    <span className="text-sm font-bold text-foreground-900">{resumen.tasaMoratoria}% mensual</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-secondary-100">
                  <p className="text-2xs text-foreground-400">
                    <i className="ri-information-line mr-1" />
                    Los pagos con más de 2 meses de atraso generan recargo del {resumen.tasaMoratoria}% mensual sobre
                    saldo vencido
                  </p>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'egresos' && <EgresosSection egresos={egresos} />}

        <RegistrarPagoModal
          open={modalPago}
          onClose={() => {
            setModalPago(false);
            setPagoAlumnoPreseleccionado('');
          }}
          onPagoRegistrado={handleRegistrarPago}
          preseleccionarAlumnoId={pagoAlumnoPreseleccionado || undefined}
        />
      </div>
    </MainLayout>
  );
}
