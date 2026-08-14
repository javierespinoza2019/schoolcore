export const kpiData = [
  { id: 'total-alumnos', label: 'Total Alumnos', value: '3', sub: 'Todos activos', trend: 'neutral', icon: 'ri-user-star-line', color: 'primary' },
  { id: 'ingresos-mes', label: 'Ingresos del Mes', value: '$8,325', sub: 'Julio 2026', trend: 'neutral', icon: 'ri-money-dollar-circle-line', color: 'success' },
  { id: 'colegiaturas-pendientes', label: 'Colegiaturas Pendientes', value: '$9,000', sub: '1 alumno · 2 meses', trend: 'up', icon: 'ri-error-warning-line', color: 'warning' },
  { id: 'tasa-cobranza', label: 'Tasa de Cobranza', value: '67%', sub: '2 de 3 al corriente', trend: 'down', icon: 'ri-pie-chart-line', color: 'accent' },
];

export const revenueData = [
  { month: 'Ene', ingresos: 7600, egresos: 4200, meta: 8000 },
  { month: 'Feb', ingresos: 8300, egresos: 4500, meta: 8000 },
  { month: 'Mar', ingresos: 7600, egresos: 4300, meta: 8000 },
  { month: 'Abr', ingresos: 9000, egresos: 4800, meta: 9000 },
  { month: 'May', ingresos: 8300, egresos: 4600, meta: 9000 },
  { month: 'Jun', ingresos: 8325, egresos: 4500, meta: 9000 },
  { month: 'Jul', ingresos: 8325, egresos: 4500, meta: 9000 },
];

export const recentActivity = [
  { id: 1, type: 'payment', text: 'Pago de colegiatura recibido', user: 'Sofía Torres Hernández', amount: '$3,825', time: 'Hace 2 días', icon: 'ri-money-dollar-circle-line', color: 'emerald' },
  { id: 2, type: 'alert', text: 'Colegiatura vencida Julio', user: 'Diego López García', amount: '$4,500', time: 'Ayer', icon: 'ri-error-warning-line', color: 'amber' },
  { id: 3, type: 'payment', text: 'Pago de colegiatura recibido', user: 'Carlos Ruiz Mendoza', amount: '$4,500', time: 'Hace 2 días', icon: 'ri-money-dollar-circle-line', color: 'emerald' },
  { id: 4, type: 'alert', text: 'Colegiatura vencida Junio', user: 'Diego López García', amount: '$4,500', time: 'Hace 30 días', icon: 'ri-error-warning-line', color: 'amber' },
  { id: 5, type: 'document', text: 'Documento verificado', user: 'Carlos Ruiz Mendoza', amount: '', time: 'Hace 3 días', icon: 'ri-file-check-line', color: 'accent' },
  { id: 6, type: 'system', text: 'Respaldo automático completado', user: 'Sistema', amount: '', time: 'Hace 6 horas', icon: 'ri-database-2-line', color: 'secondary' },
  { id: 7, type: 'enrollment', text: 'Reinscripción procesada', user: 'Sofía Torres Hernández', amount: '', time: 'Julio', icon: 'ri-refresh-line', color: 'primary' },
  { id: 8, type: 'payment', text: 'Pago de libros registrado', user: 'Carlos Ruiz Mendoza', amount: '$2,200', time: 'Junio', icon: 'ri-book-open-line', color: 'emerald' },
];

export const upcomingEvents = [
  { id: 1, date: '2026-08-05', title: 'Entrega de Boletas 6to A', time: '10:00 - 14:00', type: 'event' },
  { id: 2, date: '2026-08-10', title: 'Consejo Técnico Escolar', time: '08:30 - 13:00', type: 'meeting' },
  { id: 3, date: '2026-08-15', title: 'Vencimiento: Colegiaturas Agosto', time: 'Todo el día', type: 'deadline' },
  { id: 4, date: '2026-08-20', title: 'Junta de Padres de Familia', time: '17:00 - 19:00', type: 'meeting' },
  { id: 5, date: '2026-08-25', title: 'Festival del Día del Niño', time: '09:00 - 13:00', type: 'event' },
];

export const paymentDistribution = [
  { name: 'Al corriente', value: 2, color: '#10b981' },
  { name: '1-15 días', value: 0, color: '#f59e0b' },
  { name: '16-30 días', value: 0, color: '#f97316' },
  { name: '+30 días', value: 1, color: '#ef4444' },
];