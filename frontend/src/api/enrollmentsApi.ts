import { apiClient } from '@/api/apiClient';
import { isGuid } from '@/api/helpers';
import type { ApiResponse } from '@/api/types';
import * as studentsApi from '@/api/studentsApi';
import * as financeApi from '@/api/financeApi';

/** Payload del wizard de inscripción (5 pasos) — UI. */
export interface EnrollmentRequest {
  branchId?: string | null;
  cycleId?: string | null;
  schoolCycleId?: string | null;
  student: {
    firstName: string;
    lastName: string;
    maternalLastName?: string;
    birthDate: string;
    gender: string;
    email?: string;
    phone?: string;
    address?: string;
    bloodType?: string;
    allergies?: string;
    medicalNotes?: string;
  };
  parentIds: string[];
  level: string;
  grade: string;
  group: string;
  classroomId?: string | number | null;
  scholarshipPercent?: number;
  documentChecklistIds?: string[];
  /** Cargo de inscripción (Fase 2). */
  charge?: {
    enabled: boolean;
    paymentConceptId?: string;
    conceptName: string;
    conceptType: string;
    grossAmount: number;
    dueDate?: string;
  };
}

export interface EnrollmentResult {
  enrollmentId: string;
  studentId: string;
  enrollment: string;
  status: string;
  chargeId?: string;
  chargeNetAmount?: number;
  chargeConceptName?: string;
  warnings: string[];
  message?: string;
}

