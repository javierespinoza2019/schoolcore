export interface StudentPayment {
  id: string;
  concept: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
  method?: string;
  receipt?: string;
}

export interface StudentDocument {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  status: 'verified' | 'pending' | 'rejected';
}

export interface StudentTimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  badge?: string;
  badgeVariant?: string;
}

export interface StudentParent {
  id: string;
  name: string;
  relationship: string;
  email: string;
  phone: string;
  occupation: string;
}

export interface Student {
  id: string;
  enrollment: string;
  firstName: string;
  lastName: string;
  fullName: string;
  photo: string;
  gender: 'M' | 'F';
  birthDate: string;
  age: number;
  email: string;
  phone: string;
  address: string;
  level: string;
  grade: string;
  group: string;
  status: 'active' | 'inactive' | 'graduated' | 'suspended' | 'pending';
  enrollmentDate: string;
  branchId: string;
  branchName: string;
  schoolCycleId?: string;
  classroomId?: string;
  educationLevelId?: string;
  bloodType: string;
  allergies: string[];
  medicalNotes: string;
  parents: StudentParent[];
  payments: StudentPayment[];
  documents: StudentDocument[];
  timeline: StudentTimelineEvent[];
  balance: number;
  lastPayment: string;
  scholarship: number;
}

export const studentLevels = ['Preescolar', 'Primaria', 'Secundaria', 'Preparatoria'];
export const studentStatuses = ['active', 'inactive', 'graduated', 'suspended', 'pending'] as const;
export const studentBranches = ['Campus Norte', 'Campus Sur', 'Campus Centro', 'Campus Oriente'];

