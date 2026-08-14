export interface Sucursal {
  /** GUID from API (string). Mocks may use numeric ids. */
  id: string | number;
  /** Unique branch code required by the API (not shown in the demo form). */
  code?: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  telefono: string;
  email: string;
  director: string;
  directorEmail: string;
  directorTelefono: string;
  capacidadTotal: number;
  alumnosInscritos: number;
  profesoresActivos: number;
  salones: number;
  niveles: string[];
  estadoOperativo: 'Operando' | 'Mantenimiento' | 'Próxima Apertura';
  fechaApertura: string;
  superficie: string;
  lat: number;
  lng: number;
  instalaciones: string[];
  fotoUrl: string;
  /** null = hereda zona del tenant. */
  timeZoneId?: string | null;
}

export const sucursalesData: Sucursal[] = [
  {
    id: 1,
    nombre: 'Campus Norte',
    direccion: 'Av. Insurgentes Norte 1542, Col. Lindavista',
    ciudad: 'Ciudad de México',
    estado: 'CDMX',
    codigoPostal: '07300',
    telefono: '55-5890-1234',
    email: 'campusnorte@SchoolCore.edu.mx',
    director: 'Dr. Ricardo Álvarez Peña',
    directorEmail: 'ricardo.alvarez@SchoolCore.edu.mx',
    directorTelefono: '55-5890-1201',
    capacidadTotal: 850,
    alumnosInscritos: 782,
    profesoresActivos: 38,
    salones: 18,
    niveles: ['Secundaria', 'Preparatoria'],
    estadoOperativo: 'Operando',
    fechaApertura: '2005-08-15',
    superficie: '12,500 m²',
    lat: 19.4925,
    lng: -99.1257,
    instalaciones: ['Biblioteca', 'Laboratorios de Cómputo', 'Laboratorio de Ciencias', 'Auditorio', 'Cancha Deportiva', 'Cafetería', 'Enfermería', 'Estacionamiento'],
    fotoUrl: 'https://readdy.ai/api/search-image?query=Modern%20school%20campus%20building%20with%20glass%20facade%20and%20green%20gardens%2C%20mexican%20educational%20architecture%2C%20clean%20white%20and%20gray%20exterior%2C%20bright%20sunny%20day%2C%20wide%20angle%20architectural%20photography%2C%20professional%20real%20estate%20style&width=800&height=500&seq=suc-01&orientation=landscape',
  },
  {
    id: 2,
    nombre: 'Campus Sur',
    direccion: 'Calz. de Tlalpan 3890, Col. Santa Úrsula Coapa',
    ciudad: 'Ciudad de México',
    estado: 'CDMX',
    codigoPostal: '04650',
    telefono: '55-5890-5678',
    email: 'campussur@SchoolCore.edu.mx',
    director: 'Mtra. Adriana Fuentes Mora',
    directorEmail: 'adriana.fuentes@SchoolCore.edu.mx',
    directorTelefono: '55-5890-5601',
    capacidadTotal: 720,
    alumnosInscritos: 645,
    profesoresActivos: 31,
    salones: 15,
    niveles: ['Secundaria', 'Preparatoria'],
    estadoOperativo: 'Operando',
    fechaApertura: '2012-08-20',
    superficie: '10,200 m²',
    lat: 19.3038,
    lng: -99.1407,
    instalaciones: ['Biblioteca Digital', 'Lab de Idiomas', 'Gimnasio', 'Cancha Multiusos', 'Cafetería', 'Enfermería', 'Sala de Arte', 'Estacionamiento'],
    fotoUrl: 'https://readdy.ai/api/search-image?query=Contemporary%20school%20building%20with%20modern%20architecture%2C%20large%20windows%2C%20south%20Mexico%20City%2C%20landscaped%20courtyard%2C%20clean%20minimalist%20design%2C%20warm%20sunlight%2C%20professional%20architectural%20photography&width=800&height=500&seq=suc-02&orientation=landscape',
  },
  {
    id: 3,
    nombre: 'Campus Oriente',
    direccion: 'Av. Zaragoza 892, Col. Iztapalapa Centro',
    ciudad: 'Ciudad de México',
    estado: 'CDMX',
    codigoPostal: '09230',
    telefono: '55-5890-9012',
    email: 'campusoriente@SchoolCore.edu.mx',
    director: 'Ing. Luis Roberto Torres',
    directorEmail: 'luis.torres@SchoolCore.edu.mx',
    directorTelefono: '55-5890-9001',
    capacidadTotal: 500,
    alumnosInscritos: 0,
    profesoresActivos: 0,
    salones: 12,
    niveles: ['Secundaria', 'Preparatoria'],
    estadoOperativo: 'Próxima Apertura',
    fechaApertura: '2026-09-01',
    superficie: '8,500 m²',
    lat: 19.3639,
    lng: -99.0754,
    instalaciones: ['Biblioteca', 'Laboratorios', 'Auditorio', 'Cancha Deportiva', 'Cafetería', 'Enfermería'],
    fotoUrl: 'https://readdy.ai/api/search-image?query=Brand%20new%20modern%20school%20building%20under%20construction%20finishing%20phase%2C%20glass%20and%20white%20facade%2C%20east%20Mexico%20City%2C%20clean%20modern%20architecture%2C%20fresh%20landscaping%2C%20bright%20optimistic%20atmosphere%2C%20architectural%20photography&width=800&height=500&seq=suc-03&orientation=landscape',
  },
  {
    id: 4,
    nombre: 'Campus Poniente',
    direccion: 'Av. Constituyentes 1250, Col. Lomas de Chapultepec',
    ciudad: 'Ciudad de México',
    estado: 'CDMX',
    codigoPostal: '11000',
    telefono: '55-5890-3456',
    email: 'campusponiente@SchoolCore.edu.mx',
    director: 'Mtro. Enrique Díaz Salazar',
    directorEmail: 'enrique.diaz@SchoolCore.edu.mx',
    directorTelefono: '55-5890-3401',
    capacidadTotal: 650,
    alumnosInscritos: 598,
    profesoresActivos: 29,
    salones: 14,
    niveles: ['Secundaria', 'Preparatoria'],
    estadoOperativo: 'Operando',
    fechaApertura: '2015-08-10',
    superficie: '11,000 m²',
    lat: 19.4201,
    lng: -99.2167,
    instalaciones: ['Biblioteca', 'Laboratorios STEAM', 'Sala de Música', 'Cancha Techada', 'Cafetería Gourmet', 'Enfermería', 'Área Verde', 'Estacionamiento'],
    fotoUrl: 'https://readdy.ai/api/search-image?query=Modern%20school%20campus%20in%20upscale%20Mexico%20City%20neighborhood%2C%20contemporary%20glass%20architecture%2C%20green%20surroundings%2C%20clean%20white%20buildings%2C%20professional%20architectural%20photography%2C%20sunny%20day%20with%20blue%20sky&width=800&height=500&seq=suc-04&orientation=landscape',
  },
  {
    id: 5,
    nombre: 'Campus Extensión Toluca',
    direccion: 'Paseo Tollocan 720, Col. Universidad',
    ciudad: 'Toluca',
    estado: 'Estado de México',
    codigoPostal: '50130',
    telefono: '722-890-1234',
    email: 'campustoluca@SchoolCore.edu.mx',
    director: 'Dr. Miguel Ángel Saucedo',
    directorEmail: 'miguel.saucedo@SchoolCore.edu.mx',
    directorTelefono: '722-890-1201',
    capacidadTotal: 400,
    alumnosInscritos: 312,
    profesoresActivos: 18,
    salones: 10,
    niveles: ['Secundaria'],
    estadoOperativo: 'Operando',
    fechaApertura: '2019-08-15',
    superficie: '7,200 m²',
    lat: 19.2826,
    lng: -99.6557,
    instalaciones: ['Biblioteca', 'Laboratorio de Cómputo', 'Cancha', 'Cafetería', 'Enfermería', 'Estacionamiento'],
    fotoUrl: 'https://readdy.ai/api/search-image?query=Modern%20educational%20building%20in%20Toluca%20Mexico%2C%20contemporary%20architecture%20with%20clean%20lines%2C%20mountain%20backdrop%2C%20sunny%20day%2C%20professional%20architectural%20photography%2C%20wide%20angle&width=800&height=500&seq=suc-05&orientation=landscape',
  },
];