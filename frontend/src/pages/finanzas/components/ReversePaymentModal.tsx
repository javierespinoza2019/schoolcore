import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import type { PagoConcepto } from '@/mocks/finanzas';
import { reversePayment } from '@/api/financeApi';
import * as cashApi from '@/api/cashApi';
import { useToast } from '@/components/base/Toast';
import { useSchoolContext } from '@/context/SchoolContext';
import { queryKeys } from '@/api/queryKeys';
import { isGuid } from '@/api/helpers';
import { friendlyApiError } from '@/lib/interaction/messages';
import { validateMaxLen } from '@/lib/validation/fields';

interface ReversePaymentModalProps {
  open: boolean;
  payment: PagoConcepto | null;
  onClose: () => void;
  onReversed: (pago: PagoConcepto) => void;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(n);
}

/** BR-59C: reverso contable con motivo obligatorio. */
export default function ReversePaymentModal({
  open,
  payment,
  onClose,
  onReversed,
}: ReversePaymentModalProps) {
  const { showToast } = useToast();
  const { branchId } = useSchoolContext();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const openSessionQ = useQuery({
    queryKey: queryKeys.cash.open(String(branchId ?? '')),
    queryFn: () => cashApi.getOpenCashSession(branchId),
    enabled: open && isGuid(branchId),
  });
  const openSession = openSessionQ.data?.data ?? null;

  useEffect(() => {
    if (!open) {
      setReason('');
      setError('');
      setSaving(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (saving || !payment) return;
    const trimmed = reason.trim();
    if (trimmed.length < 5) {
      setError('Indica el motivo del reverso (mínimo 5 caracteres).');
      return;
    }
    const lenErr = validateMaxLen(trimmed, 500, 'Motivo');
    if (lenErr) {
      setError(lenErr);
      return;
    }
    setSaving(true);
    const res = await reversePayment(payment.id, {
      reason: reason.trim(),
      reverseCashSessionId: openSession?.id,
    });
    setSaving(false);
    if (!res.success || !res.data) {
      showToast(friendlyApiError(res) || 'No se pudo anular el pago', 'error');
      return;
    }
    showToast(`Reverso registrado · Folio ${res.data.folio || payment.folio || '—'}`, 'success');
    onReversed(res.data);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reverso de pago"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleSubmit} loading={saving} disabled={saving || !payment}>
            Confirmar reverso
          </Button>
        </>
      }
    >
      {payment && (
        <div className="space-y-4">
          <div className="rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-2xs text-amber-900">
            Se anula el cobro, se reabre el cargo y se genera un movimiento de egreso/reverso en caja
            (aunque el corte original esté cerrado).
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-2xs text-foreground-500">Alumno</p>
              <p className="font-medium text-foreground-800">{payment.alumnoNombre}</p>
            </div>
            <div>
              <p className="text-2xs text-foreground-500">Folio</p>
              <p className="font-medium text-foreground-800">{payment.folio || '—'}</p>
            </div>
            <div>
              <p className="text-2xs text-foreground-500">Monto</p>
              <p className="font-medium text-foreground-800">{formatMoney(payment.monto)}</p>
            </div>
            <div>
              <p className="text-2xs text-foreground-500">Método</p>
              <p className="font-medium text-foreground-800">{payment.metodoPago || '—'}</p>
            </div>
          </div>
          <div
            className={`text-2xs rounded-md px-3 py-2 border ${
              openSession
                ? 'text-emerald-800 bg-emerald-50 border-emerald-100'
                : 'text-foreground-600 bg-secondary-50 border-secondary-100'
            }`}
          >
            {openSessionQ.isLoading
              ? 'Verificando corte abierto...'
              : openSession
                ? `El reverso se asentará en tu corte abierto (turno ${openSession.turno}).`
                : 'Sin corte abierto propio: el reverso se asentará en el corte original del cobro.'}
          </div>
          <Input
            label="Motivo del reverso"
            required
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError('');
            }}
            error={error}
            maxLength={500}
            placeholder="Ej. Cobro duplicado / error de concepto"
          />
        </div>
      )}
    </Modal>
  );
}
