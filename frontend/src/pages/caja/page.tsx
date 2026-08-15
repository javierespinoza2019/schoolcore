import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/feature/MainLayout';
import Card from '@/components/base/Card';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Select from '@/components/base/Select';
import Modal from '@/components/base/Modal';
import DataTable, { type Column } from '@/components/base/DataTable';
import { useToast } from '@/components/base/Toast';
import type { CorteCaja, MovimientoCaja, ArqueoCaja } from '@/mocks/caja';
import { useSchoolContext } from '@/context/SchoolContext';
import { useApiResource } from '@/hooks/useApiResource';
import { queryKeys } from '@/api/queryKeys';
import * as cashApi from '@/api/cashApi';
import RegistrarPagoModal from '@/pages/finanzas/components/RegistrarPagoModal';
import { isGuid } from '@/api/helpers';
import Swal from 'sweetalert2';

export default function Caja() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { branchId, branch } = useSchoolContext();

  const [corteSeleccionado, setCorteSeleccionado] = useState<CorteCaja | null>(null);
  const [modalMovimientos, setModalMovimientos] = useState(false);
  const [modalArqueo, setModalArqueo] = useState(false);
  const [arqueoSeleccionado, setArqueoSeleccionado] = useState<ArqueoCaja | null>(null);
  const [tabActivo, setTabActivo] = useState<'cortes' | 'movimientos'>('cortes');
  const [modalNuevoCobro, setModalNuevoCobro] = useState(false);
  const [modalAbrirCaja, setModalAbrirCaja] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('0');
  const [openingShift, setOpeningShift] = useState('morning');
  const [openingNotes, setOpeningNotes] = useState('');
  const [openingSaving, setOpeningSaving] = useState(false);
  const [closingSaving, setClosingSaving] = useState(false);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [cortes, setCortes] = useState<CorteCaja[]>([]);
  const [arqueos, setArqueos] = useState<ArqueoCaja[]>([]);

  const sessionsQ = useApiResource({
    queryKey: queryKeys.cash.cortes({ branchId }),
    queryFn: () => cashApi.listCashSessions({ branchId }),
    errorToast: 'Error al cargar cortes de caja',
    enabled: isGuid(branchId),
  });
  const openQ = useApiResource({
    queryKey: queryKeys.cash.open(String(branchId ?? '')),
    queryFn: () => cashApi.getOpenCashSession(branchId),
    enabled: isGuid(branchId),
  });
  const arqueosQ = useApiResource({
    queryKey: ['cash', 'arqueos', branchId],
    queryFn: () => cashApi.listArqueos({ branchId }),
    enabled: isGuid(branchId),
  });

  useEffect(() => {
    if (sessionsQ.data) setCortes(sessionsQ.data);
  }, [sessionsQ.data]);
  useEffect(() => {
    if (arqueosQ.data) setArqueos(arqueosQ.data);
  }, [arqueosQ.data]);

  const openSession = openQ.data ?? null;

  const invalidateCash = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.cash.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.finance.all });
  };

  useEffect(() => {
    if (!openSession?.id) {
      setMovimientos([]);
      return;
    }
    void cashApi.listCashMovements(openSession.id).then((r) => setMovimientos(r.data));
  }, [openSession?.id]);

  useEffect(() => {
    if (!corteSeleccionado) return;
    void cashApi.listCashMovements(corteSeleccionado.id).then((r) => setMovimientos(r.data));
  }, [corteSeleccionado]);

  const movsCorte = useMemo(() => {
    const id = corteSeleccionado?.id ?? openSession?.id;
    if (!id) return [];
    return movimientos.filter((m) => m.corteId === id || !m.corteId);
  }, [movimientos, corteSeleccionado, openSession]);

  const arqueoCorte = arqueos.find((a) => a.corteId === corteSeleccionado?.id);

  const handleAbrirCaja = async () => {
    if (!isGuid(branchId)) {
      showToast('Selecciona una sucursal en el encabezado', 'error');
      return;
    }
    const amount = Number(openingAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      showToast('Monto inicial inválido', 'error');
      return;
    }
    setOpeningSaving(true);
    const res = await cashApi.openCashSession({
      branchId: branchId!,
      shift: openingShift,
      initialAmount: amount,
      notes: openingNotes.trim() || undefined,
    });
    setOpeningSaving(false);
    if (!res.success) {
      showToast(res.message || 'No se pudo abrir la caja', 'error');
      return;
    }
    showToast('Caja abierta correctamente', 'success');
    setModalAbrirCaja(false);
    setOpeningAmount('0');
    setOpeningNotes('');
    invalidateCash();
  };

  const handleCerrarCorte = async (corte: CorteCaja) => {
    const confirm = await Swal.fire({
      title: 'Cerrar corte',
      text: 'Se registrará arqueo con totales del sistema y se cerrará la sesión. ¿Continuar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Cerrar caja',
      cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;

    setClosingSaving(true);
    const expected = corte.montoInicial + corte.totalIngresos - corte.totalEgresos;
    const res = await cashApi.closeCashSession(corte.id, {
      totalCash: expected,
      totalCard: 0,
      totalTransfer: 0,
      totalCheck: 0,
      observations: 'Cierre desde UI Caja v1',
      notes: 'Cierre desde UI Caja v1',
    });
    setClosingSaving(false);

    if (!res.success) {
      showToast(res.message || 'No se pudo cerrar la caja', 'error');
      return;
    }
    showToast('Caja cerrada correctamente', 'success');
    invalidateCash();
  };

  const cortesColumns: Column<CorteCaja>[] = [
    {
      key: 'fecha',
      header: 'Fecha',
      sortable: true,
      width: '14%',
      render: (row) => (
        <span className="text-sm text-foreground-800">
          {row.fecha
            ? new Date(row.fecha).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '—'}
        </span>
      ),
    },
    {
      key: 'turno',
      header: 'Turno',
      sortable: true,
      width: '10%',
      render: (row) => (
        <Badge variant={row.turno === 'matutino' ? 'info' : 'accent'} size="sm">
          {row.turno === 'matutino' ? 'Matutino' : 'Vespertino'}
        </Badge>
      ),
    },
    {
      key: 'usuario',
      header: 'Usuario',
      width: '14%',
      render: (row) => <span className="text-sm text-foreground-700">{row.usuario || '—'}</span>,
    },
    {
      key: 'totalIngresos',
      header: 'Ingresos',
      sortable: true,
      align: 'right',
      width: '12%',
      render: (row) => (
        <span className="text-sm font-medium text-emerald-600">
          ${row.totalIngresos.toLocaleString('es-MX')}
        </span>
      ),
    },
    {
      key: 'totalEgresos',
      header: 'Egresos',
      sortable: true,
      align: 'right',
      width: '12%',
      render: (row) => (
        <span className="text-sm font-medium text-red-600">
          ${row.totalEgresos.toLocaleString('es-MX')}
        </span>
      ),
    },
    {
      key: 'montoFinal',
      header: 'Saldo Final',
      sortable: true,
      align: 'right',
      width: '12%',
      render: (row) => (
        <span className="text-sm font-semibold text-foreground-900">
          ${row.montoFinal.toLocaleString('es-MX')}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      align: 'center',
      width: '10%',
      render: (row) => (
        <Badge
          variant={
            row.estado === 'cerrado' ? 'success' : row.estado === 'abierto' ? 'warning' : 'info'
          }
          size="sm"
        >
          {row.estado === 'cerrado' ? 'Cerrado' : row.estado === 'abierto' ? 'Abierto' : 'Conciliado'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: '',
      width: '18%',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              setCorteSeleccionado(row);
              setModalMovimientos(true);
            }}
          >
            Movimientos
          </Button>
          {row.estado === 'abierto' && (
            <Button
              variant="ghost"
              size="xs"
              disabled={closingSaving}
              onClick={(e) => {
                e.stopPropagation();
                void handleCerrarCorte(row);
              }}
            >
              Cerrar
            </Button>
          )}
          {row.estado !== 'abierto' && (
            <Button
              variant="ghost"
              size="xs"
              icon="ri-file-list-3-line"
              onClick={(e) => {
                e.stopPropagation();
                const a = arqueos.find((ar) => ar.corteId === row.id);
                if (a) {
                  setArqueoSeleccionado(a);
                  setModalArqueo(true);
                } else {
                  showToast('Sin arqueo guardado para este corte', 'info');
                }
              }}
            />
          )}
        </div>
      ),
    },
  ];

  const movsColumns: Column<MovimientoCaja>[] = [
    {
      key: 'hora',
      header: 'Hora',
      width: '8%',
      render: (row) => <span className="text-sm text-foreground-500">{row.hora || '—'}</span>,
    },
    {
      key: 'tipo',
      header: 'Tipo',
      sortable: true,
      align: 'center',
      width: '10%',
      render: (row) => (
        <Badge variant={row.tipo === 'ingreso' ? 'success' : 'danger'} size="sm">
          {row.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
        </Badge>
      ),
    },
    {
      key: 'concepto',
      header: 'Concepto',
      width: '28%',
      render: (row) => (
        <div>
          <p className="text-sm text-foreground-800">{row.concepto}</p>
          <p className="text-2xs text-foreground-400">{row.categoria}</p>
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
        <span
          className={`text-sm font-medium ${row.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-600'}`}
        >
          {row.tipo === 'ingreso' ? '+' : '-'} ${row.monto.toLocaleString('es-MX')}
        </span>
      ),
    },
    {
      key: 'metodoPago',
      header: 'Método',
      sortable: true,
      align: 'center',
      width: '12%',
      render: (row) => (
        <Badge size="sm" variant="default">
          {row.metodoPago || '—'}
        </Badge>
      ),
    },
    {
      key: 'alumno',
      header: 'Alumno',
      width: '16%',
      render: (row) => <span className="text-xs text-foreground-600">{row.alumno || '—'}</span>,
    },
    {
      key: 'usuario',
      header: 'Usuario',
      width: '10%',
      render: (row) => <span className="text-xs text-foreground-500">{row.usuario || '—'}</span>,
    },
  ];

  const ingresosHoy = openSession?.totalIngresos ?? 0;
  const egresosHoy = openSession?.totalEgresos ?? 0;
  const dayMovs = openSession
    ? movimientos.filter((m) => m.corteId === openSession.id || !m.corteId)
    : [];

  return (
    <MainLayout>
      <div className="max-w-[1440px] mx-auto">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-foreground-900 tracking-tight">Caja</h1>
            <p className="text-xs text-foreground-500 mt-0.5">
              {branch?.name || 'Sin sucursal'} · {new Date().toLocaleDateString('es-MX')}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {!openSession ? (
              <Button
                variant="primary"
                size="sm"
                icon="ri-lock-unlock-line"
                onClick={() => setModalAbrirCaja(true)}
                disabled={!isGuid(branchId)}
              >
                Abrir caja
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  icon="ri-lock-line"
                  onClick={() => void handleCerrarCorte(openSession)}
                  disabled={closingSaving}
                >
                  Cerrar caja
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon="ri-add-line"
                  onClick={() => setModalNuevoCobro(true)}
                >
                  Nuevo Cobro
                </Button>
              </>
            )}
          </div>
        </div>

        {!isGuid(branchId) && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Selecciona una sucursal en el encabezado para operar la caja.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card padding="md">
            <span className="text-xs text-foreground-500">Corte Actual</span>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={openSession ? 'warning' : 'default'} size="sm">
                {openSession ? 'Abierto' : 'Sin sesión'}
              </Badge>
              {openSession && (
                <span className="text-xs text-foreground-500">
                  {openSession.turno === 'vespertino' ? 'Vespertino' : 'Matutino'}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-foreground-700 mt-2">
              {openSession ? openSession.usuario || 'Sesión activa' : 'Abre caja para cobrar'}
            </p>
          </Card>
          <Card padding="md">
            <span className="text-xs text-foreground-500">Ingresos (sesión)</span>
            <p className="text-xl font-bold text-emerald-600 mt-1">
              ${ingresosHoy.toLocaleString('es-MX')}
            </p>
            <p className="text-xs text-foreground-400 mt-0.5">
              {dayMovs.filter((m) => m.tipo === 'ingreso').length} movimientos
            </p>
          </Card>
          <Card padding="md">
            <span className="text-xs text-foreground-500">Egresos (sesión)</span>
            <p className="text-xl font-bold text-red-600 mt-1">
              ${egresosHoy.toLocaleString('es-MX')}
            </p>
          </Card>
          <Card padding="md">
            <span className="text-xs text-foreground-500">Saldo neto sesión</span>
            <p className="text-xl font-bold text-foreground-900 mt-1">
              $
              {(
                (openSession?.montoInicial ?? 0) +
                ingresosHoy -
                egresosHoy
              ).toLocaleString('es-MX')}
            </p>
            {openSession && (
              <p className="text-2xs text-foreground-400 mt-1">
                Inicial ${openSession.montoInicial.toLocaleString('es-MX')}
              </p>
            )}
          </Card>
        </div>

        <div className="mb-4 flex items-center border-b border-secondary-200/70">
          <button
            onClick={() => setTabActivo('cortes')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 cursor-pointer ${
              tabActivo === 'cortes'
                ? 'border-primary-500 text-primary-700'
                : 'border-transparent text-foreground-500 hover:text-foreground-700'
            }`}
          >
            Cortes de Caja
          </button>
          <button
            onClick={() => setTabActivo('movimientos')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 cursor-pointer ${
              tabActivo === 'movimientos'
                ? 'border-primary-500 text-primary-700'
                : 'border-transparent text-foreground-500 hover:text-foreground-700'
            }`}
          >
            Movimientos de la sesión
          </button>
        </div>

        {tabActivo === 'cortes' && (
          <Card padding="md">
            <DataTable
              columns={cortesColumns}
              data={cortes}
              rowKey={(r) => r.id}
              onRowClick={(row) => {
                setCorteSeleccionado(row);
                setModalMovimientos(true);
              }}
            />
          </Card>
        )}

        {tabActivo === 'movimientos' && (
          <Card padding="md">
            {!openSession ? (
              <p className="text-sm text-foreground-500 py-8 text-center">
                No hay sesión abierta. Los movimientos aparecen al cobrar cargos.
              </p>
            ) : (
              <DataTable columns={movsColumns} data={dayMovs} rowKey={(r) => r.id} />
            )}
          </Card>
        )}

        <Modal
          open={modalMovimientos}
          onClose={() => setModalMovimientos(false)}
          title={`Movimientos — ${
            corteSeleccionado?.fecha
              ? new Date(corteSeleccionado.fecha).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'long',
                })
              : ''
          }`}
          subtitle={corteSeleccionado?.usuario}
          size="xl"
          footer={
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setModalMovimientos(false)}>
                Cerrar
              </Button>
              {arqueoCorte && (
                <Button
                  variant="outline"
                  size="sm"
                  icon="ri-file-list-3-line"
                  onClick={() => {
                    setArqueoSeleccionado(arqueoCorte);
                    setModalArqueo(true);
                  }}
                >
                  Ver Arqueo
                </Button>
              )}
            </div>
          }
        >
          <div className="grid grid-cols-4 gap-3 mb-4">
            <Card padding="sm">
              <span className="text-2xs text-foreground-500">Ingresos</span>
              <p className="text-sm font-bold text-emerald-600">
                ${corteSeleccionado?.totalIngresos.toLocaleString('es-MX')}
              </p>
            </Card>
            <Card padding="sm">
              <span className="text-2xs text-foreground-500">Egresos</span>
              <p className="text-sm font-bold text-red-600">
                ${corteSeleccionado?.totalEgresos.toLocaleString('es-MX')}
              </p>
            </Card>
            <Card padding="sm">
              <span className="text-2xs text-foreground-500">Transacciones</span>
              <p className="text-sm font-bold text-foreground-900">
                {corteSeleccionado?.transacciones ?? movsCorte.length}
              </p>
            </Card>
            <Card padding="sm">
              <span className="text-2xs text-foreground-500">Diferencia</span>
              <p
                className={`text-sm font-bold ${
                  (corteSeleccionado?.diferencia ?? 0) === 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                ${(corteSeleccionado?.diferencia ?? 0).toLocaleString('es-MX')}
              </p>
            </Card>
          </div>
          <DataTable columns={movsColumns} data={movsCorte} rowKey={(r) => r.id} className="border-0" />
        </Modal>

        <Modal
          open={modalArqueo}
          onClose={() => setModalArqueo(false)}
          title="Arqueo de Caja"
          subtitle={arqueoSeleccionado?.usuario}
          size="lg"
          footer={
            <Button variant="ghost" size="sm" onClick={() => setModalArqueo(false)}>
              Cerrar
            </Button>
          }
        >
          {arqueoSeleccionado ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground-500">Total efectivo</span>
                <span className="font-semibold">
                  ${(arqueoSeleccionado.totalEfectivo ?? 0).toLocaleString('es-MX')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-500">Total sistema</span>
                <span className="font-semibold">
                  ${(arqueoSeleccionado.totalSistema ?? 0).toLocaleString('es-MX')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-500">Diferencia</span>
                <span className="font-semibold">
                  ${(arqueoSeleccionado.diferencia ?? 0).toLocaleString('es-MX')}
                </span>
              </div>
              {arqueoSeleccionado.observaciones && (
                <p className="text-xs text-foreground-500 pt-2 border-t border-secondary-100">
                  {arqueoSeleccionado.observaciones}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-foreground-500">Sin detalle de arqueo.</p>
          )}
        </Modal>

        <Modal
          open={modalAbrirCaja}
          onClose={() => setModalAbrirCaja(false)}
          title="Abrir caja"
          subtitle={branch?.name || 'Sucursal activa'}
          size="sm"
          footer={
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setModalAbrirCaja(false)} disabled={openingSaving}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon="ri-lock-unlock-line"
                loading={openingSaving}
                onClick={() => void handleAbrirCaja()}
              >
                Abrir
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <Select
              label="Turno"
              options={[
                { value: 'morning', label: 'Matutino' },
                { value: 'afternoon', label: 'Vespertino' },
              ]}
              value={openingShift}
              onChange={(e) => setOpeningShift(e.target.value)}
            />
            <Input
              label="Monto inicial"
              type="number"
              value={openingAmount}
              onChange={(e) => setOpeningAmount(e.target.value)}
              placeholder="0.00"
            />
            <Input
              label="Notas (opcional)"
              value={openingNotes}
              onChange={(e) => setOpeningNotes(e.target.value)}
            />
          </div>
        </Modal>

        <RegistrarPagoModal
          open={modalNuevoCobro}
          onClose={() => setModalNuevoCobro(false)}
          onPagoRegistrado={() => {
            invalidateCash();
            if (openSession?.id) {
              void cashApi.listCashMovements(openSession.id).then((r) => setMovimientos(r.data));
            }
          }}
        />
      </div>
    </MainLayout>
  );
}
