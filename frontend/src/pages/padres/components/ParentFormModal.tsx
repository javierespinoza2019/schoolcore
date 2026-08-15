import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Select from '@/components/base/Select';
import Badge from '@/components/base/Badge';
import TeacherAvatar from '@/components/feature/TeacherAvatar';
import type { Parent } from '@/mocks/padres';
import type { Student } from '@/mocks/alumnos';
import * as studentsApi from '@/api/studentsApi';
import { queryKeys } from '@/api/queryKeys';
import { InteractionCodes, interactionMessage } from '@/lib/interaction/messages';
import { confirmSoftWarnings } from '@/lib/interaction/confirmSoft';
import type { GuardIssue } from '@/lib/interaction/guards';
import {
  FieldLimits,
  assignError,
  validateEmail,
  validateMaxLen,
  validatePhone,
  validateRequiredName,
} from '@/lib/validation/fields';

interface ParentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ParentFormData) => void;
  parent?: Parent | null;
  saving?: boolean;
}

export interface ParentFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  occupation: string;
  address: string;
  status: string;
  linkedStudentIds: string[];
}

const emptyForm: ParentFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  occupation: '',
  address: '',
  status: 'active',
  linkedStudentIds: [],
};

const statusConfig: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'primary' | 'accent' }
> = {
  active: { label: 'Activo', variant: 'success' },
  inactive: { label: 'Inactivo', variant: 'warning' },
  suspended: { label: 'Suspendido', variant: 'danger' },
  graduated: { label: 'Graduado', variant: 'primary' },
  pending: { label: 'Pendiente', variant: 'warning' },
};

