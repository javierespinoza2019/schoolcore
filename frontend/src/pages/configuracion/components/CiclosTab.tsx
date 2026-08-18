import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Card from '@/components/base/Card';
import Button from '@/components/base/Button';
import Badge from '@/components/base/Badge';
import Modal from '@/components/base/Modal';
import Input from '@/components/base/Input';
import DeleteConfirmModal from '@/components/base/DeleteConfirmModal';
import { useToast } from '@/components/base/Toast';
import * as cyclesApi from '@/api/cyclesApi';
import { queryKeys } from '@/api/queryKeys';
import { isGuid } from '@/api/helpers';
import { afterValidationErrors } from '@/lib/ui/scrollToFirstError';

interface CicloEscolar {
  id: string;
  nombre: string;
  inicio: string;
  fin: string;
  activo: boolean;
}

interface Props {
  ciclos: CicloEscolar[];
  onUpdate: (ciclos: CicloEscolar[]) => void;
}

export default function CiclosTab({ ciclos }: Props) {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CicloEscolar | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CicloEscolar | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formNombre, setFormNombre] = useState('');
  const [formInicio, setFormInicio] = useState('');
  const [formFin, setFormFin] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showToast } = useToast();

  const resetForm = () => {
    setFormNombre('');
    setFormInicio('');
    setFormFin('');
    setErrors({});
    setEditing(null);
  };

  const openCreate = () => { resetForm(); setModalOpen(true); };
  const openEdit = (c: CicloEscolar) => { setEditing(c); setFormNombre(c.nombre); setFormInicio(c.inicio); setFormFin(c.fin); setModalOpen(true); };

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    if (!formNombre.trim()) errs.nombre = 'Ingresa el nombre del ciclo';
    if (!formInicio) errs.inicio = 'Selecciona la fecha de inicio';
    if (!formFin) errs.fin = 'Selecciona la fecha de fin';
    if (formInicio && formFin && formFin <= formInicio) errs.fin = 'La fecha de fin debe ser posterior al inicio';
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      afterValidationErrors(errs);
      return;
    }

    setSaving(true);
    const payload = {
      nombre: formNombre.trim(),
      inicio: formInicio,
      fin: formFin,
      activo: editing?.activo ?? ciclos.length === 0,
    };
    const res = editing
      ? await cyclesApi.updateCycle(editing.id, payload)
      : await cyclesApi.createCycle(payload);
    setSaving(false);
    if (!res.success || !res.data) {
      showToast(res.message || 'No se pudo guardar el ciclo', 'error');
      return;
    }
    showToast(editing ? 'Ciclo escolar actualizado' : 'Ciclo escolar creado', 'success');
    setModalOpen(false);
    resetForm();
    void queryClient.invalidateQueries({ queryKey: queryKeys.cycles.all });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.activo) {
      showToast('No puedes eliminar el ciclo activo. Activa otro primero.', 'error');
      setDeleteTarget(null);
      return;
    }
    if (!isGuid(deleteTarget.id)) {
      showToast('Este ciclo no existe en el servidor', 'error');
      return;
    }
    setDeleting(true);
    const res = await cyclesApi.deleteCycle(deleteTarget.id);
    setDeleting(false);
    if (!res.success) {
      showToast(res.message || 'No se pudo eliminar el ciclo', 'error');
      return;
    }
    showToast(`Ciclo "${deleteTarget.nombre}" eliminado`, 'success');
    setDeleteTarget(null);
    void queryClient.invalidateQueries({ queryKey: queryKeys.cycles.all });
  };

  const activateCycle = async (id: string) => {
    const target = ciclos.find((c) => c.id === id);
    if (!target || !isGuid(id)) {
      showToast('No se puede activar un ciclo local/inválido', 'error');
      return;
    }
    const res = await cyclesApi.updateCycle(id, {
      nombre: target.nombre,
      inicio: target.inicio,
      fin: target.fin,
      activo: true,
    });
    if (!res.success) {
      showToast(res.message || 'No se pudo activar el ciclo', 'error');
      return;
    }
    showToast(`Ciclo "${target.nombre}" activado`, 'success');
    void queryClient.invalidateQueries({ queryKey: queryKeys.cycles.all });
  };

  return (
    <>
      <Card padding="lg">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-foreground-900">Ciclos Escolares</h3>
            <p className="text-xs text-foreground-500 mt-0.5">Gestión de periodos escolares activos e históricos</p>
          </div>
          <Button variant="primary" size="sm" icon="ri-add-line" onClick={openCreate}>Nuevo Ciclo</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full responsive-table">
            <thead>
              <tr className="border-b border-secondary-200/70">
                <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-left" scope="col">Nombre</th>
                <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-left" scope="col">Fecha Inicio</th>
                <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-left" scope="col">Fecha Fin</th>
                <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-center" scope="col">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-right" scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ciclos.map((ciclo) => (
                <tr key={ciclo.id} className="border-b border-secondary-100/70 last:border-0">
                  <td className="px-4 py-3 text-sm font-medium text-foreground-800" data-label="Nombre">{ciclo.nombre}</td>
                  <td className="px-4 py-3 text-sm text-foreground-600" data-label="Fecha Inicio">{new Date(ciclo.inicio + 'T00:00:00').toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                  <td className="px-4 py-3 text-sm text-foreground-600" data-label="Fecha Fin">{new Date(ciclo.fin + 'T00:00:00').toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                  <td className="px-4 py-3 text-center" data-label="Estado">
                    <Badge variant={ciclo.activo ? 'success' : 'default'} size="sm">{ciclo.activo ? 'Activo' : 'Finalizado'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right" data-label="Acciones">
                    <div className="flex items-center justify-end gap-1">
                      {!ciclo.activo && (
                        <Button variant="ghost" size="xs" icon="ri-play-circle-line" onClick={() => activateCycle(ciclo.id)} title="Activar este ciclo" />
                      )}
                      <Button variant="ghost" size="xs" icon="ri-pencil-line" onClick={() => openEdit(ciclo)} />
                      <Button variant="ghost" size="xs" icon="ri-delete-bin-line" onClick={() => setDeleteTarget(ciclo)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editing ? 'Editar Ciclo Escolar' : 'Nuevo Ciclo Escolar'}
        subtitle={editing ? `Editando: ${editing.nombre}` : 'Define el periodo del nuevo ciclo'}
        size="sm"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setModalOpen(false); resetForm(); }}>Cancelar</Button>
            <Button variant="primary" size="sm" icon={saving ? undefined : 'ri-check-line'} onClick={handleSave} disabled={saving}>
              {saving ? (<><span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />Guardando...</>) : editing ? 'Guardar Cambios' : 'Crear Ciclo'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Nombre del Ciclo" required value={formNombre} onChange={(e) => { setFormNombre(e.target.value); if (errors.nombre) setErrors((p) => { const n = { ...p }; delete n.nombre; return n; }); }} error={errors.nombre} placeholder="Ej. Ciclo 2027-2028" />
          <Input label="Fecha de Inicio" required type="date" value={formInicio} onChange={(e) => { setFormInicio(e.target.value); if (errors.inicio) setErrors((p) => { const n = { ...p }; delete n.inicio; return n; }); }} error={errors.inicio} />
          <Input label="Fecha de Fin" required type="date" value={formFin} onChange={(e) => { setFormFin(e.target.value); if (errors.fin) setErrors((p) => { const n = { ...p }; delete n.fin; return n; }); }} error={errors.fin} />
        </div>
      </Modal>

      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Eliminar Ciclo Escolar"
        message={`¿Estás seguro de eliminar el ciclo "${deleteTarget?.nombre}"? Los datos históricos asociados se conservarán.`}
      />
    </>
  );
}