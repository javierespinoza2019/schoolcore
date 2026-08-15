import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/feature/MainLayout';
import Card from '@/components/base/Card';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import DataTable, { Column } from '@/components/base/DataTable';
import { useToast } from '@/components/base/Toast';
import type { PagoConcepto } from '@/mocks/finanzas';
import RegistrarPagoModal from '../components/RegistrarPagoModal';
import { useApiResource } from '@/hooks/useApiResource';
import { queryKeys } from '@/api/queryKeys';
import { getAccountStatement } from '@/api/financeApi';
import * as studentsApi from '@/api/studentsApi';
import { isGuid } from '@/api/helpers';
import { SkeletonTable } from '@/components/base/Skeleton';

export default function EstadoCuenta() {
  const params = useParams<{ id: string }>();
  const alumnoId = params.id || '';
  const { showToast } = useToast();

  const studentQ = useQuery({
    queryKey: queryKeys.students.detail(alumnoId),
    queryFn: async () => {
      const res = await studentsApi.getStudent(alumnoId);
      if (!res.data) throw new Error(res.message || 'Alumno no encontrado');
      return res.data;
    },
    enabled: Boolean(alumnoId) && isGuid(alumnoId),
  });

  const statementQ = useApiResource({
    queryKey: queryKeys.finance.accountStatement(alumnoId),
    queryFn: () => getAccountStatement(alumnoId),
    enabled: Boolean(alumnoId) && isGuid(alumnoId),
    errorToast: 'Error al cargar estado de cuenta',
  });

  const estadoCuenta = statementQ.data;
  const alumno = studentQ.data ?? null;

  const [modalPago, setModalPago] = useState(false);
  const [conceptos, setConceptos] = useState<PagoConcepto[]>([]);

  useEffect(() => {
    if (estadoCuenta?.conceptos) setConceptos(estadoCuenta.conceptos);
    else setConceptos([]);
  }, [estadoCuenta]);

  const handlePagoRegistrado = useCallback((_pago: PagoConcepto) => {
    void statementQ.refetch();
    void studentQ.refetch();
    showToast('Pago registrado. Estado de cuenta actualizado.', 'success');
  }, [showToast, statementQ, studentQ]);

  const totalPagado = useMemo(() => conceptos.filter((c) => c.estado === 'pagado').reduce((s, c) => s + c.montoPagado, 0), [conceptos]);
  const totalPendiente = useMemo(() => conceptos.filter((c) => c.estado === 'vencido' || c.estado === 'pendiente').reduce((s, c) => s + (c.monto - c.montoPagado), 0), [conceptos]);
  const conceptosPagados = conceptos.filter((c) => c.estado === 'pagado').length;
  const conceptosVencidos = conceptos.filter((c) => c.estado === 'vencido').length;

  if (statementQ.isLoading || studentQ.isPending) {
    return (
      <MainLayout>
        <div className="max-w-[1200px] mx-auto">
          <SkeletonTable rows={6} />
        </div>
      </MainLayout>
    );
  }

  if (!alumnoId || !isGuid(alumnoId) || !alumno) {
    return (
      <MainLayout>
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/finanzas" className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-500 hover:text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
              <i className="ri-arrow-left-line" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-foreground-900 tracking-tight">Estado de Cuenta</h1>
            </div>
          </div>
          <Card padding="lg">
            <div className="flex flex-col items-center py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                <i className="ri-user-search-line text-xl" />
              </div>
              <p className="text-sm font-medium text-foreground-800">Alumno no encontrado</p>
              <p className="text-xs text-foreground-500 mt-1">El ID proporcionado no corresponde a ningún alumno activo</p>
              <Link to="/finanzas" className="mt-4">
                <Button variant="outline" size="sm" icon="ri-arrow-left-line">Volver a Finanzas</Button>
              </Link>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const columns: Column<PagoConcepto>[] = [
    { key: 'concepto', header: 'Concepto', sortable: true, width: '22%', render: (row) => (
      <div>
        <p className="text-xs font-medium text-foreground-800">{row.concepto}</p>
        <p className="text-2xs text-foreground-400">Vence: {new Date(row.fechaVencimiento).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
      </div>
    )},
    { key: 'monto', header: 'Monto', sortable: true, align: 'right', width: '11%', render: (row) => (
      <span className="text-xs font-medium text-foreground-800">${row.monto.toLocaleString('es-MX')}</span>
    )},
    { key: 'montoPagado', header: 'Pagado', sortable: true, align: 'right', width: '11%', render: (row) => (
      <span className={`text-xs font-medium ${row.montoPagado > 0 ? 'text-emerald-600' : 'text-foreground-400'}`}>
        ${row.montoPagado.toLocaleString('es-MX')}
      </span>
    )},
    { key: 'saldo', header: 'Saldo', sortable: true, align: 'right', width: '11%', render: (row) => {
      const saldo = row.monto - row.montoPagado;
      return <span className={`text-xs font-medium ${saldo > 0 ? 'text-red-600' : 'text-foreground-400'}`}>${saldo.toLocaleString('es-MX')}</span>;
    }},
    { key: 'estado', header: 'Estado', sortable: true, align: 'center', width: '11%', render: (row) => (
      <Badge variant={row.estado === 'pagado' ? 'success' : row.estado === 'pendiente' ? 'warning' : 'danger'} size="sm">
        {row.estado === 'pagado' ? 'Pagado' : row.estado === 'pendiente' ? 'Pendiente' : 'Vencido'}
      </Badge>
    )},
    { key: 'metodo', header: 'Método', sortable: false, width: '11%', render: (row) => (
      <span className="text-xs text-foreground-500">{row.metodoPago || '—'}</span>
    )},
    { key: 'folio', header: 'Folio / Fecha Pago', sortable: false, width: '17%', render: (row) => (
      <div className="text-xs">
        {row.folio ? <p className="text-foreground-600">{row.folio}</p> : <p className="text-foreground-400">—</p>}
        {row.fechaPago && <p className="text-foreground-400">{new Date(row.fechaPago).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</p>}
      </div>
    )},
    { key: 'acciones', header: '', width: '6%', render: (row) => (
      <div className="flex items-center gap-1">
        {row.estado !== 'pagado' && (
          <Button variant="primary" size="xs" onClick={() => setModalPago(true)}>Pagar</Button>
        )}
      </div>
    )},
  ];

  const handleExportarCSV = () => {
    const headers = ['Concepto', 'Tipo', 'Monto', 'Pagado', 'Saldo', 'Estado', 'Vencimiento', 'Fecha Pago', 'Folio', 'Método'];
    const rows = conceptos.map((c) => [
      c.concepto, c.tipo, c.monto, c.montoPagado, c.monto - c.montoPagado,
      c.estado, c.fechaVencimiento, c.fechaPago || '', c.folio || '', c.metodoPago || '',
    ]);
    const bom = '\uFEFF';
    const csv = bom + [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estado-cuenta-${alumno.firstName.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Estado de cuenta exportado a CSV', 'success');
  };

  return (
    <MainLayout>
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <Link to="/finanzas" className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-500 hover:text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
            <i className="ri-arrow-left-line" />
          </Link>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold shrink-0">
              {alumno.firstName[0]}{alumno.lastName[0]}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground-900 tracking-tight truncate">{alumno.fullName}</h1>
              <p className="text-xs text-foreground-500">{alumno.level} · {alumno.grade}° {alumno.group} · {alumno.branchName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" icon="ri-download-2-line" onClick={handleExportarCSV}>Exportar CSV</Button>
            <Button variant="primary" size="sm" icon="ri-add-line" onClick={() => setModalPago(true)}>Registrar Pago</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <Card padding="md">
            <span className="text-xs text-foreground-500">Total Pagado</span>
            <p className="text-xl font-bold text-emerald-600 mt-1">${totalPagado.toLocaleString('es-MX')}</p>
          </Card>
          <Card padding="md">
            <span className="text-xs text-foreground-500">Saldo Pendiente</span>
            <p className={`text-xl font-bold mt-1 ${totalPendiente > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              ${totalPendiente.toLocaleString('es-MX')}
            </p>
          </Card>
          <Card padding="md">
            <span className="text-xs text-foreground-500">Conceptos</span>
            <p className="text-xl font-bold text-foreground-900 mt-1">{conceptosPagados} de {conceptos.length} pagados</p>
            {conceptosVencidos > 0 && (
              <p className="text-xs text-red-600 mt-0.5 font-medium">{conceptosVencidos} vencido{conceptosVencidos !== 1 ? 's' : ''}</p>
            )}
          </Card>
          <Card padding="md">
            <span className="text-xs text-foreground-500">Beca</span>
            <p className="text-xl font-bold text-foreground-900 mt-1">
              {alumno.scholarship > 0 ? `${alumno.scholarship}%` : 'Sin beca'}
            </p>
            <p className="text-xs text-foreground-400 mt-0.5">
              {alumno.scholarship > 0 ? `Ahorro aprox: $${Math.round(4500 * alumno.scholarship / 100).toLocaleString('es-MX')}/mes` : 'Colegiatura completa'}
            </p>
          </Card>
        </div>

        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground-900">Detalle de Movimientos</h3>
          </div>
          <DataTable columns={columns} data={conceptos} rowKey={(r) => r.id} emptyMessage="Sin movimientos registrados" />
          <div className="mt-4 pt-4 border-t border-secondary-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="text-xs text-foreground-500">
              <i className="ri-information-line mr-1" />
              Los pagos vencidos pueden incluir recargos por mora del 5% mensual
            </div>
            <div className="text-right">
              <p className="text-xs text-foreground-500">Total a pagar</p>
              <p className={`text-lg font-bold ${totalPendiente > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                ${totalPendiente.toLocaleString('es-MX')}
              </p>
            </div>
          </div>
        </Card>

        <RegistrarPagoModal
          open={modalPago}
          onClose={() => setModalPago(false)}
          onPagoRegistrado={handlePagoRegistrado}
          preseleccionarAlumnoId={alumnoId}
        />
      </div>
    </MainLayout>
  );
}