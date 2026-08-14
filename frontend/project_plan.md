# EduNexus - ERP Escolar SaaS

## 1. Descripción del Proyecto

EduNexus es un sistema ERP SaaS multi-tenant y multi-sucursal para administración escolar. Diseñado para instituciones educativas que necesitan gestionar alumnos, profesores, finanzas, inscripciones y operaciones diarias desde una plataforma unificada, moderna y escalable.

**Público objetivo:** Directivos, administradores y personal operativo de instituciones educativas (kinder, primaria, secundaria, preparatoria, universidad).

**Propuesta de valor:** Una experiencia de usuario premium, comparable a Stripe/Linear/Notion, que reduce la fatiga operativa y centraliza toda la gestión escolar en un solo lugar, con inteligencia artificial integrada para insights y automatización.

## 2. Estructura de Páginas

```
/                          → Dashboard Ejecutivo
/dashboard                 → Dashboard Ejecutivo (KPIs, gráficos, actividad)
/alumnos                   → Listado inteligente de alumnos
/alumnos/:id               → Expediente completo del alumno (vista CRM)
/padres                    → Listado de padres/tutores
/padres/:id                → Detalle de padre/tutor
/profesores                → Listado de profesores
/profesores/:id            → Perfil del profesor
/salones                   → Gestión de salones
/sucursales                → Gestión de sucursales
/inscripciones             → Proceso de inscripción (wizard)
/finanzas                  → Dashboard financiero
/finanzas/estado-cuenta    → Estado de cuenta
/caja                      → Control de caja (cobros, cortes, arqueos)
/reportes                  → Reportes dinámicos
/configuracion             → Configuración general
/configuracion/roles       → Roles y permisos
/asistente-ia              → Asistente IA
```

## 3. Funcionalidades Core

- [x] Design System completo (paleta, tipografía, componentes)
- [x] Layout base (Sidebar colapsable, Header, Main)
- [x] Tema claro/oscuro
- [x] Dashboard Ejecutivo con KPIs, gráficos, actividad reciente
- [x] Gestión de Alumnos (listado inteligente, filtros avanzados, expediente CRM con tabs de expediente/timeline/pagos/documentos/padres)
- [x] Gestión de Padres/Tutores (listado, detalle con alumnos vinculados)
- [x] Gestión de Profesores (listado, perfil, horarios)
- [x] Gestión de Salones
- [x] Gestión de Sucursales
- [x] Inscripciones (wizard paso a paso)
- [x] Módulo de Finanzas (dashboard, estado de cuenta, colegiaturas)
- [x] Módulo de Caja (cobros, cortes, arqueos)
- [x] Reportes dinámicos (gráficos, exportar PDF/Excel)
- [x] Configuración General
- [x] Asistente IA integrado
- [x] Notificaciones
- [x] Buscador global
- [x] Cambio de sucursal y ciclo escolar (ContextSwitcher global)
- [x] Responsive (desktop, laptop, tablet, mobile)

## 4. Modelo de Datos

> Nota: Para el MVP usaremos datos mock. Cuando se conecte Supabase, migraremos a tablas reales.

### Tablas principales (planificadas)
- **schools**: id, name, logo, settings, plan
- **branches**: id, school_id, name, address, capacity, director
- **classrooms**: id, branch_id, name, capacity, level, group, status
- **teachers**: id, branch_id, name, email, phone, specialty, status
- **students**: id, branch_id, classroom_id, name, dob, enrollment_date, status
- **parents**: id, name, email, phone, relationship
- **student_parents**: student_id, parent_id, relationship
- **enrollments**: id, student_id, cycle_id, status, documents
- **payments**: id, student_id, concept, amount, date, status
- **school_cycles**: id, school_id, name, start_date, end_date
- **users**: id, school_id, role, permissions

## 5. Integraciones Planificadas

- **Supabase**: Conexión futura para base de datos, autenticación y edge functions
- **Stripe**: Pasarela de pagos para colegiaturas online (futuro)
- **OpenAI / Asistente IA**: Integración con IA para consultas inteligentes (futuro)

