import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Select from '@/components/base/Select';
import type { Salon, SalonGrupo } from '@/mocks/salones';
import { profesoresData } from '@/mocks/profesores';
import { students } from '@/mocks/alumnos';
import { useSchoolContext } from '@/context/SchoolContext';
import { listBranches } from '@/api/branchesApi';
import { listTeachers } from '@/api/teachersApi';
import { listEducationLevels } from '@/api/settingsApi';
import { isGuid } from '@/api/helpers';
import { queryKeys } from '@/api/queryKeys';

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
  nombre: '', nivel: 'Secundaria', grado: '1°', grupo: 'A',
  capacidad: '35', sucursal: '', tipo: 'Regular',
  edificio: '', piso: '1', equipamiento: '',
  profesorAsignado: '', horarioClase: '', estado: 'Disponible',
  gruposAsignados: [],
};

const niveles = ['Preescolar', 'Primaria', 'Secundaria', 'Preparatoria', 'Todas'];
const tipos = ['Regular', 'Laboratorio', 'Taller', 'Auditorio', 'Deportivo'];
const estados = ['Disponible', 'Lleno', 'Mantenimiento'];
const grupos = ['A', 'B', 'C', 'D', 'E', 'Todos'];
const grados = ['1°', '2°', '3°', '4°', '5°', '6°', 'Todos'];

