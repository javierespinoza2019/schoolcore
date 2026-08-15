import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Select from '@/components/base/Select';
import type { Profesor } from '@/mocks/profesores';
import { listBranches } from '@/api/branchesApi';
import { listEducationLevels } from '@/api/settingsApi';
import { isGuid } from '@/api/helpers';
import { InteractionCodes, interactionMessage } from '@/lib/interaction/messages';
import { confirmSoftWarnings } from '@/lib/interaction/confirmSoft';
import type { GuardIssue } from '@/lib/interaction/guards';
import { queryKeys } from '@/api/queryKeys';
import { useSchoolContext } from '@/context/SchoolContext';
import TeacherAvatar from '@/components/feature/TeacherAvatar';
import {
  FieldLimits,
  assignError,
  validateEmail,
  validateMaxLen,
  validatePhone,
  validateRequiredName,
} from '@/lib/validation/fields';

interface ProfesorFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ProfesorFormData) => void;
  profesor?: Profesor | null;
  saving?: boolean;
}

export interface ProfesorFormData {
  firstName: string;
  lastName: string;
  email: string;
  telefono: string;
  especialidad: string;
  materias: string;
  tipoPago: string;
  salarioMensual: string;
  sucursal: string;
  nivel: string;
  horario: string;
  estado: string;
  /** Preview (data URL) o referencia persistida (GUID / http). */
  photo: string;
  photoFile: File | null;
  photoRemoved: boolean;
}

const emptyForm: ProfesorFormData = {
  firstName: '', lastName: '', email: '', telefono: '', especialidad: '',
  materias: '', tipoPago: 'Nómina', salarioMensual: '',
  sucursal: '', nivel: 'Secundaria',
  horario: '', estado: 'Activo',
  photo: '',
  photoFile: null,
  photoRemoved: false,
};

const nivelesDefault = ['Preescolar', 'Primaria', 'Secundaria', 'Preparatoria'];

function splitNombre(nombreCompleto: string): { firstName: string; lastName: string } {
  const trimmed = nombreCompleto.trim();
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace === -1) return { firstName: trimmed, lastName: '' };
  return {
    firstName: trimmed.substring(0, lastSpace),
    lastName: trimmed.substring(lastSpace + 1),
  };
}

