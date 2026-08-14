export interface Profesor {
  /** GUID from API (string). Mocks may use numeric ids. */
  id: string | number;
  branchId?: string;
  educationLevelId?: string;
  firstName?: string;
  lastName?: string;
  nombre: string;
  email: string;
  telefono: string;
  especialidad: string;
  materias: string[];
  tipoPago: string;
  salarioMensual: number;
  sucursal: string;
  nivel: string;
  estado: string;
  fechaIngreso: string;
  horario: string;
  salones: string[];
  fotoUrl: string;
  certificaciones: string[];
  evaluacion: number;
}

export const profesoresData: Profesor[] = [
  {
    id: 1,
    nombre: 'María Elena Rodríguez',
    email: 'maria.rodriguez@SchoolCore.edu.mx',
    telefono: '55-4321-8765',
    especialidad: 'Matemáticas',
    materias: ['Álgebra', 'Cálculo Diferencial', 'Trigonometría'],
    tipoPago: 'Nómina',
    salarioMensual: 28500,
    sucursal: 'Campus Norte',
    nivel: 'Preparatoria',
    estado: 'Activo',
    fechaIngreso: '2018-08-15',
    horario: 'Lunes a Viernes 7:00 - 14:00',
    salones: ['A-101', 'A-102', 'A-103'],
    fotoUrl: 'https://readdy.ai/api/search-image?query=Professional%20headshot%20of%20a%20mexican%20female%20teacher%20in%20her%2040s%20with%20warm%20smile%2C%20wearing%20smart%20casual%20attire%2C%20neutral%20cream%20background%2C%20soft%20natural%20window%20lighting%2C%20clean%20editorial%20portrait%20style%2C%20friendly%20and%20approachable%20expression&width=200&height=200&seq=prof-01&orientation=squarish',
    certificaciones: ['Maestría en Educación', 'Certificación SEP'],
    evaluacion: 4.8,
  },
  {
    id: 2,
    nombre: 'Carlos Alberto Mendoza',
    email: 'carlos.mendoza@SchoolCore.edu.mx',
    telefono: '55-2345-6789',
    especialidad: 'Ciencias Naturales',
    materias: ['Biología', 'Química', 'Física'],
    tipoPago: 'Nómina',
    salarioMensual: 31200,
    sucursal: 'Campus Norte',
    nivel: 'Secundaria',
    estado: 'Activo',
    fechaIngreso: '2016-03-01',
    horario: 'Lunes a Viernes 7:00 - 14:00',
    salones: ['A-103'],
    fotoUrl: 'https://readdy.ai/api/search-image?query=Professional%20headshot%20of%20a%20mexican%20male%20science%20teacher%20in%20his%2030s%2C%20wearing%20glasses%20and%20a%20blue%20button%20shirt%2C%20confident%20expression%2C%20neutral%20light%20gray%20background%2C%20soft%20studio%20lighting%2C%20clean%20editorial%20portrait%20style&width=200&height=200&seq=prof-02&orientation=squarish',
    certificaciones: ['Doctorado en Ciencias', 'Investigador SNI Nivel 1'],
    evaluacion: 4.6,
  },
];