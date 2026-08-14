import { useMemo } from 'react';
import Card from '@/components/base/Card';
import Badge from '@/components/base/Badge';
import type { EgresoItem } from '@/mocks/finanzas';

const colorPorCategoria: Record<string, string> = {
  'Nómina': 'bg-amber-100 text-amber-700',
  'Servicios': 'bg-sky-100 text-sky-700',
  'Materiales': 'bg-violet-100 text-violet-700',
  'Mantenimiento': 'bg-emerald-100 text-emerald-700',
  'Otros': 'bg-secondary-100 text-secondary-600',
};

const iconoPorCategoria: Record<string, string> = {
  'Nómina': 'ri-user-settings-line',
  'Servicios': 'ri-plug-line',
  'Materiales': 'ri-shopping-bag-3-line',
  'Mantenimiento': 'ri-tools-line',
  'Otros': 'ri-more-line',
};

interface EgresosSectionProps {
  egresos?: EgresoItem[];
}

export default function EgresosSection({ egresos = [] }: EgresosSectionProps) {
  const totalEgresos = useMemo(() => egresos.reduce((s, e) => s + e.monto, 0), [egresos]);

  const porCategoria = useMemo(() => {
    const agrupado: Record<string, number> = {};
    egresos.forEach((e) => {
      agrupado[e.categoria] = (agrupado[e.categoria] || 0) + e.monto;
    });
    return Object.entries(agrupado).sort(([, a], [, b]) => b - a);
  }, [egresos]);

  const categorias = porCategoria.length
    ? porCategoria.map(([c]) => c)
    : ['Nómina', 'Servicios', 'Materiales', 'Mantenimiento'];

  if (egresos.length === 0) {
    return (
      <Card padding="md">
        <h3 className="text-sm font-semibold text-foreground-900 mb-3">Egresos Recientes</h3>
        <p className="text-xs text-foreground-400 py-8 text-center">
          Sin egresos registrados. Los movimientos aparecerán cuando se registren en caja/finanzas.
        </p>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground-900">Egresos Recientes</h3>
        <span className="text-xs text-foreground-500">
          Total: <strong className="text-amber-600">${totalEgresos.toLocaleString('es-MX')}</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {categorias.slice(0, 4).map((cat) => {
          const monto = porCategoria.find(([c]) => c === cat)?.[1] || 0;
          return (
            <div key={cat} className="bg-secondary-50 rounded-lg p-2.5 text-center">
              <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center mb-1 ${colorPorCategoria[cat] || 'bg-secondary-100 text-secondary-600'}`}>
                <i className={`text-xs ${iconoPorCategoria[cat] || 'ri-more-line'}`} />
              </div>
              <p className="text-2xs text-foreground-500">{cat}</p>
              <p className="text-xs font-semibold text-foreground-800">${monto.toLocaleString('es-MX')}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        {egresos.slice(0, 8).map((egreso) => (
          <div key={egreso.id} className="flex items-center justify-between py-1.5 border-b border-secondary-100 last:border-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${colorPorCategoria[egreso.categoria] || 'bg-secondary-100 text-secondary-600'}`}>
                <i className={`text-xs ${iconoPorCategoria[egreso.categoria] || 'ri-more-line'}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-foreground-800 truncate">{egreso.concepto}</p>
                <p className="text-2xs text-foreground-400">
                  {egreso.fecha
                    ? `${new Date(egreso.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} · ${egreso.proveedor}`
                    : egreso.proveedor}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0 ml-2">
              <p className="text-xs font-semibold text-amber-600">${egreso.monto.toLocaleString('es-MX')}</p>
              <Badge variant="secondary" size="sm">{egreso.categoria}</Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
