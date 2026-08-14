import { salonesData } from '@/mocks/salones';

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

export function getProfesorDelAlumno(
  level: string,
  grade: string,
  group: string,
  branchName: string
): string {
  const normGrade = normalizeGrade(grade);

  // 1. Buscar salón regular exacto
  const salonRegular = salonesData.find(
    (s) =>
      s.tipo === 'Regular' &&
      s.nivel === level &&
      normalizeGrade(s.grado) === normGrade &&
      s.grupo === group &&
      s.sucursal === branchName
  );

  if (salonRegular && salonRegular.profesorAsignado && salonRegular.profesorAsignado !== 'Sin asignar') {
    return salonRegular.profesorAsignado;
  }

  // 2. Buscar en gruposAsignados de salones especiales
  for (const salon of salonesData) {
    if (!salon.gruposAsignados || salon.gruposAsignados.length === 0) continue;
    const match = salon.gruposAsignados.find(
      (g) =>
        g.nivel === level &&
        normalizeGrade(g.grado) === normGrade &&
        g.grupo === group
    );
    if (match && match.profesor && match.profesor !== 'Sin asignar') {
      return match.profesor;
    }
  }

  return 'Sin asignar';
}

export function getSalonDelAlumno(
  level: string,
  grade: string,
  group: string,
  branchName: string
): { nombre: string; profesor: string; tipo: string } | null {
  const normGrade = normalizeGrade(grade);

  // 1. Salón regular
  const salonRegular = salonesData.find(
    (s) =>
      s.tipo === 'Regular' &&
      s.nivel === level &&
      normalizeGrade(s.grado) === normGrade &&
      s.grupo === group &&
      s.sucursal === branchName
  );

  if (salonRegular) {
    return {
      nombre: salonRegular.nombre,
      profesor: salonRegular.profesorAsignado || 'Sin asignar',
      tipo: salonRegular.tipo,
    };
  }

  // 2. Grupo asignado en salón especial
  for (const salon of salonesData) {
    if (!salon.gruposAsignados || salon.gruposAsignados.length === 0) continue;
    const match = salon.gruposAsignados.find(
      (g) =>
        g.nivel === level &&
        normalizeGrade(g.grado) === normGrade &&
        g.grupo === group
    );
    if (match) {
      return {
        nombre: salon.nombre,
        profesor: match.profesor || 'Sin asignar',
        tipo: salon.tipo,
      };
    }
  }

  return null;
}