const LEVEL_LABELS: Record<string, string> = {
  preescolar: 'Preescolar',
  primaria: 'Primaria',
  secundaria: 'Secundaria',
  preparatoria: 'Preparatoria',
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function fail(message: string, errors: string[] = ['Error']): ApiResponse<EnrollmentResult> {
  return { success: false, data: null, message, errors };
}

/**
 * Happy path Fase 1 + 2:
 * 1) POST /enrollments
 * 2) PUT wizard JSON
 * 3) POST /students (reutiliza matrícula del draft)
 * 4) POST link guardians
 * 5) POST /enrollments/:id/complete
 * 6) POST /charges (opcional)
 */
export async function submitEnrollment(
  payload: EnrollmentRequest
): Promise<ApiResponse<EnrollmentResult>> {
  const branchId = payload.branchId;
  const schoolCycleId = payload.schoolCycleId ?? payload.cycleId;
  const warnings: string[] = [];

  if (!isGuid(branchId)) {
    return fail('Selecciona una sucursal válida en el selector de contexto.', ['CTX_NO_BRANCH']);
  }
  if (!isGuid(schoolCycleId)) {
    return fail('Selecciona un ciclo escolar válido en el selector de contexto.', ['CTX_NO_CYCLE']);
  }

  if (!payload.student.firstName?.trim() || !payload.student.lastName?.trim()) {
    return fail('Nombre y apellidos del alumno son obligatorios.');
  }

  const parentIds = (payload.parentIds ?? []).filter((id) => isGuid(id));

  if (payload.charge?.enabled) {
    if (!Number.isFinite(payload.charge.grossAmount) || payload.charge.grossAmount <= 0) {
      return fail('El cargo de inscripción debe ser mayor a 0.', ['CHARGE_AMOUNT']);
    }
  }

  const created = await apiClient<Record<string, unknown>>('/enrollments', {
    method: 'POST',
    body: { branchId, schoolCycleId },
  });
  if (!created.success || !created.data?.id) {
    return fail(created.message ?? 'No se pudo crear el borrador de inscripción.', created.errors ?? []);
  }

  const enrollmentId = String(created.data.id);
  const enrollmentNumber = String(created.data.enrollmentNumber ?? '');

  const wizard = await apiClient<Record<string, unknown>>(`/enrollments/${enrollmentId}/wizard`, {
    method: 'PUT',
    body: {
      currentStep: 5,
      step1StudentJson: JSON.stringify(payload.student),
      step2GuardiansJson: JSON.stringify({ parentIds }),
      step3AcademicJson: JSON.stringify({
        level: payload.level,
        grade: payload.grade,
        group: payload.group,
        classroomId: payload.classroomId,
        scholarshipPercent: payload.scholarshipPercent,
      }),
      step4DocumentsJson: JSON.stringify({
        checklistIds: payload.documentChecklistIds ?? [],
        note: 'Checklist UI; archivos reales (PDF/PNG/JPG, máx. 5 MB) se suben en el expediente.',
      }),
      step5FinanceJson: JSON.stringify(payload.charge ?? {}),
    },
  });

  if (!wizard.success) {
    return fail(
      `Se creó el borrador ${enrollmentNumber || enrollmentId}, pero no se pudo guardar el wizard. Revisa Inscripciones o reintenta.`,
      ['ENROLLMENT_DRAFT_ORPHAN', ...(wizard.errors ?? [])]
    );
  }

  const levelLabel = LEVEL_LABELS[payload.level] ?? payload.level;
  const gradeLabel = payload.grade ? (payload.grade.includes('°') ? payload.grade : `${payload.grade}°`) : '';

  const studentRes = await studentsApi.createStudent({
    branchId: branchId!,
    schoolCycleId: schoolCycleId!,
    classroomId: isGuid(payload.classroomId) ? String(payload.classroomId) : undefined,
    enrollment: enrollmentNumber || undefined,
    firstName: payload.student.firstName.trim(),
    lastName: payload.student.lastName.trim(),
    birthDate: payload.student.birthDate,
    gender: (payload.student.gender as 'M' | 'F') || 'M',
    email: payload.student.email?.trim() || '',
    phone: payload.student.phone?.trim() || '',
    address: payload.student.address?.trim() || '',
    bloodType: payload.student.bloodType || '',
    allergies: payload.student.allergies
      ? payload.student.allergies.split(',').map((a) => a.trim()).filter(Boolean)
      : [],
    medicalNotes: payload.student.medicalNotes || '',
    level: levelLabel,
    grade: gradeLabel,
    group: payload.group,
    status: 'active',
    enrollmentDate: todayIsoDate(),
    scholarship: payload.scholarshipPercent ?? 0,
  });

  if (!studentRes.success || !studentRes.data?.id) {
    return fail(
      studentRes.message ??
        'Se creó el borrador de inscripción, pero falló el alta del alumno. Revisa Alumnos o reintenta.',
      studentRes.errors ?? []
    );
  }

  const studentId = studentRes.data.id;
  const finalEnrollment = studentRes.data.enrollment || enrollmentNumber;

  for (const [index, parentId] of parentIds.entries()) {
    const relationship = index === 0 ? 'Padre' : 'Tutor Legal';
    const link = await studentsApi.linkParent(studentId, parentId, relationship);
    if (!link.success) {
      warnings.push(`No se pudo vincular tutor ${parentId}: ${link.message || 'error'}`);
    }
  }

  const completed = await apiClient<Record<string, unknown>>(`/enrollments/${enrollmentId}/complete`, {
    method: 'POST',
    body: { studentId },
  });

  if (!completed.success) {
    warnings.push(
      completed.message ||
        'El alumno se creó, pero la inscripción quedó en borrador (no se marcó como completada).'
    );
  }

  const status = completed.success
    ? String(completed.data?.status ?? 'completed')
    : 'draft';

  let chargeId: string | undefined;
  let chargeNetAmount: number | undefined;
  let chargeConceptName: string | undefined;

  if (payload.charge?.enabled && payload.charge.grossAmount > 0) {
    const dueDate = payload.charge.dueDate || todayIsoDate();
    const chargeRes = await financeApi.createCharge({
      branchId: branchId!,
      studentId,
      paymentConceptId: isGuid(payload.charge.paymentConceptId)
        ? payload.charge.paymentConceptId
        : undefined,
      conceptName: payload.charge.conceptName || 'Inscripción',
      conceptType: payload.charge.conceptType || 'unico',
      grossAmount: payload.charge.grossAmount,
      scholarshipPercent: payload.scholarshipPercent ?? 0,
      dueDate,
      schoolCycleId: schoolCycleId!,
    });

    if (chargeRes.success && chargeRes.data) {
      chargeId = chargeRes.data.id;
      chargeNetAmount = chargeRes.data.netAmount;
      chargeConceptName = chargeRes.data.conceptName;
    } else {
      warnings.push(
        chargeRes.message ||
          'Alumno creado, pero no se pudo generar el cargo. Créalo desde Finanzas.'
      );
    }
  }

  const summaryMessage =
    status === 'completed'
      ? warnings.length > 0
        ? 'Inscripción completada con avisos.'
        : 'Inscripción completada.'
      : 'Alumno creado; la inscripción quedó en borrador. Revisa avisos.';

  return {
    success: true,
    data: {
      enrollmentId,
      studentId,
      enrollment: String(completed.data?.enrollmentNumber ?? finalEnrollment),
      status,
      chargeId,
      chargeNetAmount,
      chargeConceptName,
      warnings,
      message: summaryMessage,
    },
    message: summaryMessage,
    errors: [],
  };
}

/** @deprecated Usar submitEnrollment */
export const createEnrollment = submitEnrollment;
