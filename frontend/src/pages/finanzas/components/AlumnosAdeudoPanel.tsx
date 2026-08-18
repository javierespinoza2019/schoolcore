import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from '@/components/base/Card';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import { PagoConcepto } from '@/mocks/finanzas';

interface AlumnosAdeudoPanelProps {
  pagos: PagoConcepto[];
  onRegistrarPago: (alumnoId: string) => void;
}

interface AdeudoAlumno {
  alumnoId: string;
  alumnoNombre: string;
  totalAdeudo: number;
  mesesAtraso: number;
  conceptosVencidos: PagoConcepto[];
  mesMasAntiguo: string;
}

export default function AlumnosAdeudoPanel({ pagos, onRegistrarPago }: AlumnosAdeudoPanelProps) {
  const alumnosConAdeudo = useMemo((): AdeudoAlumno[] => {
    const vencidos = pagos.filter((p) => p.estado === 'vencido' || p.estado === 'pendiente');
    const agrupado: Record<string, PagoConcepto[]> = {};
    vencidos.forEach((p) => {
      if (!agrupado[p.alumnoId]) agrupado[p.alumnoId] = [];
      agrupado[p.alumnoId].push(p);
    });

    return Object.entries(agrupado).map(([alumnoId, conceptos]) => {
      const total = conceptos.reduce((s, c) => s + (c.monto - c.montoPagado), 0);
      const fechas = conceptos.map((c) => new Date(c.fechaVencimiento)).sort((a, b) => a.getTime() - b.getTime());
      const mesMasAntiguo = fechas[0].toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const mesesAtraso = fechas[0]
        ? Math.max(1, Math.floor((hoy.getTime() - fechas[0].getTime()) / (30 * 24 * 60 * 60 * 1000)))
        : 1;

      return {
        alumnoId,
        alumnoNombre: conceptos[0].alumnoNombre,
        totalAdeudo: total,
        mesesAtraso,
        conceptosVencidos: conceptos.sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()),
        mesMasAntiguo,
      };
    });
  }, [pagos]);

  if (alumnosConAdeudo.length === 0) {
    return (
      <Card padding="md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground-900">Cobranza</h3>
          <Badge variant="success" size="sm">Al corriente</Badge>
        </div>
        <div className="flex flex-col items-center py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
            <i className="ri-check-double-line text-lg" />
          </div>
          <p className="text-xs text-foreground-600 font-medium">Todos los alumnos están al corriente</p>
          <p className="text-2xs text-foreground-400 mt-0.5">No hay pagos pendientes ni vencidos</p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground-900">Cobranza</h3>
          <Badge variant="danger" size="sm">{alumnosConAdeudo.length} con adeudo</Badge>
        </div>
        <span className="text-xs text-foreground-500">
          Total: <strong className="text-red-600">${alumnosConAdeudo.reduce((s, a) => s + a.totalAdeudo, 0).toLocaleString('es-MX')}</strong>
        </span>
      </div>

      <div className="space-y-3">
        {alumnosConAdeudo.map((alumno) => (
          <div key={alumno.alumnoId} className="border border-secondary-200/70 rounded-lg p-3 hover:border-red-200 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-2xs font-bold shrink-0">
                  {alumno.alumnoNombre.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground-800 truncate">{alumno.alumnoNombre}</p>
                  <p className="text-2xs text-foreground-400">
                    Desde {alumno.mesMasAntiguo} · {alumno.mesesAtraso} {alumno.mesesAtraso === 1 ? 'mes' : 'meses'} de atraso
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold text-red-600 whitespace-nowrap ml-2">${alumno.totalAdeudo.toLocaleString('es-MX')}</span>
            </div>

            <div className="flex flex-wrap gap-1 mb-2">
              {alumno.conceptosVencidos.map((c) => (
                <Badge key={c.id} variant="danger" size="sm">
                  {c.concepto}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="primary" size="xs" icon="ri-money-dollar-circle-line" onClick={() => onRegistrarPago(alumno.alumnoId)}>
                Registrar Pago
              </Button>
              <Link to={`/finanzas/estado-cuenta/${alumno.alumnoId}`} className="text-xs text-foreground-500 hover:text-foreground-700 flex items-center gap-1 transition-colors cursor-pointer">
                <i className="ri-file-text-line text-xs" /> Ver estado de cuenta
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}