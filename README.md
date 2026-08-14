# SchoolCore monorepo

Fase 0 — esqueleto listo para desarrollo.

## Estructura

- `frontend/` — React 19.2.7 (base `frontend-demo-base`, rebrand SchoolCore)
- `backend/src/` — .NET 10 Clean Architecture (API, Business, DataAccess, Models, Common)
- `backend/database/` — Scripts SQL Server 2022 + Stored Procedures
- `backend/documents/` — almacenamiento local de archivos (UUID)

## Documentación de producto

Ver `../docs/SchoolCore-Analisis-Memoria.md` y skills en `../.cursor/skills/` / `../.claude/skills/`.

## Backend

```bash
cd backend/src
dotnet restore
dotnet build
dotnet run --project SchoolCore.API
```

Health: `GET /api/health`

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Base de datos

Ejecutar en orden sobre SQL Server 2022:

1. `database/Scripts/001_CreateDatabase.sql`
2. `database/Scripts/002_CreateCoreTables.sql`
3. `database/Scripts/003_SeedRolesAndFeatureFlags.sql`
4. SPs en `database/StoredProcedures/`
5. `database/Scripts/999_BootstrapTenant_AppFabric.sql` (manual AppFabric; reemplazar placeholders)

## Dominios producción (previstos)

- App: `https://app.school-core.net`
- API: `https://api.school-core.net`
