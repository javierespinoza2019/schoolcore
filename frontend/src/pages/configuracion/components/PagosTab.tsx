import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '@/components/base/Card';
import Button from '@/components/base/Button';
import Badge from '@/components/base/Badge';
import Modal from '@/components/base/Modal';
import Input from '@/components/base/Input';
import Select from '@/components/base/Select';
import DeleteConfirmModal from '@/components/base/DeleteConfirmModal';
import { useToast } from '@/components/base/Toast';
import type { ConceptoPago, ConceptoPagoNivel } from '@/mocks/configuracion';
import * as settingsApi from '@/api/settingsApi';
import { isGuid } from '@/api/helpers';
import { queryKeys } from '@/api/queryKeys';

interface MetodoPago { id: string; nombre: string; activo: boolean; info: string; }

interface Props {
  metodos: MetodoPago[];
  conceptos: ConceptoPago[];
  onMetodosUpdate: (v: MetodoPago[]) => void;
  onConceptosUpdate: (v: ConceptoPago[]) => void;
}

interface ConceptoFormState {
  nombre: string;
  tipo: string;
  diferenciadoPorNivel: boolean;
  montoBase: string;
  montosPorNivel: { nivelId: string; nivelNombre: string; monto: string }[];
}

const ABREV_NIVEL: Record<string, string> = { Preescolar: 'Pres', Primaria: 'Prim', Secundaria: 'Sec', Preparatoria: 'Prep', Universidad: 'Univ' };

function formatMXN(n: number): string {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 });
}

function emptyConceptoForm(): ConceptoFormState {
  return { nombre: '', tipo: '', diferenciadoPorNivel: false, montoBase: '', montosPorNivel: [] };
}

function conceptoToForm(c: ConceptoPago): ConceptoFormState {
  if (c.diferenciadoPorNivel && c.montosPorNivel.length > 0) {
    return {
      nombre: c.nombre,
      tipo: c.tipo,
      diferenciadoPorNivel: true,
      montoBase: '',
      montosPorNivel: c.montosPorNivel.map((n) => ({ ...n, monto: String(n.monto) })),
    };
  }
  return {
    nombre: c.nombre,
    tipo: c.tipo,
    diferenciadoPorNivel: false,
    montoBase: String(c.monto),
    montosPorNivel: [],
  };
}