## 6. Plan de Desarrollo por Fases

### Fase 1: Fundación — Design System + Layout + Dashboard
- **Objetivo:** Establecer el lenguaje visual completo y el layout del sistema, más el dashboard ejecutivo
- **Entregable:** Design System, layout con sidebar/header, tema claro/oscuro, componentes base, dashboard con KPIs

### Fase 2: Alumnos + Padres
- **Objetivo:** Módulo de gestión de alumnos (el más completo) y padres/tutores
- **Entregable:** Listado inteligente, filtros avanzados, expediente CRM, timeline, gestión de padres

### Fase 3: Profesores + Salones + Sucursales ✅ COMPLETADA
- **Objetivo:** Gestión de profesores, salones y sucursales
- **Entregable:** Listados, perfiles, asignaciones, filtros

#### Completado:
- [x] Mock data de 12 profesores con especialidades, materias, salarios, fotos y certificaciones
- [x] Módulo de Profesores: listado con KPIs (total, activos, nómina/honorarios, evaluación, sucursales), filtros por nivel/sucursal/estado/tipo pago, tabla sortable con foto, modal de vista rápida, perfil detallado con 4 tabs (Información, Materias, Horario, Estadísticas) con rating de estrellas
- [x] Mock data de 30 salones con capacidad, tipos (Regular/Lab/Taller/Auditorio/Deportivo), equipamiento y profesores asignados
- [x] Módulo de Salones: KPIs con disponibles/llenos/mantenimiento, tabla con barra de ocupación visual, filtros por nivel/sucursal/tipo/estado, modal de detalle con equipamiento
- [x] Mock data de 5 sucursales con direcciones mexicanas, lat/lng, director, instalaciones
- [x] Módulo de Sucursales: grid de cards con imagen generada, KPIs, filtros, modal de detalle con Google Maps embebido, datos del director, instalaciones y capacidad
- [x] Rutas actualizadas: `/profesores/:id` para perfil de profesor
- [x] Build verificado sin errores

### Fase 4: Inscripciones + Finanzas + Caja ✅ COMPLETADA
- **Objetivo:** Proceso de inscripción wizard, dashboard financiero, y módulo de caja
- **Entregable:** Wizard de inscripción, estado de cuenta, cobros, cortes

#### Completado:
- [x] Componente **Stepper/Wizard** reutilizable con orientación horizontal y vertical, soporte para clic en pasos completados
- [x] Mock data financiero: 12 meses de ingresos/egresos con meta, pagos recientes por concepto (colegiatura, inscripción, uniformes, libros, comedor, talleres, transporte), resumen financiero con KPIs
- [x] Mock data de caja: 7 cortes de caja con turnos matutino/vespertino, 12 movimientos diarios con 4 métodos de pago, 2 arqueos con billetes/monedas detallados
- [x] **Módulo de Inscripciones** (`/inscripciones`) — Wizard de 5 pasos completamente funcional:
  1. **Datos del Alumno** — Nombre, apellidos, fecha nacimiento, género, tipo de sangre, email, teléfono, dirección, alergias, notas médicas (formulario de 2 columnas)
  2. **Padres/Tutores** — Select con padres existentes, card de info del padre seleccionado, segundo tutor opcional, botón registrar nuevo padre
  3. **Documentos** — 8 documentos requeridos/opcionales con iconos individuales, toggle de subida visual (no real file upload por ahora), validación de obligatorios
  4. **Asignación de Grupo** — Nivel → Grado dinámico (Preescolar 1-3, Primaria 1-6, Secundaria 1-3, Preparatoria 4-6), Grupo A/B/C, Sucursal, confirmación card verde con resumen
  5. **Resumen** — 4 cards de revisión: Datos del Alumno, Padres/Tutores, Documentos (badges verdes/rojos por estado), Asignación con matrícula generada auto (ENR-{year}-{random})
  - Pantalla de éxito con matrícula generada, nombre, nivel, grupo, sucursal, botón Nueva Inscripción
  - Navegación con validación: no avanza si el paso actual no tiene los campos obligatorios
  - Botones Anterior/Siguiente con contador de pasos

