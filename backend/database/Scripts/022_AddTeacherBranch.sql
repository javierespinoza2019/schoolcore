/*
  SchoolCore — SQL Server 2022
  Script: 022_AddTeacherBranch.sql
  Profesor ↔ N sucursales (misma idea que UserBranch).
  Conserva Teacher.BranchId como sucursal casa.
  Idempotente.
*/
USE db_a0b4b3_schoolcore;
GO

IF OBJECT_ID(N'dbo.TeacherBranch', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TeacherBranch
    (
        TeacherId UNIQUEIDENTIFIER NOT NULL,
        BranchId  UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT PK_TeacherBranch PRIMARY KEY (TeacherId, BranchId),
        CONSTRAINT FK_TeacherBranch_Teacher FOREIGN KEY (TeacherId) REFERENCES dbo.Teacher (Id),
        CONSTRAINT FK_TeacherBranch_Branch FOREIGN KEY (BranchId) REFERENCES dbo.Branch (Id)
    );

    CREATE INDEX IX_TeacherBranch_Branch
        ON dbo.TeacherBranch (BranchId);
END
GO

IF OBJECT_ID(N'dbo.Teacher', N'U') IS NOT NULL AND OBJECT_ID(N'dbo.TeacherBranch', N'U') IS NOT NULL
BEGIN
    INSERT INTO dbo.TeacherBranch (TeacherId, BranchId)
    SELECT t.Id, t.BranchId
    FROM dbo.Teacher t
    WHERE t.IsDeleted = 0
      AND NOT EXISTS (
          SELECT 1 FROM dbo.TeacherBranch tb
          WHERE tb.TeacherId = t.Id AND tb.BranchId = t.BranchId
      );
END
GO

IF OBJECT_ID(N'dbo.DatabaseVersion', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.DatabaseVersion WHERE ScriptName = N'022_AddTeacherBranch.sql')
    INSERT INTO dbo.DatabaseVersion (ScriptName) VALUES (N'022_AddTeacherBranch.sql');
GO
