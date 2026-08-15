import { isGuid } from '@/api/helpers';
import type { Salon } from '@/mocks/salones';
import {
  findMatchingClassroom,
  getProfesorDelAlumno,
  getSalonDelAlumno,
} from '@/pages/alumnos/helpers/alumnoSalon';
import {
  InteractionCodes,
  interactionMessage,
  type InteractionCode,
} from '@/lib/interaction/messages';

export type GuardIssue = { code: InteractionCode; message: string };

export interface StudentInteractionInput {
  branchId?: string | null;
  cycleId?: string | null;
  firstName?: string;
  lastName?: string;
  level?: string;
  grade?: string;
  group?: string;
  branchName?: string;
  /** Tutores seleccionados (GUIDs). */
  linkedParentIds?: string[];
  /** branchId de cada tutor si se conoce (guardianes sin sucursal se omiten). */
  linkedParentBranches?: Array<{ parentId: string; branchId?: string | null }>;
  classrooms?: Salon[];
  /** Profesor resuelto (GUID o nombre) si ya se conoce. */
  teacherRef?: string | null;
  teacherBranchId?: string | null;
}

function issue(code: InteractionCode): GuardIssue {
  return { code, message: interactionMessage(code) };
}

/** True si existe vínculo de grupo en un salón de la sucursal (misma regla que la vista previa). */
export function classroomHasGroupLink(
  classrooms: Salon[],
  branchId: string,
  level: string,
  grade: string,
  group: string,
  branchName?: string | null
): boolean {
  return (
    findMatchingClassroom(classrooms, level, grade, group, { branchId, branchName }) !== null
  );
}

/**
 * Hard: contexto, nombres, cross-branch, grupo sin vínculo en salón.
 * Soft: sin tutor / sin salón / sin profesor.
 */
export function collectStudentInteractionIssues(
  input: StudentInteractionInput
): { hard: GuardIssue[]; soft: GuardIssue[] } {
  const hard: GuardIssue[] = [];
  const soft: GuardIssue[] = [];
  const classrooms = input.classrooms ?? [];

  if (!isGuid(input.branchId)) hard.push(issue(InteractionCodes.CTX_NO_BRANCH));
  if (!isGuid(input.cycleId)) hard.push(issue(InteractionCodes.CTX_NO_CYCLE));

  if (!input.firstName?.trim() || !input.lastName?.trim()) {
    hard.push(issue(InteractionCodes.VAL_REQUIRED_NAME));
  }

  const branchId = input.branchId || '';
  const hasAcademic =
    Boolean(input.level?.trim()) &&
    Boolean(input.grade?.trim()) &&
    Boolean(input.group?.trim());

  if (hasAcademic && isGuid(branchId)) {
    const linked = classroomHasGroupLink(
      classrooms,
      branchId,
      input.level!,
      input.grade!,
      input.group!,
      input.branchName
    );
    if (!linked) hard.push(issue(InteractionCodes.REL_GROUP_NO_CLASSROOM));
  }

  for (const p of input.linkedParentBranches ?? []) {
    if (p.branchId && isGuid(p.branchId) && isGuid(branchId) && p.branchId !== branchId) {
      hard.push(issue(InteractionCodes.REL_CROSS_BRANCH));
      break;
    }
  }

  if (
    input.teacherBranchId &&
    isGuid(input.teacherBranchId) &&
    isGuid(branchId) &&
    input.teacherBranchId !== branchId
  ) {
    hard.push(issue(InteractionCodes.REL_CROSS_BRANCH));
  }

  const salon = hasAcademic
    ? getSalonDelAlumno(
        input.level!,
        input.grade!,
        input.group!,
        input.branchName || '',
        classrooms,
        branchId
      )
    : null;

  if (salon) {
    const match = classrooms.find((c) => c.id === salon.id || c.nombre === salon.nombre);
    if (match?.branchId && isGuid(match.branchId) && isGuid(branchId) && match.branchId !== branchId) {
      hard.push(issue(InteractionCodes.REL_CROSS_BRANCH));
    }
  }

  const parentIds = (input.linkedParentIds ?? []).filter((id) => isGuid(id));
  if (parentIds.length === 0) soft.push(issue(InteractionCodes.REL_STUDENT_NO_GUARDIAN));

  if (!salon) soft.push(issue(InteractionCodes.REL_STUDENT_NO_CLASSROOM));

  const profesor =
    input.teacherRef ||
    (hasAcademic
      ? getProfesorDelAlumno(
          input.level!,
          input.grade!,
          input.group!,
          input.branchName || '',
          classrooms,
          branchId
        )
      : 'Sin asignar');
  if (!profesor || profesor === 'Sin asignar') {
    soft.push(issue(InteractionCodes.REL_STUDENT_NO_TEACHER));
  }

  const dedupe = (list: GuardIssue[]) => {
    const seen = new Set<string>();
    return list.filter((i) => {
      if (seen.has(i.code)) return false;
      seen.add(i.code);
      return true;
    });
  };

  return { hard: dedupe(hard), soft: dedupe(soft) };
}

export function moduleContextGate(input: {
  branchCount: number;
  cycleCount: number;
  requireCycle?: boolean;
}): GuardIssue | null {
  if (input.branchCount <= 0) return issue(InteractionCodes.CTX_MODULE_NO_BRANCHES);
  if (input.requireCycle !== false && input.cycleCount <= 0) {
    return issue(InteractionCodes.CTX_MODULE_NO_CYCLES);
  }
  return null;
}