- [x] **Dashboard Financiero** (`/finanzas`) — Completo:
  - 4 KPIs: Ingresos del Mes (+X% vs anterior), Egresos del Mes, Saldo Pendiente (rojo con alumnos con adeudo), Pagos Hoy
  - **Gráfico de barras** Ingresos vs Egresos para 12 meses con meta como línea punteada, tooltips hover con montos
  - **Ingresos por Concepto** con barras de progreso coloreadas por tipo y totales
  - **Resumen por Tipo** con tabla de conceptos agrupados (colegiaturas, inscripciones, etc.) + mini dashboard de estado de colegiaturas (pagadas/pendientes/vencidas)
  - **Tabla de pagos recientes** con búsqueda, filtro por estado, columnas: concepto con icono tipo, monto, estado badge, folio, fecha de pago
  - Botones Exportar y Nuevo Concepto

- [x] **Estado de Cuenta** (`/finanzas/estado-cuenta/:id`) — Detalle por alumno:
  - 4 KPIs: Total Pagado (verde), Saldo Pendiente (rojo), Conceptos Pagados (X/Y), Tasa Moratoria
  - Tabla detallada con: concepto, monto total, pagado, saldo, estado badge, folio/fecha, botón Pagar (solo si no pagado) y ver recibo
  - Footer con total a pagar en rojo y nota sobre mora
  - Botones Descargar e Imprimir

- [x] **Módulo de Caja** (`/caja`) — Completo:
  - 4 KPIs: Corte Actual (badge abierto + turno + usuario), Ingresos Hoy, Egresos Hoy, Saldo Neto con breakdown por método (efectivo/tarjeta)
  - **2 tabs**: Cortes de Caja / Movimientos del Día
  - Tabla de Cortes: fecha, turno badge, usuario, ingresos/egresos con colores, saldo final, estado badge (cerrado/abierto/conciliado), acciones rápidas
  - Tabla de Movimientos: hora, tipo badge (ingreso/egreso), concepto + categoría, monto con color, método badge (efectivo/tarjeta/transferencia/cheque), alumno, usuario
  - **Modal de Movimientos**: al hacer click en un corte, modal XL con 4 KPIs (Ingresos, Egresos, Transacciones, Diferencia) + tabla de todos los movimientos del corte
  - **Modal de Arqueo**: detalle completo de billetes (500, 200, 100, 50, 20) y monedas (10, 5, 2, 1), totales por método de pago, comparación total sistema vs arqueo, diferencia

- [x] Rutas actualizadas: `/finanzas/estado-cuenta/:id` para estado de cuenta
- [x] Build verificado sin errores

### Fase 5: Reportes + IA + Configuración ✅ COMPLETADA
- **Objetivo:** Reportes dinámicos, asistente IA, y configuración general
- **Entregable:** Reportes interactivos, chat IA, panel de configuración

#### Completado:
- [x] Mock data de reportes con ingresos, morosidad, matrícula, métodos de pago, sucursales, retención
- [x] Mock data del asistente IA con conversaciones, sugerencias inteligentes y respuestas contextuales
- [x] Mock data de configuración: institución, ciclos, métodos de pago, conceptos, niveles, roles, notificaciones
- [x] **Módulo de Reportes** (`/reportes`) — Dashboard de análisis completo:
  - 4 KPIs: Ingresos Acumulados, Alumnos Activos, Tasa de Morosidad, Nuevos Inscritos con variaciones
  - **6 tipos de reporte** con navegación por tabs: Ingresos y Egresos, Matrícula y Retención, Morosidad, Métodos de Pago, Ingresos por Concepto, Por Sucursal
  - **Gráfico de barras SVG** Ingresos vs Egresos mensuales con línea de meta punteada y tooltips
  - **Gráfico de barras SVG** Retención por grado con nuevos inscritos overlay
  - **Donut chart SVG** Distribución de pagos por método con tooltips y centro con total
  - Barras de progreso para morosidad por nivel, ingresos por concepto, alumnos por nivel
  - Filtros: tipo de reporte, sucursal, rango de fechas (mes a mes)
  - Tabla de sucursales con barras de ocupación visual
  - Resumen de morosidad con cards rojo/ámbar/verde y botón de envío masivo
  - Botones Exportar PDF y Exportar Excel

