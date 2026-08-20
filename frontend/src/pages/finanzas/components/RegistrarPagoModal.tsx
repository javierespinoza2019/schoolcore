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
import { FieldLimits } from '@/lib/validation/fields';
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

function isCashMethod(name: string | undefined): boolean {
  return (name ?? '').toLowerCase().includes('efectivo');
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
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
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

  const selectedCharge: ChargeSummary | undefined = useMemo(
    () => charges.find((c) => c.id === chargeId),
    [charges, chargeId]
  );

  const selectedStudent = students.find((s) => s.id === studentId);
  const selectedMethod = methods.find((m) => m.id === paymentMethodId);
  const needsReference = Boolean(paymentMethodId) && !isCashMethod(selectedMethod?.nombre);
  const conceptLabel = selectedCharge?.conceptName ?? '';
  const montoDisplay = selectedCharge ? String(selectedCharge.netAmount) : '';
  const studentLocked = Boolean(preseleccionarAlumnoId && isGuid(preseleccionarAlumnoId));

  useEffect(() => {
    if (!open) return;
    setStudentId(preseleccionarAlumnoId && isGuid(preseleccionarAlumnoId) ? preseleccionarAlumnoId : '');
    setChargeId('');
    setPaymentMethodId('');
    setReference('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setNotes('');
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
    if (!needsReference) setReference('');
  }, [needsReference]);

  const modalSubtitle = selectedStudent
    ? `Alumno: ${selectedStudent.fullName} · ${selectedStudent.enrollment || '—'}`
    : 'Selecciona alumno y concepto de pago';

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async () => {
    if (saving) return;
    const errs: Record<string, string> = {};
    if (!isGuid(branchId)) errs.branch = 'Selecciona una sucursal en el contexto';
    if (!isGuid(studentId)) errs.studentId = 'Selecciona un alumno';
    if (!isGuid(chargeId)) errs.chargeId = 'Selecciona un concepto de pago';
    if (!isGuid(paymentMethodId)) errs.paymentMethodId = 'Selecciona un método de pago';
    if (needsReference && !reference.trim()) {
      errs.reference = 'La referencia es obligatoria para este método de pago';
    }
    if (!paymentDate.trim()) errs.paymentDate = 'La fecha es obligatoria';
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
      notes: notes.trim() || undefined,
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
      subtitle={modalSubtitle}
      size="lg"
      footer={
        <>
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
        </>
      }
    >
      <div className="space-y-5">
        {!isGuid(branchId) && (
          <div className="text-2xs text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            Selecciona una sucursal válida en el encabezado.
          </div>
        )}

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

        {!studentLocked && (
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
            onChange={(e) => {
              setStudentId(e.target.value);
              if (errors.studentId) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.studentId;
                  return next;
                });
              }
            }}
            error={errors.studentId}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Concepto de pago"
            required
            options={[
              {
                value: '',
                label: !studentId
                  ? 'Primero selecciona alumno...'
                  : chargesQ.isLoading
                    ? 'Cargando...'
                    : charges.length === 0
                      ? 'Sin conceptos pendientes'
                      : 'Selecciona concepto...',
              },
              ...charges.map((c) => ({ value: c.id, label: c.conceptName })),
            ]}
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
            disabled={!studentId}
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
            options={[
              { value: '', label: methods.length ? 'Selecciona método...' : 'Sin métodos configurados' },
              ...methods.filter((m) => m.activo !== false).map((m) => ({ value: m.id, label: m.nombre })),
            ]}
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
            maxLength={FieldLimits.reference}
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
          <label htmlFor="observaciones-pago-fin" className="block text-xs font-medium text-foreground-700 mb-1.5">
            Observaciones
          </label>
          <textarea
            id="observaciones-pago-fin"
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
