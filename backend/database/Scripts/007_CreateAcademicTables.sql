/*
  SchoolCore — SQL Server 2022
  Script: 007_CreateAcademicTables.sql
  Phase 4: Teacher, Classroom, Enrollment (+ wizard snapshot).
  Idempotent.
*/
USE db_a0b4b3_schoolcore;
GO

IF OBJECT_ID(N'dbo.Teacher', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Teacher
    (
        Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Teacher PRIMARY KEY,
        TenantId        UNIQUEIDENTIFIER NOT NULL,
        BranchId        UNIQUEIDENTIFIER NOT NULL,
        FirstName       NVARCHAR(100) NOT NULL,
        LastName        NVARCHAR(100) NOT NULL,
        Email           NVARCHAR(256) NULL,
        Phone           NVARCHAR(50) NULL,
        Specialty       NVARCHAR(150) NULL,
        SubjectsJson    NVARCHAR(MAX) NULL,
        EmploymentType  NVARCHAR(50) NULL,
        MonthlySalary   DECIMAL(18,2) NULL,
        EducationLevelId UNIQUEIDENTIFIER NULL,
        Status          NVARCHAR(30) NOT NULL CONSTRAINT DF_Teacher_Status DEFAULT (N'active'),
        HireDate        DATE NULL,
        ScheduleNotes   NVARCHAR(500) NULL,
        IsDeleted       BIT NOT NULL CONSTRAINT DF_Teacher_IsDeleted DEFAULT (0),
        CreatedAt       DATETIME2(3) NOT NULL CONSTRAINT DF_Teacher_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy       UNIQUEIDENTIFIER NULL,
        UpdatedAt       DATETIME2(3) NULL,
        UpdatedBy       UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_Teacher_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id),
        CONSTRAINT FK_Teacher_Branch FOREIGN KEY (BranchId) REFERENCES dbo.Branch (Id),
        CONSTRAINT FK_Teacher_EducationLevel FOREIGN KEY (EducationLevelId) REFERENCES dbo.EducationLevel (Id)
    );

    CREATE INDEX IX_Teacher_Tenant_Branch
        ON dbo.Teacher (TenantId, BranchId)
        WHERE IsDeleted = 0;
END
GO

IF OBJECT_ID(N'dbo.Classroom', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Classroom
    (
        Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Classroom PRIMARY KEY,
        TenantId        UNIQUEIDENTIFIER NOT NULL,
        BranchId        UNIQUEIDENTIFIER NOT NULL,
        Name            NVARCHAR(100) NOT NULL,
        EducationLevelId UNIQUEIDENTIFIER NULL,
        Grade           NVARCHAR(50) NULL,
        GroupCode       NVARCHAR(50) NULL,
        Capacity        INT NOT NULL CONSTRAINT DF_Classroom_Capacity DEFAULT (0),
        Occupied        INT NOT NULL CONSTRAINT DF_Classroom_Occupied DEFAULT (0),
        RoomType        NVARCHAR(50) NULL,
        Building        NVARCHAR(100) NULL,
        FloorNumber     INT NULL,
        Status          NVARCHAR(30) NOT NULL CONSTRAINT DF_Classroom_Status DEFAULT (N'available'),
        TeacherId       UNIQUEIDENTIFIER NULL,
        ScheduleNotes   NVARCHAR(500) NULL,
        EquipmentJson   NVARCHAR(MAX) NULL,
        IsDeleted       BIT NOT NULL CONSTRAINT DF_Classroom_IsDeleted DEFAULT (0),
        CreatedAt       DATETIME2(3) NOT NULL CONSTRAINT DF_Classroom_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy       UNIQUEIDENTIFIER NULL,
        UpdatedAt       DATETIME2(3) NULL,
        UpdatedBy       UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_Classroom_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id),
        CONSTRAINT FK_Classroom_Branch FOREIGN KEY (BranchId) REFERENCES dbo.Branch (Id),
        CONSTRAINT FK_Classroom_EducationLevel FOREIGN KEY (EducationLevelId) REFERENCES dbo.EducationLevel (Id),
        CONSTRAINT FK_Classroom_Teacher FOREIGN KEY (TeacherId) REFERENCES dbo.Teacher (Id)
    );

    CREATE INDEX IX_Classroom_Tenant_Branch
        ON dbo.Classroom (TenantId, BranchId)
        WHERE IsDeleted = 0;
END
GO

/* FK Student.ClassroomId after Classroom exists */
IF COL_LENGTH(N'dbo.Student', N'ClassroomId') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Student_Classroom'
   )
BEGIN
    ALTER TABLE dbo.Student
        ADD CONSTRAINT FK_Student_Classroom FOREIGN KEY (ClassroomId) REFERENCES dbo.Classroom (Id);
END
GO

IF OBJECT_ID(N'dbo.Enrollment', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Enrollment
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Enrollment PRIMARY KEY,
        TenantId            UNIQUEIDENTIFIER NOT NULL,
        BranchId            UNIQUEIDENTIFIER NOT NULL,
        SchoolCycleId       UNIQUEIDENTIFIER NOT NULL,
        StudentId           UNIQUEIDENTIFIER NULL,
        EnrollmentNumber    NVARCHAR(50) NOT NULL,
        Status              NVARCHAR(30) NOT NULL CONSTRAINT DF_Enrollment_Status DEFAULT (N'draft'),
        -- Wizard 5-step snapshot (JSON) for persistence mid-flow
        Step1StudentJson    NVARCHAR(MAX) NULL,
        Step2GuardiansJson  NVARCHAR(MAX) NULL,
        Step3AcademicJson   NVARCHAR(MAX) NULL,
        Step4DocumentsJson  NVARCHAR(MAX) NULL,
        Step5FinanceJson    NVARCHAR(MAX) NULL,
        CurrentStep         INT NOT NULL CONSTRAINT DF_Enrollment_CurrentStep DEFAULT (1),
        CompletedAt         DATETIME2(3) NULL,
        IsDeleted           BIT NOT NULL CONSTRAINT DF_Enrollment_IsDeleted DEFAULT (0),
        CreatedAt           DATETIME2(3) NOT NULL CONSTRAINT DF_Enrollment_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy           UNIQUEIDENTIFIER NULL,
        UpdatedAt           DATETIME2(3) NULL,
        UpdatedBy           UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_Enrollment_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id),
        CONSTRAINT FK_Enrollment_Branch FOREIGN KEY (BranchId) REFERENCES dbo.Branch (Id),
        CONSTRAINT FK_Enrollment_SchoolCycle FOREIGN KEY (SchoolCycleId) REFERENCES dbo.SchoolCycle (Id),
        CONSTRAINT FK_Enrollment_Student FOREIGN KEY (StudentId) REFERENCES dbo.Student (Id)
    );

    CREATE UNIQUE INDEX UX_Enrollment_Tenant_Number_Active
        ON dbo.Enrollment (TenantId, EnrollmentNumber)
        WHERE IsDeleted = 0;

    CREATE INDEX IX_Enrollment_Tenant_Status
        ON dbo.Enrollment (TenantId, Status)
        WHERE IsDeleted = 0;
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.DatabaseVersion WHERE ScriptName = N'007_CreateAcademicTables.sql')
BEGIN
    INSERT INTO dbo.DatabaseVersion (ScriptName) VALUES (N'007_CreateAcademicTables.sql');
END
GO
