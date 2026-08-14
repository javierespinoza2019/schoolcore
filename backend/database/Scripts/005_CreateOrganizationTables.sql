/*
  SchoolCore — SQL Server 2022
  Script: 005_CreateOrganizationTables.sql
  Phase 2: Branch extras, SchoolCycle, InstitutionSettings, PaymentMethod,
  PaymentConcept (+ amounts), EducationLevel, TenantSequence.
  Idempotent.
*/
USE db_a0b4b3_schoolcore;
GO

/* --- Branch extras (address / contact) --- */
IF COL_LENGTH(N'dbo.Branch', N'Address') IS NULL
    ALTER TABLE dbo.Branch ADD Address NVARCHAR(300) NULL;
IF COL_LENGTH(N'dbo.Branch', N'City') IS NULL
    ALTER TABLE dbo.Branch ADD City NVARCHAR(100) NULL;
IF COL_LENGTH(N'dbo.Branch', N'State') IS NULL
    ALTER TABLE dbo.Branch ADD [State] NVARCHAR(100) NULL;
IF COL_LENGTH(N'dbo.Branch', N'PostalCode') IS NULL
    ALTER TABLE dbo.Branch ADD PostalCode NVARCHAR(20) NULL;
IF COL_LENGTH(N'dbo.Branch', N'Phone') IS NULL
    ALTER TABLE dbo.Branch ADD Phone NVARCHAR(50) NULL;
IF COL_LENGTH(N'dbo.Branch', N'Email') IS NULL
    ALTER TABLE dbo.Branch ADD Email NVARCHAR(256) NULL;
GO

IF OBJECT_ID(N'dbo.SchoolCycle', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SchoolCycle
    (
        Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_SchoolCycle PRIMARY KEY,
        TenantId    UNIQUEIDENTIFIER NOT NULL,
        Name        NVARCHAR(200) NOT NULL,
        StartDate   DATE NOT NULL,
        EndDate     DATE NOT NULL,
        IsActive    BIT NOT NULL CONSTRAINT DF_SchoolCycle_IsActive DEFAULT (0),
        IsDeleted   BIT NOT NULL CONSTRAINT DF_SchoolCycle_IsDeleted DEFAULT (0),
        CreatedAt   DATETIME2(3) NOT NULL CONSTRAINT DF_SchoolCycle_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy   UNIQUEIDENTIFIER NULL,
        UpdatedAt   DATETIME2(3) NULL,
        UpdatedBy   UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_SchoolCycle_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id)
    );

    CREATE INDEX IX_SchoolCycle_Tenant_Active
        ON dbo.SchoolCycle (TenantId, IsActive)
        WHERE IsDeleted = 0;
END
GO