export default function ProfesorFormModal({ open, onClose, onSave, profesor, saving = false }: ProfesorFormModalProps) {
  const [form, setForm] = useState<ProfesorFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      return branchOptions.filter((b) => isGuid(b.id)).map((b) => ({ value: b.id, label: b.name || b.shortName }));
    }
    return (branchesQ.data?.data ?? [])
      .filter((b) => isGuid(b.id))
      .map((b) => ({ value: String(b.id), label: b.nombre }));
  }, [branchOptions, branchesQ.data]);
  const nivelOptions = useMemo(() => {
    const fromApi = (levelsQ.data?.data ?? [])
      .map((lvl) => {
        const row = lvl as unknown as Record<string, unknown>;
        return String(row.nombre ?? row.name ?? '').trim();
      })
      .filter(Boolean);
    return [...new Set([...nivelesDefault, ...fromApi])].map((n) => ({ value: n, label: n }));
  }, [levelsQ.data]);

  useEffect(() => {
    if (profesor) {
      const split = splitNombre(profesor.nombre);
      const firstName = profesor.firstName?.trim() || split.firstName;
      const lastName = profesor.lastName?.trim() || split.lastName;
      setForm({
        firstName,
        lastName,
        email: profesor.email,
        telefono: profesor.telefono,
        especialidad: profesor.especialidad,
        materias: profesor.materias.join(', '),
        tipoPago: profesor.tipoPago,
        salarioMensual: String(profesor.salarioMensual),
        sucursal: isGuid(profesor.branchId) ? profesor.branchId! : isGuid(profesor.sucursal) ? profesor.sucursal : branchId || '',
        nivel: profesor.nivel,
        horario: profesor.horario,
        estado: profesor.estado,
        photo: profesor.fotoUrl || '',
        photoFile: null,
        photoRemoved: false,
      });
      setPhotoPreview(profesor.fotoUrl || '');
    } else {
      setForm({
        ...emptyForm,
        sucursal: isGuid(branchId) ? branchId! : sucursalOptions[0]?.value || '',
      });
      setPhotoPreview('');
    }
    setErrors({});
  }, [profesor, open]);

  const handleChange = (field: keyof ProfesorFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const processFile = (file: File) => {
    const allowed = ['image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setErrors((prev) => ({ ...prev, photo: 'Solo se permiten imágenes JPG o PNG (máx. 5 MB)' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: 'La imagen no debe superar 5 MB' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPhotoPreview(dataUrl);
      setForm((prev) => ({ ...prev, photo: dataUrl, photoFile: file, photoRemoved: false }));
      if (errors.photo) {
        setErrors((prev) => {
          const n = { ...prev };
          delete n.photo;
          return n;
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview('');
    setForm((prev) => ({ ...prev, photo: '', photoFile: null, photoRemoved: true }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    assignError(newErrors, 'firstName', validateRequiredName(form.firstName, 'El nombre'));
    assignError(newErrors, 'lastName', validateRequiredName(form.lastName, 'Los apellidos'));
    assignError(newErrors, 'email', validateEmail(form.email, true));
    assignError(newErrors, 'telefono', validatePhone(form.telefono, true));

    if (!form.especialidad.trim()) newErrors.especialidad = 'La especialidad es obligatoria';
    assignError(newErrors, 'especialidad', validateMaxLen(form.especialidad, FieldLimits.specialty, 'Especialidad'));

    if (!form.salarioMensual.trim()) newErrors.salarioMensual = 'El salario es obligatorio';
    else if (isNaN(Number(form.salarioMensual)) || Number(form.salarioMensual) <= 0) newErrors.salarioMensual = 'Ingresa un monto válido mayor a 0';

    if (!form.horario.trim()) newErrors.horario = 'El horario es obligatorio';
    assignError(newErrors, 'horario', validateMaxLen(form.horario, FieldLimits.schedule, 'Horario'));

    if (!form.materias.trim()) newErrors.materias = 'Indica al menos una materia';

    if (!isGuid(form.sucursal)) newErrors.sucursal = 'Selecciona una sucursal válida';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || saving) return;
    const soft: GuardIssue[] = [];
    const salonCount = profesor?.salones?.length ?? 0;
    if (salonCount === 0) {
      soft.push({
        code: InteractionCodes.REL_TEACHER_NO_CLASSROOM,
        message: interactionMessage(InteractionCodes.REL_TEACHER_NO_CLASSROOM),
      });
    }
    const ok = await confirmSoftWarnings(soft);
    if (!ok) return;
    onSave(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={profesor ? 'Editar Profesor' : 'Nuevo Profesor'}
      subtitle={profesor ? `Editando: ${profesor.nombre}` : 'Los campos marcados con * son obligatorios'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button variant="primary" size="sm" icon="ri-save-line" onClick={handleSubmit} disabled={saving} loading={saving}>
            {profesor ? 'Guardar Cambios' : 'Registrar Profesor'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Fotografía */}
        <div>
          <h4 className="text-sm font-semibold text-foreground-800 mb-3 flex items-center gap-2">
            <i className="ri-camera-line text-primary-500" />
            Fotografía
          </h4>
          <div className="flex items-start gap-5">
            {/* Preview */}
            <div className="flex-shrink-0">
              {photoPreview ? (
                <div className="relative">
                  <TeacherAvatar
                    src={photoPreview}
                    alt="Vista previa"
                    className="w-24 h-24 rounded-xl object-cover object-top border-2 border-secondary-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white text-xs hover:bg-red-600 transition-colors cursor-pointer shadow-sm"
                    title="Quitar foto"
                  >
                    <i className="ri-close-line" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl bg-background-100 border-2 border-dashed border-secondary-300 flex flex-col items-center justify-center gap-1">
                  <i className="ri-user-line text-2xl text-foreground-300" />
                  <span className="text-3xs text-foreground-400">Sin foto</span>
                </div>
              )}
            </div>

            {/* Upload area */}
            <div className="flex-1">
              <div
                className={`relative rounded-lg border-2 border-dashed p-4 text-center transition-all duration-150 cursor-pointer ${
                  isDragging
                    ? 'border-primary-400 bg-primary-50/50'
                    : 'border-secondary-300 hover:border-secondary-400 bg-background-50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-9 h-9 rounded-full bg-secondary-100 flex items-center justify-center">
                    <i className="ri-upload-cloud-2-line text-lg text-foreground-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground-700">
                      {photoPreview ? 'Cambiar fotografía' : 'Subir fotografía'}
                    </p>
                    <p className="text-xs text-foreground-400 mt-0.5">
                      Arrastra una imagen o haz clic para seleccionar
                    </p>
                  </div>
                  <span className="text-3xs text-foreground-300">JPG o PNG · Máx. 5 MB</span>
                </div>
              </div>
              {errors.photo && (
                <p className="mt-1.5 text-xs text-red-500">{errors.photo}</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground-800 mb-3 flex items-center gap-2">
            <i className="ri-user-line text-primary-500" />
            Datos Personales
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Nombre(s)" required maxLength={FieldLimits.name} value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} error={errors.firstName} placeholder="Ej. María Elena" />
            <Input label="Apellidos" required maxLength={FieldLimits.name} value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} error={errors.lastName} placeholder="Ej. Rodríguez López" />
            <Input label="Email" type="email" required maxLength={FieldLimits.email} value={form.email} onChange={(e) => handleChange('email', e.target.value)} error={errors.email} placeholder="profesor@SchoolCore.edu.mx" />
            <Input label="Teléfono" required maxLength={FieldLimits.phone} value={form.telefono} onChange={(e) => handleChange('telefono', e.target.value)} error={errors.telefono} placeholder="55-0000-0000" />
            <Input label="Especialidad" required maxLength={FieldLimits.specialty} value={form.especialidad} onChange={(e) => handleChange('especialidad', e.target.value)} error={errors.especialidad} placeholder="Ej. Matemáticas" />
            <Select
              label="Estado"
              value={form.estado}
              onChange={(e) => handleChange('estado', e.target.value)}
              options={[{ value: 'Activo', label: 'Activo' }, { value: 'Suspendido', label: 'Suspendido' }, { value: 'Inactivo', label: 'Inactivo' }]}
            />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground-800 mb-3 flex items-center gap-2">
            <i className="ri-briefcase-line text-accent-500" />
            Información Laboral
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Tipo de Pago"
              value={form.tipoPago}
              onChange={(e) => handleChange('tipoPago', e.target.value)}
              options={[{ value: 'Nómina', label: 'Nómina' }, { value: 'Honorarios', label: 'Honorarios' }]}
            />
            <Input label="Salario Mensual (MXN)" type="number" required value={form.salarioMensual} onChange={(e) => handleChange('salarioMensual', e.target.value)} error={errors.salarioMensual} placeholder="25000" />
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
            <Select
              label="Nivel"
              value={form.nivel}
              onChange={(e) => handleChange('nivel', e.target.value)}
              options={nivelOptions}
            />
            <div className="sm:col-span-2">
              <Input label="Horario" required maxLength={FieldLimits.schedule} value={form.horario} onChange={(e) => handleChange('horario', e.target.value)} error={errors.horario} placeholder="Lunes a Viernes 7:00 - 14:00" />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground-800 mb-3 flex items-center gap-2">
            <i className="ri-booklet-line text-amber-500" />
            Materias
          </h4>
          <Input
            label="Materias que imparte"
            required
            value={form.materias}
            onChange={(e) => handleChange('materias', e.target.value)}
            error={errors.materias}
            placeholder="Ej. Álgebra, Cálculo, Trigonometría"
            hint="Separa cada materia con una coma"
          />
        </div>
      </div>
    </Modal>
  );
}