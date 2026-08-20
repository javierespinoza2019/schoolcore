import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Select from '@/components/base/Select';
import type { Student, StudentPayment } from '@/mocks/alumnos';
import {
  isOpenChargeStatus,
  listCharges,
  registerPayment,
  type ChargeSummary,
} from '@/api/financeApi';
import * as cashApi from '@/api/cashApi';
import * as settingsApi from '@/api/settingsApi';
import { useToast } from '@/components/base/Toast';
import { useSchoolContext } from '@/context/SchoolContext';
import { queryKeys } from '@/api/queryKeys';
import { isGuid } from '@/api/helpers';
import { friendlyApiError } from '@/lib/interaction/messages';
import { newPaymentIdempotencyKey } from '@/lib/finance/idempotency';
import { afterValidationErrors } from '@/lib/ui/scrollToFirstError';
import { FieldLimits } from '@/lib/validation/fields';

interface RegistrarPagoModalProps {
  open: boolean;
  onClose: () => void;
  student: Student;
  onPaymentRegistered: (updatedStudent: Student) => void;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(n);
}

function isCashMethod(name: string | undefined): boolean {
  return (name ?? '').toLowerCase().includes('efectivo');
}

export default function RegistrarPagoModal({
  open,
  onClose,
  student,
  onPaymentRegistered,
}: RegistrarPagoModalProps) {
  const { showToast } = useToast();
  const { branchId } = useSchoolContext();
  const [chargeId, setChargeId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [reference, setReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState('');

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
    queryKey: queryKeys.finance.charges({ studentId: student.id, status: 'open', branchId }),
    queryFn: async () => {
      const res = await listCharges({
        studentId: student.id,
        branchId,
        pageSize: 100,
      });
      return {
        ...res,
        data: (res.data ?? []).filter((c) => isOpenChargeStatus(c.status)),
      };
    },
    enabled: open && isGuid(student.id),
  });

  const methods = methodsQ.data?.data ?? [];
  const charges = chargesQ.data?.data ?? [];
  const openSession = openSessionQ.data?.data ?? null;
  const selectedCharge: ChargeSummary | undefined = charges.find((c) => c.id === chargeId);
  const selectedMethod = methods.find((m) => m.id === paymentMethodId);
  const needsReference = Boolean(paymentMethodId) && !isCashMethod(selectedMethod?.nombre);

  const conceptLabel = selectedCharge?.conceptName ?? '';
  const montoDisplay = selectedCharge ? String(selectedCharge.netAmount) : '';

  useEffect(() => {
    if (!open) return;
    setChargeId('');
    setPaymentMethodId('');
    setReference('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setErrors({});
    setSaving(false);
    setIdempotencyKey('');
  }, [open, student.id]);

  useEffect(() => {
    if (open && isGuid(chargeId)) {
      setIdempotencyKey(newPaymentIdempotencyKey(chargeId));
    } else {
      setIdempotencyKey('');
    }
  }, [open, chargeId]);

  useEffect(() => {
    if (!needsReference) setReference('');
  }, [needsReference]);

  const chargeOptions = useMemo(
    () => [
      {
        value: '',
        label: chargesQ.isLoading
          ? 'Cargando...'
          : charges.length === 0
            ? 'Sin conceptos pendientes'
            : 'Selecciona concepto...',
      },
      ...charges.map((c) => ({ value: c.id, label: c.conceptName })),
    ],
    [charges, chargesQ.isLoading]
  );

  const methodOptions = useMemo(
    () => [
      { value: '', label: methods.length ? 'Selecciona método...' : 'Sin métodos configurados' },
      ...methods.filter((m) => m.activo !== false).map((m) => ({ value: m.id, label: m.nombre })),
    ],
    [methods]
  );

  const handleSubmit = async () => {
    if (saving) return;
    const errs: Record<string, string> = {};
    if (!isGuid(branchId)) errs.branch = 'Sucursal inválida';
    if (!isGuid(chargeId)) errs.chargeId = 'Selecciona un concepto de pago';
    if (!isGuid(paymentMethodId)) errs.paymentMethodId = 'Selecciona un método de pago';
    if (needsReference && !reference.trim()) {
      errs.reference = 'La referencia es obligatoria para este método de pago';
    }
    if (!paymentDate.trim()) errs.paymentDate = 'La fecha es obligatoria';
    if (!openSession?.id) errs.session = 'Abre caja en /caja antes de cobrar';
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      afterValidationErrors(errs);
      return;
    }
    if (!selectedCharge) return;

    setSaving(true);
    const res = await registerPayment({
      branchId: branchId!,
      studentId: student.id,
      chargeId,
      amount: selectedCharge.netAmount,
      paymentMethodId,
      cashSessionId: openSession!.id,
      reference: reference.trim() || undefined,
      idempotencyKey: idempotencyKey || newPaymentIdempotencyKey(chargeId),
      concept: selectedCharge.conceptName,
      notes: notes.trim() || undefined,
    });
    setSaving(false);

    if (!res.success || !res.data) {
      showToast(friendlyApiError(res) || 'No se pudo registrar el pago', 'error');
      return;
    }

    const payment: StudentPayment = {
      id: res.data.id,
      concept: selectedCharge.conceptName,
      amount: selectedCharge.netAmount,
      date: res.data.fechaPago || paymentDate,
      method: res.data.metodoPago || selectedMethod?.nombre || '',
      status: 'paid',
      receipt: res.data.folio || '',
    };

    const updated: Student = {
      ...student,
      balance: Math.max(0, (student.balance || 0) - selectedCharge.netAmount),
      lastPayment: payment.date,
      payments: [payment, ...(student.payments || [])],
    };

    showToast(`Pago registrado · Folio ${payment.receipt || '—'}`, 'success');
    onPaymentRegistered(updated);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar Pago"
      subtitle={`Alumno: ${student.fullName} · ${student.enrollment || '—'}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon="ri-check-line"
            loading={saving}
            disabled={saving}
            onClick={() => void handleSubmit()}
          >
            Registrar Pago
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {!openSession && (
          <div
            className="text-2xs rounded-md px-3 py-2 border text-amber-800 bg-amber-50 border-amber-100"
            aria-invalid={errors.session ? true : undefined}
          >
            {openSessionQ.isLoading
              ? 'Verificando corte de caja...'
              : 'No hay corte abierto. Ábrelo en Caja antes de registrar el pago.'}
            {errors.session && <p className="mt-1 font-medium">{errors.session}</p>}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Concepto de pago"
            required
            options={chargeOptions}
            value={chargeId}
            onChange={(e) => {
              setChargeId(e.target.value);
              if (errors.chargeId) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.chargeId;
                  return next;
                });
              }
            }}
            placeholder="Selecciona concepto..."
            error={errors.chargeId}
          />
          <Input
            label="Monto ($ MXN)"
            type="number"
            required
            value={montoDisplay}
            readOnly
            placeholder="0.00"
            icon="ri-money-cny-circle-line"
            hint={selectedCharge ? 'Monto del cargo pendiente (pago completo)' : undefined}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Método de pago"
            required
            options={methodOptions}
            value={paymentMethodId}
            onChange={(e) => {
              setPaymentMethodId(e.target.value);
              if (errors.paymentMethodId) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.paymentMethodId;
                  return next;
                });
              }
            }}
            placeholder="Selecciona método..."
            error={errors.paymentMethodId}
          />
          <Input
            label="Referencia"
            value={reference}
            onChange={(e) => {
              setReference(e.target.value);
              if (errors.reference) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.reference;
                  return next;
                });
              }
            }}
            maxLength={FieldLimits.reference}
            placeholder={
              needsReference
                ? 'Número de transacción, terminal, folio...'
                : 'No aplica para efectivo'
            }
            disabled={!needsReference}
            required={needsReference}
            icon="ri-barcode-line"
            error={errors.reference}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Fecha de pago"
            type="date"
            required
            value={paymentDate}
            onChange={(e) => {
              setPaymentDate(e.target.value);
              if (errors.paymentDate) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.paymentDate;
                  return next;
                });
              }
            }}
            error={errors.paymentDate}
          />
        </div>

        <div>
          <label htmlFor="observaciones-pago" className="block text-xs font-medium text-foreground-700 mb-1.5">
            Observaciones
          </label>
          <textarea
            id="observaciones-pago"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas adicionales sobre el pago..."
            rows={3}
            maxLength={FieldLimits.paymentNotes}
            className="w-full rounded-md border border-secondary-200 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-300 px-3 py-2 transition-all duration-150 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 resize-none"
          />
          <p className="mt-1 text-2xs text-foreground-400 text-right">
            {notes.length}/{FieldLimits.paymentNotes}
          </p>
        </div>

        <div className="rounded-lg bg-background-100 border border-background-200/70 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-foreground-700 flex items-center gap-1.5">
            <i className="ri-file-list-3-line text-foreground-400" />
            Resumen del pago
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground-500">Concepto:</span>
            <span className="font-medium text-foreground-800">{conceptLabel || '—'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground-500">Monto:</span>
            <span className="font-medium text-foreground-800">
              {selectedCharge ? formatMoney(selectedCharge.netAmount) : '—'}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
