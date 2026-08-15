import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Select from '@/components/base/Select';
import Badge from '@/components/base/Badge';
import type { Student } from '@/mocks/alumnos';
import type { Parent } from '@/mocks/padres';
import type { Salon } from '@/mocks/salones';
import { getSalonDelAlumno } from '@/pages/alumnos/helpers/alumnoSalon';
import { useSchoolContext } from '@/context/SchoolContext';
import { isGuid } from '@/api/helpers';
import {
  FieldLimits,
  assignError,
  validateBirthDate,
  validateEmail,
  validateMaxLen,
  validatePhone,
  validateRequiredName,
} from '@/lib/validation/fields';
import * as parentsApi from '@/api/parentsApi';
import { queryKeys } from '@/api/queryKeys';
import TeacherAvatar from '@/components/feature/TeacherAvatar';
import { collectStudentInteractionIssues } from '@/lib/interaction/guards';
import { confirmSoftWarnings } from '@/lib/interaction/confirmSoft';
import { useToast } from '@/components/base/Toast';

interface StudentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: StudentFormData) => void;
  student?: Student | null;
  saving?: boolean;
  classrooms?: Salon[];
}

interface LinkedParentEntry {
  parentId: string;
  relationship: string;
}

export interface StudentFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: string;
  bloodType: string;
  address: string;
  level: string;
  grade: string;
  group: string;
  branchId: string;
  branchName: string;
  allergies: string;
  medicalNotes: string;
  status: string;
  photo: string;
  photoFile: File | null;
  photoRemoved: boolean;
  linkedParents: LinkedParentEntry[];
}

const emptyForm: StudentFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  birthDate: '',
  gender: 'M',
  bloodType: 'O+',
  address: '',
  level: 'Preescolar',
  grade: '1°',
  group: 'A',
  branchId: '',
  branchName: '',
  allergies: '',
  medicalNotes: '',
  status: 'active',
  photo: '',
  photoFile: null,
  photoRemoved: false,
  linkedParents: [],
};

const niveles = ['Preescolar', 'Primaria', 'Secundaria', 'Preparatoria'];
const grupos = ['A', 'B', 'C'];
const parentescoOptions = [
  'Padre',
  'Madre',
  'Tutor Legal',
  'Abuelo',
  'Abuela',
  'Tío',
  'Tía',
  'Hermano',
  'Hermana',
  'Otro Familiar',
];

