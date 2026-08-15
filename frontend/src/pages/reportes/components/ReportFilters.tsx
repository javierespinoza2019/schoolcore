import { useMemo, useState } from 'react';
import Button from '@/components/base/Button';
import Select from '@/components/base/Select';
import { fechaPresets } from '@/api/reportsApi';
import { useSchoolContext } from '@/context/SchoolContext';

interface ReportFiltersProps {
  sucursalFiltro: string;
  setSucursalFiltro: (v: string) => void;
  periodoDesde: string;
  setPeriodoDesde: (v: string) => void;
  periodoHasta: string;
  setPeriodoHasta: (v: string) => void;
  reporteActivo: string;
  onExport: () => void;
  onPrint: () => void;
  exporting?: boolean;
}

export default function ReportFilters({
  sucursalFiltro,
  setSucursalFiltro,
  periodoDesde,
  setPeriodoDesde,
  periodoHasta,
  setPeriodoHasta,
  onExport,
  onPrint,
  exporting = false,
}: ReportFiltersProps) {
  const { branchOptions } = useSchoolContext();
  const [presetActivo, setPresetActivo] = useState('ultimo-semestre');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const branchSelectOptions = useMemo(
    () => [
      { value: 'todas', label: 'Todas las sucursales' },
      ...branchOptions.map((b) => ({ value: b.id, label: b.name })),
    ],
    [branchOptions]
  );

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
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1 bg-background-100 rounded-lg p-1 flex-wrap" role="group" aria-label="Presets de periodo">
        {fechaPresets.map((p) => (
          <button
            key={p.id}
            type="button"
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
          aria-label="Periodo desde"
          onChange={(e) => {
            setPeriodoDesde(e.target.value);
            setPresetActivo('personalizado');
          }}
          className="rounded-md border border-secondary-200 bg-background-50 text-xs text-foreground-900 px-2.5 py-1.5 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 cursor-pointer"
        />
        <span className="text-xs text-foreground-400">a</span>
        <input
          type="month"
          value={periodoHasta}
          aria-label="Periodo hasta"
          onChange={(e) => {
            setPeriodoHasta(e.target.value);
            setPresetActivo('personalizado');
          }}
          className="rounded-md border border-secondary-200 bg-background-50 text-xs text-foreground-900 px-2.5 py-1.5 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 cursor-pointer"
        />
      </div>

      <div className="w-44">
        <Select
          aria-label="Filtrar por sucursal"
          options={branchSelectOptions}
          value={sucursalFiltro}
          onChange={(e) => setSucursalFiltro(e.target.value)}
        />
      </div>

      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          icon="ri-download-2-line"
          loading={exporting}
          disabled={exporting}
          onClick={() => setShowExportMenu((v) => !v)}
        >
          Exportar
        </Button>
        {showExportMenu && (
          <div className="absolute right-0 top-full mt-1 w-52 bg-background-50 border border-secondary-200 rounded-lg shadow-lg z-30 py-1">
            <button
              type="button"
              onClick={() => {
                onExport();
                setShowExportMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground-700 hover:bg-secondary-50 transition-colors cursor-pointer"
            >
              <i className="ri-file-excel-2-line text-emerald-500" aria-hidden="true" />
              Exportar Excel (API)
            </button>
            <button
              type="button"
              onClick={() => {
                onPrint();
                setShowExportMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground-700 hover:bg-secondary-50 transition-colors cursor-pointer"
            >
              <i className="ri-printer-line text-primary-500" aria-hidden="true" />
              Imprimir vista
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
