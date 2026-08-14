export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
}

export interface Sugerencia {
  id: string;
  icono: string;
  texto: string;
  query: string;
}

export interface Conversacion {
  id: string;
  titulo: string;
  fecha: string;
  preview: string;
}

export const conversaciones: Conversacion[] = [
  { id: 'conv-1', titulo: 'Reporte de morosidad por nivel', fecha: 'Hoy, 10:23 AM', preview: 'Los alumnos de Primaria concentran el 34.5% de la morosidad total...' },
  { id: 'conv-2', titulo: 'Análisis de ingresos julio 2026', fecha: 'Ayer, 3:45 PM', preview: 'Los ingresos de julio superaron en 4% la meta establecida...' },
  { id: 'conv-3', titulo: 'Alumnos con pagos vencidos', fecha: '28 jul, 9:15 AM', preview: 'Actualmente hay 187 alumnos con algún pago vencido...' },
  { id: 'conv-4', titulo: 'Comparativa interanual matrícula', fecha: '25 jul, 11:30 AM', preview: 'La matrícula creció 7.8% respecto al ciclo anterior...' },
  { id: 'conv-5', titulo: 'Profesores mejor evaluados', fecha: '22 jul, 2:00 PM', preview: 'Los 5 profesores con mejor evaluación son del Campus Norte...' },
  { id: 'conv-6', titulo: 'Proyección de ingresos Q4', fecha: '18 jul, 4:20 PM', preview: 'Se proyecta un incremento del 12% en colegiaturas para el Q4...' },
];

export const sugerenciasRapidas: Sugerencia[] = [
  { id: 'sug-1', icono: 'ri-error-warning-line', texto: '¿Qué alumnos tienen pagos vencidos este mes?', query: 'muéstrame los alumnos con pagos vencidos este mes y agrúpalos por nivel educativo' },
  { id: 'sug-2', icono: 'ri-bar-chart-line', texto: '¿Cuánto se recaudó en julio vs la meta?', query: 'compara los ingresos de julio 2026 contra la meta y el mes anterior' },
  { id: 'sug-3', icono: 'ri-user-add-line', texto: '¿Cuántos alumnos nuevos se inscribieron este ciclo?', query: 'muéstrame el total de nuevas inscripciones por sucursal y nivel en este ciclo' },
  { id: 'sug-4', icono: 'ri-money-dollar-circle-line', texto: '¿Cuál es la tasa de morosidad actual por sucursal?', query: 'calcula la tasa de morosidad por sucursal y compárala con el mes anterior' },
  { id: 'sug-5', icono: 'ri-user-voice-line', texto: '¿Qué profesores tienen la mejor evaluación?', query: 'muéstrame el ranking de los 10 profesores mejor evaluados con su promedio de estrellas' },
  { id: 'sug-6', icono: 'ri-building-2-line', texto: '¿Cuál es la ocupación de salones por sucursal?', query: 'muéstrame el porcentaje de ocupación de salones por sucursal y nivel' },
];

export const conversacionInicial: ChatMessage[] = [
  {
    id: 'msg-0',
    role: 'assistant',
    text: '¡Hola María! Soy el asistente inteligente de SchoolCore. Tengo acceso a todos los datos de tu institución en tiempo real. Puedo ayudarte con:\n\n• **Consultas financieras** — ingresos, egresos, morosidad, proyecciones\n• **Análisis de alumnos** — matrícula, retención, desempeño\n• **Operaciones** — ocupación de salones, horarios, profesores\n• **Reportes rápidos** — comparativas, rankings, tendencias\n\n¿En qué te puedo ayudar hoy?',
    time: '10:15 AM',
  },
];

export const respuestasIA: Record<string, string> = {
  'pagos-vencidos': 'He analizado la base de datos y encontré **187 alumnos con pagos vencidos** este mes, por un monto total de **$324,500 MXN**. El desglose por nivel es:\n\n| Nivel | Alumnos | Monto |\n|-------|---------|-------|\n| Preescolar | 18 | $28,000 |\n| Primaria | 67 | $112,000 |\n| Secundaria | 52 | $96,500 |\n| Preparatoria | 34 | $68,000 |\n| Universidad | 16 | $20,000 |\n\n**Primaria concentra el 34.5% de la morosidad total.** Recomiendo enviar recordatorios de pago a los padres de este nivel prioritariamente. ¿Quieres que genere la lista detallada para envío masivo?',
  'ingresos-julio': 'Los ingresos de **Julio 2026** fueron de **$520,000 MXN**, superando en **4% la meta** de $500,000 y representando un incremento del **10.6% respecto a junio** ($470,000).\n\nLos egresos fueron de $280,000, resultando en un **superávit de $240,000**.\n\nEl desglose de ingresos:\n• Colegiaturas: $312,000 (60%)\n• Inscripciones: $85,000 (16.3%)\n• Uniformes: $38,000 (7.3%)\n• Libros: $35,000 (6.7%)\n• Comedor/Talleres/Transporte: $50,000 (9.6%)\n\nJulio es históricamente el mes de mayor recaudación por el inicio del ciclo escolar.',
  'nuevas-inscripciones': 'En el ciclo actual se han registrado **187 nuevas inscripciones**, un incremento del **12.6%** respecto al ciclo anterior (166).\n\nDistribución por sucursal:\n• Campus Norte: 52 nuevos\n• Campus Sur: 68 nuevos 🏆\n• Campus Oriente: 35 nuevos\n• Campus Poniente: 24 nuevos\n• Extensión Toluca: 8 nuevos\n\nPor nivel:\n• Preescolar: 42\n• Primaria: 78 🏆\n• Secundaria: 38\n• Preparatoria: 24\n• Universidad: 5\n\n**El Campus Sur y Primaria lideran en captación.**',
  'default': 'Excelente pregunta. Déjame analizar los datos...\n\nBasado en la información actual del sistema, puedo confirmarte que los indicadores generales son positivos. Los ingresos acumulados del año ascienden a **$4,825,000 MXN**, con una tasa de morosidad controlada del **6.7%** y una retención promedio del **91%** en todos los niveles.\n\n¿Hay algo más específico que quieras analizar? Puedo ayudarte con reportes detallados, comparativas o proyecciones.',
};