export default function ParentFormModal({
  open,
  onClose,
  onSave,
  parent,
  saving = false,
}: ParentFormModalProps) {
  const [form, setForm] = useState<ParentFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [studentSearch, setStudentSearch] = useState('');

  const studentsQ = useQuery({
    queryKey: queryKeys.students.list({ pageSize: 200, forParentForm: true }),
    queryFn: async () => {
      const res = await studentsApi.listStudents({ pageSize: 200 });
      return res.data ?? [];
    },
    enabled: open,
  });

  const allStudents: Student[] = studentsQ.data ?? [];

  useEffect(() => {
    if (!open) return;
    if (parent) {
      setForm({
        firstName: parent.firstName,
        lastName: parent.lastName,
        email: parent.email,
        phone: parent.phone,
        occupation: parent.occupation,
        address: parent.address,
        status: parent.status,
        linkedStudentIds: [...parent.childrenIds],
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
    setStudentSearch('');
  }, [parent, open]);

  const handleChange = (field: keyof ParentFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  };

  const filteredStudents = useMemo(() => {
    let list = allStudents;
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.enrollment.toLowerCase().includes(q)
      );
    }
    return list;
  }, [studentSearch, allStudents]);

  const toggleStudent = (studentId: string) => {
    setForm((prev) => {
      const exists = prev.linkedStudentIds.includes(studentId);
      if (exists) {
        return { ...prev, linkedStudentIds: prev.linkedStudentIds.filter((id) => id !== studentId) };
      }
      return { ...prev, linkedStudentIds: [...prev.linkedStudentIds, studentId] };
    });
  };

  const getStudentById = (id: string): Student | undefined => allStudents.find((s) => s.id === id);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    assignError(newErrors, 'firstName', validateRequiredName(form.firstName, 'El nombre'));
    assignError(newErrors, 'lastName', validateRequiredName(form.lastName, 'Los apellidos'));
    assignError(newErrors, 'email', validateEmail(form.email, true));
    assignError(newErrors, 'phone', validatePhone(form.phone, true));

    if (!form.occupation.trim()) newErrors.occupation = 'La ocupación es obligatoria';
    assignError(newErrors, 'occupation', validateMaxLen(form.occupation, FieldLimits.occupation, 'Ocupación'));

    if (!form.address.trim()) newErrors.address = 'La dirección es obligatoria';
    assignError(newErrors, 'address', validateMaxLen(form.address, FieldLimits.address, 'Dirección'));

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || saving) return;
    const soft: GuardIssue[] = [];
    if (form.linkedStudentIds.length === 0) {
      soft.push({
        code: InteractionCodes.REL_GUARDIAN_NO_CHILDREN,
        message: interactionMessage(InteractionCodes.REL_GUARDIAN_NO_CHILDREN),
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
      title={parent ? 'Editar Tutor' : 'Nuevo Tutor'}
      subtitle={parent ? `Editando: ${parent.fullName}` : 'Los campos marcados con * son obligatorios'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon="ri-save-line"
            onClick={handleSubmit}
            disabled={saving}
            loading={saving}
          >
            {parent ? 'Guardar Cambios' : 'Registrar Tutor'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
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
              placeholder="Ej. Roberto"
            />
            <Input
              label="Apellidos"
              required
              maxLength={FieldLimits.name}
              value={form.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              error={errors.lastName}
              placeholder="Ej. Ruiz Gómez"
            />
            <Input
              label="Email"
              type="email"
              required
              maxLength={FieldLimits.email}
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={errors.email}
              placeholder="tutor@email.com"
            />
            <Input
              label="Teléfono"
              required
              maxLength={FieldLimits.phone}
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              error={errors.phone}
              placeholder="+52 55 0000 0000"
            />
            <Input
              label="Ocupación"
              required
              maxLength={FieldLimits.occupation}
              value={form.occupation}
              onChange={(e) => handleChange('occupation', e.target.value)}
              error={errors.occupation}
              placeholder="Ej. Ingeniero Civil"
            />
            <Select
              label="Estado"
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              options={[
                { value: 'active', label: 'Activo' },
                { value: 'inactive', label: 'Inactivo' },
              ]}
            />
          </div>
          <div className="mt-3">
            <Input
              label="Dirección"
              required
              maxLength={FieldLimits.address}
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              error={errors.address}
              placeholder="Calle, Colonia, Ciudad"
            />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground-800 mb-3 flex items-center gap-2">
            <i className="ri-group-line text-accent-500" />
            Alumnos Vinculados
            {form.linkedStudentIds.length > 0 && (
              <Badge variant="accent" size="sm">
                {form.linkedStudentIds.length} seleccionado
                {form.linkedStudentIds.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </h4>
          <p className="text-xs text-foreground-500 mb-3">
            Selecciona los alumnos que estarán a cargo de este tutor
          </p>

          {form.linkedStudentIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {form.linkedStudentIds.map((sid) => {
                const student = getStudentById(sid);
                if (!student) {
                  return (
                    <div
                      key={sid}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-50 border border-accent-200 text-xs"
                    >
                      <span className="font-medium text-foreground-800">Alumno vinculado</span>
                      <button
                        type="button"
                        onClick={() => toggleStudent(sid)}
                        className="w-4 h-4 flex items-center justify-center rounded-full text-foreground-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Quitar"
                      >
                        <i className="ri-close-line text-3xs" />
                      </button>
                    </div>
                  );
                }
                return (
                  <div
                    key={sid}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-50 border border-accent-200 text-xs"
                  >
                    <TeacherAvatar
                      src={student.photo}
                      alt={student.fullName}
                      filenameHint="student-photo"
                      className="w-5 h-5 rounded-full object-cover object-top border border-accent-200"
                    />
                    <span className="font-medium text-foreground-800 whitespace-nowrap">
                      {student.fullName}
                    </span>
                    <span className="text-foreground-400">·</span>
                    <span className="text-2xs text-foreground-500">
                      {student.level} {student.grade}°
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleStudent(sid)}
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
            placeholder="Buscar alumno por nombre, email o matrícula..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            className="mb-2"
          />

          <div className="max-h-56 overflow-y-auto border border-secondary-200/70 rounded-lg divide-y divide-secondary-100/70">
            {studentsQ.isPending ? (
              <div className="flex flex-col items-center justify-center py-6 text-foreground-400">
                <p className="text-sm">Cargando alumnos…</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-foreground-400">
                <i className="ri-user-search-line text-xl mb-1.5" />
                <p className="text-sm">
                  {studentSearch.trim()
                    ? 'No se encontraron alumnos con ese criterio'
                    : 'No hay alumnos registrados en el sistema'}
                </p>
              </div>
            ) : (
              filteredStudents.map((student) => {
                const isSelected = form.linkedStudentIds.includes(student.id);
                const sCfg = statusConfig[student.status] || statusConfig.inactive;
                return (
                  <div
                    key={student.id}
                    onClick={() => toggleStudent(student.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-accent-50/70 border-l-2 border-accent-500'
                        : 'hover:bg-secondary-50/50 border-l-2 border-transparent'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected ? 'bg-accent-500 border-accent-500' : 'border-secondary-300'
                      }`}
                    >
                      {isSelected && <i className="ri-check-line text-white text-3xs" />}
                    </div>
                    <TeacherAvatar
                      src={student.photo}
                      alt={student.fullName}
                      filenameHint="student-photo"
                      className="w-8 h-8 rounded-full object-cover object-top flex-shrink-0 border border-secondary-200 bg-secondary-100"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground-800">{student.fullName}</p>
                      <p className="text-2xs text-foreground-500">
                        {student.enrollment} · {student.level} {student.grade}° {student.group} ·{' '}
                        {student.branchName}
                      </p>
                    </div>
                    <Badge variant={sCfg.variant} size="sm">
                      {sCfg.label}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>

          <p className="text-3xs text-foreground-400 mt-1.5">
            <i className="ri-information-line" /> Puedes vincular alumnos ahora o después desde la ficha
            del tutor
          </p>
        </div>
      </div>
    </Modal>
  );
}