export default function PagosTab({ metodos, conceptos, onMetodosUpdate, onConceptosUpdate }: Props) {
  const [modalMetodo, setModalMetodo] = useState(false);
  const [modalConcepto, setModalConcepto] = useState(false);
  const [editingMetodo, setEditingMetodo] = useState<MetodoPago | null>(null);
  const [editingConcepto, setEditingConcepto] = useState<ConceptoPago | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'metodo' | 'concepto'; item: MetodoPago | ConceptoPago } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [metodoForm, setMetodoForm] = useState({ nombre: '', info: '' });
  const [conceptoForm, setConceptoForm] = useState<ConceptoFormState>(emptyConceptoForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const levelsQ = useQuery({
    queryKey: queryKeys.settings.catalogs(),
    queryFn: () => settingsApi.listEducationLevels(),
  });
  const nivelesActivos = (levelsQ.data?.data ?? []).filter((n) => n.activo);

  const invalidatePagos = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.settings.paymentMethods() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.settings.paymentConcepts() });
  };

  const toggleMetodo = async (id: string) => {
    const met = metodos.find((m) => m.id === id);
    if (!met || !isGuid(id)) {
      showToast('Método inválido o aún no persistido', 'error');
      return;
    }
    const next = !met.activo;
    const res = await settingsApi.updatePaymentMethod(id, { ...met, activo: next });
    if (!res.success) {
      showToast(res.message || 'No se pudo actualizar el método', 'error');
      return;
    }
    onMetodosUpdate(metodos.map((m) => (m.id === id ? { ...m, activo: next } : m)));
    showToast('Método de pago actualizado', 'success');
    invalidatePagos();
  };

  const openEditMetodo = (m: MetodoPago) => { setEditingMetodo(m); setMetodoForm({ nombre: m.nombre, info: m.info }); setErrors({}); setModalMetodo(true); };
  const openCreateMetodo = () => { setEditingMetodo(null); setMetodoForm({ nombre: '', info: '' }); setErrors({}); setModalMetodo(true); };

  const openEditConcepto = (c: ConceptoPago) => { setEditingConcepto(c); setConceptoForm(conceptoToForm(c)); setErrors({}); setModalConcepto(true); };
  const openCreateConcepto = () => { setEditingConcepto(null); setConceptoForm(emptyConceptoForm()); setErrors({}); setModalConcepto(true); };

  const handleSaveMetodo = async () => {
    const errs: Record<string, string> = {};
    if (!metodoForm.nombre.trim()) errs.nombre = 'Ingresa el nombre del método';
    if (!metodoForm.info.trim()) errs.info = 'Ingresa la información del método';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      if (editingMetodo) {
        if (!isGuid(editingMetodo.id)) {
          showToast('Método inválido', 'error');
          return;
        }
        const res = await settingsApi.updatePaymentMethod(editingMetodo.id, {
          nombre: metodoForm.nombre.trim(),
          info: metodoForm.info.trim(),
          activo: editingMetodo.activo,
        });
        if (!res.success || !res.data) {
          showToast(res.message || 'No se pudo actualizar', 'error');
          return;
        }
        onMetodosUpdate(metodos.map((m) => (m.id === editingMetodo.id ? res.data! : m)));
        showToast('Método de pago actualizado', 'success');
      } else {
        const res = await settingsApi.createPaymentMethod({
          nombre: metodoForm.nombre.trim(),
          info: metodoForm.info.trim(),
          activo: true,
        });
        if (!res.success || !res.data) {
          showToast(res.message || 'No se pudo crear', 'error');
          return;
        }
        onMetodosUpdate([...metodos, res.data]);
        showToast('Método de pago agregado', 'success');
      }
      setModalMetodo(false);
      invalidatePagos();
    } catch {
      showToast('Error de red al guardar método', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConcepto = async () => {
    const errs: Record<string, string> = {};
    if (!conceptoForm.nombre.trim()) errs.nombre = 'Ingresa el nombre del concepto';
    if (!conceptoForm.tipo) errs.tipo = 'Selecciona el tipo';

    if (conceptoForm.diferenciadoPorNivel) {
      conceptoForm.montosPorNivel.forEach((n) => {
        if (!n.monto.trim() || parseFloat(n.monto) <= 0) {
          errs[`nivel-${n.nivelId}`] = `Ingresa el monto para ${n.nivelNombre}`;
        }
      });
    } else if (!conceptoForm.montoBase.trim() || parseFloat(conceptoForm.montoBase) <= 0) {
      errs.montoBase = 'Ingresa un monto válido';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      let montoFinal: number;
      let montosPorNivel: ConceptoPagoNivel[] = [];

      if (conceptoForm.diferenciadoPorNivel) {
        montosPorNivel = conceptoForm.montosPorNivel.map((n) => ({
          nivelId: n.nivelId,
          nivelNombre: n.nivelNombre,
          monto: parseFloat(n.monto),
        }));
        montoFinal = Math.min(...montosPorNivel.map((n) => n.monto));
      } else {
        montoFinal = parseFloat(conceptoForm.montoBase);
        montosPorNivel = [];
      }

      const datos = {
        nombre: conceptoForm.nombre.trim(),
        monto: montoFinal,
        tipo: conceptoForm.tipo,
        diferenciadoPorNivel: conceptoForm.diferenciadoPorNivel,
        montosPorNivel,
        activo: true,
      };

      let conceptId = editingConcepto?.id;
      if (editingConcepto) {
        if (!isGuid(editingConcepto.id)) {
          showToast('Concepto inválido', 'error');
          return;
        }
        const res = await settingsApi.updatePaymentConcept(editingConcepto.id, {
          ...datos,
          activo: editingConcepto.activo,
        });
        if (!res.success || !res.data) {
          showToast(res.message || 'No se pudo actualizar', 'error');
          return;
        }
        conceptId = res.data.id;
        onConceptosUpdate(
          conceptos.map((c) =>
            c.id === editingConcepto.id ? { ...res.data!, montosPorNivel } : c
          )
        );
        showToast('Concepto de pago actualizado', 'success');
      } else {
        const res = await settingsApi.createPaymentConcept(datos);
        if (!res.success || !res.data) {
          showToast(res.message || 'No se pudo crear', 'error');
          return;
        }
        conceptId = res.data.id;
        onConceptosUpdate([...conceptos, { ...res.data, montosPorNivel }]);
        showToast('Concepto de pago agregado', 'success');
      }

      if (conceptId && datos.diferenciadoPorNivel && montosPorNivel.length > 0) {
        const amounts = montosPorNivel
          .filter((n) => isGuid(n.nivelId))
          .map((n) => ({ educationLevelId: n.nivelId, amount: n.monto }));
        if (amounts.length) {
          const amt = await settingsApi.setPaymentConceptAmounts(conceptId, amounts);
          if (!amt.success) {
            showToast(amt.message || 'Concepto guardado, pero fallaron montos por nivel', 'error');
          }
        }
      }

      setModalConcepto(false);
      invalidatePagos();
    } catch {
      showToast('Error de red al guardar concepto', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (!isGuid(deleteTarget.item.id)) {
      showToast('Registro inválido', 'error');
      return;
    }
    setDeleting(true);
    const name = deleteTarget.item.nombre;
    try {
      const res =
        deleteTarget.type === 'metodo'
          ? await settingsApi.deletePaymentMethod(deleteTarget.item.id)
          : await settingsApi.deletePaymentConcept(deleteTarget.item.id);
      if (!res.success) {
        showToast(res.message || 'No se pudo eliminar', 'error');
        return;
      }
      if (deleteTarget.type === 'metodo') {
        onMetodosUpdate(metodos.filter((m) => m.id !== deleteTarget.item.id));
      } else {
        onConceptosUpdate(conceptos.filter((c) => c.id !== deleteTarget.item.id));
      }
      showToast(`"${name}" eliminado`, 'success');
      setDeleteTarget(null);
      invalidatePagos();
    } catch {
      showToast('Error de red al eliminar', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const toggleDiferenciado = (on: boolean) => {
    if (on) {
      const montosPorNivel = nivelesActivos.map((n) => ({
        nivelId: n.id,
        nivelNombre: n.nombre,
        monto: '',
      }));
      setConceptoForm((f) => ({ ...f, diferenciadoPorNivel: true, montoBase: '', montosPorNivel }));
    } else {
      setConceptoForm((f) => ({ ...f, diferenciadoPorNivel: false, montosPorNivel: [] }));
    }
    setErrors({});
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card padding="lg">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground-900">Métodos de Pago</h3>
              <p className="text-xs text-foreground-500 mt-0.5">Configura las formas de pago aceptadas</p>
            </div>
            <Button variant="primary" size="sm" icon="ri-add-line" onClick={openCreateMetodo}>Agregar</Button>
          </div>
          <div className="space-y-3">
            {metodos.map((met) => (
              <div key={met.id} className="flex items-center justify-between p-3 rounded-lg border border-secondary-200/70 bg-background-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground-800">{met.nombre}</span>
                    <Badge variant={met.activo ? 'success' : 'default'} size="sm">{met.activo ? 'Activo' : 'Inactivo'}</Badge>
                  </div>
                  <p className="text-xs text-foreground-500 truncate">{met.info}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                  <button onClick={() => toggleMetodo(met.id)} className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${met.activo ? 'bg-emerald-500' : 'bg-secondary-300'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${met.activo ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                  <Button variant="ghost" size="xs" icon="ri-pencil-line" onClick={() => openEditMetodo(met)} />
                  <Button variant="ghost" size="xs" icon="ri-delete-bin-line" onClick={() => setDeleteTarget({ type: 'metodo', item: met })} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground-900">Conceptos de Pago</h3>
              <p className="text-xs text-foreground-500 mt-0.5">Montos configurables por nivel educativo</p>
            </div>
            <Button variant="primary" size="sm" icon="ri-add-line" onClick={openCreateConcepto}>Agregar</Button>
          </div>
          <div className="space-y-2">
            {conceptos.map((conc) => (
              <div key={conc.id} className="flex items-start justify-between p-3 rounded-lg border border-secondary-200/70 bg-background-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground-800">{conc.nombre}</span>
                    <Badge variant={conc.tipo === 'recurrente' ? 'primary' : conc.tipo === 'mensual' ? 'accent' : 'default'} size="sm">{conc.tipo}</Badge>
                    {conc.diferenciadoPorNivel && (
                      <span className="text-[10px] text-accent-600 bg-accent-100/70 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">por nivel</span>
                    )}
                  </div>
                  {conc.diferenciadoPorNivel && conc.montosPorNivel.length > 0 ? (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      {conc.montosPorNivel.map((n) => (
                        <span key={n.nivelId} className="text-xs text-foreground-500 whitespace-nowrap">
                          <span className="font-medium text-foreground-700">{ABREV_NIVEL[n.nivelNombre] || n.nivelNombre}</span>{' '}
                          {formatMXN(n.monto)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-foreground-900">{formatMXN(conc.monto)}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-3 mt-0.5">
                  <Button variant="ghost" size="xs" icon="ri-pencil-line" onClick={() => openEditConcepto(conc)} />
                  <Button variant="ghost" size="xs" icon="ri-delete-bin-line" onClick={() => setDeleteTarget({ type: 'concepto', item: conc })} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal
        open={modalMetodo}
        onClose={() => { setModalMetodo(false); setErrors({}); }}
        title={editingMetodo ? 'Editar Método de Pago' : 'Agregar Método de Pago'}
        subtitle={editingMetodo ? `Editando: ${editingMetodo.nombre}` : 'Define la nueva forma de pago aceptada'}
        size="sm"
        footer={<div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={() => { setModalMetodo(false); setErrors({}); }}>Cancelar</Button><Button variant="primary" size="sm" icon={saving ? undefined : 'ri-check-line'} onClick={handleSaveMetodo} disabled={saving}>{saving ? (<><span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />Guardando...</>) : editingMetodo ? 'Guardar Cambios' : 'Agregar'}</Button></div>}
      >
        <div className="space-y-4">
          <Input label="Nombre" required value={metodoForm.nombre} onChange={(e) => { setMetodoForm((f) => ({ ...f, nombre: e.target.value })); if (errors.nombre) setErrors((p) => { const n = { ...p }; delete n.nombre; return n; }); }} error={errors.nombre} placeholder="Ej. Pago con PayPal" />
          <Input label="Información" required value={metodoForm.info} onChange={(e) => { setMetodoForm((f) => ({ ...f, info: e.target.value })); if (errors.info) setErrors((p) => { const n = { ...p }; delete n.info; return n; }); }} error={errors.info} placeholder="Ej. Cuenta PayPal: ejemplo@correo.com" />
        </div>
      </Modal>

      <Modal
        open={modalConcepto}
        onClose={() => { setModalConcepto(false); setErrors({}); }}
        title={editingConcepto ? 'Editar Concepto de Pago' : 'Agregar Concepto de Pago'}
        subtitle={editingConcepto ? `Editando: ${editingConcepto.nombre}` : 'Define el nuevo concepto y sus montos'}
        size="md"
        footer={<div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={() => { setModalConcepto(false); setErrors({}); }}>Cancelar</Button><Button variant="primary" size="sm" icon={saving ? undefined : 'ri-check-line'} onClick={handleSaveConcepto} disabled={saving}>{saving ? (<><span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />Guardando...</>) : editingConcepto ? 'Guardar Cambios' : 'Agregar'}</Button></div>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre del Concepto" required value={conceptoForm.nombre} onChange={(e) => { setConceptoForm((f) => ({ ...f, nombre: e.target.value })); if (errors.nombre) setErrors((p) => { const n = { ...p }; delete n.nombre; return n; }); }} error={errors.nombre} placeholder="Ej. Colegiatura Mensual" />
            <Select
              label="Tipo" required
              options={[{ value: '', label: 'Seleccionar tipo...' }, { value: 'recurrente', label: 'Recurrente' }, { value: 'unico', label: 'Único' }, { value: 'mensual', label: 'Mensual' }, { value: 'anual', label: 'Anual' }]}
              value={conceptoForm.tipo}
              onChange={(e) => { setConceptoForm((f) => ({ ...f, tipo: e.target.value })); if (errors.tipo) setErrors((p) => { const n = { ...p }; delete n.tipo; return n; }); }}
              error={errors.tipo}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary-50 border border-secondary-200/60">
            <div>
              <span className="text-sm font-medium text-foreground-800">Precio diferenciado por nivel educativo</span>
              <p className="text-xs text-foreground-500 mt-0.5">Asigna un monto distinto para cada nivel</p>
            </div>
            <button
              type="button"
              onClick={() => toggleDiferenciado(!conceptoForm.diferenciadoPorNivel)}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${conceptoForm.diferenciadoPorNivel ? 'bg-accent-500' : 'bg-secondary-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${conceptoForm.diferenciadoPorNivel ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
          </div>

          {conceptoForm.diferenciadoPorNivel ? (
            <div className="grid grid-cols-2 gap-3">
              {conceptoForm.montosPorNivel.map((n, idx) => (
                <Input
                  key={n.nivelId}
                  label={n.nivelNombre}
                  required
                  type="number"
                  value={n.monto}
                  onChange={(e) => {
                    const nuevos = [...conceptoForm.montosPorNivel];
                    nuevos[idx] = { ...nuevos[idx], monto: e.target.value };
                    setConceptoForm((f) => ({ ...f, montosPorNivel: nuevos }));
                    const ek = `nivel-${n.nivelId}`;
                    if (errors[ek]) setErrors((p) => { const nx = { ...p }; delete nx[ek]; return nx; });
                  }}
                  error={errors[`nivel-${n.nivelId}`]}
                  placeholder="0.00"
                />
              ))}
            </div>
          ) : (
            <Input
              label="Monto"
              required
              type="number"
              value={conceptoForm.montoBase}
              onChange={(e) => { setConceptoForm((f) => ({ ...f, montoBase: e.target.value })); if (errors.montoBase) setErrors((p) => { const n = { ...p }; delete n.montoBase; return n; }); }}
              error={errors.montoBase}
              placeholder="0.00"
            />
          )}
        </div>
      </Modal>

      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={deleteTarget?.type === 'metodo' ? 'Eliminar Método de Pago' : 'Eliminar Concepto de Pago'}
        message={`¿Estás seguro de eliminar "${deleteTarget?.item.nombre}"? Esta acción no se puede deshacer.`}
      />
    </>
  );
}