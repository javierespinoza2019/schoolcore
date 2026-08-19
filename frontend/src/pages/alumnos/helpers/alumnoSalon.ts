import { humanLabel, isGuid } from '@/api/helpers';
import type { Salon } from '@/mocks/salones';

export function normalizeLevel(level: string): string {
  return level.trim().toLowerCase();
}

/** Extrae el número de grado (5°, 5to → "5") de forma consistente con guards. */
export function normalizeGrade(grade: string): string {
  const g = grade.toLowerCase().replace(/°/g, '').trim();
  const m = g.match(/^(\d+)/);
  return m ? m[1] : g.replace(/ro|do|to|ta/g, '').trim();
}

function classroomInBranch(
  classroom: Salon,
  branchId?: string | null,
  branchName?: string | null
): boolean {
  if (branchId && isGuid(branchId) && classroom.branchId && isGuid(classroom.branchId)) {
    return classroom.branchId === branchId;
  }
  if (branchName?.trim() && classroom.sucursal?.trim()) {
    return classroom.sucursal.trim().toLowerCase() === branchName.trim().toLowerCase();
  }
  // Sin datos de sucursal en el salón: no descartar (catálogo incompleto).
  if (branchId && isGuid(branchId) && !classroom.branchId) return true;
  return true;
}

/** Salón en mantenimiento (u otro estado no operable) no se usa para vincular alumnos. */
export function isClassroomUnavailable(salon: Salon): boolean {
  const e = (salon.estado || '').trim().toLowerCase();
  return e === 'mantenimiento' || e === 'inactivo' || e === 'cerrado';
}

/**
 * Misma regla para vista previa y validación:
 * salón de la sucursal cuyo nivel/grado/grupo (o gruposAsignados) coinciden.
 * Omite salones en mantenimiento.
 */
export function findMatchingClassroom(
  classrooms: Salon[],
  level: string,
  grade: string,
  group: string,
  opts?: { branchId?: string | null; branchName?: string | null }
): Salon | null {
  if (!classrooms.length || !level?.trim() || !grade?.trim() || !group?.trim()) return null;

  const normLevel = normalizeLevel(level);
  const normGrade = normalizeGrade(grade);
  const pool = classrooms.filter(
    (c) => classroomInBranch(c, opts?.branchId, opts?.branchName) && !isClassroomUnavailable(c)
  );

  const byPrimary = pool.find(
    (s) =>
      normalizeLevel(s.nivel) === normLevel &&
      normalizeGrade(s.grado) === normGrade &&
      s.grupo === group
  );
  if (byPrimary) return byPrimary;

  for (const salon of pool) {
    const hit = salon.gruposAsignados?.some(
      (g) =>
        normalizeLevel(g.nivel) === normLevel &&
        normalizeGrade(g.grado) === normGrade &&
        g.grupo === group
    );
    if (hit) return salon;
  }
  return null;
}

/**
 * Resuelve profesor/salón a partir de classrooms reales (API).
 * Sin lista o sin match → "Sin asignar" / null (no usa mocks).
 */
export function getProfesorDelAlumno(
  level: string,
  grade: string,
  group: string,
  branchName: string,
  classrooms: Salon[] = [],
  branchId?: string | null
): string {
  const salon = findMatchingClassroom(classrooms, level, grade, group, { branchId, branchName });
  if (!salon) return 'Sin asignar';

  const fromSalon = humanLabel(salon.profesorAsignado);
  if (fromSalon && fromSalon !== 'Sin asignar') return fromSalon;

  const normLevel = normalizeLevel(level);
  const normGrade = normalizeGrade(grade);
  const grupo = salon.gruposAsignados?.find(
    (g) =>
      normalizeLevel(g.nivel) === normLevel &&
      normalizeGrade(g.grado) === normGrade &&
      g.grupo === group
  );
  const fromGrupo = humanLabel(grupo?.profesor);
  if (fromGrupo && fromGrupo !== 'Sin asignar') return fromGrupo;
  return 'Sin asignar';
}

export function getSalonDelAlumno(
  level: string,
  grade: string,
  group: string,
  branchName: string,
  classrooms: Salon[] = [],
  branchId?: string | null
): { id: string; nombre: string; profesor: string; tipo: string } | null {
  const salon = findMatchingClassroom(classrooms, level, grade, group, { branchId, branchName });
  if (!salon) return null;

  const normLevel = normalizeLevel(level);
  const normGrade = normalizeGrade(grade);
  const grupo = salon.gruposAsignados?.find(
    (g) =>
      normalizeLevel(g.nivel) === normLevel &&
      normalizeGrade(g.grado) === normGrade &&
      g.grupo === group
  );
  return {
    id: salon.id,
    nombre: salon.nombre,
    profesor:
      humanLabel(grupo?.profesor) ||
      humanLabel(salon.profesorAsignado) ||
      'Sin asignar',
    tipo: salon.tipo,
  };
}

/** BR-74A: resuelve classroomId GUID si hay match de nivel/grado/grupo en la sucursal. */
export function resolveClassroomId(
  level: string,
  grade: string,
  group: string,
  branchName: string,
  classrooms: Salon[] = [],
  branchId?: string | null
): string | undefined {
  const salon = getSalonDelAlumno(level, grade, group, branchName, classrooms, branchId);
  return salon?.id && /^[0-9a-f-]{36}$/i.test(salon.id) ? salon.id : undefined;
}

/** Alumnos activos que ocupan el salón (por classroomId o por nivel/grado/grupo). */
export function countOccupiedInClassroom(
  salon: Salon,
  students: Array<{
    id: string;
    status?: string;
    classroomId?: string;
    level?: string;
    grade?: string;
    group?: string;
    branchId?: string;
    branchName?: string;
  }>,
  excludeStudentId?: string
): number {
  return students.filter((s) => {
    if (excludeStudentId && s.id === excludeStudentId) return false;
    if ((s.status || 'active') !== 'active') return false;
    if (salon.id && s.classroomId && s.classroomId === salon.id) return true;
    const match = findMatchingClassroom([salon], s.level || '', s.grade || '', s.group || '', {
      branchId: s.branchId,
      branchName: s.branchName,
    });
    return Boolean(match);
  }).length;
}
