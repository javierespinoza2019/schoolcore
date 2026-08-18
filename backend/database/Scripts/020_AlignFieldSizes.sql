/*
  SchoolCore — SQL Server 2022
  Script: 020_AlignFieldSizes.sql
  Alinea NVARCHAR a fieldStandards (SHRINK + LevelName widen).
  Idempotente. Precheck falla (THROW) si hay datos que no caben.
*/
USE db_a0b4b3_schoolcore;
GO

SET NOCOUNT ON;

/* ---- Precheck: abort if data exceeds new sizes ---- */
DECLARE @violations TABLE (Entity NVARCHAR(64), Col NVARCHAR(64), BadCount INT);

IF OBJECT_ID(N'dbo.Student', N'U') IS NOT NULL
BEGIN
    INSERT INTO @violations
    SELECT N'Student', N'BloodType', COUNT(*) FROM dbo.Student WHERE BloodType IS NOT NULL AND LEN(BloodType) > 5
    UNION ALL SELECT N'Student', N'Grade', COUNT(*) FROM dbo.Student WHERE Grade IS NOT NULL AND LEN(Grade) > 20
    UNION ALL SELECT N'Student', N'GroupCode', COUNT(*) FROM dbo.Student WHERE GroupCode IS NOT NULL AND LEN(GroupCode) > 10;
END

IF OBJECT_ID(N'dbo.Classroom', N'U') IS NOT NULL
BEGIN
    INSERT INTO @violations
    SELECT N'Classroom', N'Grade', COUNT(*) FROM dbo.Classroom WHERE Grade IS NOT NULL AND LEN(Grade) > 20
    UNION ALL SELECT N'Classroom', N'GroupCode', COUNT(*) FROM dbo.Classroom WHERE GroupCode IS NOT NULL AND LEN(GroupCode) > 10;
END

IF OBJECT_ID(N'dbo.Branch', N'U') IS NOT NULL
BEGIN
    INSERT INTO @violations
    SELECT N'Branch', N'Code', COUNT(*) FROM dbo.Branch WHERE Code IS NOT NULL AND LEN(Code) > 20;
END

IF OBJECT_ID(N'dbo.InstitutionSettings', N'U') IS NOT NULL
BEGIN
    INSERT INTO @violations
    SELECT N'InstitutionSettings', N'TaxId', COUNT(*) FROM dbo.InstitutionSettings WHERE TaxId IS NOT NULL AND LEN(TaxId) > 20;
END

IF EXISTS (SELECT 1 FROM @violations WHERE BadCount > 0)
BEGIN
    DECLARE @msg NVARCHAR(MAX) = N'020_AlignFieldSizes: data exceeds target sizes. Fix rows before shrink:';
    SELECT @msg = @msg + CHAR(10) + Entity + N'.' + Col + N'=' + CONVERT(NVARCHAR(20), BadCount)
    FROM @violations WHERE BadCount > 0;
    THROW 50020, @msg, 1;
END
GO

/* ---- Student ---- */
IF COL_LENGTH(N'dbo.Student', N'BloodType') IS NOT NULL
    AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Student') AND name = N'BloodType' AND max_length = 20) -- NVARCHAR(10)=20 bytes
    ALTER TABLE dbo.Student ALTER COLUMN BloodType NVARCHAR(5) NULL;

IF COL_LENGTH(N'dbo.Student', N'Grade') IS NOT NULL
    ALTER TABLE dbo.Student ALTER COLUMN Grade NVARCHAR(20) NULL;

IF COL_LENGTH(N'dbo.Student', N'GroupCode') IS NOT NULL
    ALTER TABLE dbo.Student ALTER COLUMN GroupCode NVARCHAR(10) NULL;

IF COL_LENGTH(N'dbo.Student', N'LevelName') IS NOT NULL
    ALTER TABLE dbo.Student ALTER COLUMN LevelName NVARCHAR(100) NULL;
GO

/* ---- Classroom ---- */
IF COL_LENGTH(N'dbo.Classroom', N'Grade') IS NOT NULL
    ALTER TABLE dbo.Classroom ALTER COLUMN Grade NVARCHAR(20) NULL;

IF COL_LENGTH(N'dbo.Classroom', N'GroupCode') IS NOT NULL
    ALTER TABLE dbo.Classroom ALTER COLUMN GroupCode NVARCHAR(10) NULL;

IF COL_LENGTH(N'dbo.Classroom', N'LevelName') IS NOT NULL
    ALTER TABLE dbo.Classroom ALTER COLUMN LevelName NVARCHAR(100) NULL;
GO

/* ---- Branch (drop dependent index, alter, recreate) ---- */
IF COL_LENGTH(N'dbo.Branch', N'Code') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'UX_Branch_Tenant_Code_Active'
          AND object_id = OBJECT_ID(N'dbo.Branch')
    )
        DROP INDEX UX_Branch_Tenant_Code_Active ON dbo.Branch;

    ALTER TABLE dbo.Branch ALTER COLUMN Code NVARCHAR(20) NOT NULL;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'UX_Branch_Tenant_Code_Active'
          AND object_id = OBJECT_ID(N'dbo.Branch')
    )
        CREATE UNIQUE INDEX UX_Branch_Tenant_Code_Active
            ON dbo.Branch (TenantId, Code)
            WHERE IsDeleted = 0;
END

IF COL_LENGTH(N'dbo.Branch', N'PostalCode') IS NOT NULL
    ALTER TABLE dbo.Branch ALTER COLUMN PostalCode NVARCHAR(10) NULL;
GO

/* ---- InstitutionSettings ---- */
IF COL_LENGTH(N'dbo.InstitutionSettings', N'TaxId') IS NOT NULL
    ALTER TABLE dbo.InstitutionSettings ALTER COLUMN TaxId NVARCHAR(20) NULL;
GO

/* ---- Teacher LevelName (if present) ---- */
IF COL_LENGTH(N'dbo.Teacher', N'LevelName') IS NOT NULL
    ALTER TABLE dbo.Teacher ALTER COLUMN LevelName NVARCHAR(100) NULL;
GO

PRINT N'020_AlignFieldSizes: columns aligned.';
GO