export const students: Student[] = [
  {
    id: 'STU-2024-0001',
    enrollment: 'ENR-2024-0001',
    firstName: 'Carlos',
    lastName: 'Ruiz Mendoza',
    fullName: 'Carlos Ruiz Mendoza',
    photo: 'https://readdy.ai/api/search-image?query=Professional%20student%20portrait%20photo%20of%20a%20young%20Hispanic%20teenage%20boy%20with%20dark%20hair%20and%20friendly%20smile%2C%20clean%20white%20background%2C%20school%20uniform%20white%20shirt%2C%20soft%20natural%20lighting%2C%20editorial%20style%2C%20headshot&width=200&height=200&seq=student-carlos-ruiz&orientation=squarish',
    gender: 'M',
    birthDate: '2008-03-15',
    age: 18,
    email: 'carlos.ruiz@email.com',
    phone: '+52 55 1234 5678',
    address: 'Av. Reforma 234, Col. Juárez, CDMX',
    level: 'Preparatoria',
    grade: '6to',
    group: 'A',
    status: 'active',
    enrollmentDate: '2024-01-10',
    branchId: 'BR-001',
    branchName: 'Campus Norte',
    bloodType: 'O+',
    allergies: ['Penicilina'],
    medicalNotes: 'Usa lentes. Asma leve controlada con inhalador.',
    parents: [
      { id: 'PAR-001', name: 'Roberto Ruiz Gómez', relationship: 'Padre', email: 'roberto.ruiz@email.com', phone: '+52 55 1111 2222', occupation: 'Ingeniero Civil' },
      { id: 'PAR-002', name: 'María Mendoza López', relationship: 'Madre', email: 'maria.mendoza@email.com', phone: '+52 55 1111 3333', occupation: 'Contadora' },
    ],
    payments: [
      { id: 'PAY-001', concept: 'Colegiatura Julio 2026', amount: 4500, date: '2026-07-01', status: 'paid', method: 'Transferencia', receipt: 'REC-071' },
      { id: 'PAY-002', concept: 'Colegiatura Junio 2026', amount: 4500, date: '2026-06-01', status: 'paid', method: 'Tarjeta', receipt: 'REC-065' },
      { id: 'PAY-003', concept: 'Colegiatura Mayo 2026', amount: 4500, date: '2026-05-01', status: 'paid', method: 'Efectivo', receipt: 'REC-058' },
      { id: 'PAY-004', concept: 'Inscripción 2026', amount: 3800, date: '2026-01-10', status: 'paid', method: 'Transferencia', receipt: 'REC-001' },
      { id: 'PAY-005', concept: 'Libros Semestre 2026-B', amount: 2200, date: '2026-01-15', status: 'paid', method: 'Tarjeta', receipt: 'REC-002' },
    ],
    documents: [
      { id: 'DOC-001', name: 'Acta de Nacimiento', type: 'PDF', uploadDate: '2024-01-10', status: 'verified' },
      { id: 'DOC-002', name: 'Certificado Médico', type: 'PDF', uploadDate: '2024-01-10', status: 'verified' },
      { id: 'DOC-003', name: 'Comprobante Domicilio', type: 'PDF', uploadDate: '2024-01-10', status: 'verified' },
      { id: 'DOC-004', name: 'Boleta Semestre Anterior', type: 'PDF', uploadDate: '2026-06-30', status: 'verified' },
      { id: 'DOC-005', name: 'Carta de Buena Conducta', type: 'PDF', uploadDate: '2026-06-30', status: 'pending' },
    ],
    timeline: [
      { id: 'TL-001', date: '2026-07-01 10:30', title: 'Pago de colegiatura registrado', description: 'Se registró pago de Julio 2026 por $4,500 MXN vía transferencia', icon: 'ri-money-dollar-circle-line', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', badge: 'Pago' },
      { id: 'TL-002', date: '2026-06-15 14:20', title: 'Boleta entregada', description: 'Se subió la boleta del semestre anterior al expediente', icon: 'ri-file-upload-line', iconBg: 'bg-primary-100', iconColor: 'text-primary-600', badge: 'Documento' },
      { id: 'TL-003', date: '2026-05-01 09:00', title: 'Inicio de semestre', description: 'Inició el semestre 2026-B en el grupo 6to A', icon: 'ri-calendar-check-line', iconBg: 'bg-accent-100', iconColor: 'text-accent-600' },
      { id: 'TL-004', date: '2026-01-10 11:00', title: 'Inscripción completada', description: 'Se completó el proceso de inscripción para el ciclo 2026', icon: 'ri-user-add-line', iconBg: 'bg-primary-100', iconColor: 'text-primary-600', badge: 'Inscripción' },
    ],
    balance: 0,
    lastPayment: '2026-07-01',
    scholarship: 0,
  },
  {
    id: 'STU-2024-0002',
    enrollment: 'ENR-2024-0002',
    firstName: 'Sofía',
    lastName: 'Torres Hernández',
    fullName: 'Sofía Torres Hernández',
    photo: 'https://readdy.ai/api/search-image?query=Professional%20student%20portrait%20photo%20of%20a%20young%20Hispanic%20teenage%20girl%20with%20long%20dark%20hair%20and%20warm%20smile%2C%20clean%20white%20background%2C%20school%20uniform%20white%20shirt%2C%20soft%20natural%20lighting%2C%20editorial%20style%2C%20headshot&width=200&height=200&seq=student-sofia-torres&orientation=squarish',
    gender: 'F',
    birthDate: '2009-07-22',
    age: 17,
    email: 'sofia.torres@email.com',
    phone: '+52 55 2345 6789',
    address: 'Calle Hidalgo 89, Coyoacán, CDMX',
    level: 'Preparatoria',
    grade: '5to',
    group: 'A',
    status: 'active',
    enrollmentDate: '2024-01-12',
    branchId: 'BR-001',
    branchName: 'Campus Norte',
    bloodType: 'A+',
    allergies: [],
    medicalNotes: 'Ninguna.',
    parents: [
      { id: 'PAR-003', name: 'Fernando Torres Díaz', relationship: 'Padre', email: 'fernando.torres@email.com', phone: '+52 55 2222 1111', occupation: 'Abogado' },
      { id: 'PAR-004', name: 'Laura Hernández Vela', relationship: 'Madre', email: 'laura.hernandez@email.com', phone: '+52 55 2222 2222', occupation: 'Médico Pediatra' },
    ],
    payments: [
      { id: 'PAY-006', concept: 'Colegiatura Julio 2026', amount: 3825, date: '2026-07-03', status: 'paid', method: 'Tarjeta', receipt: 'REC-072' },
      { id: 'PAY-007', concept: 'Colegiatura Junio 2026', amount: 3825, date: '2026-06-02', status: 'paid', method: 'Tarjeta', receipt: 'REC-066' },
      { id: 'PAY-008', concept: 'Inscripción 2026', amount: 3230, date: '2026-01-12', status: 'paid', method: 'Transferencia', receipt: 'REC-003' },
    ],
    documents: [
      { id: 'DOC-006', name: 'Acta de Nacimiento', type: 'PDF', uploadDate: '2024-01-12', status: 'verified' },
      { id: 'DOC-007', name: 'Certificado Médico', type: 'PDF', uploadDate: '2024-01-12', status: 'verified' },
      { id: 'DOC-008', name: 'Comprobante Domicilio', type: 'PDF', uploadDate: '2024-01-12', status: 'verified' },
    ],
    timeline: [
      { id: 'TL-005', date: '2026-07-03 09:15', title: 'Pago de colegiatura registrado', description: 'Se registró pago de Julio 2026 por $3,825 MXN vía tarjeta (beca 15%)', icon: 'ri-money-dollar-circle-line', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', badge: 'Pago' },
      { id: 'TL-006', date: '2026-01-12 10:30', title: 'Inscripción completada', description: 'Se completó el proceso de inscripción para el ciclo 2026', icon: 'ri-user-add-line', iconBg: 'bg-primary-100', iconColor: 'text-primary-600', badge: 'Inscripción' },
    ],
    balance: 0,
    lastPayment: '2026-07-03',
    scholarship: 15,
  },
  {
    id: 'STU-2024-0003',
    enrollment: 'ENR-2024-0003',
    firstName: 'Diego',
    lastName: 'López García',
    fullName: 'Diego López García',
    photo: 'https://readdy.ai/api/search-image?query=Professional%20student%20portrait%20photo%20of%20a%20young%20Hispanic%20teenage%20boy%20with%20short%20dark%20hair%20and%20confident%20expression%2C%20clean%20white%20background%2C%20school%20uniform%20white%20shirt%2C%20soft%20natural%20lighting%2C%20editorial%20style%2C%20headshot&width=200&height=200&seq=student-diego-lopez&orientation=squarish',
    gender: 'M',
    birthDate: '2008-11-08',
    age: 17,
    email: 'diego.lopez@email.com',
    phone: '+52 55 3456 7890',
    address: 'Av. Universidad 456, Benito Juárez, CDMX',
    level: 'Preparatoria',
    grade: '6to',
    group: 'A',
    status: 'active',
    enrollmentDate: '2024-01-08',
    branchId: 'BR-001',
    branchName: 'Campus Norte',
    bloodType: 'B+',
    allergies: ['Mariscos', 'Nueces'],
    medicalNotes: 'Alergia severa a mariscos. Lleva epipen en enfermería.',
    parents: [
      { id: 'PAR-005', name: 'José López Ramírez', relationship: 'Padre', email: 'jose.lopez@email.com', phone: '+52 55 3333 1111', occupation: 'Empresario' },
      { id: 'PAR-006', name: 'Ana García Morales', relationship: 'Madre', email: 'ana.garcia@email.com', phone: '+52 55 3333 2222', occupation: 'Ama de casa' },
    ],
    payments: [
      { id: 'PAY-009', concept: 'Colegiatura Julio 2026', amount: 4500, date: '2026-07-01', status: 'overdue', method: '', receipt: '' },
      { id: 'PAY-010', concept: 'Colegiatura Junio 2026', amount: 4500, date: '2026-06-01', status: 'overdue', method: '', receipt: '' },
      { id: 'PAY-011', concept: 'Colegiatura Mayo 2026', amount: 4500, date: '2026-05-05', status: 'paid', method: 'Efectivo', receipt: 'REC-059' },
      { id: 'PAY-012', concept: 'Inscripción 2026', amount: 3800, date: '2026-01-08', status: 'paid', method: 'Transferencia', receipt: 'REC-004' },
    ],
    documents: [
      { id: 'DOC-009', name: 'Acta de Nacimiento', type: 'PDF', uploadDate: '2024-01-08', status: 'verified' },
      { id: 'DOC-010', name: 'Certificado Médico', type: 'PDF', uploadDate: '2024-01-08', status: 'verified' },
      { id: 'DOC-011', name: 'Comprobante Domicilio', type: 'PDF', uploadDate: '2024-01-08', status: 'verified' },
    ],
    timeline: [
      { id: 'TL-007', date: '2026-07-01 08:00', title: 'Colegiatura vencida', description: 'La colegiatura de Julio 2026 no ha sido cubierta. Se envió recordatorio.', icon: 'ri-error-warning-line', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', badge: 'Pendiente', badgeVariant: 'warning' },
      { id: 'TL-008', date: '2026-06-05 09:00', title: 'Recordatorio de pago enviado', description: 'Se envió correo a padres por colegiatura de Junio vencida', icon: 'ri-mail-send-line', iconBg: 'bg-secondary-100', iconColor: 'text-secondary-600' },
      { id: 'TL-009', date: '2026-01-08 11:30', title: 'Inscripción completada', description: 'Se completó el proceso de inscripción para el ciclo 2026', icon: 'ri-user-add-line', iconBg: 'bg-primary-100', iconColor: 'text-primary-600', badge: 'Inscripción' },
    ],
    balance: 9000,
    lastPayment: '2026-05-05',
    scholarship: 0,
  },
];

export const summaryStats = {
  total: students.length,
  active: students.filter((s) => s.status === 'active').length,
  pending: students.filter((s) => s.status === 'pending').length,
  inactive: students.filter((s) => s.status === 'inactive').length,
  graduated: students.filter((s) => s.status === 'graduated').length,
  suspended: students.filter((s) => s.status === 'suspended').length,
  withBalance: students.filter((s) => s.balance > 0).length,
  totalBalance: students.reduce((sum, s) => sum + s.balance, 0),
};