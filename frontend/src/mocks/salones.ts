export interface SalonGrupo {
  grupo: string;
  grado: string;
  nivel: string;
  horario: string;
  profesor?: string;
  ocupados?: number;
}

export interface Salon {
  id: string;
  branchId?: string;
  educationLevelId?: string;
  teacherId?: string;
  nombre: string;
  nivel: string;
  grado: string;
  grupo: string;
  capacidad: number;
  ocupados: number;
  sucursal: string;
  estado: 'Disponible' | 'Lleno' | 'Mantenimiento';
  tipo: 'Regular' | 'Laboratorio' | 'Taller' | 'Auditorio' | 'Deportivo';
  edificio: string;
  piso: number;
  equipamiento: string[];
  profesorAsignado: string;
  horarioClase: string;
  gruposAsignados?: SalonGrupo[];
}

export const salonesData: Salon[] = [
  {
    id: '1',
    nombre: 'A-101',
    nivel: 'Preparatoria',
    grado: '6to',
    grupo: 'A',
    capacidad: 35,
    ocupados: 2,
    sucursal: 'Campus Norte',
    estado: 'Disponible',
    tipo: 'Regular',
    edificio: 'Edificio A',
    piso: 1,
    equipamiento: ['Proyector', 'Pizarrón Inteligente', 'Aire Acondicionado'],
    profesorAsignado: 'María Elena Rodríguez',
    horarioClase: '7:00 - 14:00',
    gruposAsignados: [
      { grupo: 'A', grado: '6to', nivel: 'Preparatoria', horario: '7:00 - 14:00', profesor: 'María Elena Rodríguez', ocupados: 2 },
    ],
  },
  {
    id: '2',
    nombre: 'A-102',
    nivel: 'Preparatoria',
    grado: '5to',
    grupo: 'A',
    capacidad: 35,
    ocupados: 1,
    sucursal: 'Campus Norte',
    estado: 'Disponible',
    tipo: 'Regular',
    edificio: 'Edificio A',
    piso: 1,
    equipamiento: ['Proyector', 'Pizarrón Inteligente'],
    profesorAsignado: 'María Elena Rodríguez',
    horarioClase: '7:00 - 14:00',
    gruposAsignados: [
      { grupo: 'A', grado: '5to', nivel: 'Preparatoria', horario: '7:00 - 14:00', profesor: 'María Elena Rodríguez', ocupados: 1 },
    ],
  },
  {
    id: '3',
    nombre: 'A-103',
    nivel: 'Preparatoria',
    grado: '4to',
    grupo: 'A',
    capacidad: 35,
    ocupados: 0,
    sucursal: 'Campus Norte',
    estado: 'Disponible',
    tipo: 'Regular',
    edificio: 'Edificio A',
    piso: 1,
    equipamiento: ['Proyector', 'Pizarrón Inteligente', 'Aire Acondicionado'],
    profesorAsignado: 'María Elena Rodríguez',
    horarioClase: '7:00 - 14:00',
    gruposAsignados: [
      { grupo: 'A', grado: '4to', nivel: 'Preparatoria', horario: '7:00 - 14:00', profesor: 'María Elena Rodríguez', ocupados: 0 },
    ],
  },
];