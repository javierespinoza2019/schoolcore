import { Link } from 'react-router-dom';
import MainLayout from '@/components/feature/MainLayout';
import EmptyState from '@/components/base/EmptyState';
import Button from '@/components/base/Button';
import { useSchoolContext } from '@/context/SchoolContext';
import { moduleContextGate } from '@/lib/interaction/guards';
import type { ReactNode } from 'react';

interface ModuleContextGateProps {
  children: ReactNode;
  /** Si false, solo exige sucursales (p.ej. alta de ciclos). Default true. */
  requireCycle?: boolean;
  /** Rutas CTA */
  branchesPath?: string;
  cyclesPath?: string;
}

/**
 * Bloquea el módulo si no hay sucursales (o ciclos) en el tenant/contexto.
 */
export default function ModuleContextGate({
  children,
  requireCycle = true,
  branchesPath = '/sucursales',
  cyclesPath = '/configuracion',
}: ModuleContextGateProps) {
  const { branchOptions, cycleOptions } = useSchoolContext();
  const gate = moduleContextGate({
    branchCount: branchOptions.length,
    cycleCount: cycleOptions.length,
    requireCycle,
  });

  if (!gate) return <>{children}</>;

  const isBranches = gate.code === 'CTX_MODULE_NO_BRANCHES';

  return (
    <MainLayout>
      <EmptyState
        icon={isBranches ? 'ri-store-2-line' : 'ri-calendar-event-line'}
        title={isBranches ? 'Falta configurar sucursales' : 'Falta configurar ciclos escolares'}
        description={gate.message}
        action={
          <Link to={isBranches ? branchesPath : cyclesPath}>
            <Button variant="primary" size="sm" icon={isBranches ? 'ri-add-line' : 'ri-settings-3-line'}>
              {isBranches ? 'Ir a Sucursales' : 'Ir a Configuración'}
            </Button>
          </Link>
        }
      />
    </MainLayout>
  );
}
