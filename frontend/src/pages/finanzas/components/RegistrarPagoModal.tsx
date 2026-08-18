import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Select from '@/components/base/Select';
import type { PagoConcepto } from '@/mocks/finanzas';
import {
  CASH_V1_PARTIAL_PAYMENTS,
  isOpenChargeStatus,
  listCharges,
  registerPayment,
  type ChargeSummary,
} from '@/api/financeApi';
import * as cashApi from '@/api/cashApi';
import * as studentsApi from '@/api/studentsApi';
import * as settingsApi from '@/api/settingsApi';
import { useToast } from '@/components/base/Toast';
import { useSchoolContext } from '@/context/SchoolContext';
import { queryKeys } from '@/api/queryKeys';
import { isGuid } from '@/api/helpers';
import { friendlyApiError } from '@/lib/interaction/messages';
import { newPaymentIdempotencyKey } from '@/lib/finance/idempotency';
import { afterValidationErrors } from '@/lib/ui/scrollToFirstError';

interface RegistrarPagoModalProps {
  open: boolean;
  onClose: () => void;
  onPagoRegistrado: (pago: PagoConcepto) => void;
  preseleccionarAlumnoId?: string;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(n);
}

export default function RegistrarPagoModal({
  open,
  onClose,
  onPagoRegistrado,
  preseleccionarAlumnoId,
}: RegistrarPagoModalProps) {
  const { showToast } = useToast();
  const { branchId } = useSchoolContext();
  const [studentId, setStudentId] = useState('');
  const [chargeId, setChargeId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [reference, setReference] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  /** Stable for this charge selection — not regenerated on each click (BR-53). */
  const [idempotencyKey, setIdempotencyKey] = useState('');

  const studentsQ = useQuery({
    queryKey: queryKeys.students.list({ branchId, forPayment: true }),
    queryFn: () => studentsApi.listStudents({ branchId, pageSize: 100 }),
    enabled: open,
  });

  const openSessionQ = useQuery({
    queryKey: queryKeys.cash.open(String(branchId ?? '')),
    queryFn: () => cashApi.getOpenCashSession(branchId),
    enabled: open && isGuid(branchId),
  });

  const methodsQ = useQuery({
    queryKey: queryKeys.settings.paymentMethods(),
    queryFn: () => settingsApi.listPaymentMethods(),
    enabled: open,
  });

  const chargesQ = useQuery({
    queryKey: queryKeys.finance.charges({ studentId, status: 'open', branchId }),
    queryFn: async () => {
      const res = await listCharges({
        studentId,
        branchId,
        pageSize: 100,
      });
      return {
        ...res,
        data: (res.data ?? []).filter((c) => isOpenChargeStatus(c.status)),
      };
    },
    enabled: open && isGuid(studentId),
  });

  const students = studentsQ.data?.data ?? [];
  const methods = methodsQ.data?.data ?? [];
  const charges = chargesQ.data?.data ?? [];
  const openSession = openSessionQ.data?.data ?? null;

  useEffect(() => {
    if (!open) return;
    setStudentId(preseleccionarAlumnoId && isGuid(preseleccionarAlumnoId) ? preseleccionarAlumnoId : '');
    setChargeId('');
    setPaymentMethodId('');
    setReference('');
    setErrors({});
    setSaving(false);
    setIdempotencyKey('');
  }, [open, preseleccionarAlumnoId]);

  useEffect(() => {
    setChargeId('');
  }, [studentId]);

  useEffect(() => {
    if (open && isGuid(chargeId)) {
      setIdempotencyKey(newPaymentIdempotencyKey(chargeId));
    } else {
      setIdempotencyKey('');
    }
  }, [open, chargeId]);

  useEffect(() => {
    if (!paymentMethodId && methods.length > 0) {
      setPaymentMethodId(methods[0].id);
    }
  }, [methods, paymentMethodId]);

  const selectedCharge: ChargeSummary | undefined = useMemo(
    () => charges.find((c) => c.id === chargeId),
    [charges, chargeId]
  );

  const selectedStudent = students.find((s) => s.id === studentId);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async () => {
    if (saving) return;
    const errs: Record<string, string> = {};
    if (!isGuid(branchId)) errs.branch = 'Selecciona una sucursal en el contexto';
    if (!isGuid(studentId)) errs.studentId = 'Selecciona un alumno';
    if (!isGuid(chargeId)) errs.chargeId = 'Selecciona un cargo pendiente';
    if (!isGuid(paymentMethodId)) errs.paymentMethodId = 'Selecciona un método de pago';
    if (!openSession?.id) {
      errs.session = 'Abre un corte de caja antes de cobrar (obligatorio para cualquier método)';
    }
    if (!CASH_V1_PARTIAL_PAYMENTS && selectedCharge && selectedCharge.netAmount <= 0) {
      errs.chargeId = 'El cargo no tiene monto neto válido';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      afterValidationErrors(errs);
      return;
    }
    if (!selectedCharge) return;

    setSaving(true);
    const res = await registerPayment({
      branchId: branchId!,
      studentId,
      chargeId,
      amount: selectedCharge.netAmount,
      paymentMethodId,
      cashSessionId: openSession!.id,
      reference: reference.trim() || undefined,
      idempotencyKey: idempotencyKey || newPaymentIdempotencyKey(chargeId),
      concept: selectedCharge.conceptName,
      notes: undefined,
    });
    setSaving(false);

    if (!res.success || !res.data) {
      showToast(friendlyApiError(res) || 'No se pudo registrar el pago', 'error');
      return;
    }

    showToast(`Pago registrado · Folio ${res.data.folio || '—'}`, 'success');
    onPagoRegistrado(res.data);
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Registrar Pago"
      subtitle="Cobra un cargo pendiente (Caja v1 — sin parciales)"
      size="sm"
      footer={
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon="ri-check-line"
            onClick={() => void handleSubmit()}
            loading={saving}
            disabled={saving}
          >
            Registrar Pago
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {!isGuid(branchId) && (
          <div className="text-2xs text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            Selecciona una sucursal válida en el encabezado.
          </div>
        )}

        <div
          className={`text-2xs rounded-md px-3 py-2 border ${
            openSession
              ? 'text-emerald-800 bg-emerald-50 border-emerald-100'
              : 'text-amber-800 bg-amber-50 border-amber-100'
          }`}
          aria-invalid={errors.session ? true : undefined}
        >
          {openSessionQ.isLoading
            ? 'Verificando corte de caja...'
            : openSession
              ? `Corte abierto · turno ${openSession.turno} · ingresos $${openSession.totalIngresos.toLocaleString('es-MX')}`
              : 'No hay corte abierto. Ábrelo en Caja antes de cobrar (obligatorio para cualquier método).'}
          {errors.session && <p className="mt-1 font-medium">{errors.session}</p>}
        </div>

        {!CASH_V1_PARTIAL_PAYMENTS && (
          <div className="text-2xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
            El monto se toma del cargo (pago completo obligatorio).
          </div>
        )}

        <Select
          label="Alumno"
          required
          options={[
            { value: '', label: studentsQ.isLoading ? 'Cargando alumnos...' : 'Seleccionar alumno...' },
            ...students.map((s) => ({
              value: s.id,
              label: `${s.fullName} — ${s.enrollment || s.id.slice(0, 8)}`,
            })),
          ]}
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          error={errors.studentId}
        />

        {selectedStudent && (
          <div className="flex items-center gap-3 px-3 py-2 bg-secondary-50 rounded-md border border-secondary-100">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">
              {(selectedStudent.firstName[0] || '?') + (selectedStudent.lastName[0] || '')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground-800 truncate">{selectedStudent.fullName}</p>
              <p className="text-2xs text-foreground-500">
                {selectedStudent.level} · {selectedStudent.grade} {selectedStudent.group}
              </p>
            </div>
          </div>
        )}

        <Select
          label="Cargo pendiente"
          required
          options={[
            {
              value: '',
              label: !studentId
                ? 'Primero selecciona alumno...'
                : chargesQ.isLoading
                  ? 'Cargando cargos...'
                  : charges.length === 0
                    ? 'Sin cargos pendientes'
                    : 'Seleccionar cargo...',
            },
            ...charges.map((c) => ({
              value: c.id,
              label: `${c.conceptName} · ${formatMoney(c.netAmount)} · vence ${c.dueDate || '—'}`,
            })),
          ]}
          value={chargeId}
          onChange={(e) => setChargeId(e.target.value)}
          error={errors.chargeId}
          disabled={!studentId}
        />

        {selectedCharge && (
          <div className="rounded-md border border-primary-100 bg-primary-50/50 px-3 py-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-foreground-600">Monto a cobrar</span>
              <span className="font-semibold text-foreground-900">
                {formatMoney(selectedCharge.netAmount)}
              </span>
            </div>
            <p className="text-2xs text-foreground-500 mt-1">{selectedCharge.conceptName}</p>
          </div>
        )}

        <Select
          label="Método de Pago"
          required
          options={[
            { value: '', label: methods.length ? 'Seleccionar...' : 'Sin métodos configurados' },
            ...methods.map((m) => ({ value: m.id, label: m.nombre })),
          ]}
          value={paymentMethodId}
          onChange={(e) => setPaymentMethodId(e.target.value)}
          error={errors.paymentMethodId}
        />

        <Input
          label="Referencia (opcional)"
          maxLength={100}
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Ej. TRANS-89342"
        />
      </div>
    </Modal>
  );
}
