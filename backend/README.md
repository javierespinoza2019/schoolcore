# SchoolCore Backend

API .NET 10 (Clean Architecture) + SQL Server 2022 (solo Stored Procedures / Dapper).

## Requisitos

- .NET 10 SDK
- SQL Server 2022

## Aplicar base de datos (orden)

Ejecutar en SQL Server Management Studio o `sqlcmd` contra la instancia destino:

### 1. Scripts DDL / seed

```text
database/Scripts/001_CreateDatabase.sql
database/Scripts/002_CreateCoreTables.sql
database/Scripts/003_SeedRolesAndFeatureFlags.sql
database/Scripts/004_CreateAuthTables.sql
database/Scripts/005_CreateOrganizationTables.sql
database/Scripts/006_CreatePeopleTables.sql
database/Scripts/007_CreateAcademicTables.sql
database/Scripts/008_CreateFinanceTables.sql
database/Scripts/009_CreateNotificationTables.sql
```

### 2. Stored Procedures

Aplicar **todos** los `.sql` en `database/StoredProcedures/` (son `CREATE OR ALTER`, idempotentes).

Ejemplo PowerShell:

```powershell
Get-ChildItem .\database\StoredProcedures\*.sql | Sort-Object Name | ForEach-Object {
  sqlcmd -S localhost -d SchoolCore -E -i $_.FullName
}
```

### 3. Bootstrap de tenant (AppFabric)

1. Generar hash de contraseña:

```powershell
dotnet run --project src/SchoolCore.API -- --hash-password "YourPassword123"
```

2. Pegar el hash en `database/Scripts/999_BootstrapTenant_AppFabric.sql` (`@PasswordHash`) y ajustar `@TenantCode`, `@Email`, etc.

3. Ejecutar `999_BootstrapTenant_AppFabric.sql`.

## Build y tests

```powershell
dotnet build src/SchoolCore.slnx
dotnet test src/SchoolCore.Tests/SchoolCore.Tests.csproj
```

## Configuración

Ver `src/SchoolCore.API/appsettings.json`:

- `ConnectionStrings:SchoolCore`
- `Jwt:*`
- `Documents:RootPath` (default relativo `documents/` bajo `schoolcore/backend/documents`)
- `Smtp:*`, `Cors:AllowedOrigins`, `Logging:*`

## Documentos

Ruta física: `documents/{uploaderUserUuid}/{fileUuid}.ext`  
Extensiones: pdf, png, jpg, jpeg — máx. 5 MB. Solo vía API autenticada.

## Notas MVP

- Feature flags OFF por defecto: Stripe, IA, portales, CFDI, académico avanzado.
- Caja v1: 1 corte abierto por tenant+sucursal+usuario+turno; arqueo obligatorio al cerrar; sin pagos parciales; beca al generar cargo.
