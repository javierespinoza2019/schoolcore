import Modal from '@/components/base/Modal';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';

interface DrillDownModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  tipo: 'conceptos' | 'alumnos' | 'morosidad' | 'sucursal';
  data: any[];
}

function formatMXN(n: number): string {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 });
}

export default function DrillDownModal({ open, onClose, title, subtitle, tipo, data }: DrillDownModalProps) {
  if (!data || data.length === 0) return null;

  const total = data.reduce((s: number, d: any) => s + (d.monto || d.alumnos || d.ingresos || 0), 0);

  const renderContent = () => {
    switch (tipo) {
      case 'conceptos':
        return (
          <div className="overflow-x-auto">
            <table className="w-full responsive-table">
              <thead>
                <tr className="border-b border-secondary-200/70">
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-left" scope="col">Concepto</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-right" scope="col">Monto</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-right" scope="col">% del total</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-left" scope="col">Proporción</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d: any, i: number) => {
                  const pct = ((d.monto / total) * 100).toFixed(1);
                  return (
                    <tr key={i} className="border-b border-secondary-100/70 last:border-0">
                      <td className="px-4 py-3" data-label="Concepto">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${d.color}`} />
                          <span className="text-sm font-medium text-foreground-800">{d.concepto}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-foreground-900" data-label="Monto">{formatMXN(d.monto)}</td>
                      <td className="px-4 py-3 text-right text-sm text-foreground-600" data-label="%">{pct}%</td>
                      <td className="px-4 py-3" data-label="Proporción">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-secondary-100 rounded-full overflow-hidden max-w-[100px]">
                            <div className={`h-full rounded-full ${d.color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-secondary-50/50">
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-800 text-left" scope="row">Total</th>
                  <td className="px-4 py-3 text-right text-sm font-bold text-foreground-900">{formatMXN(total)}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-foreground-600">100%</td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        );

      case 'alumnos':
        return (
          <div className="overflow-x-auto">
            <table className="w-full responsive-table">
              <thead>
                <tr className="border-b border-secondary-200/70">
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-left" scope="col">Grado</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-right" scope="col">Alumnos</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-right" scope="col">% del nivel</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-left" scope="col">Distribución</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d: any, i: number) => {
                  const pct = ((d.alumnos / total) * 100).toFixed(1);
                  return (
                    <tr key={i} className="border-b border-secondary-100/70 last:border-0">
                      <td className="px-4 py-3 text-sm font-medium text-foreground-800" data-label="Grado">{d.grado}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-foreground-900" data-label="Alumnos">{d.alumnos.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-sm text-foreground-600" data-label="%">{pct}%</td>
                      <td className="px-4 py-3" data-label="Distribución">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-secondary-100 rounded-full overflow-hidden max-w-[100px]">
                            <div className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-secondary-50/50">
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-800 text-left" scope="row">Total</th>
                  <td className="px-4 py-3 text-right text-sm font-bold text-foreground-900">{total.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-foreground-600">100%</td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        );

      case 'morosidad':
        return (
          <div className="overflow-x-auto">
            <table className="w-full responsive-table">
              <thead>
                <tr className="border-b border-secondary-200/70">
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-left" scope="col">Alumno</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-left" scope="col">Grado</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-right" scope="col">Monto</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-center" scope="col">Meses</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d: any, i: number) => (
                  <tr key={i} className="border-b border-secondary-100/70 last:border-0">
                    <td className="px-4 py-3 text-sm font-medium text-foreground-800" data-label="Alumno">{d.nombre}</td>
                    <td className="px-4 py-3 text-xs text-foreground-600" data-label="Grado">{d.grado}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-red-600" data-label="Monto">{formatMXN(d.monto)}</td>
                    <td className="px-4 py-3 text-center" data-label="Meses">
                      <Badge variant={d.meses >= 3 ? 'danger' : 'warning'} size="sm">{d.meses} {d.meses === 1 ? 'mes' : 'meses'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'sucursal':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.map((d: any, i: number) => (
              <div key={i} className="bg-background-50 border border-secondary-200/70 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground-800">{d.sucursal}</h4>
                    <p className="text-2xs text-foreground-500">{d.alumnos} alumnos · {d.profesores} profesores</p>
                  </div>
                  <Badge variant={d.morosidad > 7 ? 'warning' : 'success'} size="sm">
                    {d.morosidad}% mora
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-2xs">
                  <div>
                    <p className="text-foreground-400">Ingresos</p>
                    <p className="text-sm font-semibold text-foreground-900">{formatMXN(d.ingresos)}</p>
                  </div>
                  <div>
                    <p className="text-foreground-400">Ocupación</p>
                    <p className="text-sm font-semibold text-foreground-900">{((d.alumnos / d.capacidad) * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-foreground-400">Salones</p>
                    <p className="text-sm font-semibold text-foreground-900">{d.salones}</p>
                  </div>
                  <div>
                    <p className="text-foreground-400">Capacidad</p>
                    <p className="text-sm font-semibold text-foreground-900">{d.capacidad}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return <p className="text-sm text-foreground-500">Sin datos disponibles</p>;
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      {subtitle && <p className="text-xs text-foreground-500 -mt-2 mb-4">{subtitle}</p>}
      {renderContent()}
      <div className="flex justify-end mt-5">
        <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
      </div>
    </Modal>
  );
}