- [x] **Asistente IA** (`/asistente-ia`) — Chat inteligente completo:
  - Layout de 2 columnas: historial de conversaciones (sidebar) + chat principal
  - Sidebar con 6 conversaciones guardadas (reporte morosidad, análisis ingresos, alumnos vencidos, etc.)
  - Botón "Nueva conversación" para reiniciar el chat
  - Área de chat con burbujas estilizadas (asistente: gradiente primario/accent, usuario: primary sólido)
  - Indicador de "escribiendo..." con 3 dots animados
  - **6 sugerencias rápidas** con iconos: pagos vencidos, ingresos vs meta, nuevas inscripciones, morosidad por sucursal, ranking profesores, ocupación salones
  - **Respuestas contextuales** con markdown: negritas, tablas, saltos de línea, análisis detallado con datos reales del mock
  - Input con soporte Enter para enviar, botón de envío deshabilitado si está vacío
  - Auto-scroll al último mensaje
  - Disclaimer "El Asistente IA puede cometer errores"
  - Badge "Beta" con icono sparkle

- [x] **Configuración General** (`/configuracion`) — Panel de administración completo con 4 tabs:
  1. **General** — Formulario de información institucional (nombre, RFC, teléfono, email, sitio web, dirección fiscal) en grid 2 columnas, uploader de logo con preview visual gradiente, configuración regional (zona horaria, moneda, idioma), botón Guardar con feedback visual de éxito
  2. **Ciclos Escolares** — Tabla con 3 ciclos (2026-2027 activo, 2025-2026, 2024-2025), fechas formateadas en español, badges de estado, botón Nuevo Ciclo
  3. **Métodos de Pago** — Layout 2 columnas: métodos de pago con toggle switches (transferencia, efectivo, tarjeta, cheque, domiciliación) + info detallada, conceptos de pago con montos y badges de tipo (recurrente, único, mensual, anual), botones Agregar
  4. **Catálogos** — Niveles educativos con grados (Preescolar 3, Primaria 6, Secundaria 3, Preparatoria 6, Universidad 8), Notificaciones automáticas con toggle (recordatorio pago, aviso morosidad, confirmación, inscripción, cumpleaños, junta), Roles y permisos en tabla con conteo de usuarios y botón de permisos

- [x] Build verificado sin errores

### Fase 6: Pulido Final ✅ COMPLETADA
- **Objetivo:** Animaciones, microinteracciones, accesibilidad WCAG 2.2, responsive completo, notificaciones, context switcher
- **Entregable:** Sistema completo pulido y listo para producción

#### Completado:
- [x] **Centro de Notificaciones** (`/notificaciones`) — Página completa con 15 notificaciones ultra realistas categorizadas:
  - Filtro por categoría (pagos, inscripciones, profesores, alumnos, sistema) y solo no leídas
  - Búsqueda por texto en título, descripción y alumno vinculado
  - Indicador visual de no leídas (fondo primario suave + badge azul + dot en avatar)
  - Acciones contextuales por notificación (ver alumnos, ver expediente, ver comprobante, ir a caja, conciliar)
  - Botón eliminar individual y marcar todas como leídas
  - Categorías con colores semánticos (ámbar=pagos, azul=inscripciones, violeta=profesores, verde=alumnos, gris=sistema)
  - Empty state con icono cuando no hay resultados
