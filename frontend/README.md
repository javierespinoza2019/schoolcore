# SchoolCore Frontend — API wiring (MVP Phases 2–7)

React **19.2.7** · TanStack Query · Inter + OKLCH · `VITE_API_BASE_URL` (default `…/api`).

## Ambientes (`.env`)

| Archivo | Script | API por defecto |
|---------|--------|-----------------|
| `.env.development` | `npm run dev` / `build:development` | `https://localhost:7141/api` |
| `.env.qa` | `npm run build:qa` / `preview:qa` | `http://schoolcore.api.expofabricantes.mx/api` |
| `.env.production` | `npm run build` / `build:production` | `https://api.school-core.net/api` |

Overrides locales: copia valores a `.env.local` (gitignored).  
Variables: `VITE_APP_ENV`, `VITE_APP_NAME`, `VITE_API_BASE_URL`.  
Lectura en runtime: `src/config/env.ts` (usado por `apiClient`).  
Verificación: `npm run verify:env`.

## Deploy IIS (SPA)

Tras `npm run build` / `build:qa` / `build:production`, publica la carpeta `out/` en IIS.  
El build incluye `web.config` (desde `public/`) para que F5 en rutas como `/login` reescriba a `index.html`.  
En el servidor IIS debe estar instalado **URL Rewrite**.

## Convención de rutas (esperadas del backend)

| Módulo | Prefijo | Notas |
|--------|---------|--------|
| Auth | `/auth/*` | Ya cableado (login, refresh, logout, forgot/reset) |
| Permisos | `/auth/me/permissions` | Opcional; stub si falta |
| Sucursales | `/branches` | CRUD |
| Ciclos | `/cycles` | CRUD |
| Alumnos | `/students` | + `/students/:id/documents` multipart |
| Padres | `/parents` | + vínculo alumnos |
| Profesores | `/teachers` | |
| Salones | `/classrooms` | |
| Inscripciones | `/enrollments` | POST wizard |
| Finanzas | `/finance/*` | summary, payments, account-statement, export |
| Caja | `/cash/sessions`, `/cash/arqueos` | Cierre con arqueo obligatorio |
| Reportes | `/reports`, `/reports/export` | |
| Notificaciones | `/notifications` | |
| Dashboard | `/dashboard/kpis` | |
| Settings | `/settings/*`, `/users` | tenant, payment-methods/concepts, email-templates |

Todas las respuestas esperan `ApiResponse<T>`: `{ success, data, message, errors }` (camelCase).

Listados pueden ser `T[]` o `PagedResult<T>` (`items`, `totalCount`, `page`, `pageSize`).

## Fallback mock

Si el endpoint aún no existe o falla, `fetchOrFallback` usa mocks **solo** en ese caso (con log DEV / TODO). Si la API responde `success` con lista vacía → empty state real (sin inventar datos).

## ContextSwitcher

`SchoolProvider` guarda `branchId` / `cycleId` y al cambiar invalida queries con prefijos: students, parents, teachers, classrooms, finance, cash, reports, dashboard, notifications, enrollments.

## Feature flags FE

- `FEATURES.aiAssistant = false` → menú y ruta `/asistente-ia` ocultos/redirigidos.
- Sin UI Stripe/CFDI/portales.

## Caja v1 UX

- `CASH_V1_PARTIAL_PAYMENTS = false` en `financeApi` / modal de pago.
- Cierre de corte pide arqueo (SweetAlert2).

## Ajustar nombres si el backend difiere

Edita los paths en `src/api/*Api.ts`. No hace falta tocar las páginas si el contrato DTO se mantiene compatible con los tipos UI (o el normalizer del módulo).
