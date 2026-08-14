import Card from '@/components/base/Card';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import type { Student, StudentPayment } from '@/mocks/alumnos';

interface PagosTabProps {
  student: Student;
  onRegistrarPago?: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount);
};

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
  paid: { label: 'Pagado', variant: 'success' },
  pending: { label: 'Pendiente', variant: 'warning' },
  overdue: { label: 'Vencido', variant: 'danger' },
};

export default function PagosTab({ student, onRegistrarPago }: PagosTabProps) {
  const totalPaid = student.payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = student.payments.filter((p) => p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
          <Card padding="sm">
            <p className="text-3xs text-foreground-500 uppercase tracking-wider">Total Pagado</p>
            <p className="text-base font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
          </Card>
          <Card padding="sm">
            <p className="text-3xs text-foreground-500 uppercase tracking-wider">Pendiente / Vencido</p>
            <p className={`text-base font-bold ${totalPending > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {totalPending > 0 ? formatCurrency(totalPending) : 'Sin adeudos'}
            </p>
          </Card>
          <Card padding="sm">
            <p className="text-3xs text-foreground-500 uppercase tracking-wider">Beca</p>
            <p className="text-base font-bold text-foreground-900">{student.scholarship > 0 ? `${student.scholarship}%` : 'Sin beca'}</p>
          </Card>
          <Card padding="sm">
            <p className="text-3xs text-foreground-500 uppercase tracking-wider">Último Pago</p>
            <p className="text-base font-bold text-foreground-900">{student.lastPayment || '—'}</p>
          </Card>
        </div>
        {onRegistrarPago && (
          <div className="ml-4 flex-shrink-0 hidden sm:block">
            <Button variant="primary" size="sm" icon="ri-add-line" onClick={onRegistrarPago}>
              Registrar pago
            </Button>
          </div>
        )}
      </div>

      {/* Mobile-only button */}
      {onRegistrarPago && (
        <div className="sm:hidden">
          <Button variant="primary" size="sm" icon="ri-add-line" onClick={onRegistrarPago} className="w-full">
            Registrar pago
          </Button>
        </div>
      )}

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full responsive-table">
            <thead>
              <tr className="border-b border-secondary-200/70">
                <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-left bg-secondary-50/70" scope="col">Concepto</th>
                <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-right bg-secondary-50/70" scope="col">Monto</th>
                <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-center bg-secondary-50/70" scope="col">Fecha</th>
                <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-center bg-secondary-50/70" scope="col">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-left bg-secondary-50/70" scope="col">Método</th>
                <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-left bg-secondary-50/70" scope="col">Recibo</th>
              </tr>
            </thead>
            <tbody>
              {student.payments.map((payment: StudentPayment) => (
                <tr key={payment.id} className="border-b border-secondary-100/70 last:border-0 hover:bg-secondary-50/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-foreground-800" data-label="Concepto">{payment.concept}</td>
                  <td className="px-4 py-3 text-sm text-foreground-800 text-right font-medium" data-label="Monto">{formatCurrency(payment.amount)}</td>
                  <td className="px-4 py-3 text-sm text-foreground-600 text-center" data-label="Fecha">{payment.date}</td>
                  <td className="px-4 py-3 text-center" data-label="Estado">
                    <Badge variant={statusConfig[payment.status]?.variant || 'default'} size="sm">
                      {statusConfig[payment.status]?.label || payment.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground-600" data-label="Método">{payment.method || '—'}</td>
                  <td className="px-4 py-3 text-sm text-foreground-600" data-label="Recibo">{payment.receipt || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {student.payments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-foreground-400">
            <i className="ri-money-dollar-circle-line text-2xl mb-2" />
            <p className="text-sm">Sin historial de pagos</p>
          </div>
        )}
      </Card>
    </div>
  );
}