- [x] **Dropdown de notificaciones mejorado en Header** — Dots de no leídas en cada item, navegación al centro completo, badge de conteo "4 nuevas"
- [x] **ContextSwitcher global** — Selector de sucursal (5 campus con conteo de alumnos) + selector de ciclo escolar (3 ciclos con badge "Activo") en el Header
  - Dropdowns independientes con animación fade-in, checkmarks en selección actual
  - Diseño adaptativo: texto completo en desktop, abreviado en mobile
  - aria-haspopup, aria-expanded, role="listbox/option" para accesibilidad
- [x] **Nuevo enlace en Sidebar** — "Notificaciones" con badge de 4 no leídas en sección Sistema
- [x] **Sistema de Animaciones** en `index.css`:
  - `fade-in-up`: entrada suave desde abajo (12px)
  - `fade-in-scale`: entrada con ligero zoom (0.96 → 1)
  - `shimmer`: efecto de brillo para skeletons y loadings
  - `bounce-dot`: 3 dots animados con delays escalonados para "escribiendo..."
  - `pulse-ring`: anillo expansivo para indicadores de atención
  - `slide-up-in` + stagger: animaciones secuenciales con 8 niveles de delay para cards y listas
  - `page-enter`: transición global aplicada a cada cambio de página vía MainLayout
- [x] **Dashboard con stagger animations** — KPIs y secciones del dashboard entran secuencialmente con efecto stagger
- [x] **Accesibilidad WCAG 2.2**:
  - `:focus-visible` global con outline primary de 2px + offset de 2px
  - `role="main"` y `aria-label="Contenido principal"` en el main del layout
  - `aria-label="Navegación principal"` en el nav del sidebar
  - `aria-current="page"` en el item activo del sidebar
  - `aria-sort` en cabeceras de tabla sortables
  - `scope="col"` en todas las `<th>`
  - `role="button"`, `tabIndex`, `onKeyDown` (Enter/Space) en filas clickeables de tabla
  - `aria-label` en botones del header (menú, notificaciones, perfil, búsqueda)
  - `aria-haspopup` y `aria-expanded` en dropdowns (notificaciones, perfil, context switcher)
  - `role="listbox"`, `role="option"`, `aria-selected` en menús de selección
  - `aria-hidden="true"` en iconos decorativos
