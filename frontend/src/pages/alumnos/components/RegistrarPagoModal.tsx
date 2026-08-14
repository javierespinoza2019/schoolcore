import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Select from '@/components/base/Select';
import type { Student, StudentPayment, StudentTimelineEvent } from '@/mocks/alumnos';
import {
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

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
    queryKey: queryKeys.finance.charges({ studentId: student.id, status: 'pending', branchId }),
    queryFn: () =>
      listCharges({
        studentId: student.id,
        branchId,
        status: 'pending',
        pageSize: 100,
      }),
    enabled: open && isGuid(student.id),
  });

  const methods = methodsQ.data?.data ?? [];
  const charges = chargesQ.data?.data ?? [];
  const openSession = openSessionQ.data?.data ?? null;
  const selectedCharge: ChargeSummary | undefined = charges.find((c) => c.id === chargeId);

  useEffect(() => {
    if (!open) return;
    setChargeId('');
    setPaymentMethodId('');
    setReference('');
    setErrors({});
    setSaving(false);
  }, [open, student.id]);

  useEffect(() => {
    if (!paymentMethodId && methods.length > 0) setPaymentMethodId(methods[0].id);
  }, [methods, paymentMethodId]);

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!isGuid(branchId)) errs.branch = 'Sucursal inválida';
    if (!isGuid(chargeId)) errs.chargeId = 'Selecciona un cargo pendiente';
    if (!isGuid(paymentMethodId)) errs.paymentMethodId = 'Selecciona un método';
    if (!openSession?.id) errs.session = 'Abre caja en /caja antes de cobrar';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
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
      idempotencyKey: `pay-${chargeId}-${Date.now()}`,
      concept: selectedCharge.conceptName,
    });
    setSaving(false);

    if (!res.success || !res.data) {
      showToast(res.message || 'No se pudo registrar el pago', 'error');
      return;
    }

    const payment: StudentPayment = {
      id: res.data.id,
      concept: selectedCharge.conceptName,
      amount: selectedCharge.netAmount,
      date: res.data.fechaPago || new Date().toISOString().slice(0, 10),
      method: res.data.metodoPago || methods.find((m) => m.id === paymentMethodId)?.nombre || '',
      status: 'paid',
      receipt: res.data.folio || '',
    };

    const timeline: StudentTimelineEvent = {
      id: `TL-${Date.now()}`,
      date: payment.date,
      title: `Pago: ${selectedCharge.conceptName}`,
      description: `Folio ${payment.receipt} · ${formatMoney(payment.amount)}`,
      icon: 'ri-money-dollar-circle-line',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      badge: 'Pago',
    };

    const updated: Student = {
      ...student,
      balance: Math.max(0, (student.balance || 0) - selectedCharge.netAmount),
      lastPayment: payment.date,
      payments: [payment, ...(student.payments || [])],
      timeline: [timeline, ...(student.timeline || [])],
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
      subtitle={student.fullName}
      size="sm"
      footer={
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon="ri-check-line"
            loading={saving}
            onClick={() => void handleSubmit()}
          >
            Cobrar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div
          className={`text-2xs rounded-md px-3 py-2 border ${
            openSession
              ? 'text-emerald-800 bg-emerald-50 border-emerald-100'
              : 'text-amber-800 bg-amber-50 border-amber-100'
          }`}
        >
          {openSession
            ? `Caja abierta · ${openSession.turno}`
            : 'No hay caja abierta. Ve a Caja → Abrir caja.'}
          {errors.session && <p className="mt-1 font-medium">{errors.session}</p>}
        </div>

        <Select
          label="Cargo pendiente"
          required
          options={[
            {
              value: '',
              label: chargesQ.isLoading
                ? 'Cargando...'
                : charges.length === 0
                  ? 'Sin cargos pendientes'
                  : 'Seleccionar cargo...',
            },
            ...charges.map((c) => ({
              value: c.id,
              label: `${c.conceptName} · ${formatMoney(c.netAmount)}`,
            })),
          ]}
          value={chargeId}
          onChange={(e) => setChargeId(e.target.value)}
          error={errors.chargeId}
        />

        {selectedCharge && (
          <div className="rounded-md border border-primary-100 bg-primary-50/50 px-3 py-2 text-sm flex justify-between">
            <span className="text-foreground-600">Monto</span>
            <span className="font-semibold">{formatMoney(selectedCharge.netAmount)}</span>
          </div>
        )}

        <Select
          label="Método de pago"
          required
          options={[
            { value: '', label: 'Seleccionar...' },
            ...methods.map((m) => ({ value: m.id, label: m.nombre })),
          ]}
          value={paymentMethodId}
          onChange={(e) => setPaymentMethodId(e.target.value)}
          error={errors.paymentMethodId}
        />

        <Input
          label="Referencia (opcional)"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
      </div>
    </Modal>
  );
}
