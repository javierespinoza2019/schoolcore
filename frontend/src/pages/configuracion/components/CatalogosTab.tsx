import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Card from '@/components/base/Card';
import Button from '@/components/base/Button';
import Badge from '@/components/base/Badge';
import Modal from '@/components/base/Modal';
import Input from '@/components/base/Input';
import DeleteConfirmModal from '@/components/base/DeleteConfirmModal';
import PermisosModal from '@/pages/configuracion/components/PermisosModal';
import { useToast } from '@/components/base/Toast';
import * as settingsApi from '@/api/settingsApi';
import { isGuid } from '@/api/helpers';
import { queryKeys } from '@/api/queryKeys';
import { afterValidationErrors } from '@/lib/ui/scrollToFirstError';

interface NivelEducativo { id: string; nombre: string; grados: number; activo: boolean; }
interface RolPermiso { id: string; nombre: string; usuarios: number; descripcion: string; }
interface NotifSetting { id: string; nombre: string; descripcion: string; activo: boolean; canal: string; }

interface Props {
  niveles: NivelEducativo[];
  roles: RolPermiso[];
  notificaciones: NotifSetting[];
  onNivelesUpdate: (v: NivelEducativo[]) => void;
  onRolesUpdate: (v: RolPermiso[]) => void;
  onNotificacionesUpdate: (v: NotifSetting[]) => void;
}

