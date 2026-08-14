import { useState, useRef } from 'react';
import Button from '@/components/base/Button';
import Select from '@/components/base/Select';
import { useToast } from '@/components/base/Toast';
import { sucursalesReporte, fechaPresets, ingresosMensuales, ingresosMensualesAnterior, drillDownIngresosPorConcepto, pagosPorMetodo, conceptosIngreso, alumnosPorNivel, morosidadPorNivel, alumnosPorSucursal } from '@/mocks/reportes';

interface ReportFiltersProps {
  sucursalFiltro: string;
  setSucursalFiltro: (v: string) => void;
  periodoDesde: string;
  setPeriodoDesde: (v: string) => void;
  periodoHasta: string;
  setPeriodoHasta: (v: string) => void;
  comparativa: boolean;
  setComparativa: (v: boolean) => void;
  reporteActivo: string;
  onExportCSV: () => void;
  onPrint: () => void;
}

export function generateCSV(reporteActivo: string): string {
  let csv = '';
  const BOM = '\uFEFF';

  switch (reporteActivo) {
    case 'ingresos': {
      csv = BOM + 'Mes,Ingresos,Egresos,Meta,Diferencia\n';
      ingresosMensuales.forEach((d) => {
        csv += `${d.mes},${d.ingresos},${d.egresos},${d.meta},${d.ingresos - d.egresos}\n`;
      });
      csv += '\nDesglose por Concepto (Julio)\n';
      csv += 'Concepto,Monto\n';
      const detalle = drillDownIngresosPorConcepto['Jul'] || [];
      detalle.forEach((d) => csv += `${d.concepto},${d.monto}\n`);
      break;
    }
    case 'alumnos': {
      csv = BOM + 'Nivel,Alumnos,Porcentaje\n';
      const total = alumnosPorNivel.reduce((s, n) => s + n.alumnos, 0);
      alumnosPorNivel.forEach((n) => csv += `${n.nivel},${n.alumnos},${((n.alumnos / total) * 100).toFixed(1)}%\n`);
      break;
    }
    case 'morosidad': {
      csv = BOM + 'Nivel,Monto,Alumnos,Porcentaje\n';
      morosidadPorNivel.forEach((m) => csv += `${m.nivel},${m.monto},${m.alumnos},${m.porcentaje}%\n`);
      break;
    }
    case 'pagos': {
      csv = BOM + 'Método,Monto,Porcentaje,Transacciones\n';
      pagosPorMetodo.forEach((p) => csv += `${p.metodo},${p.monto},${p.porcentaje}%,${p.transacciones}\n`);
      break;
    }
    case 'conceptos': {
      csv = BOM + 'Concepto,Monto,Porcentaje\n';
      const totalC = conceptosIngreso.reduce((s, c) => s + c.monto, 0);
      conceptosIngreso.forEach((c) => csv += `${c.concepto},${c.monto},${((c.monto / totalC) * 100).toFixed(1)}%\n`);
      break;
    }
    case 'sucursales': {
      csv = BOM + 'Sucursal,Alumnos,Profesores,Salones,Capacidad,Ingresos,Morosidad\n';
      alumnosPorSucursal.forEach((s) => csv += `${s.sucursal},${s.alumnos},${s.profesores},${s.salones},${s.capacidad},${s.ingresos},${s.morosidad}%\n`);
      break;
    }
  }
  return csv;
}

export default function ReportFilters({
  sucursalFiltro,
  setSucursalFiltro,
  periodoDesde,
  setPeriodoDesde,
  periodoHasta,
  setPeriodoHasta,
  comparativa,
  setComparativa,
  reporteActivo,
  onExportCSV,
  onPrint,
}: ReportFiltersProps) {
  const [presetActivo, setPresetActivo] = useState('ultimo-semestre');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const handlePreset = (presetId: string) => {
    setPresetActivo(presetId);
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');

    switch (presetId) {
      case 'ultimo-mes':
        setPeriodoDesde(`${y}-${m}`);
        setPeriodoHasta(`${y}-${m}`);
        break;
      case 'ultimo-trimestre': {
        const d = new Date(y, now.getMonth() - 2, 1);
        setPeriodoDesde(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        setPeriodoHasta(`${y}-${m}`);
        break;
      }
      case 'ultimo-semestre': {
        const d = new Date(y, now.getMonth() - 5, 1);
        setPeriodoDesde(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        setPeriodoHasta(`${y}-${m}`);
        break;
      }
      case 'este-ano':
        setPeriodoDesde(`${y}-01`);
        setPeriodoHasta(`${y}-12`);
        break;
      case 'ano-anterior':
        setPeriodoDesde(`${y - 1}-01`);
        setPeriodoHasta(`${y - 1}-12`);
        break;
      case 'personalizado':
        break;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1 bg-background-100 rounded-lg p-1 flex-wrap">
        {fechaPresets.map((p) => (
          <button
            key={p.id}
            onClick={() => handlePreset(p.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all duration-150 cursor-pointer ${
              presetActivo === p.id
                ? 'bg-background-50 text-foreground-900 shadow-sm'
                : 'text-foreground-500 hover:text-foreground-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="month"
          value={periodoDesde}
          onChange={(e) => { setPeriodoDesde(e.target.value); setPresetActivo('personalizado'); }}
          className="rounded-md border border-secondary-200 bg-background-50 text-xs text-foreground-900 px-2.5 py-1.5 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 cursor-pointer"
        />
        <span className="text-xs text-foreground-400">a</span>
        <input
          type="month"
          value={periodoHasta}
          onChange={(e) => { setPeriodoHasta(e.target.value); setPresetActivo('personalizado'); }}
          className="rounded-md border border-secondary-200 bg-background-50 text-xs text-foreground-900 px-2.5 py-1.5 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 cursor-pointer"
        />
      </div>

      <div className="w-36">
        <Select
          options={sucursalesReporte.map((s) => ({ value: s.id, label: s.label }))}
          value={sucursalFiltro}
          onChange={(e) => setSucursalFiltro(e.target.value)}
        />
      </div>

      <button
        onClick={() => setComparativa(!comparativa)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 cursor-pointer whitespace-nowrap ${
          comparativa
            ? 'bg-accent-100/70 border-accent-300 text-accent-800'
            : 'bg-background-50 border-secondary-200 text-foreground-500 hover:text-foreground-700'
        }`}
      >
        <i className={`${comparativa ? 'ri-toggle-fill text-accent-500' : 'ri-toggle-line'} text-sm`} />
        Comparativa
      </button>

      <div className="relative" ref={exportRef}>
        <Button
          variant="outline"
          size="sm"
          icon="ri-download-2-line"
          onClick={() => setShowExportMenu(!showExportMenu)}
        >
          Exportar
        </Button>
        {showExportMenu && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-background-50 border border-secondary-200 rounded-lg shadow-lg z-30 py-1">
            <button
              onClick={() => { onExportCSV(); setShowExportMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground-700 hover:bg-secondary-50 transition-colors cursor-pointer"
            >
              <i className="ri-file-excel-2-line text-emerald-500" />
              Exportar CSV (.csv)
            </button>
            <button
              onClick={() => { onPrint(); setShowExportMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground-700 hover:bg-secondary-50 transition-colors cursor-pointer"
            >
              <i className="ri-printer-line text-primary-500" />
              Imprimir reporte
            </button>
          </div>
        )}
      </div>
    </div>
  );
}