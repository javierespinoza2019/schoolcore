import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/feature/MainLayout';
import Stepper, { type Step } from '@/components/base/Stepper';
import Card from '@/components/base/Card';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Select from '@/components/base/Select';
import Badge from '@/components/base/Badge';
import { useToast } from '@/components/base/Toast';
import { useSchoolContext } from '@/context/SchoolContext';
import { submitEnrollment, listEnrollments, deleteEnrollment, type EnrollmentResult, type EnrollmentSummary } from '@/api/enrollmentsApi';
import * as parentsApi from '@/api/parentsApi';
import * as settingsApi from '@/api/settingsApi';
import ParentFormModal from '@/pages/padres/components/ParentFormModal';
import type { ParentFormData } from '@/pages/padres/components/ParentFormModal';
import { queryKeys } from '@/api/queryKeys';
import { isGuid } from '@/api/helpers';
import type { ConceptoPago } from '@/mocks/configuracion';
import ModuleContextGate from '@/components/feature/ModuleContextGate';
import { collectStudentInteractionIssues } from '@/lib/interaction/guards';
import { confirmSoftWarnings } from '@/lib/interaction/confirmSoft';
import { friendlyApiError, InteractionCodes, interactionMessage } from '@/lib/interaction/messages';
import * as classroomsApi from '@/api/classroomsApi';
import { useApiResource } from '@/hooks/useApiResource';
import type { Salon } from '@/mocks/salones';
import { resolveClassroomId, getSalonDelAlumno, findMatchingClassroom } from '@/pages/alumnos/helpers/alumnoSalon';
import { filterTutorCatalog, TUTOR_SEARCH_MIN } from '@/pages/alumnos/helpers/tutorCatalog';
import { DOCUMENT_RULES_HINT } from '@/lib/documents/rules';
import {
  FieldLimits,
  assignError,
  validateBirthDate,
  validateEmail,
  validateOptionalName,
  validatePhone,
  validatePositiveNumber,
  validateRequiredName,
  validateTextFree,
} from '@/lib/validation/fields';
import { afterValidationErrors } from '@/lib/ui/scrollToFirstError';

const enrollmentSteps: Step[] = [
  { id: 'datos', label: 'Datos del Alumno', subtitle: 'Información personal', icon: 'ri-user-line' },
  { id: 'padres', label: 'Padres o Tutores', subtitle: 'Responsables del alumno', icon: 'ri-parent-line' },
  { id: 'documentos', label: 'Documentos', subtitle: 'Checklist (subida después)', icon: 'ri-file-list-3-line' },
  { id: 'grupo', label: 'Asignación', subtitle: 'Nivel, grado y grupo', icon: 'ri-building-4-line' },
  { id: 'resumen', label: 'Resumen', subtitle: 'Confirmar e inscribir', icon: 'ri-check-double-line' },
];

const niveles = [
  { value: 'preescolar', label: 'Preescolar' },
  { value: 'primaria', label: 'Primaria' },
  { value: 'secundaria', label: 'Secundaria' },
  { value: 'preparatoria', label: 'Preparatoria' },
];

const gradosPorNivel: Record<string, { value: string; label: string }[]> = {
  preescolar: [
    { value: '1', label: '1° de Preescolar' },
    { value: '2', label: '2° de Preescolar' },
    { value: '3', label: '3° de Preescolar' },
  ],
  primaria: [
    { value: '1', label: '1° de Primaria' },
    { value: '2', label: '2° de Primaria' },
    { value: '3', label: '3° de Primaria' },
    { value: '4', label: '4° de Primaria' },
    { value: '5', label: '5° de Primaria' },
    { value: '6', label: '6° de Primaria' },
  ],
  secundaria: [
    { value: '1', label: '1° de Secundaria' },
    { value: '2', label: '2° de Secundaria' },
    { value: '3', label: '3° de Secundaria' },
  ],
  preparatoria: [
    { value: '4', label: '4° Semestre' },
    { value: '5', label: '5° Semestre' },
    { value: '6', label: '6° Semestre' },
  ],
};

const grupos = [
  { value: 'A', label: 'Grupo A' },
  { value: 'B', label: 'Grupo B' },
  { value: 'C', label: 'Grupo C' },
];

const tiposSangre = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
];

const documentosChecklist = [
  { id: 'acta', nombre: 'Acta de Nacimiento', requerido: true, icono: 'ri-file-text-line' },
  { id: 'certificado', nombre: 'Certificado Médico', requerido: true, icono: 'ri-heart-pulse-line' },
  { id: 'comprobante', nombre: 'Comprobante de Domicilio', requerido: true, icono: 'ri-home-4-line' },
  { id: 'cartilla', nombre: 'Cartilla de Vacunación', requerido: true, icono: 'ri-syringe-line' },
  { id: 'curp', nombre: 'CURP', requerido: true, icono: 'ri-id-card-line' },
  { id: 'fotos', nombre: 'Fotografías Tamaño Infantil (4)', requerido: false, icono: 'ri-camera-line' },
  { id: 'boleta', nombre: 'Boleta del Grado Anterior', requerido: false, icono: 'ri-file-copy-line' },
  { id: 'carta', nombre: 'Carta de Recomendación', requerido: false, icono: 'ri-mail-line' },
];

