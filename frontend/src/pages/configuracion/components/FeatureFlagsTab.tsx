import { useState } from 'react';
import Card from '@/components/base/Card';
import Badge from '@/components/base/Badge';
import { useToast } from '@/components/base/Toast';
import * as featureFlagsApi from '@/api/featureFlagsApi';
import { useSchoolContext } from '@/context/SchoolContext';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import { usePermissions } from '@/permissions/PermissionContext';
import { ViewCodes } from '@/permissions/viewCodes';
import {
  FEATURE_KEYS,
  FEATURE_LABELS,
  apiKeyToFeatureId,
  type FeatureFlagId,
} from '@/config/features';

const SCOPE_LABEL: Record<string, string> = {
  Branch: 'Sucursal',
  Tenant: 'Colegio',
  Global: 'Plataforma',
  None: 'Default OFF',
};

/** Tab: flags resueltos Branch > Tenant > Global; toggle escribe override tenant o sucursal. */
export default function FeatureFlagsTab() {
  const { showToast } = useToast();
  const { branchId, branch } = useSchoolContext();
  const { rows, isLoading, refresh, isEnabled, resolvedFrom } = useFeatureFlags();
  const { can } = usePermissions();
  const canEdit = can(ViewCodes.SETTINGS, 'edit');
  const [scopeBranch, setScopeBranch] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const handleToggle = async (featureId: FeatureFlagId, next: boolean) => {
    if (!canEdit) {
      showToast('Sin permiso para editar flags', 'error');
      return;
    }
    if (scopeBranch && !branchId) {
      showToast('Selecciona una sucursal en el ContextSwitcher', 'error');
      return;
    }
    setBusyKey(featureId);
    const res = await featureFlagsApi.setFeatureFlag({
      featureId,
      isEnabled: next,
      branchId: scopeBranch ? branchId : null,
    });
    setBusyKey(null);
    if (res.success) {
      showToast(
        `${FEATURE_LABELS[featureId]} ${next ? 'activado' : 'desactivado'} (${scopeBranch ? 'sucursal' : 'colegio'})`,
        'success'
      );
      refresh();
    } else {
      showToast(res.message || 'No se pudo actualizar el flag', 'error');
    }
  };

  const knownIds = Object.keys(FEATURE_KEYS) as FeatureFlagId[];
  const byId = new Map<FeatureFlagId, { isEnabled: boolean; resolvedFrom: string }>();
  for (const id of knownIds) {
    byId.set(id, {
      isEnabled: isEnabled(id),
      resolvedFrom: resolvedFrom[id] ?? 'None',
    });
  }
  for (const row of rows) {
    const id = apiKeyToFeatureId(row.featureKey);
    if (!id) continue;
    byId.set(id, { isEnabled: row.isEnabled, resolvedFrom: row.resolvedFrom });
  }

  return (
    <div className="space-y-4">
      <Card padding="md">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground-900">Feature flags</h3>
            <p className="text-xs text-foreground-500 mt-0.5">
              Resolución: Sucursal → Colegio → Plataforma. Valores OFF ocultan módulos (p. ej. Asistente IA).
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-foreground-600 cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded border-secondary-300"
              checked={scopeBranch}
              onChange={(e) => setScopeBranch(e.target.checked)}
              disabled={!canEdit || !branchId}
            />
            Aplicar solo a {branch?.shortName || branch?.name || 'sucursal activa'}
          </label>
        </div>

        {!canEdit && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-2 mb-3">
            Solo lectura: se requiere permiso de edición en Configuración (Super Admin).
          </p>
        )}

        {isLoading ? (
          <p className="text-xs text-foreground-400 py-6 text-center">Cargando flags…</p>
        ) : (
          <ul className="divide-y divide-secondary-100">
            {knownIds.map((id) => {
              const state = byId.get(id)!;
              const busy = busyKey === id;
              return (
                <li key={id} className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground-800">{FEATURE_LABELS[id]}</p>
                    <p className="text-2xs text-foreground-400 mt-0.5">key: {FEATURE_KEYS[id]}</p>
                  </div>
                  <Badge variant={state.isEnabled ? 'accent' : 'default'} size="sm">
                    {SCOPE_LABEL[state.resolvedFrom] ?? state.resolvedFrom}
                  </Badge>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={state.isEnabled}
                    disabled={!canEdit || busy}
                    onClick={() => void handleToggle(id, !state.isEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                      state.isEnabled ? 'bg-primary-600' : 'bg-secondary-200'
                    } ${!canEdit || busy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
                        state.isEnabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
