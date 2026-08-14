/*
  SchoolCore — SQL Server 2022
  Script: 006_CreatePeopleTables.sql
  Phase 3: Student, Guardian, StudentGuardian, Document, TimelineEvent.
  Idempotent.
*/
USE db_a0b4b3_schoolcore;
GO

IF OBJECT_ID(N'dbo.Student', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Student
    (
        Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Student PRIMARY KEY,
        TenantId        UNIQUEIDENTIFIER NOT NULL,
        BranchId        UNIQUEIDENTIFIER NOT NULL,
        EnrollmentNumber NVARCHAR(50) NOT NULL,
        FirstName       NVARCHAR(100) NOT NULL,
        LastName        NVARCHAR(100) NOT NULL,
        Gender          CHAR(1) NULL, -- M | F | O
        BirthDate       DATE NULL,
        Email           NVARCHAR(256) NULL,
        Phone           NVARCHAR(50) NULL,
        Address         NVARCHAR(400) NULL,
        EducationLevelId UNIQUEIDENTIFIER NULL,
        Grade           NVARCHAR(50) NULL,
        GroupCode       NVARCHAR(50) NULL,
        Status          NVARCHAR(30) NOT NULL CONSTRAINT DF_Student_Status DEFAULT (N'active'),
        EnrollmentDate  DATE NULL,
        BloodType       NVARCHAR(10) NULL,
        Allergies       NVARCHAR(500) NULL,
        MedicalNotes    NVARCHAR(1000) NULL,
        ScholarshipPercent DECIMAL(5,2) NOT NULL CONSTRAINT DF_Student_Scholarship DEFAULT (0),
        SchoolCycleId   UNIQUEIDENTIFIER NULL,
        ClassroomId     UNIQUEIDENTIFIER NULL,
        IsDeleted       BIT NOT NULL CONSTRAINT DF_Student_IsDeleted DEFAULT (0),
        CreatedAt       DATETIME2(3) NOT NULL CONSTRAINT DF_Student_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy       UNIQUEIDENTIFIER NULL,
        UpdatedAt       DATETIME2(3) NULL,
        UpdatedBy       UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_Student_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id),
        CONSTRAINT FK_Student_Branch FOREIGN KEY (BranchId) REFERENCES dbo.Branch (Id),
        CONSTRAINT FK_Student_EducationLevel FOREIGN KEY (EducationLevelId) REFERENCES dbo.EducationLevel (Id),
        CONSTRAINT FK_Student_SchoolCycle FOREIGN KEY (SchoolCycleId) REFERENCES dbo.SchoolCycle (Id)
    );

    CREATE UNIQUE INDEX UX_Student_Tenant_Enrollment_Active
        ON dbo.Student (TenantId, EnrollmentNumber)
        WHERE IsDeleted = 0;

    CREATE INDEX IX_Student_Tenant_Branch
        ON dbo.Student (TenantId, BranchId)
        WHERE IsDeleted = 0;

    CREATE INDEX IX_Student_Tenant_Status
        ON dbo.Student (TenantId, Status)
        WHERE IsDeleted = 0;
END
GO

IF OBJECT_ID(N'dbo.Guardian', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Guardian
    (
        Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Guardian PRIMARY KEY,
        TenantId    UNIQUEIDENTIFIER NOT NULL,
        FirstName   NVARCHAR(100) NOT NULL,
        LastName    NVARCHAR(100) NOT NULL,
        Email       NVARCHAR(256) NULL,
        Phone       NVARCHAR(50) NULL,
        Occupation  NVARCHAR(150) NULL,
        Address     NVARCHAR(400) NULL,
        Status      NVARCHAR(30) NOT NULL CONSTRAINT DF_Guardian_Status DEFAULT (N'active'),
        IsDeleted   BIT NOT NULL CONSTRAINT DF_Guardian_IsDeleted DEFAULT (0),
        CreatedAt   DATETIME2(3) NOT NULL CONSTRAINT DF_Guardian_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy   UNIQUEIDENTIFIER NULL,
        UpdatedAt   DATETIME2(3) NULL,
        UpdatedBy   UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_Guardian_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id)
    );

    CREATE INDEX IX_Guardian_Tenant
        ON dbo.Guardian (TenantId)
        WHERE IsDeleted = 0;
