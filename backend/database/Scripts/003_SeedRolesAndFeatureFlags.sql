/*
  SchoolCore — SQL Server 2022
  Script: 003_SeedRolesAndFeatureFlags.sql
  Seeds system roles (14) and global feature flags default OFF.
*/
USE db_a0b4b3_schoolcore;
GO

MERGE dbo.Role AS target
USING (VALUES
    (CONVERT(UNIQUEIDENTIFIER, '11111111-1111-1111-1111-111111111001'), N'SuperAdmin', N'Super Admin', 1),
    (CONVERT(UNIQUEIDENTIFIER, '11111111-1111-1111-1111-111111111002'), N'Director', N'Director', 1),
    (CONVERT(UNIQUEIDENTIFIER, '11111111-1111-1111-1111-111111111003'), N'Coordinator', N'Coordinador', 1),
    (CONVERT(UNIQUEIDENTIFIER, '11111111-1111-1111-1111-111111111004'), N'Cashier', N'Cajero', 1),
    (CONVERT(UNIQUEIDENTIFIER, '11111111-1111-1111-1111-111111111005'), N'Accountant', N'Contador', 1),
    (CONVERT(UNIQUEIDENTIFIER, '11111111-1111-1111-1111-111111111006'), N'Receptionist', N'Recepcionista', 1),
    (CONVERT(UNIQUEIDENTIFIER, '11111111-1111-1111-1111-111111111007'), N'Teacher', N'Profesor', 1),
    (CONVERT(UNIQUEIDENTIFIER, '11111111-1111-1111-1111-111111111008'), N'Nursing', N'Enfermería', 1),
    (CONVERT(UNIQUEIDENTIFIER, '11111111-1111-1111-1111-111111111009'), N'Counselor', N'Orientador / Psicólogo', 1),
    (CONVERT(UNIQUEIDENTIFIER, '11111111-1111-1111-1111-111111111010'), N'HR', N'RH / Nómina', 1),
    (CONVERT(UNIQUEIDENTIFIER, '11111111-1111-1111-1111-111111111011'), N'Maintenance', N'Mantenimiento', 1),
    (CONVERT(UNIQUEIDENTIFIER, '11111111-1111-1111-1111-111111111012'), N'Auditor', N'Auditor', 1),
    (CONVERT(UNIQUEIDENTIFIER, '11111111-1111-1111-1111-111111111013'), N'Parent', N'Padre / Tutor', 1),
    (CONVERT(UNIQUEIDENTIFIER, '11111111-1111-1111-1111-111111111014'), N'Student', N'Alumno', 1)
) AS source (Id, Code, Name, IsSystem)
ON target.Code = source.Code
WHEN NOT MATCHED THEN
    INSERT (Id, Code, Name, IsSystem) VALUES (source.Id, source.Code, source.Name, source.IsSystem);
GO

MERGE dbo.FeatureFlag AS target
USING (VALUES
    (CONVERT(UNIQUEIDENTIFIER, '22222222-2222-2222-2222-222222222001'), N'StripeModule', N'Global', CAST(0 AS BIT)),
    (CONVERT(UNIQUEIDENTIFIER, '22222222-2222-2222-2222-222222222002'), N'AiAssistant', N'Global', CAST(0 AS BIT)),
    (CONVERT(UNIQUEIDENTIFIER, '22222222-2222-2222-2222-222222222003'), N'ParentPortal', N'Global', CAST(0 AS BIT)),
    (CONVERT(UNIQUEIDENTIFIER, '22222222-2222-2222-2222-222222222004'), N'TeacherPortal', N'Global', CAST(0 AS BIT)),
    (CONVERT(UNIQUEIDENTIFIER, '22222222-2222-2222-2222-222222222005'), N'StudentPortal', N'Global', CAST(0 AS BIT)),
    (CONVERT(UNIQUEIDENTIFIER, '22222222-2222-2222-2222-222222222006'), N'CfdiModule', N'Global', CAST(0 AS BIT)),
    (CONVERT(UNIQUEIDENTIFIER, '22222222-2222-2222-2222-222222222007'), N'AdvancedAcademics', N'Global', CAST(0 AS BIT))
) AS source (Id, FeatureKey, ScopeType, IsEnabled)
ON target.FeatureKey = source.FeatureKey AND target.ScopeType = source.ScopeType AND target.TenantId IS NULL AND target.BranchId IS NULL
WHEN NOT MATCHED THEN
    INSERT (Id, FeatureKey, ScopeType, TenantId, BranchId, IsEnabled)
    VALUES (source.Id, source.FeatureKey, source.ScopeType, NULL, NULL, source.IsEnabled)
WHEN MATCHED THEN
    UPDATE SET IsEnabled = source.IsEnabled, UpdatedAt = SYSUTCDATETIME();
GO

IF NOT EXISTS (SELECT 1 FROM dbo.DatabaseVersion WHERE ScriptName = N'003_SeedRolesAndFeatureFlags.sql')
BEGIN
    INSERT INTO dbo.DatabaseVersion (ScriptName) VALUES (N'003_SeedRolesAndFeatureFlags.sql');
END
GO