export default function StudentFormModal({
  open,
  onClose,
  onSave,
  student,
  saving = false,
  classrooms = [],
}: StudentFormModalProps) {
  const { showToast } = useToast();
  const {
    branchId: contextBranchId,
    branch: contextBranch,
    branchOptions,
    cycleId,
  } = useSchoolContext();
  const [form, setForm] = useState<StudentFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [parentSearch, setParentSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sucursales = useMemo(
    () =>
      branchOptions
        .filter((b) => isGuid(b.id))
        .map((b) => ({ value: b.id, label: b.name || b.shortName || b.id })),
    [branchOptions]
  );

  const parentsQuery = useQuery({
    queryKey: queryKeys.parents.list({}),
    queryFn: () => parentsApi.listParents({ pageSize: 200 }),
    enabled: open,
  });
  const allParents: Parent[] = parentsQuery.data?.data ?? [];

  useEffect(() => {
    if (!open) return;

    if (student) {
      setForm({
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        birthDate: student.birthDate,
        gender: student.gender,
        bloodType: student.bloodType,
        address: student.address,
        level: student.level || 'Preescolar',
        grade: student.grade || '1°',
        group: student.group || 'A',
        branchId: isGuid(student.branchId) ? student.branchId : contextBranchId || '',
        branchName: student.branchName || contextBranch?.name || '',
        allergies: student.allergies.join(', '),
        medicalNotes: student.medicalNotes,
        status: student.status,
        photo: student.photo,
        photoFile: null,
        photoRemoved: false,
        linkedParents: student.parents.map((p) => ({
          parentId: p.id,
          relationship: p.relationship,
        })),
      });
      setPhotoPreview(student.photo);
    } else {
      const defaultBranchId = isGuid(contextBranchId) ? contextBranchId! : sucursales[0]?.value || '';
      const defaultBranchName =
        (defaultBranchId &&
          (sucursales.find((s) => s.value === defaultBranchId)?.label || contextBranch?.name)) ||
        '';
      setForm({
        ...emptyForm,
        branchId: defaultBranchId,
        branchName: defaultBranchName,
      });
      setPhotoPreview('');
    }
    setErrors({});
    setParentSearch('');
  }, [student, open, contextBranchId, contextBranch?.name, sucursales]);

  const salonPreview = useMemo(() => {
    if (!form.level || !form.grade || !form.group || !form.branchName) return null;
    return getSalonDelAlumno(
      form.level,
      form.grade,
      form.group,
      form.branchName,
      classrooms,
      form.branchId
    );
  }, [form.level, form.grade, form.group, form.branchName, form.branchId, classrooms]);

  const handleChange = (field: keyof StudentFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleBranchChange = (value: string) => {
    const branch = sucursales.find((s) => s.value === value);
    setForm((prev) => ({ ...prev, branchId: value, branchName: branch?.label || '' }));
  };

  const linkedParentIds = useMemo(
    () => form.linkedParents.map((lp) => lp.parentId),
    [form.linkedParents]
  );

  const filteredParents = useMemo(() => {
    let list = allParents;
    if (parentSearch.trim()) {
      const q = parentSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.phone.includes(q)
      );
    }
    return list;
  }, [parentSearch, allParents]);

  const toggleParent = (parentId: string) => {
    setForm((prev) => {
      const exists = prev.linkedParents.find((lp) => lp.parentId === parentId);
      if (exists) {
        return {
          ...prev,
          linkedParents: prev.linkedParents.filter((lp) => lp.parentId !== parentId),
        };
      }
      return {
        ...prev,
        linkedParents: [...prev.linkedParents, { parentId, relationship: 'Padre' }],
      };
    });
  };

  const updateRelationship = (parentId: string, relationship: string) => {
    setForm((prev) => ({
      ...prev,
      linkedParents: prev.linkedParents.map((lp) =>
        lp.parentId === parentId ? { ...lp, relationship } : lp
      ),
    }));
  };

  const getParentById = (id: string): Parent | undefined => allParents.find((p) => p.id === id);

  const processFile = (file: File) => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
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
    assignError(newErrors, 'email', validateEmail(form.email, false));
    assignError(newErrors, 'phone', validatePhone(form.phone, false));
    assignError(newErrors, 'birthDate', validateBirthDate(form.birthDate, true));
    assignError(newErrors, 'address', validateMaxLen(form.address, FieldLimits.address, 'Dirección'));
    assignError(newErrors, 'allergies', validateMaxLen(form.allergies, FieldLimits.allergies, 'Alergias'));
    assignError(newErrors, 'medicalNotes', validateMaxLen(form.medicalNotes, FieldLimits.medicalNotes, 'Notas médicas'));

    if (!form.level) newErrors.level = 'Selecciona un nivel';
    if (!form.grade) newErrors.grade = 'Selecciona un grado';
    if (!form.group) newErrors.group = 'Selecciona un grupo';
    if (!isGuid(form.branchId)) {
      newErrors.branchId =
        sucursales.length === 0
          ? 'No hay sucursales reales. Revisa el selector de contexto.'
          : 'Selecciona una sucursal válida';
    }
    if (!form.status) newErrors.status = 'Selecciona un estado';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || saving) return;

    const { hard, soft } = collectStudentInteractionIssues({
      branchId: form.branchId,
      cycleId,
      firstName: form.firstName,
      lastName: form.lastName,
      level: form.level,
      grade: form.grade,
      group: form.group,
      branchName: form.branchName,
      linkedParentIds: form.linkedParents.map((lp) => lp.parentId),
      classrooms,
    });

    if (hard.length > 0) {
      const first = hard[0];
      showToast(first.message, 'error');
      if (first.code === 'CTX_NO_BRANCH') {
        setErrors((prev) => ({ ...prev, branchId: first.message }));
      }
      if (first.code === 'CTX_NO_CYCLE') {
        showToast(first.message, 'error');
      }
      if (first.code === 'REL_GROUP_NO_CLASSROOM') {
        setErrors((prev) => ({
          ...prev,
          group: first.message,
        }));
      }
      return;
    }

    const ok = await confirmSoftWarnings(soft);
    if (!ok) return;

    onSave(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={student ? 'Editar Alumno' : 'Nuevo Alumno'}
      subtitle={student ? `Editando: ${student.fullName}` : 'Los campos marcados con * son obligatorios'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={saving ? undefined : 'ri-save-line'}
            onClick={handleSubmit}
            disabled={saving}
            loading={saving}
          >
            {student ? 'Guardar Cambios' : 'Registrar Alumno'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <h4 className="text-sm font-semibold text-foreground-800 mb-3 flex items-center gap-2">
            <i className="ri-camera-line text-primary-500" />
            Fotografía
          </h4>
          <div className="flex items-start gap-5">
            <div className="flex-shrink-0">
              {photoPreview ? (
                <div className="relative">
                  <TeacherAvatar
                    src={photoPreview}
                    alt="Vista previa"
                    filenameHint="student-photo"
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
              {errors.photo && <p className="mt-1.5 text-xs text-red-500">{errors.photo}</p>}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground-800 mb-3 flex items-center gap-2">
            <i className="ri-user-line text-primary-500" />
            Datos Personales
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nombre(s)"
              required
              maxLength={FieldLimits.name}
              value={form.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              error={errors.firstName}
              placeholder="Ej. Carlos"
            />
            <Input
              label="Apellidos"
              required
              maxLength={FieldLimits.name}
              value={form.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              error={errors.lastName}
              placeholder="Ej. Ruiz Mendoza"
            />
            <Input
              label="Email"
              type="email"
              maxLength={FieldLimits.email}
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={errors.email}
              placeholder="alumno@email.com"
            />
            <Input
              label="Teléfono"
              maxLength={FieldLimits.phone}
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              error={errors.phone}
              placeholder="+52 55 0000 0000"
            />
            <Input
              label="Fecha de Nacimiento"
              type="date"
              required
              value={form.birthDate}
              onChange={(e) => handleChange('birthDate', e.target.value)}
              error={errors.birthDate}
            />
            <Select
              label="Género"
              required
              value={form.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              options={[
                { value: 'M', label: 'Masculino' },
                { value: 'F', label: 'Femenino' },
              ]}
            />
            <Select
              label="Tipo de Sangre"
              value={form.bloodType}
              onChange={(e) => handleChange('bloodType', e.target.value)}
              options={['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((v) => ({
                value: v,
                label: v,
              }))}
            />
            <div className="sm:col-span-2">
              <Input
                label="Dirección"
                maxLength={FieldLimits.address}
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                error={errors.address}
                placeholder="Calle, Colonia, Ciudad"
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground-800 mb-3 flex items-center gap-2">
            <i className="ri-book-open-line text-accent-500" />
            Información Académica
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Nivel"
              required
              value={form.level}
              onChange={(e) => handleChange('level', e.target.value)}
              options={niveles.map((n) => ({ value: n, label: n }))}
              error={errors.level}
            />
            <Select
              label="Grado"
              required
              value={form.grade}
              onChange={(e) => handleChange('grade', e.target.value)}
              options={['1°', '2°', '3°', '4°', '5°', '6°'].map((g) => ({ value: g, label: g }))}
              error={errors.grade}
            />
            <Select
              label="Grupo"
              required
              value={form.group}
              onChange={(e) => handleChange('group', e.target.value)}
              options={grupos.map((g) => ({ value: g, label: g }))}
              error={errors.group}
            />
            <Select
              label="Sucursal"
              required
              value={form.branchId}
              onChange={(e) => handleBranchChange(e.target.value)}
              options={
                sucursales.length > 0
                  ? sucursales
                  : [{ value: '', label: 'Sin sucursales disponibles' }]
              }
              error={errors.branchId}
            />
            <Select
              label="Estado"
              required
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              options={[
                { value: 'active', label: 'Activo' },
                { value: 'inactive', label: 'Inactivo' },
                { value: 'pending', label: 'Pendiente' },
                { value: 'suspended', label: 'Suspendido' },
                { value: 'graduated', label: 'Graduado' },
              ]}
              error={errors.status}
            />
          </div>

          <div className="mt-3">
            {form.level && form.grade && form.group && form.branchName ? (
              salonPreview ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <i className="ri-door-open-line text-emerald-600 text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-emerald-800 whitespace-nowrap">
                      Salón {salonPreview.nombre}
                    </span>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Vinculado por nivel, grado y grupo
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200">
                  <i className="ri-error-warning-line text-amber-600 text-sm flex-shrink-0" />
                  <p className="text-xs text-amber-800">
                    Ese grupo no está vinculado a ningún salón de esta sucursal. Vincula el grupo en
                    Salones o elige otra combinación.
                  </p>
                </div>
              )
            ) : null}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground-800 mb-3 flex items-center gap-2">
            <i className="ri-heart-pulse-line text-red-400" />
            Información Médica
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Alergias"
              maxLength={FieldLimits.allergies}
              value={form.allergies}
              onChange={(e) => handleChange('allergies', e.target.value)}
              error={errors.allergies}
              placeholder="Separadas por coma. Ej: Penicilina, Lácteos"
              hint="Separa cada alergia con una coma"
            />
            <Input
              label="Notas Médicas"
              maxLength={FieldLimits.medicalNotes}
              value={form.medicalNotes}
              onChange={(e) => handleChange('medicalNotes', e.target.value)}
              error={errors.medicalNotes}
              placeholder="Condiciones, medicamentos, observaciones..."
            />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground-800 mb-3 flex items-center gap-2">
            <i className="ri-user-heart-line text-accent-500" />
            Tutores / Padres
            {form.linkedParents.length > 0 && (
              <Badge variant="accent" size="sm">
                {form.linkedParents.length} seleccionado
                {form.linkedParents.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </h4>
          <p className="text-xs text-foreground-500 mb-3">
            Selecciona tutores registrados (módulo Padres). Opcional al crear.
          </p>

          {form.linkedParents.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {form.linkedParents.map((lp) => {
                const parent = getParentById(lp.parentId);
                if (!parent) return null;
                return (
                  <div
                    key={lp.parentId}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-50 border border-accent-200 text-xs"
                  >
                    <span className="font-medium text-foreground-800 whitespace-nowrap">
                      {parent.fullName}
                    </span>
                    <span className="text-foreground-400">·</span>
                    <Select
                      value={lp.relationship}
                      onChange={(e) => updateRelationship(lp.parentId, e.target.value)}
                      options={parentescoOptions.map((o) => ({ value: o, label: o }))}
                      className="!py-0 !px-1 !text-2xs !border-0 !bg-transparent !min-h-0"
                      style={{ minHeight: 'unset', padding: 0 }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleParent(lp.parentId)}
                      className="w-4 h-4 flex items-center justify-center rounded-full text-foreground-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Quitar"
                    >
                      <i className="ri-close-line text-3xs" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <Input
            icon="ri-search-line"
            placeholder="Buscar tutor por nombre, email o teléfono..."
            value={parentSearch}
            onChange={(e) => setParentSearch(e.target.value)}
            className="mb-2"
          />

          <div className="max-h-52 overflow-y-auto border border-secondary-200/70 rounded-lg divide-y divide-secondary-100/70">
            {parentsQuery.isLoading ? (
              <div className="flex flex-col items-center justify-center py-6 text-foreground-400">
                <i className="ri-loader-4-line animate-spin text-xl mb-1.5" />
                <p className="text-sm">Cargando tutores...</p>
              </div>
            ) : parentsQuery.isError ? (
              <div className="flex flex-col items-center justify-center py-6 text-foreground-400">
                <i className="ri-error-warning-line text-xl mb-1.5 text-amber-500" />
                <p className="text-sm">No se pudieron cargar tutores</p>
              </div>
            ) : filteredParents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-foreground-400">
                <i className="ri-user-search-line text-xl mb-1.5" />
                <p className="text-sm">
                  {parentSearch.trim()
                    ? 'No se encontraron tutores con ese criterio'
                    : 'No hay tutores registrados. Créalos en Padres.'}
                </p>
              </div>
            ) : (
              filteredParents.map((parent) => {
                const isSelected = linkedParentIds.includes(parent.id);
                return (
                  <div
                    key={parent.id}
                    onClick={() => toggleParent(parent.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-accent-50/70 border-l-2 border-accent-500'
                        : 'hover:bg-secondary-50/50 border-l-2 border-transparent'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-accent-500 border-accent-500'
                          : 'border-secondary-300'
                      }`}
                    >
                      {isSelected && <i className="ri-check-line text-white text-3xs" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground-800">{parent.fullName}</p>
                      <div className="flex items-center gap-2 text-2xs text-foreground-500">
                        <span>{parent.email || '—'}</span>
                        <span>·</span>
                        <span>{parent.phone || '—'}</span>
                      </div>
                    </div>
                    <Badge variant="default" size="sm">
                      {parent.childrenCount} {parent.childrenCount === 1 ? 'hijo' : 'hijos'}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>

          <p className="text-3xs text-foreground-400 mt-1.5">
            <i className="ri-information-line" /> Puedes vincular tutores ahora o después desde la
            ficha del alumno
          </p>
        </div>
      </div>
    </Modal>
  );
}