export default function CatalogosTab({
  niveles, roles, notificaciones,
  onNivelesUpdate,
}: Props) {
  const [modalNivel, setModalNivel] = useState(false);
  const [permisosOpen, setPermisosOpen] = useState(false);
  const [permisosRol, setPermisosRol] = useState<RolPermiso | null>(null);
  const [editingNivel, setEditingNivel] = useState<NivelEducativo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'nivel' | 'rol'; item: NivelEducativo | RolPermiso } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [nivelForm, setNivelForm] = useState({ nombre: '', grados: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const invalidateNiveles = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.settings.catalogs() });
  };

  const toggleNivel = async (id: string) => {
    const niv = niveles.find((n) => n.id === id);
    if (!niv || !isGuid(id)) {
      showToast('Nivel inválido', 'error');
      return;
    }
    const next = !niv.activo;
    const res = await settingsApi.updateEducationLevel(id, { ...niv, activo: next });
    if (!res.success) {
      showToast(res.message || 'No se pudo actualizar el nivel', 'error');
      return;
    }
    onNivelesUpdate(niveles.map((n) => (n.id === id ? { ...n, activo: next } : n)));
    showToast(`Nivel "${niv.nombre}" ${next ? 'activado' : 'desactivado'}`, 'success');
    invalidateNiveles();
  };

  const toggleNotificacion = (_id: string) => {
    showToast('La persistencia de notificaciones aún no está disponible en esta versión', 'info');
  };

  const openEditNivel = (n: NivelEducativo) => { setEditingNivel(n); setNivelForm({ nombre: n.nombre, grados: String(n.grados) }); setErrors({}); setModalNivel(true); };
  const openCreateNivel = () => { setEditingNivel(null); setNivelForm({ nombre: '', grados: '' }); setErrors({}); setModalNivel(true); };

  const openEditRol = (_r: RolPermiso) => {
    showToast('La edición de roles del sistema no está disponible en esta versión', 'info');
  };
  const openCreateRol = () => {
    showToast('Los roles se administran por script de plataforma; no se pueden crear aquí aún', 'info');
  };

  const handleSaveNivel = async () => {
    const errs: Record<string, string> = {};
    if (!nivelForm.nombre.trim()) errs.nombre = 'Ingresa el nombre del nivel';
    if (!nivelForm.grados.trim() || parseInt(nivelForm.grados) <= 0) errs.grados = 'Ingresa un número de grados válido';
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      afterValidationErrors(errs);
      return;
    }
    setSaving(true);
    try {
      if (editingNivel) {
        if (!isGuid(editingNivel.id)) {
          showToast('Nivel inválido', 'error');
          return;
        }
        const res = await settingsApi.updateEducationLevel(editingNivel.id, {
          nombre: nivelForm.nombre.trim(),
          grados: parseInt(nivelForm.grados),
          activo: editingNivel.activo,
        });
        if (!res.success || !res.data) {
          showToast(res.message || 'No se pudo actualizar', 'error');
          return;
        }
        onNivelesUpdate(niveles.map((n) => (n.id === editingNivel.id ? res.data! : n)));
        showToast('Nivel educativo actualizado', 'success');
      } else {
        const res = await settingsApi.createEducationLevel({
          nombre: nivelForm.nombre.trim(),
          grados: parseInt(nivelForm.grados),
          activo: true,
        });
        if (!res.success || !res.data) {
          showToast(res.message || 'No se pudo crear', 'error');
          return;
        }
        onNivelesUpdate([...niveles, res.data]);
        showToast('Nivel educativo agregado', 'success');
      }
      setModalNivel(false);
      invalidateNiveles();
    } catch {
      showToast('Error de red al guardar nivel', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'rol') {
      showToast('Los roles del sistema no se pueden eliminar desde la UI', 'info');
      setDeleteTarget(null);
      return;
    }
    if (!isGuid(deleteTarget.item.id)) {
      showToast('Nivel inválido', 'error');
      return;
    }
    setDeleting(true);
    const name = deleteTarget.item.nombre;
    try {
      const res = await settingsApi.deleteEducationLevel(deleteTarget.item.id);
      if (!res.success) {
        showToast(res.message || 'No se pudo eliminar', 'error');
        return;
      }
      onNivelesUpdate(niveles.filter((n) => n.id !== deleteTarget.item.id));
      showToast(`"${name}" eliminado`, 'success');
      setDeleteTarget(null);
      invalidateNiveles();
    } catch {
      showToast('Error de red al eliminar', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const openPermisos = (rol: RolPermiso) => {
    setPermisosRol(rol);
    setPermisosOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card padding="lg">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground-900">Niveles Educativos</h3>
              <p className="text-xs text-foreground-500 mt-0.5">Configuración de niveles y grados</p>
            </div>
            <Button variant="primary" size="sm" icon="ri-add-line" onClick={openCreateNivel}>Agregar Nivel</Button>
          </div>
          <div className="space-y-2">
            {niveles.map((niv) => (
              <div key={niv.id} className="flex items-center justify-between p-3 rounded-lg border border-secondary-200/70 bg-background-50">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleNivel(niv.id)} className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${niv.activo ? 'bg-emerald-500' : 'bg-secondary-300'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${niv.activo ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                  <div>
                    <span className="text-sm font-medium text-foreground-800">{niv.nombre}</span>
                    <p className="text-xs text-foreground-500">{niv.grados} grados</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={niv.activo ? 'success' : 'default'} size="sm">{niv.activo ? 'Activo' : 'Inactivo'}</Badge>
                  <Button variant="ghost" size="xs" icon="ri-pencil-line" onClick={() => openEditNivel(niv)} />
                  <Button variant="ghost" size="xs" icon="ri-delete-bin-line" onClick={() => setDeleteTarget({ type: 'nivel', item: niv })} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground-900">Notificaciones Automáticas</h3>
              <p className="text-xs text-foreground-500 mt-0.5">Configura los avisos y recordatorios del sistema</p>
            </div>
          </div>
          <div className="space-y-2">
            {notificaciones.map((notif) => (
              <div key={notif.id} className="flex items-center justify-between p-3 rounded-lg border border-secondary-200/70 bg-background-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-foreground-800">{notif.nombre}</span>
                    <Badge variant="info" size="sm">{notif.canal}</Badge>
                  </div>
                  <p className="text-xs text-foreground-500">{notif.descripcion}</p>
                </div>
                <div className="flex-shrink-0 ml-3">
                  <button onClick={() => toggleNotificacion(notif.id)} className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${notif.activo ? 'bg-emerald-500' : 'bg-secondary-300'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${notif.activo ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2" padding="lg">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground-900">Roles y Permisos</h3>
              <p className="text-xs text-foreground-500 mt-0.5">Gestión de roles del sistema y usuarios asignados</p>
            </div>
            <Button variant="primary" size="sm" icon="ri-add-line" onClick={openCreateRol}>Nuevo Rol</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full responsive-table">
              <thead>
                <tr className="border-b border-secondary-200/70">
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-left" scope="col">Rol</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-left" scope="col">Descripción</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-center" scope="col">Usuarios</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-right" scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((rol) => (
                  <tr key={rol.id} className="border-b border-secondary-100/70 last:border-0">
                    <td className="px-4 py-3 text-sm font-medium text-foreground-800" data-label="Rol">{rol.nombre}</td>
                    <td className="px-4 py-3 text-sm text-foreground-600" data-label="Descripción">{rol.descripcion}</td>
                    <td className="px-4 py-3 text-center" data-label="Usuarios">
                      <Badge variant="primary" size="sm">{rol.usuarios}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right" data-label="Acciones">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="xs" icon="ri-shield-keyhole-line" onClick={() => openPermisos(rol)}>Permisos</Button>
                        <Button variant="ghost" size="xs" icon="ri-pencil-line" onClick={() => openEditRol(rol)} />
                        <Button variant="ghost" size="xs" icon="ri-delete-bin-line" onClick={() => setDeleteTarget({ type: 'rol', item: rol })} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal
        open={modalNivel}
        onClose={() => { setModalNivel(false); setErrors({}); }}
        title={editingNivel ? 'Editar Nivel Educativo' : 'Agregar Nivel Educativo'}
        subtitle={editingNivel ? `Editando: ${editingNivel.nombre}` : 'Define el nuevo nivel y cantidad de grados'}
        size="sm"
        footer={<div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={() => { setModalNivel(false); setErrors({}); }}>Cancelar</Button><Button variant="primary" size="sm" icon={saving ? undefined : 'ri-check-line'} onClick={() => void handleSaveNivel()} disabled={saving}>{saving ? (<><span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />Guardando...</>) : editingNivel ? 'Guardar Cambios' : 'Agregar Nivel'}</Button></div>}
      >
        <div className="space-y-4">
          <Input label="Nombre del Nivel" required value={nivelForm.nombre} onChange={(e) => { setNivelForm((f) => ({ ...f, nombre: e.target.value })); if (errors.nombre) setErrors((p) => { const n = { ...p }; delete n.nombre; return n; }); }} error={errors.nombre} placeholder="Ej. Bachillerato" />
          <Input label="Número de Grados" required type="number" value={nivelForm.grados} onChange={(e) => { setNivelForm((f) => ({ ...f, grados: e.target.value })); if (errors.grados) setErrors((p) => { const n = { ...p }; delete n.grados; return n; }); }} error={errors.grados} placeholder="Ej. 6" />
        </div>
      </Modal>

      <PermisosModal
        open={permisosOpen}
        onClose={() => setPermisosOpen(false)}
        rol={permisosRol}
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        loading={deleting}
        title={deleteTarget?.type === 'nivel' ? 'Eliminar Nivel Educativo' : 'Eliminar Rol'}
        message={`¿Estás seguro de eliminar "${deleteTarget?.item.nombre}"? Esta acción no se puede deshacer.`}
      />
    </>
  );
}