/*
  SchoolCore — SQL Server 2022
  Script: 010_AddTimeZones.sql
  Timezone columns on Tenant/Branch + Mexico catalog.
  Does NOT rewrite historical UTC timestamps.
  Idempotent.
*/
USE db_a0b4b3_schoolcore;
GO

IF COL_LENGTH(N'dbo.Tenant', N'TimeZoneId') IS NULL
    ALTER TABLE dbo.Tenant ADD TimeZoneId NVARCHAR(64) NULL;
GO

IF COL_LENGTH(N'dbo.Branch', N'TimeZoneId') IS NULL
    ALTER TABLE dbo.Branch ADD TimeZoneId NVARCHAR(64) NULL;
GO

/* Default existing tenants to Mexico City without touching audit timestamps */
UPDATE dbo.Tenant
SET TimeZoneId = N'America/Mexico_City'
WHERE TimeZoneId IS NULL;
GO

IF OBJECT_ID(N'dbo.TimeZoneCatalog', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TimeZoneCatalog
    (
        Id            NVARCHAR(64) NOT NULL CONSTRAINT PK_TimeZoneCatalog PRIMARY KEY,
        DisplayNameEs NVARCHAR(120) NOT NULL,
        DisplayNameEn NVARCHAR(120) NOT NULL,
        SortOrder     INT NOT NULL CONSTRAINT DF_TimeZoneCatalog_SortOrder DEFAULT (0),
        IsActive      BIT NOT NULL CONSTRAINT DF_TimeZoneCatalog_IsActive DEFAULT (1)
    );
END
GO

MERGE dbo.TimeZoneCatalog AS t
USING (VALUES
    (N'America/Mexico_City', N'Ciudad de México / Centro (UTC−6)', N'Mexico City / Central (UTC−6)', 1),
    (N'America/Cancun', N'Cancún / Quintana Roo (UTC−5)', N'Cancun / Quintana Roo (UTC−5)', 2),
    (N'America/Mazatlan', N'Pacífico — Mazatlán (UTC−7)', N'Pacific — Mazatlan (UTC−7)', 3),
    (N'America/Chihuahua', N'Chihuahua (UTC−7)', N'Chihuahua (UTC−7)', 4),
    (N'America/Hermosillo', N'Hermosillo / Sonora', N'Hermosillo / Sonora', 5),
    (N'America/Tijuana', N'Tijuana / Baja California (UTC−8)', N'Tijuana / Baja California (UTC−8)', 6)
) AS s (Id, DisplayNameEs, DisplayNameEn, SortOrder)
ON t.Id = s.Id
WHEN MATCHED THEN UPDATE SET
    DisplayNameEs = s.DisplayNameEs,
    DisplayNameEn = s.DisplayNameEn,
    SortOrder = s.SortOrder,
    IsActive = 1
WHEN NOT MATCHED THEN
    INSERT (Id, DisplayNameEs, DisplayNameEn, SortOrder, IsActive)
    VALUES (s.Id, s.DisplayNameEs, s.DisplayNameEn, s.SortOrder, 1);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.DatabaseVersion WHERE ScriptName = N'010_AddTimeZones.sql')
BEGIN
    INSERT INTO dbo.DatabaseVersion (ScriptName) VALUES (N'010_AddTimeZones.sql');
END
GO