END
GO

IF OBJECT_ID(N'dbo.StudentGuardian', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.StudentGuardian
    (
        StudentId    UNIQUEIDENTIFIER NOT NULL,
        GuardianId   UNIQUEIDENTIFIER NOT NULL,
        TenantId     UNIQUEIDENTIFIER NOT NULL,
        Relationship NVARCHAR(50) NOT NULL,
        IsPrimary    BIT NOT NULL CONSTRAINT DF_StudentGuardian_IsPrimary DEFAULT (0),
        CreatedAt    DATETIME2(3) NOT NULL CONSTRAINT DF_StudentGuardian_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_StudentGuardian PRIMARY KEY (StudentId, GuardianId),
        CONSTRAINT FK_StudentGuardian_Student FOREIGN KEY (StudentId) REFERENCES dbo.Student (Id),
        CONSTRAINT FK_StudentGuardian_Guardian FOREIGN KEY (GuardianId) REFERENCES dbo.Guardian (Id),
        CONSTRAINT FK_StudentGuardian_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.Document', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Document
    (
        Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Document PRIMARY KEY,
        TenantId        UNIQUEIDENTIFIER NOT NULL,
        FileId          UNIQUEIDENTIFIER NOT NULL,
        UploaderUserId  UNIQUEIDENTIFIER NOT NULL,
        EntityType      NVARCHAR(50) NOT NULL, -- Student | Guardian | Teacher | Other
        EntityId        UNIQUEIDENTIFIER NOT NULL,
        OriginalFileName NVARCHAR(260) NOT NULL,
        ContentType     NVARCHAR(100) NOT NULL,
        Extension       NVARCHAR(10) NOT NULL,
        SizeBytes       BIGINT NOT NULL,
        RelativePath    NVARCHAR(500) NOT NULL,
        Status          NVARCHAR(30) NOT NULL CONSTRAINT DF_Document_Status DEFAULT (N'pending'),
        IsDeleted       BIT NOT NULL CONSTRAINT DF_Document_IsDeleted DEFAULT (0),
        CreatedAt       DATETIME2(3) NOT NULL CONSTRAINT DF_Document_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy       UNIQUEIDENTIFIER NULL,
        DeletedAt       DATETIME2(3) NULL,
        DeletedBy       UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_Document_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id),
        CONSTRAINT FK_Document_Uploader FOREIGN KEY (UploaderUserId) REFERENCES dbo.[User] (Id)
    );

    CREATE UNIQUE INDEX UX_Document_Tenant_FileId
        ON dbo.Document (TenantId, FileId)
        WHERE IsDeleted = 0;

    CREATE INDEX IX_Document_Tenant_Entity
        ON dbo.Document (TenantId, EntityType, EntityId)
        WHERE IsDeleted = 0;
END
GO

IF OBJECT_ID(N'dbo.TimelineEvent', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TimelineEvent
    (
        Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_TimelineEvent PRIMARY KEY,
        TenantId    UNIQUEIDENTIFIER NOT NULL,
        EntityType  NVARCHAR(50) NOT NULL,
        EntityId    UNIQUEIDENTIFIER NOT NULL,
        EventDate   DATETIME2(3) NOT NULL,
        Title       NVARCHAR(200) NOT NULL,
        Description NVARCHAR(1000) NULL,
        Icon        NVARCHAR(50) NULL,
        Badge       NVARCHAR(50) NULL,
        IsDeleted   BIT NOT NULL CONSTRAINT DF_TimelineEvent_IsDeleted DEFAULT (0),
        CreatedAt   DATETIME2(3) NOT NULL CONSTRAINT DF_TimelineEvent_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy   UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_TimelineEvent_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id)
    );

    CREATE INDEX IX_TimelineEvent_Tenant_Entity
        ON dbo.TimelineEvent (TenantId, EntityType, EntityId, EventDate DESC)
        WHERE IsDeleted = 0;
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.DatabaseVersion WHERE ScriptName = N'006_CreatePeopleTables.sql')
BEGIN
    INSERT INTO dbo.DatabaseVersion (ScriptName) VALUES (N'006_CreatePeopleTables.sql');
END
GO
