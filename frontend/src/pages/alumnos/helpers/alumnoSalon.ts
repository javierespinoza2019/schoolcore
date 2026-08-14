import type { Salon } from '@/mocks/salones';

function normalizeGrade(grade: string): string {
  return grade
    .toLowerCase()
    .replace(/°/g, '')
    .replace(/ro/g, '')
    .replace(/do/g, '')
    .replace(/to/g, '')
    .replace(/ta/g, '')
    .trim();
}

function matchSalon(
  classrooms: Salon[],
  level: string,
  grade: string,
  group: string,
  branchName: string
): Salon | null {
  const normGrade = normalizeGrade(grade);
  const salonRegular = classrooms.find(
    (s) =>
      s.tipo === 'Regular' &&
      s.nivel === level &&
      normalizeGrade(s.grado) === normGrade &&
      s.grupo === group &&
      (s.sucursal === branchName || !branchName)
  );
  if (salonRegular) return salonRegular;

  for (const salon of classrooms) {
    if (!salon.gruposAsignados || salon.gruposAsignados.length === 0) continue;
    const match = salon.gruposAsignados.find(
      (g) =>
        g.nivel === level &&
        normalizeGrade(g.grado) === normGrade &&
        g.grupo === group
    );
    if (match) return salon;
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
  classrooms: Salon[] = []
): string {
  if (!classrooms.length) return 'Sin asignar';
  const salon = matchSalon(classrooms, level, grade, group, branchName);
  if (!salon) return 'Sin asignar';

  if (salon.profesorAsignado && salon.profesorAsignado !== 'Sin asignar') {
    return salon.profesorAsignado;
  }
  const normGrade = normalizeGrade(grade);
  const grupo = salon.gruposAsignados?.find(
    (g) =>
      g.nivel === level &&
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
  classrooms: Salon[] = []
): { nombre: string; profesor: string; tipo: string } | null {
  if (!classrooms.length) return null;
  const salon = matchSalon(classrooms, level, grade, group, branchName);
  if (!salon) return null;

  const normGrade = normalizeGrade(grade);
  const grupo = salon.gruposAsignados?.find(
    (g) =>
      g.nivel === level &&
      normalizeGrade(g.grado) === normGrade &&
      g.grupo === group
  );
  return {
    nombre: salon.nombre,
    profesor:
      (grupo?.profesor && grupo.profesor !== 'Sin asignar'
        ? grupo.profesor
        : salon.profesorAsignado) || 'Sin asignar',
    tipo: salon.tipo,
  };
}