export default function SalonFormModal({ open, onClose, onSave, salon, saving = false }: SalonFormModalProps) {
  const { branchId, branchOptions } = useSchoolContext();
  const branchesQ = useQuery({
    queryKey: queryKeys.branches.list(),
    queryFn: () => listBranches({ pageSize: 100 }),
    enabled: open,
  });
  const teachersQ = useQuery({
    queryKey: queryKeys.teachers.list({ pageSize: 100 }),
    queryFn: () => listTeachers({ pageSize: 100 }),
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
    const names = [...new Set([...niveles, ...fromApi])];
    return names.map((n) => ({ value: n, label: n }));
  }, [levelsQ.data]);

  const profesorOptions = useMemo(() => {
    const options = [
      { value: '', label: 'Selecciona un profesor...' },
      { value: 'Sin asignar', label: 'Sin asignar' },
    ];
    const seen = new Set<string>(['', 'Sin asignar']);
    for (const raw of teachersQ.data?.data ?? []) {
      const row = raw as unknown as Record<string, unknown>;
      const id = String(row.id ?? '');
      const name = String(
        row.nombre ?? `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim()
      ).trim();
      const value = isGuid(id) ? id : name;
      if (!value || seen.has(value)) continue;
      seen.add(value);
      options.push({ value, label: name || value });
    }
    for (const p of profesoresData.filter((x) => x.estado === 'Activo')) {
      if (seen.has(p.nombre)) continue;
      seen.add(p.nombre);
      options.push({ value: p.nombre, label: p.nombre });
    }
    const current = salon?.profesorAsignado || salon?.teacherId;
    if (current && !seen.has(current)) {
      options.push({ value: current, label: salon?.profesorAsignado || current });
    }
    return options;
  }, [teachersQ.data, salon]);
  const [form, setForm] = useState<SalonFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [addingGrupo, setAddingGrupo] = useState(false);
  const [newGrupo, setNewGrupo] = useState<SalonGrupo>({ grupo: 'A', grado: '1°', nivel: 'Secundaria', horario: '', profesor: '' });

  useEffect(() => {
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
        gruposAsignados: salon.gruposAsignados ? [...salon.gruposAsignados] : [],
      });
    } else {
      setForm({
        ...emptyForm,
        sucursal: isGuid(branchId) ? branchId! : sucursalOptions[0]?.value || '',
      });
    }
    setErrors({});
    setAddingGrupo(false);
    setNewGrupo({ grupo: 'A', grado: '1°', nivel: 'Secundaria', horario: '', profesor: '' });
  }, [salon, open]);

  const handleChange = (field: keyof SalonFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const matchingStudentsCount = useMemo(() => {
    if (!form.nivel || !form.grado || !form.grupo || !form.sucursal) return 0;
    return students.filter(
      (alumno) =>
        alumno.status === 'active' &&
        alumno.branchName === form.sucursal &&
        alumno.level === form.nivel &&
        alumno.group === form.grupo
    ).length;
  }, [form.nivel, form.grado, form.grupo, form.sucursal]);

  const addGrupo = () => {
    if (!newGrupo.horario.trim()) return;
    setForm((prev) => ({
      ...prev,
      gruposAsignados: [...prev.gruposAsignados, { ...newGrupo }],
    }));
    setAddingGrupo(false);
    setNewGrupo({ grupo: 'A', grado: '1°', nivel: 'Secundaria', horario: '', profesor: '' });
  };

  const removeGrupo = (index: number) => {
    setForm((prev) => ({
      ...prev,
      gruposAsignados: prev.gruposAsignados.filter((_, i) => i !== index),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.nombre.trim()) newErrors.nombre = 'El nombre/código es obligatorio';
    if (!form.tipo) newErrors.tipo = 'Selecciona un tipo';
    if (!form.capacidad.trim()) newErrors.capacidad = 'La capacidad es obligatoria';
    else if (isNaN(Number(form.capacidad)) || Number(form.capacidad) <= 0) newErrors.capacidad = 'Ingresa un número válido mayor a 0';
    if (!form.edificio.trim()) newErrors.edificio = 'El edificio es obligatorio';
    if (!form.piso.trim()) newErrors.piso = 'El piso es obligatorio';
    else if (isNaN(Number(form.piso)) || Number(form.piso) <= 0) newErrors.piso = 'Ingresa un número de piso válido';
    if (!isGuid(form.sucursal)) newErrors.sucursal = 'Selecciona una sucursal válida';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={salon ? 'Editar Salón' : 'Nuevo Salón'}
      subtitle={salon ? `Editando: ${salon.nombre}` : 'Los campos marcados con * son obligatorios'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button variant="primary" size="sm" icon="ri-save-line" onClick={handleSubmit} loading={saving}>
            {salon ? 'Guardar Cambios' : 'Registrar Salón'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="Nombre / Código" required value={form.nombre} onChange={(e) => handleChange('nombre', e.target.value)} error={errors.nombre} placeholder="Ej. A-101" />
          <Select label="Tipo" required value={form.tipo} onChange={(e) => handleChange('tipo', e.target.value)} options={tipos.map((t) => ({ value: t, label: t }))} error={errors.tipo} />
          <Select label="Estado" value={form.estado} onChange={(e) => handleChange('estado', e.target.value)} options={estados.map((e) => ({ value: e, label: e }))} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select label="Nivel" value={form.nivel} onChange={(e) => handleChange('nivel', e.target.value)} options={nivelOptions} />
          <Select label="Grado" value={form.grado} onChange={(e) => handleChange('grado', e.target.value)} options={grados.map((g) => ({ value: g, label: g }))} />
          <Select label="Grupo" value={form.grupo} onChange={(e) => handleChange('grupo', e.target.value)} options={grupos.map((g) => ({ value: g, label: g }))} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="Capacidad" type="number" required value={form.capacidad} onChange={(e) => handleChange('capacidad', e.target.value)} error={errors.capacidad} placeholder="35" />
          <Input label="Edificio" required value={form.edificio} onChange={(e) => handleChange('edificio', e.target.value)} error={errors.edificio} placeholder="Ej. Edificio A" />
          <Input label="Piso" type="number" required value={form.piso} onChange={(e) => handleChange('piso', e.target.value)} error={errors.piso} placeholder="1" />
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

        {form.nivel && form.grado && form.grupo && form.sucursal && (
          <div className={`flex items-center gap-3 p-3 rounded-lg border ${
            matchingStudentsCount > 0
              ? 'bg-primary-50/50 border-primary-200'
              : 'bg-background-100/60 border-background-200/40'
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              matchingStudentsCount > 0 ? 'bg-primary-100 text-primary-600' : 'bg-background-200 text-foreground-400'
            }`}>
              <i className="ri-group-line text-sm" />
            </div>
            <div className="flex-1 min-w-0">
              {matchingStudentsCount > 0 ? (
                <p className="text-sm font-medium text-primary-700">
                  {matchingStudentsCount} alumno{matchingStudentsCount !== 1 ? 's' : ''} activo{matchingStudentsCount !== 1 ? 's' : ''} coinciden con esta configuración
                </p>
              ) : (
                <p className="text-sm text-foreground-500">
                  Ningún alumno activo coincide con {form.nivel} · {form.grado}° · Grupo {form.grupo} · {form.sucursal}
                </p>
              )}
              <p className="text-xs text-foreground-400 mt-0.5">
                Los alumnos se vincularán automáticamente al guardar
              </p>
            </div>
            {matchingStudentsCount > 0 && (
              <div className="flex-shrink-0">
                <span className="text-xs font-bold text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">
                  {matchingStudentsCount}
                </span>
              </div>
            )}
          </div>
        )}

        <Select
          label="Profesor Asignado"
          required
          value={form.profesorAsignado}
          onChange={(e) => handleChange('profesorAsignado', e.target.value)}
          options={profesorOptions}
          error={errors.profesorAsignado}
        />
        <Input label="Horario de Clase" required value={form.horarioClase} onChange={(e) => handleChange('horarioClase', e.target.value)} error={errors.horarioClase} placeholder="Lunes a Viernes 7:00 - 14:00" />
        <Input label="Equipamiento" value={form.equipamiento} onChange={(e) => handleChange('equipamiento', e.target.value)} placeholder="Proyector, Pizarrón Inteligente, Aire Acondicionado" hint="Separa cada elemento con una coma" />

        <div className="border-t border-background-200/70 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-foreground-800">Grupos asignados a este salón</p>
              <p className="text-2xs text-foreground-500">Agrega grupos adicionales con diferente horario o profesor</p>
            </div>
            {!addingGrupo && (
              <Button variant="outline" size="sm" icon="ri-add-line" onClick={() => setAddingGrupo(true)}>
                Agregar grupo
              </Button>
            )}
          </div>

          {form.gruposAsignados.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {form.gruposAsignados.map((g, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-background-100 border border-background-200/70 rounded-md">
                  <span className="text-xs font-medium text-foreground-800">{g.grado} · {g.grupo} · {g.nivel}</span>
                  <span className="text-2xs text-foreground-500">{g.horario}</span>
                  {g.profesor && (
                    <span className="text-2xs text-foreground-500">· {g.profesor}</span>
                  )}
                  <button
                    onClick={() => removeGrupo(i)}
                    className="w-4 h-4 flex items-center justify-center rounded text-foreground-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer ml-1"
                    title="Quitar grupo"
                  >
                    <i className="ri-close-line text-xs" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {form.gruposAsignados.length === 0 && !addingGrupo && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-background-100/60 border border-background-200/40">
              <i className="ri-information-line text-foreground-400 text-sm" />
              <p className="text-xs text-foreground-500">Este salón solo tiene un grupo asignado. Usa "Agregar grupo" para asignar más.</p>
            </div>
          )}

          {addingGrupo && (
            <div className="p-3 rounded-lg bg-background-100 border border-background-200/70 space-y-3">
              <p className="text-xs font-medium text-foreground-700">Nuevo grupo</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <Select
                  label="Grado"
                  value={newGrupo.grado}
                  onChange={(e) => setNewGrupo((prev) => ({ ...prev, grado: e.target.value }))}
                  options={grados.map((g) => ({ value: g, label: g }))}
                />
                <Select
                  label="Grupo"
                  value={newGrupo.grupo}
                  onChange={(e) => setNewGrupo((prev) => ({ ...prev, grupo: e.target.value }))}
                  options={grupos.map((g) => ({ value: g, label: g }))}
                />
                <Select
                  label="Nivel"
                  value={newGrupo.nivel}
                  onChange={(e) => setNewGrupo((prev) => ({ ...prev, nivel: e.target.value }))}
                  options={niveles.map((n) => ({ value: n, label: n }))}
                />
                <Input
                  label="Horario"
                  value={newGrupo.horario}
                  onChange={(e) => setNewGrupo((prev) => ({ ...prev, horario: e.target.value }))}
                  placeholder="Lun/Mie 8:00-9:30"
                />
              </div>
              <Input
                label="Profesor (opcional)"
                value={newGrupo.profesor || ''}
                onChange={(e) => setNewGrupo((prev) => ({ ...prev, profesor: e.target.value }))}
                placeholder="Nombre del profesor para este grupo"
              />
              <div className="flex items-center gap-2 pt-1">
                <Button variant="primary" size="sm" icon="ri-check-line" onClick={addGrupo}>
                  Agregar
                </Button>
                <Button variant="ghost" size="sm" icon="ri-close-line" onClick={() => { setAddingGrupo(false); setNewGrupo({ grupo: 'A', grado: '1°', nivel: 'Secundaria', horario: '', profesor: '' }); }}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}