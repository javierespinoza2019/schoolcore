import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Select from '@/components/base/Select';
import Stepper, { type Step } from '@/components/base/Stepper';
import type { Salon, SalonGrupo } from '@/mocks/salones';
import { useSchoolContext } from '@/context/SchoolContext';
import { listBranches } from '@/api/branchesApi';
import { listTeachers } from '@/api/teachersApi';
import { listEducationLevels } from '@/api/settingsApi';
import { isGuid } from '@/api/helpers';
import { queryKeys } from '@/api/queryKeys';
import {
  FieldLimits,
  assignError,
  validatePositiveNumber,
  validateTextFree,
} from '@/lib/validation/fields';
import { afterValidationErrors } from '@/lib/ui/scrollToFirstError';

interface SalonFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: SalonFormData) => void;
  salon?: Salon | null;
  saving?: boolean;
}

export interface SalonFormData {
  nombre: string;
  nivel: string;
  grado: string;
  grupo: string;
  capacidad: string;
  sucursal: string;
  tipo: string;
  edificio: string;
  piso: string;
  equipamiento: string;
  profesorAsignado: string;
  horarioClase: string;
  estado: string;
  gruposAsignados: SalonGrupo[];
}

const emptyForm: SalonFormData = {
  nombre: '',
  nivel: '',
  grado: '',
  grupo: '',
  capacidad: '35',
  sucursal: '',
  tipo: 'Regular',
  edificio: '',
  piso: '1',
  equipamiento: '',
  profesorAsignado: '',
  horarioClase: '',
  estado: 'Disponible',
  gruposAsignados: [],
};

const emptyGrupoDraft = (): SalonGrupo => ({
  grupo: 'A',
  grado: '1°',
  nivel: 'Secundaria',
  horario: '',
  profesor: '',
});

const wizardSteps: Step[] = [
  { id: 'infra', label: 'Salón', subtitle: 'Datos del espacio', icon: 'ri-door-open-line' },
  { id: 'grupos', label: 'Grupos', subtitle: 'Vínculos (opcional)', icon: 'ri-group-line' },
];

const nivelesFallback = ['Preescolar', 'Primaria', 'Secundaria', 'Preparatoria', 'Todas'];
const tipos = ['Regular', 'Laboratorio', 'Taller', 'Auditorio', 'Deportivo'];
const estados = ['Disponible', 'Lleno', 'Mantenimiento'];
const grupos = ['A', 'B', 'C', 'D', 'E', 'Todos'];
const grados = ['1°', '2°', '3°', '4°', '5°', '6°', 'Todos'];

function seedGruposFromSalon(salon: Salon): SalonGrupo[] {
  if (salon.gruposAsignados && salon.gruposAsignados.length > 0) {
    return salon.gruposAsignados.map((g) => ({ ...g }));
  }
  const hasFlatAssignment = Boolean(salon.nivel || salon.grado || salon.grupo || salon.horarioClase);
  if (!hasFlatAssignment) return [];

  const profesor =
    isGuid(salon.teacherId)
      ? salon.teacherId!
      : salon.profesorAsignado && salon.profesorAsignado !== 'Sin asignar'
        ? salon.profesorAsignado
        : '';

  return [
    {
      grupo: salon.grupo || 'A',
      grado: salon.grado || '1°',
      nivel: salon.nivel || 'Secundaria',
      horario: salon.horarioClase || '',
      profesor: profesor || undefined,
    },
  ];
}

/** Flatten first group link into legacy flat columns for the existing API payload. */
function withFlatFieldsFromLinks(form: SalonFormData): SalonFormData {
  const first = form.gruposAsignados[0];
  if (!first) {
    return {
      ...form,
      nivel: form.nivel || '',
      grado: form.grado || '',
      grupo: form.grupo || '',
      profesorAsignado: form.profesorAsignado || 'Sin asignar',
      horarioClase: form.horarioClase || '',
    };
  }

  const profesor = (first.profesor || '').trim();
  return {
    ...form,
    nivel: first.nivel,
    grado: first.grado,
    grupo: first.grupo,
    horarioClase: first.horario,
    profesorAsignado: profesor || 'Sin asignar',
  };
}