- [x] **Responsive completo**:
  - DataTable con clase `responsive-table`: en mobile (<1024px) las tablas se transforman en cards apiladas con `data-label` como pseudo-elementos
  - Todas las tablas del sistema actualizadas: DataTable + PagosTab, Reportes (sucursales), Configuración (ciclos + roles)
  - `overflow-x-auto` en todos los contenedores de tabla para scroll horizontal en tablets
  - Grid responsive en todos los layouts: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-N`
  - Inputs y filtros con `flex-col sm:flex-row` para adaptarse en mobile
  - Sidebar con menú hamburguesa funcional en mobile/tablet (overlay + slide-in)
  - Header con buscador oculto en mobile, context switcher adaptativo
- [x] Build verificado sin errores

### Fase 7: Formularios CRUD Completos ✅ COMPLETADA
- **Objetivo:** Reforzar cada módulo con formularios completos de Alta, Edición y Eliminación
- **Entregable:** Formularios modales con validación, confirmación de eliminación, feedback toast, datos en estado local

#### Completado:
- [x] **DeleteConfirmModal reutilizable** — Modal de confirmación con icono rojo, nombre del item a eliminar, botones Cancelar/Eliminar con loading state
- [x] **Sistema de Toast/Feedback** — ToastProvider global con useToast hook, animación slide-up, auto-dismiss 3.5s, estilos por tipo (success/error/info), botón cerrar manual
- [x] **StudentFormModal** — Formulario completo para Alumnos: datos personales (nombre, email, tel, fecha nac, género, sangre), datos académicos (nivel, grado, grupo, sucursal, estado), datos médicos (alergias, notas), validación de campos requeridos, modo creación y edición
- [x] **ParentFormModal** — Formulario para Padres/Tutores: nombre, email, teléfono, ocupación, dirección, estado (activo/inactivo), validación
- [x] **ProfesorFormModal** — Formulario para Profesores: datos personales, información laboral (tipo pago, salario, sucursal, nivel, horario), materias, validación
- [x] **SalonFormModal** — Formulario para Salones: código, tipo, estado, nivel/grado/grupo, capacidad, edificio/piso, sucursal, profesor asignado, horario, equipamiento, validación
- [x] **SucursalFormModal** — Formulario para Sucursales: datos del campus (nombre, dirección, ciudad, CP, superficie, tel, email), director (nombre, email, tel), configuración (capacidad, estado operativo, fecha apertura, niveles educativos), validación
- [x] **Integración en Alumnos** — "Nuevo Alumno" abre formulario, botones editar/eliminar en cada fila de la tabla, datos en estado local, KPIs dinámicos
- [x] **Integración en Padres** — "Nuevo Tutor" + botones editar/eliminar en filas, estado local, KPIs dinámicos
- [x] **Integración en Profesores** — "Nuevo Profesor" + editar/eliminar en acciones de tabla, estado local, KPIs dinámicos
- [x] **Integración en Salones** — "Nuevo Salón" + editar/eliminar en acciones de tabla, estado local, KPIs dinámicos
- [x] **Integración en Sucursales** — "Nueva Sucursal" + editar/eliminar en footer de cada card, estado local, KPIs dinámicos
- [x] **Build verificado sin errores**

### Fase 8: Validación Robusta de Formularios ✅ COMPLETADA
- **Objetivo:** Reforzar todos los formularios con validación completa (formatos, obligatoriedad, mensajes descriptivos)
- **Entregable:** Sistema de validación profesional con indicadores visuales, formatos de email/teléfono/números, asterisco rojo en campos requeridos

#### Completado:
- [x] **Input y Select** — Nuevo prop `required` con asterisco rojo (*) automático en el label de todos los campos obligatorios
- [x] **StudentFormModal** — Validación completa: email formato, teléfono mínimo 8 dígitos, longitud mínima 2 caracteres en nombres, campos obligatorios con mensajes descriptivos (no solo "Requerido")
- [x] **ParentFormModal** — Validación completa: email formato, teléfono mínimo 8 dígitos, nombre/apellidos/ocupación/dirección obligatorios con mensajes claros
- [x] **ProfesorFormModal** — Refactorizado: `nombre` dividido en `firstName` + `lastName` (consistente con Alumnos y Padres). Al editar, el nombre completo se separa inteligentemente por el último espacio. Validación: email, teléfono, salario > 0, nombre/apellidos/especialidad/materias/horario obligatorios. Página de profesores actualizada para componer `nombre = firstName + lastName`
- [x] **SalonFormModal** — Validación completa: nombre/código, tipo, capacidad (número > 0), edificio, piso (número > 0), sucursal, profesor asignado y horario obligatorios
- [x] **SucursalFormModal** — Validación más completa del sistema: email (formato), teléfono (8+ dígitos), CP (exactamente 5 dígitos), emails del director (formato), capacidad > 0, 16 campos con reglas específicas
- [x] **Inscripciones Wizard** — Sistema de errores visuales: ahora los campos del paso 1 muestran mensajes de error en rojo cuando están vacíos, validación con `setErrors` en cada paso, indicadores `required` en campos obligatorios (nombre, apellido, fecha nac, género, nivel, grado, grupo, sucursal, padre/tutor)
- [x] **Build verificado sin errores**

### Lo que sigue
- **Conectar Supabase** — Migrar de datos mock a base de datos real, autenticación de usuarios, RLS
- **Conectar Stripe** — Pagos de colegiaturas reales desde el estado de cuenta y portal de padres
- **Impresión y exportación real** — Implementar PDF/Excel con datos reales
- **Subida de archivos** — Documentos, fotos de perfil, logos de institución