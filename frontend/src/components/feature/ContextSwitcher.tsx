import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listBranches } from '@/api/branchesApi';
import { listCycles } from '@/api/cyclesApi';
import { isGuid } from '@/api/helpers';
import { queryKeys } from '@/api/queryKeys';
import { useSchoolContext } from '@/context/SchoolContext';

interface Branch {
  id: string;
  name: string;
  shortName: string;
  alumnos?: number;
}

interface Cycle {
  id: string;
  name: string;
  isActive: boolean;
}

function shortName(name: string): string {
  const parts = name.replace(/^Campus\s+/i, '').replace(/^Extensión\s+/i, '').trim();
  return parts.split(/\s+/)[0] || name;
}

export default function ContextSwitcher() {
  const {
    branch,
    cycle,
    setBranch,
    setCycle,
    setBranchOptions,
    setCycleOptions,
    branchOptions,
    cycleOptions,
  } = useSchoolContext();

  const [branchOpen, setBranchOpen] = useState(false);
  const [cycleOpen, setCycleOpen] = useState(false);
  const branchRef = useRef<HTMLDivElement>(null);
  const cycleRef = useRef<HTMLDivElement>(null);

  const branchesQuery = useQuery({
    queryKey: queryKeys.branches.list(),
    queryFn: () => listBranches({ pageSize: 100 }),
  });

  const cyclesQuery = useQuery({
    queryKey: queryKeys.cycles.list(),
    queryFn: () => listCycles(),
  });

  useEffect(() => {
    const items = branchesQuery.data?.data;
    if (!items) return;
    setBranchOptions(
      items
        .filter((b) => isGuid(b.id))
        .map((b) => ({
          id: String(b.id),
          name: b.nombre,
          shortName: shortName(b.nombre),
          studentCount: b.alumnosInscritos,
        }))
    );
  }, [branchesQuery.data, setBranchOptions]);

  useEffect(() => {
    const items = cyclesQuery.data?.data;
    if (!items) return;
    setCycleOptions(
      items
        .filter((c) => isGuid(c.id))
        .map((c) => ({
          id: c.id,
          name: c.nombre,
          isActive: c.activo,
        }))
    );
  }, [cyclesQuery.data, setCycleOptions]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) setBranchOpen(false);
      if (cycleRef.current && !cycleRef.current.contains(e.target as Node)) setCycleOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const branches: Branch[] = branchOptions.length
    ? branchOptions.map((b) => ({
        id: b.id,
        name: b.name,
        shortName: b.shortName,
        alumnos: b.studentCount,
      }))
    : [];

  const cycles: Cycle[] = cycleOptions.length
    ? cycleOptions.map((c) => ({ id: c.id, name: c.name, isActive: c.isActive }))
    : [];

  const selectedBranch = branch
    ? { id: branch.id, name: branch.name, shortName: branch.shortName, alumnos: branch.studentCount }
    : branches[0];
  const selectedCycle = cycle
    ? { id: cycle.id, name: cycle.name, isActive: cycle.isActive }
    : cycles[0];

  const contextBusy = branchesQuery.isPending || cyclesQuery.isPending;

  return (
    <div className="flex items-center gap-2">
      <div className="relative" ref={branchRef}>
        <button
          onClick={() => {
            setBranchOpen(!branchOpen);
            setCycleOpen(false);
          }}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium text-foreground-700 bg-secondary-50 border border-secondary-200 hover:bg-secondary-100 hover:border-secondary-300 transition-all duration-150 cursor-pointer whitespace-nowrap"
          aria-haspopup="listbox"
          aria-expanded={branchOpen}
          aria-label="Cambiar sucursal"
        >
          <i className="ri-store-2-line text-foreground-400" />
          <span className="hidden sm:inline">
            {selectedBranch?.name ?? (branchesQuery.isPending ? 'Sucursal…' : 'Sin sucursal')}
          </span>
          <span className="sm:hidden">
            {selectedBranch?.shortName ?? (branchesQuery.isPending ? '…' : 'Sucursal')}
          </span>
          <i
            className={`ri-arrow-down-s-line text-foreground-400 text-xs transition-transform duration-150 ${branchOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {branchOpen && (
          <div
            className="absolute left-0 top-full mt-1.5 w-56 bg-background-50 border border-secondary-200 rounded-lg shadow-xl z-50 py-1 animate-fade-in"
            role="listbox"
            aria-label="Seleccionar sucursal"
          >
            <div className="px-3 py-2 border-b border-secondary-100">
              <p className="text-2xs font-semibold text-foreground-400 uppercase tracking-wider">
                Sucursales
              </p>
            </div>
            {branches.length === 0 ? (
              <p className="px-3 py-3 text-xs text-foreground-400">Sin sucursales</p>
            ) : (
              branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setBranch({
                      id: b.id,
                      name: b.name,
                      shortName: b.shortName,
                      studentCount: b.alumnos,
                    });
                    setBranchOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors cursor-pointer whitespace-nowrap ${
                    selectedBranch?.id === b.id
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-foreground-600 hover:bg-background-100'
                  }`}
                  role="option"
                  aria-selected={selectedBranch?.id === b.id}
                >
                  <div className="flex-1 text-left">
                    <p className="text-xs">{b.name}</p>
                  </div>
                  {typeof b.alumnos === 'number' && b.alumnos > 0 && (
                    <span className="text-2xs text-foreground-400">{b.alumnos} al.</span>
                  )}
                  {selectedBranch?.id === b.id && (
                    <i className="ri-check-line text-primary-600 text-xs" />
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="relative" ref={cycleRef}>
        <button
          onClick={() => {
            setCycleOpen(!cycleOpen);
            setBranchOpen(false);
          }}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium bg-accent-50 text-accent-700 border border-accent-200 hover:bg-accent-100 hover:border-accent-300 transition-all duration-150 cursor-pointer whitespace-nowrap"
          aria-haspopup="listbox"
          aria-expanded={cycleOpen}
          aria-label="Cambiar ciclo escolar"
        >
          <i className="ri-calendar-line" />
          <span>{selectedCycle?.name ?? (cyclesQuery.isPending ? 'Ciclo…' : 'Sin ciclo')}</span>
          <i
            className={`ri-arrow-down-s-line text-accent-400 text-xs transition-transform duration-150 ${cycleOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {cycleOpen && (
          <div
            className="absolute left-0 top-full mt-1.5 w-48 bg-background-50 border border-secondary-200 rounded-lg shadow-xl z-50 py-1 animate-fade-in"
            role="listbox"
            aria-label="Seleccionar ciclo escolar"
          >
            <div className="px-3 py-2 border-b border-secondary-100">
              <p className="text-2xs font-semibold text-foreground-400 uppercase tracking-wider">
                Ciclo Escolar
              </p>
            </div>
            {cycles.length === 0 ? (
              <p className="px-3 py-3 text-xs text-foreground-400">
                Sin ciclos. Créalos en Configuración.
              </p>
            ) : (
            cycles.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCycle({ id: c.id, name: c.name, isActive: c.isActive });
                  setCycleOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCycle?.id === c.id
                    ? 'bg-accent-50 text-accent-700 font-medium'
                    : 'text-foreground-600 hover:bg-background-100'
                }`}
                role="option"
                aria-selected={selectedCycle?.id === c.id}
              >
                <span className="flex-1 text-left">{c.name}</span>
                {c.isActive && (
                  <span className="text-3xs px-1.5 py-0.5 rounded-full bg-accent-100 text-accent-700 font-medium">
                    Activo
                  </span>
                )}
                {selectedCycle?.id === c.id && (
                  <i className="ri-check-line text-accent-600 text-xs" />
                )}
              </button>
            ))
            )}
          </div>
        )}
      </div>
      {contextBusy && (
        <i className="ri-loader-4-line animate-spin text-foreground-300 text-sm" aria-hidden />
      )}
    </div>
  );
}
