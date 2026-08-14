export interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  occupation: string;
  address: string;
  status: 'active' | 'inactive';
  childrenCount: number;
  childrenIds: string[];
  childrenNames: string[];
  createdAt: string;
}

export const parents: Parent[] = [
  { id: 'PAR-001', firstName: 'Roberto', lastName: 'Ruiz Gómez', fullName: 'Roberto Ruiz Gómez', email: 'roberto.ruiz@email.com', phone: '+52 55 1111 2222', occupation: 'Ingeniero Civil', address: 'Av. Reforma 234, Col. Juárez, CDMX', status: 'active', childrenCount: 1, childrenIds: ['STU-2024-0001'], childrenNames: ['Carlos Ruiz Mendoza'], createdAt: '2024-01-10' },
  { id: 'PAR-002', firstName: 'María', lastName: 'Mendoza López', fullName: 'María Mendoza López', email: 'maria.mendoza@email.com', phone: '+52 55 1111 3333', occupation: 'Contadora', address: 'Av. Reforma 234, Col. Juárez, CDMX', status: 'active', childrenCount: 1, childrenIds: ['STU-2024-0001'], childrenNames: ['Carlos Ruiz Mendoza'], createdAt: '2024-01-10' },
  { id: 'PAR-003', firstName: 'Fernando', lastName: 'Torres Díaz', fullName: 'Fernando Torres Díaz', email: 'fernando.torres@email.com', phone: '+52 55 2222 1111', occupation: 'Abogado', address: 'Calle Hidalgo 89, Coyoacán, CDMX', status: 'active', childrenCount: 1, childrenIds: ['STU-2024-0002'], childrenNames: ['Sofía Torres Hernández'], createdAt: '2024-01-12' },
  { id: 'PAR-004', firstName: 'Laura', lastName: 'Hernández Vela', fullName: 'Laura Hernández Vela', email: 'laura.hernandez@email.com', phone: '+52 55 2222 2222', occupation: 'Médico Pediatra', address: 'Calle Hidalgo 89, Coyoacán, CDMX', status: 'active', childrenCount: 1, childrenIds: ['STU-2024-0002'], childrenNames: ['Sofía Torres Hernández'], createdAt: '2024-01-12' },
  { id: 'PAR-005', firstName: 'José', lastName: 'López Ramírez', fullName: 'José López Ramírez', email: 'jose.lopez@email.com', phone: '+52 55 3333 1111', occupation: 'Empresario', address: 'Av. Universidad 456, Benito Juárez, CDMX', status: 'active', childrenCount: 1, childrenIds: ['STU-2024-0003'], childrenNames: ['Diego López García'], createdAt: '2024-01-08' },
  { id: 'PAR-006', firstName: 'Ana', lastName: 'García Morales', fullName: 'Ana García Morales', email: 'ana.garcia@email.com', phone: '+52 55 3333 2222', occupation: 'Ama de casa', address: 'Av. Universidad 456, Benito Juárez, CDMX', status: 'active', childrenCount: 1, childrenIds: ['STU-2024-0003'], childrenNames: ['Diego López García'], createdAt: '2024-01-08' },
];