export default function SalonFormModal({ open, onClose, onSave, salon, saving = false }: SalonFormModalProps) {
  const { branchId, branchOptions } = useSchoolContext();
  const branchesQ = useQuery({
    queryKey: queryKeys.branches.list(),
    queryFn: () => listBranches({ pageSize: 100 }),
    enabled: open,
  });
  const levelsQ = useQuery({
    queryKey: queryKeys.settings.catalogs(),
    queryFn: () => listEducationLevels(),
    enabled: open,
  });

  const sucursalOptions = useMemo(() => {
    if (branchOptions.some((b) => isGuid(b.id))) {
      return branchOptions
        .filter((b) => isGuid(b.id))
        .map((b) => ({ value: b.id, label: b.name || b.shortName }));
    }
    return (branchesQ.data?.data ?? [])
      .filter((b) => isGuid(b.id))
      .map((b) => ({ value: String(b.id), label: b.nombre }));
  }, [branchOptions, branchesQ.data]);

  const nivelOptions = useMemo(() => {
    const fromApi = (levelsQ.data?.data ?? [])
      .map((lvl) => {
        const row = lvl as unknown as Record<string, unknown>;
        const name = String(row.nombre ?? row.name ?? '').trim();
        return name;
      })
      .filter(Boolean);
    const names = [...new Set([...nivelesFallback, ...fromApi])];
    return names.map((n) => ({ value: n, label: n }));
  }, [levelsQ.data]);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<SalonFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [addingGrupo, setAddingGrupo] = useState(false);
  const [newGrupo, setNewGrupo] = useState<SalonGrupo>(emptyGrupoDraft);
  const [linkError, setLinkError] = useState('');
  const [editingGrupoIndex, setEditingGrupoIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;

    if (salon) {
      setForm({
        nombre: salon.nombre,
        nivel: salon.nivel,
        grado: salon.grado,
        grupo: salon.grupo,
        capacidad: String(salon.capacidad),
        sucursal: isGuid(salon.branchId) ? salon.branchId! : isGuid(salon.sucursal) ? salon.sucursal : branchId || '',
        tipo: salon.tipo,
        edificio: salon.edificio,
        piso: String(salon.piso),
        equipamiento: salon.equipamiento.join(', '),
        profesorAsignado: isGuid(salon.teacherId) ? salon.teacherId! : salon.profesorAsignado,
        horarioClase: salon.horarioClase,
        estado: salon.estado,
        gruposAsignados: seedGruposFromSalon(salon),
      });
    } else {
      const defaultBranch = isGuid(branchId)
        ? branchId!
        : (sucursalOptions[0]?.value || '');
      setForm({
        ...emptyForm,
        sucursal: defaultBranch,
      });
    }
    setStep(0);
    setErrors({});
    setLinkError('');
    setAddingGrupo(false);
    setNewGrupo(emptyGrupoDraft());
    setEditingGrupoIndex(null);
    // Intentionally only reset when opening / switching salon (not when branch options load).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salon, open]);

  const teacherListBranchId = isGuid(form.sucursal) ? form.sucursal : branchId;
  const teachersQ = useQuery({
    queryKey: queryKeys.teachers.list({ pageSize: 100, branchId: teacherListBranchId }),
    queryFn: () => listTeachers({ pageSize: 100, branchId: teacherListBranchId || undefined }),
    enabled: open && Boolean(teacherListBranchId),
  });

  const profesorOptions = useMemo(() => {
    const options = [
      { value: '', label: 'Sin asignar / opcional' },
    ];
    const seen = new Set<string>(['']);
    for (const t of teachersQ.data?.data ?? []) {
      const id = String(t.id ?? '');
      const name = String(t.nombre ?? '').trim();
      const value = isGuid(id) ? id : name;
      if (!value || seen.has(value)) continue;
      seen.add(value);
      options.push({ value, label: name || value });
    }
    const seeded = [
      salon?.teacherId,
      salon?.profesorAsignado,
      ...(salon?.gruposAsignados ?? []).map((g) => g.profesor),
    ].filter((v): v is string => Boolean(v && v !== 'Sin asignar'));
    for (const current of seeded) {
      if (seen.has(current)) continue;
      seen.add(current);
      options.push({
        value: current,
        label: isGuid(current) ? 'Profesor asignado' : current,
      });
    }
    return options;
  }, [teachersQ.data, salon]);

  const profesorLabelByValue = useMemo(() => {
    const map = new Map<string, string>();
    for (const opt of profesorOptions) {
      if (opt.value) map.set(opt.value, opt.label);
    }
    return map;
  }, [profesorOptions]);

  const handleChange = (field: keyof SalonFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.nombre.trim()) newErrors.nombre = 'El nombre/código es obligatorio';
    assignError(newErrors, 'nombre', validateTextFree(form.nombre, FieldLimits.classroomName, 'El nombre', true));
    if (!form.tipo) newErrors.tipo = 'Selecciona un tipo';
    assignError(newErrors, 'capacidad', validatePositiveNumber(form.capacidad, 'La capacidad'));
    assignError(newErrors, 'edificio', validateTextFree(form.edificio, FieldLimits.building, 'Edificio', true));
    if (!form.piso.trim()) newErrors.piso = 'El piso es obligatorio';
    else if (isNaN(Number(form.piso)) || Number(form.piso) < 0) {
      newErrors.piso = 'Ingresa un número de piso válido';
    }
    if (!isGuid(form.sucursal)) newErrors.sucursal = 'Selecciona una sucursal válida';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      afterValidationErrors(newErrors);
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep1()) return;
    setStep(1);
  };

  const goBack = () => setStep(0);

  const handleStepClick = (index: number) => {
    if (index < step) setStep(index);
    if (index > step && index === 1 && validateStep1()) setStep(1);
  };

  const addGrupo = () => {
    if (!newGrupo.nivel.trim()) {
      setLinkError('Selecciona el nivel del grupo');
      return;
    }
    if (!newGrupo.grado.trim()) {
      setLinkError('Selecciona el grado');
      return;
    }
    if (!newGrupo.grupo.trim()) {
      setLinkError('Selecciona el grupo');
      return;
    }
    if (!newGrupo.horario.trim()) {
      setLinkError('Indica el horario del vínculo');
      return;
    }

    setForm((prev) => {
      const entry = { ...newGrupo, profesor: newGrupo.profesor || undefined };
      if (editingGrupoIndex != null) {
        return {
          ...prev,
          gruposAsignados: prev.gruposAsignados.map((g, i) => (i === editingGrupoIndex ? entry : g)),
        };
      }
      return { ...prev, gruposAsignados: [...prev.gruposAsignados, entry] };
    });
    setAddingGrupo(false);
    setNewGrupo(emptyGrupoDraft());
    setEditingGrupoIndex(null);
    setLinkError('');
  };

  const startEditGrupo = (index: number) => {
    const g = form.gruposAsignados[index];
    if (!g) return;
    setNewGrupo({ ...g });
    setEditingGrupoIndex(index);
    setAddingGrupo(true);
    setLinkError('');
  };

  const removeGrupo = (index: number) => {
    setForm((prev) => ({
      ...prev,
      gruposAsignados: prev.gruposAsignados.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    if (saving) return;
    if (!validateStep1()) {
      setStep(0);
      return;
    }
    onSave(withFlatFieldsFromLinks(form));
  };

  const isEdit = Boolean(salon);
  const hasLinks = form.gruposAsignados.length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar Salón' : 'Nuevo Salón'}
      subtitle={
        step === 0
          ? (isEdit ? `Editando: ${salon?.nombre}` : 'Paso 1 de 2 — datos del espacio físico')
          : 'Paso 2 de 2 — vincular grupos (opcional)'
      }
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          {step === 0 ? (
            <Button variant="primary" size="sm" iconRight="ri-arrow-right-line" onClick={goNext}>
              Siguiente
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" icon="ri-arrow-left-line" onClick={goBack} disabled={saving}>
                Atrás
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon="ri-save-line"
                onClick={handleSubmit}
                disabled={saving}
                loading={saving}
              >
                {hasLinks
                  ? (isEdit ? 'Guardar cambios' : 'Registrar salón')
                  : 'Guardar sin grupos'}
              </Button>
            </>
          )}
        </>
      }
    >
      <div className="space-y-5">
        <Stepper steps={wizardSteps} currentStep={step} onStepClick={handleStepClick} className="mb-1" />

        {step === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Nombre / Código"
                required
                maxLength={FieldLimits.classroomName}
                value={form.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                error={errors.nombre}
                placeholder="Ej. A-101"
              />
              <Select
                label="Tipo"
                required
                value={form.tipo}
                onChange={(e) => handleChange('tipo', e.target.value)}
                options={tipos.map((t) => ({ value: t, label: t }))}
                error={errors.tipo}
              />
              <Select
                label="Estado"
                value={form.estado}
                onChange={(e) => handleChange('estado', e.target.value)}
                options={estados.map((e) => ({ value: e, label: e }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Capacidad"
                type="number"
                required
                value={form.capacidad}
                onChange={(e) => handleChange('capacidad', e.target.value)}
                error={errors.capacidad}
                placeholder="35"
              />
              <Input
                label="Edificio"
                maxLength={FieldLimits.building}
                value={form.edificio}
                onChange={(e) => handleChange('edificio', e.target.value)}
                error={errors.edificio}
                placeholder="Ej. Edificio A"
              />
              <Input
                label="Piso"
                type="number"
                required
                value={form.piso}
                onChange={(e) => handleChange('piso', e.target.value)}
                error={errors.piso}
                placeholder="1"
              />
            </div>

            <Select
              label="Sucursal"
              required
              value={form.sucursal}
              onChange={(e) => handleChange('sucursal', e.target.value)}
              options={
                sucursalOptions.length > 0
                  ? sucursalOptions
                  : [{ value: '', label: 'Sin sucursales disponibles' }]
              }
              error={errors.sucursal}
            />

            <Input
              label="Equipamiento"
              value={form.equipamiento}
              onChange={(e) => handleChange('equipamiento', e.target.value)}
              placeholder="Proyector, Pizarrón Inteligente, Aire Acondicionado"
              hint="Separa cada elemento con una coma"
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground-800">Grupos vinculados a este salón</p>
                <p className="text-xs text-foreground-500 mt-0.5">
                  Puedes vincular varios grupos (nivel, grado, horario y profesor por vínculo). Este paso es opcional.
                </p>
              </div>
              {!addingGrupo && (
                <Button variant="outline" size="sm" icon="ri-link" onClick={() => { setAddingGrupo(true); setLinkError(''); }}>
                  Vincular a este Salón
                </Button>
              )}
            </div>

            {form.gruposAsignados.length === 0 && !addingGrupo && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-background-100/60 border border-background-200/40">
                <i className="ri-information-line text-foreground-400 text-sm mt-0.5" />
                <div>
                  <p className="text-xs text-foreground-600">
                    Sin grupos vinculados. Puedes guardar el salón ahora y asignar grupos después.
                  </p>
                  <p className="text-2xs text-foreground-400 mt-1">
                    La ocupación del listado se estima por coincidencia de nivel/grupo; no se reasigna alumnos al guardar.
                  </p>
                </div>
              </div>
            )}

            {form.gruposAsignados.length > 0 && (
              <div className="space-y-2">
                {form.gruposAsignados.map((g, i) => {
                  const profesorLabel = g.profesor
                    ? profesorLabelByValue.get(g.profesor) ||
                      (isGuid(g.profesor) ? 'Profesor asignado' : g.profesor)
                    : null;
                  return (
                    <div
                      key={`${g.nivel}-${g.grado}-${g.grupo}-${g.horario}-${i}`}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-background-100 border border-background-200/70"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground-800 truncate">
                          {[g.nivel, g.grado, g.grupo ? `Grupo ${g.grupo}` : '']
                            .map((part) => (isGuid(part) ? '' : part))
                            .filter(Boolean)
                            .join(' · ') || 'Vínculo'}
                        </p>
                        <p className="text-xs text-foreground-500 truncate">
                          {g.horario}
                          {profesorLabel ? ` · ${profesorLabel}` : ' · Sin profesor'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditGrupo(i)}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-400 hover:text-foreground-700 hover:bg-secondary-100 transition-colors cursor-pointer"
                        title="Editar vínculo"
                      >
                        <i className="ri-pencil-line text-sm" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeGrupo(i)}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Quitar vínculo"
                      >
                        <i className="ri-close-line text-sm" />
                      </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {addingGrupo && (
              <div className="p-3 rounded-lg bg-background-100 border border-background-200/70 space-y-3">
                <p className="text-xs font-medium text-foreground-700">
                  {editingGrupoIndex != null ? 'Editar vínculo' : 'Nuevo vínculo'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Select
                    label="Nivel"
                    required
                    value={newGrupo.nivel}
                    onChange={(e) => setNewGrupo((prev) => ({ ...prev, nivel: e.target.value }))}
                    options={nivelOptions}
                  />
                  <Select
                    label="Grado"
                    required
                    value={newGrupo.grado}
                    onChange={(e) => setNewGrupo((prev) => ({ ...prev, grado: e.target.value }))}
                    options={grados.map((g) => ({ value: g, label: g }))}
                  />
                  <Select
                    label="Grupo"
                    required
                    value={newGrupo.grupo}
                    onChange={(e) => setNewGrupo((prev) => ({ ...prev, grupo: e.target.value }))}
                    options={grupos.map((g) => ({ value: g, label: g }))}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    label="Horario"
                    required
                    maxLength={FieldLimits.schedule}
                    value={newGrupo.horario}
                    onChange={(e) => {
                      setNewGrupo((prev) => ({ ...prev, horario: e.target.value }));
                      if (linkError) setLinkError('');
                    }}
                    placeholder="Lun–Vie 7:00 – 14:00"
                  />
                  <Select
                    label="Profesor"
                    value={newGrupo.profesor || ''}
                    onChange={(e) => setNewGrupo((prev) => ({ ...prev, profesor: e.target.value }))}
                    options={profesorOptions}
                  />
                </div>
                {linkError && <p className="text-xs text-red-600">{linkError}</p>}
                <div className="flex items-center gap-2 pt-1">
                  <Button variant="primary" size="sm" icon="ri-link" onClick={addGrupo}>
                    {editingGrupoIndex != null ? 'Guardar vínculo' : 'Vincular a este Salón'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="ri-close-line"
                    onClick={() => {
                      setAddingGrupo(false);
                      setEditingGrupoIndex(null);
                      setNewGrupo(emptyGrupoDraft());
                      setLinkError('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
