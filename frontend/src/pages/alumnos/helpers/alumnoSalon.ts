import { isGuid } from '@/api/helpers';
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

/**
 * Misma regla para vista previa y validación:
 * salón de la sucursal cuyo nivel/grado/grupo (o gruposAsignados) coinciden.
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
  const pool = classrooms.filter((c) =>
    classroomInBranch(c, opts?.branchId, opts?.branchName)
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

  if (salon.profesorAsignado && salon.profesorAsignado !== 'Sin asignar') {
    return salon.profesorAsignado;
  }
  const normLevel = normalizeLevel(level);
  const normGrade = normalizeGrade(grade);
  const grupo = salon.gruposAsignados?.find(
    (g) =>
      normalizeLevel(g.nivel) === normLevel &&
      normalizeGrade(g.grado) === normGrade &&
      g.grupo === group
  );
  if (grupo?.profesor && grupo.profesor !== 'Sin asignar') return grupo.profesor;
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
      (grupo?.profesor && grupo.profesor !== 'Sin asignar'
        ? grupo.profesor
        : salon.profesorAsignado) || 'Sin asignar',
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