IF OBJECT_ID(N'dbo.InstitutionSettings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.InstitutionSettings
    (
        TenantId       UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_InstitutionSettings PRIMARY KEY,
        DisplayName    NVARCHAR(200) NOT NULL,
        LegalName      NVARCHAR(300) NULL,
        TaxId          NVARCHAR(50) NULL,
        Phone          NVARCHAR(50) NULL,
        Email          NVARCHAR(256) NULL,
        Website        NVARCHAR(300) NULL,
        Address        NVARCHAR(400) NULL,
        LogoUrl        NVARCHAR(500) NULL,
        PrimaryColor   NVARCHAR(20) NULL,
        UpdatedAt      DATETIME2(3) NULL,
        UpdatedBy      UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_InstitutionSettings_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.EducationLevel', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.EducationLevel
    (
        Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_EducationLevel PRIMARY KEY,
        TenantId    UNIQUEIDENTIFIER NOT NULL,
        Name        NVARCHAR(100) NOT NULL,
        Code        NVARCHAR(50) NOT NULL,
        GradeCount  INT NOT NULL CONSTRAINT DF_EducationLevel_GradeCount DEFAULT (0),
        SortOrder   INT NOT NULL CONSTRAINT DF_EducationLevel_SortOrder DEFAULT (0),
        IsActive    BIT NOT NULL CONSTRAINT DF_EducationLevel_IsActive DEFAULT (1),
        IsDeleted   BIT NOT NULL CONSTRAINT DF_EducationLevel_IsDeleted DEFAULT (0),
        CreatedAt   DATETIME2(3) NOT NULL CONSTRAINT DF_EducationLevel_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy   UNIQUEIDENTIFIER NULL,
        UpdatedAt   DATETIME2(3) NULL,
        UpdatedBy   UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_EducationLevel_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id)
    );

    CREATE UNIQUE INDEX UX_EducationLevel_Tenant_Code_Active
        ON dbo.EducationLevel (TenantId, Code)
        WHERE IsDeleted = 0;
END
GO

IF OBJECT_ID(N'dbo.PaymentMethod', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PaymentMethod
    (
        Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PaymentMethod PRIMARY KEY,
        TenantId    UNIQUEIDENTIFIER NOT NULL,
        Name        NVARCHAR(150) NOT NULL,
        Info        NVARCHAR(500) NULL,
        IsActive    BIT NOT NULL CONSTRAINT DF_PaymentMethod_IsActive DEFAULT (1),
        IsDeleted   BIT NOT NULL CONSTRAINT DF_PaymentMethod_IsDeleted DEFAULT (0),
        SortOrder   INT NOT NULL CONSTRAINT DF_PaymentMethod_SortOrder DEFAULT (0),
        CreatedAt   DATETIME2(3) NOT NULL CONSTRAINT DF_PaymentMethod_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy   UNIQUEIDENTIFIER NULL,
        UpdatedAt   DATETIME2(3) NULL,
        UpdatedBy   UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_PaymentMethod_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id)
    );

    CREATE INDEX IX_PaymentMethod_Tenant
        ON dbo.PaymentMethod (TenantId)
        WHERE IsDeleted = 0;
END
GO

IF OBJECT_ID(N'dbo.PaymentConcept', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PaymentConcept
    (
        Id                      UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PaymentConcept PRIMARY KEY,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        Name                    NVARCHAR(200) NOT NULL,
        ConceptType             NVARCHAR(50) NOT NULL, -- mensual | unico | anual | other
        DefaultAmount           DECIMAL(18,2) NOT NULL CONSTRAINT DF_PaymentConcept_DefaultAmount DEFAULT (0),
        DifferentiatedByLevel   BIT NOT NULL CONSTRAINT DF_PaymentConcept_Diff DEFAULT (0),
        IsActive                BIT NOT NULL CONSTRAINT DF_PaymentConcept_IsActive DEFAULT (1),
        IsDeleted               BIT NOT NULL CONSTRAINT DF_PaymentConcept_IsDeleted DEFAULT (0),
        CreatedAt               DATETIME2(3) NOT NULL CONSTRAINT DF_PaymentConcept_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy               UNIQUEIDENTIFIER NULL,
        UpdatedAt               DATETIME2(3) NULL,
        UpdatedBy               UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_PaymentConcept_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id)
    );

    CREATE INDEX IX_PaymentConcept_Tenant
        ON dbo.PaymentConcept (TenantId)
        WHERE IsDeleted = 0;
END
GO

IF OBJECT_ID(N'dbo.PaymentConceptAmount', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PaymentConceptAmount
    (
        Id               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PaymentConceptAmount PRIMARY KEY,
        TenantId         UNIQUEIDENTIFIER NOT NULL,
        PaymentConceptId UNIQUEIDENTIFIER NOT NULL,
        EducationLevelId UNIQUEIDENTIFIER NOT NULL,
        Amount           DECIMAL(18,2) NOT NULL,
        CONSTRAINT FK_PaymentConceptAmount_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id),
        CONSTRAINT FK_PaymentConceptAmount_Concept FOREIGN KEY (PaymentConceptId) REFERENCES dbo.PaymentConcept (Id),
        CONSTRAINT FK_PaymentConceptAmount_Level FOREIGN KEY (EducationLevelId) REFERENCES dbo.EducationLevel (Id)
    );

    CREATE UNIQUE INDEX UX_PaymentConceptAmount_Concept_Level
        ON dbo.PaymentConceptAmount (TenantId, PaymentConceptId, EducationLevelId);
END
GO

/* Contadores race-safe por tenant (matrículas, folios, etc.) */
IF OBJECT_ID(N'dbo.TenantSequence', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantSequence
    (
        TenantId     UNIQUEIDENTIFIER NOT NULL,
        SequenceKey  NVARCHAR(50) NOT NULL,
        NextValue    BIGINT NOT NULL CONSTRAINT DF_TenantSequence_NextValue DEFAULT (1),
        Prefix       NVARCHAR(20) NULL,
        UpdatedAt    DATETIME2(3) NOT NULL CONSTRAINT DF_TenantSequence_UpdatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_TenantSequence PRIMARY KEY (TenantId, SequenceKey),
        CONSTRAINT FK_TenantSequence_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.DatabaseVersion WHERE ScriptName = N'005_CreateOrganizationTables.sql')
BEGIN
    INSERT INTO dbo.DatabaseVersion (ScriptName) VALUES (N'005_CreateOrganizationTables.sql');
END
GO
