import { useState, useEffect } from 'react';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import Badge from '@/components/base/Badge';
import { useToast } from '@/components/base/Toast';
import { modulosPermisos, permisosPorRol } from '@/mocks/usuarios';
import { rolesPermisos } from '@/mocks/configuracion';
import type { RolPermiso } from '@/mocks/configuracion';

interface Props {
  open: boolean;
  onClose: () => void;
  rol: RolPermiso | null;
  onSave: (rolId: string, selectedMods: string[]) => void;
}

export default function PermisosModal({ open, onClose, rol, onSave }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (rol) {
      setSelected(permisosPorRol[rol.id] || []);
    }
  }, [rol]);

  if (!rol) return null;

  const toggleModule = (modId: string) => {
    setSelected((prev) =>
      prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId]
    );
  };

  const selectAll = () => setSelected(modulosPermisos.map((m) => m.id));
  const deselectAll = () => setSelected([]);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      onSave(rol.id, selected);
      showToast(`Permisos de "${rol.nombre}" actualizados`, 'success');
      setSaving(false);
      onClose();
    }, 600);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Permisos — ${rol.nombre}`}
      subtitle={`${selected.length} de ${modulosPermisos.length} módulos habilitados`}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="xs" onClick={selectAll}>Seleccionar todos</Button>
            <Button variant="ghost" size="xs" onClick={deselectAll}>Deseleccionar todos</Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" size="sm" icon={saving ? undefined : 'ri-check-line'} onClick={handleSave} disabled={saving}>
              {saving ? (<><span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />Guardando...</>) : 'Guardar Permisos'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
        {modulosPermisos.map((mod) => {
          const isChecked = selected.includes(mod.id);
          return (
            <label
              key={mod.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                isChecked
                  ? 'border-primary-300 bg-primary-50/60'
                  : 'border-secondary-200/70 bg-background-50 hover:bg-secondary-50'
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleModule(mod.id)}
                className="w-4 h-4 rounded border-secondary-300 text-primary-500 focus:ring-primary-400 cursor-pointer flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground-800">{mod.nombre}</span>
                <p className="text-xs text-foreground-500 mt-0.5">{mod.descripcion}</p>
              </div>
              {isChecked && (
                <Badge variant="success" size="sm">Habilitado</Badge>
              )}
            </label>
          );
        })}
      </div>
    </Modal>
  );
}