interface WizardData {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  genero: string;
  email: string;
  telefono: string;
  direccion: string;
  tipoSangre: string;
  alergias: string;
  notasMedicas: string;
  nivel: string;
  grado: string;
  grupo: string;
  padreId: string;
  tutorId: string;
  documentosMarcados: string[];
  generateCharge: boolean;
  paymentConceptId: string;
  chargeAmount: string;
}

const initialData: WizardData = {
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  fechaNacimiento: '',
  genero: '',
  email: '',
  telefono: '',
  direccion: '',
  tipoSangre: '',
  alergias: '',
  notasMedicas: '',
  nivel: '',
  grado: '',
  grupo: '',
  padreId: '',
  tutorId: '',
  documentosMarcados: [],
  generateCharge: true,
  paymentConceptId: '',
  chargeAmount: '',
};

function pickEnrollmentConcept(concepts: ConceptoPago[]): ConceptoPago | undefined {
  const active = concepts.filter((c) => c.activo);
  return (
    active.find((c) => /inscrip/i.test(c.nombre)) ||
    active.find((c) => /unico|única|unica/i.test(c.tipo)) ||
    active[0]
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function Inscripciones() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const school = useSchoolContext();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(initialData);
  const [result, setResult] = useState<EnrollmentResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savingEnrollment, setSavingEnrollment] = useState(false);
  const [parentModalOpen, setParentModalOpen] = useState(false);
  const [savingParent, setSavingParent] = useState(false);
  const [parentSearch, setParentSearch] = useState('');

  const parentsQuery = useQuery({
    queryKey: queryKeys.parents.list({ forEnrollment: true }),
    queryFn: () => parentsApi.listParents({ pageSize: 100 }),
  });
  const parents = (parentsQuery.data?.data ?? []).filter((p) => isGuid(p.id));
  const parentsForSelect = useMemo(() => {
    const result = filterTutorCatalog(parents, parentSearch);
    const keepIds = new Set([data.padreId, data.tutorId].filter((id) => isGuid(id)));
    const keep = parents.filter((p) => keepIds.has(p.id));
    const seen = new Set(result.list.map((p) => p.id));
    return { ...result, list: [...keep.filter((p) => !seen.has(p.id)), ...result.list] };
  }, [parents, parentSearch, data.padreId, data.tutorId]);

  const handleSaveNewParent = async (formData: ParentFormData) => {
    setSavingParent(true);
    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      occupation: formData.occupation.trim(),
      address: formData.address.trim(),
      status: formData.status as 'active' | 'inactive',
      photo: formData.photoRemoved ? '' : '',
    };
    try {
      const res = await parentsApi.createParent({
        ...payload,
        childrenCount: 0,
        childrenIds: [],
        childrenNames: [],
        createdAt: new Date().toISOString().split('T')[0],
      });
      if (!res.success || !res.data) {
        showToast(friendlyApiError(res) || 'No se pudo registrar el tutor', 'error');
        return;
      }
      let parentId = res.data.id;
      if (formData.photoFile && isGuid(parentId)) {
        const up = await parentsApi.uploadParentPhoto(parentId, formData.photoFile);
        if (up.success && up.data) {
          await parentsApi.updateParent(parentId, { ...payload, photo: up.data });
        }
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.parents.all });
      update('padreId', parentId);
      setParentModalOpen(false);
      showToast(`Tutor "${payload.fullName}" registrado. Continúa la inscripción.`, 'success');
    } catch {
      showToast('Error de red al registrar el tutor', 'error');
    } finally {
      setSavingParent(false);
    }
  };

  const classroomsQ = useApiResource({
    queryKey: queryKeys.classrooms.list({ for: 'enrollment' }),
    queryFn: () => classroomsApi.listClassrooms({ pageSize: 100 }),
  });
  const classrooms: Salon[] = classroomsQ.data ?? [];

  const conceptsQuery = useQuery({
    queryKey: queryKeys.settings.paymentConcepts(),
    queryFn: () => settingsApi.listPaymentConcepts(),
  });
  const conceptos = useMemo(
    () => (conceptsQuery.data?.data ?? []).filter((c) => c.activo),
    [conceptsQuery.data]
  );

  const draftsQuery = useQuery({
    queryKey: [...queryKeys.enrollments.all, 'drafts', school.branchId],
    queryFn: () => listEnrollments({ branchId: school.branchId, status: 'draft', pageSize: 20 }),
    enabled: isGuid(school.branchId),
  });
  const drafts: EnrollmentSummary[] = draftsQuery.data?.data ?? [];
  const [discardingId, setDiscardingId] = useState<string | null>(null);

  const discardDraft = async (id: string) => {
    setDiscardingId(id);
    try {
      const res = await deleteEnrollment(id);
      if (!res.success) {
        showToast(res.message || 'No se pudo descartar el borrador', 'error');
        return;
      }
      showToast('Borrador descartado', 'success');
      void draftsQuery.refetch();
      void queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all });
    } finally {
      setDiscardingId(null);
    }
  };

  useEffect(() => {
    if (data.paymentConceptId || conceptos.length === 0) return;
    const preferred = pickEnrollmentConcept(conceptos);
    if (!preferred) return;
    setData((d) => ({
      ...d,
      paymentConceptId: preferred.id,
      chargeAmount: d.chargeAmount || String(preferred.monto || 0),
    }));
  }, [conceptos, data.paymentConceptId]);

  const update = (field: keyof WizardData, value: string | boolean) => {
    setData((d) => ({ ...d, [field]: value }));
    if (typeof field === 'string' && errors[field]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  };

  const toggleDocumento = (id: string) => {
    setData((d) => ({
      ...d,
      documentosMarcados: d.documentosMarcados.includes(id)
        ? d.documentosMarcados.filter((x) => x !== id)
        : [...d.documentosMarcados, id],
    }));
  };

  const selectedPadre = parents.find((p) => p.id === data.padreId);
  const selectedTutor = parents.find((p) => p.id === data.tutorId);
  const selectedConcept = conceptos.find((c) => c.id === data.paymentConceptId);
  const gradosDisponibles = data.nivel ? gradosPorNivel[data.nivel] || [] : [];
  const contextReady = isGuid(school.branchId) && isGuid(school.cycleId);

  const assignmentSalon = useMemo(() => {
    if (!data.nivel || !data.grado || !data.grupo) return null;
    const levelLabel = niveles.find((n) => n.value === data.nivel)?.label || data.nivel;
    const gradeLabel = `${data.grado}°`;
    return getSalonDelAlumno(
      levelLabel,
      gradeLabel,
      data.grupo,
      school.branch?.name || '',
      classrooms,
      school.branchId
    );
  }, [data.nivel, data.grado, data.grupo, school.branch?.name, school.branchId, classrooms, niveles]);

  const validateStep = (current: number): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    if (current === 0) {
      assignError(newErrors, 'nombre', validateRequiredName(data.nombre, 'El nombre'));
      assignError(newErrors, 'apellidoPaterno', validateRequiredName(data.apellidoPaterno, 'El apellido paterno'));
      assignError(newErrors, 'apellidoMaterno', validateOptionalName(data.apellidoMaterno, 'El apellido materno'));
      assignError(newErrors, 'fechaNacimiento', validateBirthDate(data.fechaNacimiento, true));
      assignError(newErrors, 'email', validateEmail(data.email, false));
      assignError(newErrors, 'telefono', validatePhone(data.telefono, false));
      assignError(newErrors, 'direccion', validateTextFree(data.direccion, FieldLimits.address, 'Dirección'));
      assignError(newErrors, 'alergias', validateTextFree(data.alergias, FieldLimits.allergies, 'Alergias'));
      assignError(newErrors, 'notasMedicas', validateTextFree(data.notasMedicas, FieldLimits.medicalNotes, 'Notas médicas'));
      if (!data.genero) newErrors.genero = 'Selecciona el género';
    }
    if (current === 1) {
      // Tutor mínimo es soft al confirmar (misma matriz que alumno).
    }
    if (current === 3) {
      if (!data.nivel) newErrors.nivel = 'Selecciona un nivel';
      if (!data.grado) newErrors.grado = 'Selecciona un grado';
      if (!data.grupo) newErrors.grupo = 'Selecciona un grupo';
      if (!contextReady) {
        newErrors.contexto = 'Selecciona sucursal y ciclo en el encabezado antes de continuar';
      }
      if (data.nivel && data.grado && data.grupo && contextReady) {
        const levelLabel = niveles.find((n) => n.value === data.nivel)?.label || data.nivel;
        const gradeLabel = `${data.grado}°`;
        const salon = getSalonDelAlumno(
          levelLabel,
          gradeLabel,
          data.grupo,
          school.branch?.name || '',
          classrooms,
          school.branchId
        );
        if (!salon) {
          newErrors.grupo = interactionMessage(InteractionCodes.REL_GROUP_NO_CLASSROOM);
        }
      }
    }
    if (current === 4 && data.generateCharge) {
      assignError(newErrors, 'chargeAmount', validatePositiveNumber(data.chargeAmount, 'El monto del cargo'));
    }
    return newErrors;
  };

  const canNext = (): boolean => Object.keys(validateStep(step)).length === 0;

  const handleNext = () => {
    const newErrors = validateStep(step);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      afterValidationErrors(newErrors);
      return;
    }
    if (step < 4) setStep((s) => s + 1);
  };

  const handleConfirmar = async () => {
    if (savingEnrollment) return;
    const newErrors = validateStep(4);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      afterValidationErrors(newErrors);
      return;
    }
    if (!contextReady) {
      showToast('Selecciona sucursal y ciclo escolar en el selector de contexto', 'error');
      return;
    }

    const levelLabel = niveles.find((n) => n.value === data.nivel)?.label || data.nivel;
    const gradeLabel = data.grado ? `${data.grado}°` : '';
    const parentIds = [data.padreId, data.tutorId].filter((id) => isGuid(id));

    const { hard, soft } = collectStudentInteractionIssues({
      branchId: school.branchId,
      cycleId: school.cycleId,
      firstName: data.nombre,
      lastName: data.apellidoPaterno,
      level: levelLabel,
      grade: gradeLabel,
      group: data.grupo,
      branchName: school.branch?.name || '',
      linkedParentIds: parentIds,
      classrooms,
    });

    const missingRequiredDocs = documentosChecklist.filter(
      (d) => d.requerido && !data.documentosMarcados.includes(d.id)
    );
    if (missingRequiredDocs.length > 0) {
      soft.push({
        code: InteractionCodes.REL_ENROLLMENT_DOCS,
        message: interactionMessage(InteractionCodes.REL_ENROLLMENT_DOCS),
      });
    }

    if (hard.length > 0) {
      showToast(hard[0].message, 'error');
      if (hard[0].code === 'REL_GROUP_NO_CLASSROOM') {
        setErrors((prev) => ({ ...prev, grupo: hard[0].message }));
        setStep(3);
      }
      return;
    }

    const matchedSalon = findMatchingClassroom(classrooms, levelLabel, gradeLabel, data.grupo, {
      branchId: school.branchId,
      branchName: school.branch?.name || '',
    });
    if (matchedSalon && matchedSalon.capacidad > 0 && (matchedSalon.ocupados ?? 0) >= matchedSalon.capacidad) {
      const msg = `El salón "${matchedSalon.nombre}" está lleno (${matchedSalon.ocupados}/${matchedSalon.capacidad}). Elige otro grupo.`;
      showToast(msg, 'error');
      setErrors((prev) => ({ ...prev, grupo: msg }));
      setStep(3);
      return;
    }

    const ok = await confirmSoftWarnings(soft);
    if (!ok) return;

    setSavingEnrollment(true);
    try {
      const lastName = `${data.apellidoPaterno} ${data.apellidoMaterno}`.trim().slice(0, FieldLimits.name);
      const amount = Number(data.chargeAmount) || 0;
      const classroomId = resolveClassroomId(
        levelLabel,
        gradeLabel,
        data.grupo,
        school.branch?.name || '',
        classrooms,
        school.branchId
      );

      const res = await submitEnrollment({
        branchId: school.branchId,
        cycleId: school.cycleId,
        student: {
          firstName: data.nombre.trim(),
          lastName,
          maternalLastName: data.apellidoMaterno.trim(),
          birthDate: data.fechaNacimiento,
          gender: data.genero,
          email: data.email.trim(),
          phone: data.telefono.trim(),
          address: data.direccion.trim(),
          bloodType: data.tipoSangre,
          allergies: data.alergias,
          medicalNotes: data.notasMedicas,
        },
        parentIds,
        level: data.nivel,
        grade: data.grado,
        group: data.grupo,
        classroomId,
        scholarshipPercent: 0,
        documentChecklistIds: data.documentosMarcados,
        charge: data.generateCharge
          ? {
              enabled: true,
              paymentConceptId: data.paymentConceptId || undefined,
              conceptName: selectedConcept?.nombre || 'Inscripción',
              conceptType: selectedConcept?.tipo || 'unico',
              grossAmount: amount,
            }
          : { enabled: false, conceptName: '', conceptType: 'unico', grossAmount: 0 },
      });

      if (!res.data?.studentId) {
        showToast(friendlyApiError(res) || 'No se pudo completar la inscripción', 'error');
        return;
      }

      setResult(res.data);
      void queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.finance.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.parents.all });
      void draftsQuery.refetch();

      if (res.data.status !== 'completed') {
        showToast(res.data.message || 'Alumno creado; inscripción en borrador', 'info');
        if (res.data.warnings.length > 0) {
          showToast(res.data.warnings[0], 'info');
        }
      } else if (res.data.warnings.length > 0) {
        showToast(res.data.warnings[0], 'info');
        if (res.data.warnings.length > 1) {
          showToast(`${res.data.warnings.length - 1} aviso(s) más — revisa el resumen.`, 'info');
        }
      } else {
        showToast('Inscripción completada correctamente', 'success');
      }
    } finally {
      setSavingEnrollment(false);
    }
  };

  const resetWizard = () => {
    setStep(0);
    setData(initialData);
    setResult(null);
    setErrors({});
  };

  if (result) {
    return (
      <ModuleContextGate>
      <MainLayout>
        <div className="max-w-[720px] mx-auto py-16 text-center">
          <div
            className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${
              result.status === 'completed' ? 'bg-emerald-100' : 'bg-amber-100'
            }`}
          >
            <i
              className={`text-3xl ${
                result.status === 'completed'
                  ? 'ri-check-line text-emerald-600'
                  : 'ri-error-warning-line text-amber-600'
              }`}
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground-900 mb-2">
            {result.status === 'completed' ? 'Inscripción completada' : 'Inscripción parcial'}
          </h1>
          <p className="text-sm text-foreground-500 mb-8">
            {result.message ||
              (result.status === 'completed'
                ? 'El alumno quedó registrado y vinculado a la inscripción.'
                : 'El alumno se creó, pero la inscripción no quedó marcada como completada. Revisa los avisos.')}
          </p>
          <Card className="inline-block text-left mb-6 w-full max-w-md">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-foreground-500 w-36">Matrícula:</span>
                <Badge variant="primary" size="md">
                  {result.enrollment}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-foreground-500 w-36">Nombre:</span>
                <span className="text-sm font-medium text-foreground-900">
                  {data.nombre} {data.apellidoPaterno} {data.apellidoMaterno}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-foreground-500 w-36">Estado inscripción:</span>
                <Badge variant={result.status === 'completed' ? 'success' : 'warning'} size="sm">
                  {result.status === 'completed' ? 'Completada' : result.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-foreground-500 w-36">Sucursal:</span>
                <span className="text-sm text-foreground-800">{school.branch?.name || '—'}</span>
              </div>
              {result.chargeId ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-foreground-500 w-36">Cargo:</span>
                  <span className="text-sm text-foreground-800">
                    {result.chargeConceptName} · {formatCurrency(result.chargeNetAmount ?? 0)}
                  </span>
                </div>
              ) : data.generateCharge ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-foreground-500 w-36">Cargo:</span>
                  <span className="text-sm text-amber-700">No generado (revisa Finanzas)</span>
                </div>
              ) : null}
            </div>
          </Card>
          {result.warnings.length > 0 && (
            <div className="mb-6 text-left max-w-md mx-auto rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              {result.warnings.map((w) => (
                <p key={w} className="flex gap-1.5">
                  <i className="ri-information-line mt-0.5" />
                  {w}
                </p>
              ))}
            </div>
          )}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button variant="primary" icon="ri-user-line" onClick={() => navigate(`/alumnos/${result.studentId}`)}>
              Ver expediente
            </Button>
            <Button variant="outline" icon="ri-group-line" onClick={() => navigate('/alumnos')}>
              Ir a Alumnos
            </Button>
            <Button variant="ghost" icon="ri-user-add-line" onClick={resetWizard}>
              Nueva inscripción
            </Button>
          </div>
        </div>
      </MainLayout>
      </ModuleContextGate>
    );
  }

  return (
    <ModuleContextGate>
    <MainLayout>
      <div className="max-w-[900px] mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-1 gap-3 flex-wrap">
            <h1 className="text-lg font-bold text-foreground-900 tracking-tight">Nueva Inscripción</h1>
            <Badge variant="primary" size="md" icon="ri-calendar-line">
              {school.cycle?.name || 'Selecciona ciclo'}
            </Badge>
          </div>
          <p className="text-xs text-foreground-500">
            Sucursal activa: <span className="font-medium text-foreground-700">{school.branch?.name || '—'}</span>
            {!contextReady && (
              <span className="text-amber-600"> · Debes elegir sucursal y ciclo en el encabezado</span>
            )}
          </p>
        </div>

        {drafts.length > 0 && (
          <Card padding="md" className="mb-6 border-amber-200 bg-amber-50/40">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground-900">Borradores pendientes</h2>
                <p className="text-2xs text-foreground-500 mt-0.5">
                  Inscripciones incompletas en esta sucursal. Puedes descartarlas o abrir el alumno si ya se creó.
                </p>
              </div>
              <Badge variant="warning" size="sm">
                {drafts.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {drafts.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200/80 bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground-800 truncate">
                      {d.enrollmentNumber || d.id.slice(0, 8)}
                    </p>
                    <p className="text-2xs text-foreground-500">
                      Paso {d.currentStep || 0} · {d.createdAt || '—'}
                      {d.studentId ? ' · alumno creado' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {d.studentId && isGuid(d.studentId) && (
                      <Button
                        variant="outline"
                        size="xs"
                        icon="ri-user-line"
                        onClick={() => navigate(`/alumnos/${d.studentId}`)}
                      >
                        Ver alumno
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="xs"
                      icon="ri-delete-bin-line"
                      loading={discardingId === d.id}
                      onClick={() => void discardDraft(d.id)}
                    >
                      Descartar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Stepper steps={enrollmentSteps} currentStep={step} className="mb-8" />

        <Card padding="lg">
          {step === 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground-900 mb-5">Datos Personales del Alumno</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nombre(s)" required autoComplete="given-name" maxLength={FieldLimits.name} value={data.nombre} onChange={(e) => update('nombre', e.target.value)} error={errors.nombre} placeholder="Ej. Carlos" />
                <Input label="Apellido Paterno" required autoComplete="family-name" maxLength={FieldLimits.name} value={data.apellidoPaterno} onChange={(e) => update('apellidoPaterno', e.target.value)} error={errors.apellidoPaterno} placeholder="Ej. Ruiz" />
                <Input label="Apellido Materno" autoComplete="family-name" maxLength={FieldLimits.name} value={data.apellidoMaterno} onChange={(e) => update('apellidoMaterno', e.target.value)} error={errors.apellidoMaterno} placeholder="Ej. Mendoza" />
                <Input label="Fecha de Nacimiento" type="date" required value={data.fechaNacimiento} onChange={(e) => update('fechaNacimiento', e.target.value)} error={errors.fechaNacimiento} />
                <Select label="Género" required options={[{ value: 'M', label: 'Masculino' }, { value: 'F', label: 'Femenino' }]} value={data.genero} onChange={(e) => update('genero', e.target.value)} error={errors.genero} placeholder="Seleccionar género" />
                <Select label="Tipo de Sangre" options={tiposSangre} value={data.tipoSangre} onChange={(e) => update('tipoSangre', e.target.value)} placeholder="Seleccionar tipo" />
                <Input label="Email" type="email" autoComplete="email" maxLength={FieldLimits.email} value={data.email} onChange={(e) => update('email', e.target.value)} error={errors.email} placeholder="alumno@email.com" />
                <Input label="Teléfono" type="tel" autoComplete="tel" maxLength={FieldLimits.phone} value={data.telefono} onChange={(e) => update('telefono', e.target.value)} error={errors.telefono} placeholder="+52 55 0000 0000" />
              </div>
              <div className="mt-4">
                <Input label="Dirección" autoComplete="street-address" maxLength={FieldLimits.address} value={data.direccion} onChange={(e) => update('direccion', e.target.value)} error={errors.direccion} placeholder="Calle, Número, Colonia, Ciudad" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Input label="Alergias" maxLength={FieldLimits.allergies} value={data.alergias} onChange={(e) => update('alergias', e.target.value)} error={errors.alergias} placeholder="Ej. Penicilina, Nuez..." />
                <Input label="Notas Médicas" maxLength={FieldLimits.medicalNotes} value={data.notasMedicas} onChange={(e) => update('notasMedicas', e.target.value)} error={errors.notasMedicas} placeholder="Condiciones especiales" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground-900 mb-1">Padres o Tutores</h3>
              <p className="text-xs text-foreground-500 mb-5">
                Busca tutores ya registrados (recomendado). Puedes inscribir ahora y vincularlos después.
              </p>
              {parentsQuery.isLoading ? (
                <p className="text-sm text-foreground-500 py-6">Cargando tutores...</p>
              ) : parents.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 mb-4">
                  No hay tutores en el sistema. Puedes continuar y vincularlos después, o registrar uno en Padres.
                </div>
              ) : (
                <div className="space-y-4">
                  <Input
                    icon="ri-search-line"
                    placeholder="Buscar tutor (mín. 2 caracteres)..."
                    value={parentSearch}
                    onChange={(e) => setParentSearch(e.target.value)}
                  />
                  {parentsForSelect.needsSearch && (
                    <p className="text-xs text-foreground-500">
                      Hay {parentsForSelect.catalogSize} tutores. Escribe al menos {TUTOR_SEARCH_MIN} caracteres
                      para filtrar el listado.
                    </p>
                  )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Select
                      label="Padre o Tutor Principal"
                      options={[
                        { value: '', label: 'Seleccionar padre/tutor...' },
                        ...parentsForSelect.list.map((p) => ({
                          value: p.id,
                          label: `${p.fullName}${p.occupation ? ` — ${p.occupation}` : ''}`,
                        })),
                      ]}
                      value={data.padreId}
                      onChange={(e) => update('padreId', e.target.value)}
                      error={errors.padreId}
                    />
                    {selectedPadre && (
                      <Card className="mt-3" padding="sm">
                        <p className="text-sm font-medium text-foreground-900">{selectedPadre.fullName}</p>
                        <p className="text-xs text-foreground-400 mt-1">
                          {selectedPadre.email || '—'} · {selectedPadre.phone || '—'}
                        </p>
                      </Card>
                    )}
                  </div>
                  <div>
                    <Select
                      label="Segundo Tutor (Opcional)"
                      options={[
                        { value: '', label: 'Seleccionar segundo tutor...' },
                        ...parentsForSelect.list
                          .filter((p) => p.id !== data.padreId)
                          .map((p) => ({
                            value: p.id,
                            label: `${p.fullName}${p.occupation ? ` — ${p.occupation}` : ''}`,
                          })),
                      ]}
                      value={data.tutorId}
                      onChange={(e) => update('tutorId', e.target.value)}
                    />
                    {selectedTutor && (
                      <Card className="mt-3" padding="sm">
                        <p className="text-sm font-medium text-foreground-900">{selectedTutor.fullName}</p>
                        <p className="text-xs text-foreground-400 mt-1">
                          {selectedTutor.email || '—'} · {selectedTutor.phone || '—'}
                        </p>
                      </Card>
                    )}
                  </div>
                </div>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-secondary-100">
                <Button variant="outline" size="sm" icon="ri-user-add-line" onClick={() => setParentModalOpen(true)}>
                  Registrar Padre/Tutor aquí
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground-900 mb-1">Checklist de documentos</h3>
              <p className="text-xs text-foreground-500 mb-5">
                Marca lo que el responsable entregará. Los archivos ({DOCUMENT_RULES_HINT}) se suben después en el
                expediente del alumno.
              </p>
              <div className="mb-4 rounded-lg border border-secondary-200 bg-background-50 p-3 text-xs text-foreground-600 flex gap-2">
                <i className="ri-information-line text-primary-500 mt-0.5" />
                Este paso no bloquea la inscripción. Es solo un recordatorio.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {documentosChecklist.map((doc) => {
                  const marked = data.documentosMarcados.includes(doc.id);
                  return (
                    <div
                      key={doc.id}
                      onClick={() => toggleDocumento(doc.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-150 cursor-pointer ${
                        marked
                          ? 'border-emerald-300 bg-emerald-50/60'
                          : 'border-secondary-200 bg-background-50 hover:border-secondary-300'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0 ${
                          marked ? 'bg-emerald-100 text-emerald-600' : 'bg-secondary-100 text-secondary-500'
                        }`}
                      >
                        <i className={`${doc.icono} text-lg`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground-800">{doc.nombre}</p>
                        <p className="text-xs text-foreground-400">
                          {doc.requerido ? 'Recomendado' : 'Opcional'}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          marked ? 'border-emerald-500 bg-emerald-500' : 'border-secondary-300'
                        }`}
                      >
                        {marked && <i className="ri-check-line text-white text-xs" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground-900 mb-1">Asignación de Grupo</h3>
              <p className="text-xs text-foreground-500 mb-5">
                La sucursal y el ciclo se toman del selector de contexto (arriba).
              </p>
              {errors.contexto && (
                <div className="mb-4 p-3 rounded-md bg-amber-50 border border-amber-200 text-sm text-amber-700 flex items-center gap-2">
                  <i className="ri-error-warning-line" />
                  {errors.contexto}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Nivel"
                  required
                  options={niveles}
                  value={data.nivel}
                  onChange={(e) => {
                    update('nivel', e.target.value);
                    update('grado', '');
                  }}
                  error={errors.nivel}
                  placeholder="Seleccionar nivel"
                />
                <Input
                  label="Sucursal (contexto)"
                  value={school.branch?.name || ''}
                  disabled
                  hint="Cámbiala desde el selector del encabezado"
                />
                <Select
                  label="Grado"
                  required
                  options={gradosDisponibles}
                  value={data.grado}
                  onChange={(e) => update('grado', e.target.value)}
                  error={errors.grado}
                  placeholder="Seleccionar grado"
                  disabled={!data.nivel}
                />
                <Select
                  label="Grupo"
                  required
                  options={grupos}
                  value={data.grupo}
                  onChange={(e) => update('grupo', e.target.value)}
                  error={errors.grupo}
                  placeholder="Seleccionar grupo"
                />
              </div>
              {data.nivel && data.grado && data.grupo && contextReady && (
                assignmentSalon ? (
                  <Card className="mt-5 bg-emerald-50/50 border-emerald-200" padding="md">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                        <i className="ri-door-open-line text-lg" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground-900">
                          Salón {assignmentSalon.nombre}
                        </p>
                        <p className="text-xs text-foreground-500">
                          {niveles.find((n) => n.value === data.nivel)?.label} — Grado {data.grado}° Grupo{' '}
                          {data.grupo} · Vinculado por nivel, grado y grupo
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="mt-5 bg-amber-50/70 border-amber-200" padding="md">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                        <i className="ri-error-warning-line text-lg" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-900">
                          Sin salón para esta combinación
                        </p>
                        <p className="text-xs text-amber-800 mt-0.5">
                          {interactionMessage(InteractionCodes.REL_GROUP_NO_CLASSROOM)}
                        </p>
                      </div>
                    </div>
                  </Card>
                )
              )}
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground-900 mb-1">Resumen de Inscripción</h3>
              <p className="text-xs text-foreground-500 mb-5">
                Al confirmar se crea el alumno, se vinculan tutores y se cierra la inscripción.
              </p>

              <Card padding="sm" className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 flex items-center justify-center rounded-md bg-primary-100 text-primary-600">
                    <i className="ri-user-line text-sm" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground-900">Datos del Alumno</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5 text-sm">
                  <div>
                    <span className="text-xs text-foreground-400">Nombre:</span>{' '}
                    <span className="text-foreground-800">
                      {data.nombre} {data.apellidoPaterno} {data.apellidoMaterno}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-foreground-400">Fecha Nac.:</span>{' '}
                    <span className="text-foreground-800">{data.fechaNacimiento || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-foreground-400">Género:</span>{' '}
                    <span className="text-foreground-800">
                      {data.genero === 'M' ? 'Masculino' : data.genero === 'F' ? 'Femenino' : '—'}
                    </span>
                  </div>
                </div>
              </Card>

              <Card padding="sm" className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 flex items-center justify-center rounded-md bg-accent-100 text-accent-600">
                    <i className="ri-parent-line text-sm" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground-900">Padres / Tutores</h4>
                </div>
                {selectedPadre ? (
                  <p className="text-sm text-foreground-800">
                    {selectedPadre.fullName} ({selectedPadre.phone || selectedPadre.email || '—'})
                  </p>
                ) : (
                  <p className="text-sm text-amber-600 font-medium">Falta seleccionar padre/tutor</p>
                )}
                {selectedTutor && (
                  <p className="text-sm text-foreground-800 mt-1">
                    {selectedTutor.fullName} ({selectedTutor.phone || selectedTutor.email || '—'})
                  </p>
                )}
              </Card>

              <Card padding="sm" className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 flex items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
                    <i className="ri-building-4-line text-sm" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground-900">Asignación</h4>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <div>
                    <span className="text-xs text-foreground-400">Nivel:</span>{' '}
                    <span className="text-foreground-800">
                      {niveles.find((n) => n.value === data.nivel)?.label || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-foreground-400">Grado/Grupo:</span>{' '}
                    <span className="text-foreground-800">
                      {data.grado || '—'}° {data.grupo || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-foreground-400">Sucursal:</span>{' '}
                    <span className="text-foreground-800">{school.branch?.name || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-foreground-400">Ciclo:</span>{' '}
                    <span className="text-foreground-800">{school.cycle?.name || '—'}</span>
                  </div>
                </div>
              </Card>

              <Card padding="sm" className="mb-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 flex items-center justify-center rounded-md bg-amber-100 text-amber-700">
                      <i className="ri-money-dollar-circle-line text-sm" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground-900">Cargo de inscripción</h4>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-foreground-600 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-primary-500"
                      checked={data.generateCharge}
                      onChange={(e) => update('generateCharge', e.target.checked)}
                    />
                    Generar cargo
                  </label>
                </div>
                {data.generateCharge ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Select
                      label="Concepto"
                      options={
                        conceptos.length > 0
                          ? conceptos.map((c) => ({
                              value: c.id,
                              label: `${c.nombre} (${formatCurrency(c.monto)})`,
                            }))
                          : [{ value: '', label: 'Sin conceptos — usa monto manual' }]
                      }
                      value={data.paymentConceptId}
                      onChange={(e) => {
                        const id = e.target.value;
                        const concept = conceptos.find((c) => c.id === id);
                        update('paymentConceptId', id);
                        if (concept) update('chargeAmount', String(concept.monto || 0));
                      }}
                    />
                    <Input
                      label="Monto (MXN)"
                      type="number"
                      value={data.chargeAmount}
                      onChange={(e) => update('chargeAmount', e.target.value)}
                      error={errors.chargeAmount}
                      placeholder="0"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-foreground-500">
                    No se generará cargo. Puedes crearlo después en Finanzas.
                  </p>
                )}
                {conceptos.length === 0 && data.generateCharge && (
                  <p className="text-xs text-amber-700 mt-2">
                    No hay conceptos de pago en catálogo. El cargo usará el nombre “Inscripción” y el monto
                    indicado.
                  </p>
                )}
              </Card>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-secondary-100">
            <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || savingEnrollment}>
              <i className="ri-arrow-left-line mr-1" /> Anterior
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground-400">Paso {step + 1} de 5</span>
              {step < 4 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleNext}
                  disabled={!canNext()}
                  iconRight="ri-arrow-right-line"
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => void handleConfirmar()}
                  icon="ri-check-line"
                  loading={savingEnrollment}
                  disabled={savingEnrollment || !contextReady}
                >
                  Confirmar Inscripción
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      <ParentFormModal
        open={parentModalOpen}
        onClose={() => setParentModalOpen(false)}
        onSave={(d) => void handleSaveNewParent(d)}
        saving={savingParent}
      />
    </MainLayout>
    </ModuleContextGate>
  );
}
