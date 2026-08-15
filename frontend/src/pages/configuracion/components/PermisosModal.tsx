import { useEffect, useMemo, useState } from 'react';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import Badge from '@/components/base/Badge';
import { useToast } from '@/components/base/Toast';
import {
  EDITABLE_VIEWS,
  PERMISSION_ACTIONS,
  getRolePermissions,
  replaceRolePermissions,
  type RolePermissionGrant,
} from '@/api/permissionsApi';
import type { RolPermiso } from '@/mocks/configuracion';
import { usePermissions } from '@/permissions/PermissionContext';
import { ViewCodes } from '@/permissions/viewCodes';

interface Props {
  open: boolean;
  onClose: () => void;
  rol: RolPermiso | null;
  onSaved?: () => void;
}

type Matrix = Record<string, Set<string>>;

function grantsToMatrix(grants: RolePermissionGrant[]): Matrix {
  const m: Matrix = {};
  for (const g of grants) {
    m[g.viewCode] = new Set((g.actions || []).map((a) => a.toLowerCase()));
  }
  return m;
}

function matrixToGrants(matrix: Matrix): RolePermissionGrant[] {
  return Object.entries(matrix)
    .filter(([, actions]) => actions.size > 0)
    .map(([viewCode, actions]) => ({
      viewCode,
      actions: Array.from(actions).sort(),
    }))
    .sort((a, b) => a.viewCode.localeCompare(b.viewCode));
}

export default function PermisosModal({ open, onClose, rol, onSaved }: Props) {
  const { showToast } = useToast();
  const { can } = usePermissions();
  const canEdit = can(ViewCodes.SETTINGS, 'edit');
  const [matrix, setMatrix] = useState<Matrix>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isWildcard, setIsWildcard] = useState(false);

  const roleId = rol?.id ?? '';
  const roleCode = (rol as RolPermiso & { code?: string })?.code ?? '';
  const isSuperAdmin = roleCode.toLowerCase() === 'superadmin' || rol?.nombre?.toLowerCase().includes('super admin');

  useEffect(() => {
    if (!open || !rol || !roleId) return;
    let cancelled = false;
    setLoading(true);
    void getRolePermissions(roleId).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (!res.success || !res.data) {
        showToast(res.message || 'No se pudieron cargar permisos', 'error');
        setMatrix({});
        setIsWildcard(false);
        return;
      }
      const wild = res.data.some(
        (g) => g.viewCode === '*' || (g.actions || []).includes('*')
      );
      setIsWildcard(wild || isSuperAdmin);
      setMatrix(grantsToMatrix(res.data.filter((g) => g.viewCode !== '*')));
    });
    return () => {
      cancelled = true;
    };
  }, [open, rol, roleId, isSuperAdmin, showToast]);

  const enabledViews = useMemo(
    () => EDITABLE_VIEWS.filter((v) => (matrix[v.code]?.size ?? 0) > 0).length,
    [matrix]
  );

  const toggleAction = (view: string, action: string) => {
    if (!canEdit || isWildcard || isSuperAdmin) return;
    setMatrix((prev) => {
      const next: Matrix = { ...prev };
      const set = new Set(next[view] ?? []);
      if (set.has(action)) set.delete(action);
      else set.add(action);
      if (set.size === 0) delete next[view];
      else next[view] = set;
      return next;
    });
  };

  const toggleViewAll = (view: string) => {
    if (!canEdit || isWildcard || isSuperAdmin) return;
    setMatrix((prev) => {
      const next: Matrix = { ...prev };
      const current = next[view];
      if (current && current.size === PERMISSION_ACTIONS.length) {
        delete next[view];
      } else {
        next[view] = new Set(PERMISSION_ACTIONS);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!rol || !roleId) return;
    if (isSuperAdmin || isWildcard) {
      showToast('Los permisos de Super Admin no se pueden editar.', 'info');
      return;
    }
    if (!canEdit) {
      showToast('Sin permiso para editar roles', 'error');
      return;
    }
    setSaving(true);
    const res = await replaceRolePermissions(roleId, matrixToGrants(matrix));
    setSaving(false);
    if (res.success) {
      showToast('Permisos guardados. Los usuarios verán el cambio al refrescar sesión.', 'success');
      onSaved?.();
      onClose();
    } else {
      showToast(res.message || 'No se pudo guardar', 'error');
    }
  };

  if (!rol) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Permisos — ${rol.nombre}`}
      subtitle={
        isWildcard || isSuperAdmin
          ? 'Acceso total (*). No editable.'
          : `${enabledViews} de ${EDITABLE_VIEWS.length} módulos con al menos una acción`
      }
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>
          {!isSuperAdmin && !isWildcard && (
            <Button
              variant="primary"
              size="sm"
              icon={saving ? undefined : 'ri-check-line'}
              onClick={() => void handleSave()}
              disabled={saving || !canEdit || loading}
            >
              {saving ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />
                  Guardando...
                </>
              ) : (
                'Guardar permisos'
              )}
            </Button>
          )}
        </div>
      }
    >
      {loading ? (
        <p className="text-xs text-foreground-400 py-8 text-center">Cargando matriz…</p>
      ) : isWildcard || isSuperAdmin ? (
        <div className="rounded-lg border border-primary-200 bg-primary-50/50 p-4 text-sm text-foreground-700">
          Este rol tiene comodín <Badge variant="accent" size="sm">* / *</Badge> (acceso completo).
        </div>
      ) : (
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          {!canEdit && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
              Solo lectura: se requiere permiso de edición en Configuración.
            </p>
          )}
          {EDITABLE_VIEWS.map((mod) => {
            const actions = matrix[mod.code] ?? new Set<string>();
            const allOn = PERMISSION_ACTIONS.every((a) => actions.has(a));
            return (
              <div
                key={mod.code}
                className="rounded-lg border border-secondary-200/70 bg-background-50 p-3"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground-800">{mod.label}</p>
                    <p className="text-xs text-foreground-500">{mod.description}</p>
                    <p className="text-2xs text-foreground-400 mt-0.5">view: {mod.code}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    disabled={!canEdit}
                    onClick={() => toggleViewAll(mod.code)}
                  >
                    {allOn ? 'Quitar todo' : 'Todas'}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PERMISSION_ACTIONS.map((action) => {
                    const on = actions.has(action);
                    return (
                      <label
                        key={action}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs cursor-pointer ${
                          on
                            ? 'border-primary-300 bg-primary-50 text-primary-800'
                            : 'border-secondary-200 text-foreground-600'
                        } ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="checkbox"
                          className="rounded border-secondary-300"
                          checked={on}
                          disabled={!canEdit}
                          onChange={() => toggleAction(mod.code, action)}
                        />
                        {action}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
