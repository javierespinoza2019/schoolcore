/*
  SchoolCore — SQL Server 2022
  Script: 002_CreateCoreTables.sql
  Core tenancy, identity skeleton, feature flags, email templates metadata.
  Idempotent where possible.
*/
USE db_a0b4b3_schoolcore;
GO

IF OBJECT_ID(N'dbo.Tenant', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tenant
    (
        Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Tenant PRIMARY KEY,
        Code        NVARCHAR(50) NOT NULL,
        Name        NVARCHAR(200) NOT NULL,
        IsActive    BIT NOT NULL CONSTRAINT DF_Tenant_IsActive DEFAULT (1),
        CreatedAt   DATETIME2(3) NOT NULL CONSTRAINT DF_Tenant_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_Tenant_Code UNIQUE (Code)
    );
END
GO

IF OBJECT_ID(N'dbo.[User]', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.[User]
    (
        Id                 UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_User PRIMARY KEY,
        TenantId           UNIQUEIDENTIFIER NOT NULL,
        Email              NVARCHAR(256) NOT NULL,
        PasswordHash       NVARCHAR(500) NOT NULL,
        FirstName          NVARCHAR(100) NOT NULL,
        LastName           NVARCHAR(100) NOT NULL,
        IsActive           BIT NOT NULL CONSTRAINT DF_User_IsActive DEFAULT (1),
        AccessFailedCount  INT NOT NULL CONSTRAINT DF_User_AccessFailedCount DEFAULT (0),
        LockoutEndUtc      DATETIME2(3) NULL,
        LastLoginAt        DATETIME2(3) NULL,
        IsDeleted          BIT NOT NULL CONSTRAINT DF_User_IsDeleted DEFAULT (0),
        CreatedAt          DATETIME2(3) NOT NULL CONSTRAINT DF_User_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy          UNIQUEIDENTIFIER NULL,
        UpdatedAt          DATETIME2(3) NULL,
        UpdatedBy          UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_User_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id)
    );

    CREATE UNIQUE INDEX UX_User_Tenant_Email_Active
        ON dbo.[User] (TenantId, Email)
        WHERE IsDeleted = 0;
END
GO

IF OBJECT_ID(N'dbo.Role', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Role
    (
        Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Role PRIMARY KEY,
        Code        NVARCHAR(50) NOT NULL,
        Name        NVARCHAR(100) NOT NULL,
        IsSystem    BIT NOT NULL CONSTRAINT DF_Role_IsSystem DEFAULT (1),
        CONSTRAINT UQ_Role_Code UNIQUE (Code)
    );
END
GO

IF OBJECT_ID(N'dbo.UserRole', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserRole
    (
        UserId UNIQUEIDENTIFIER NOT NULL,
        RoleId UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT PK_UserRole PRIMARY KEY (UserId, RoleId),
        CONSTRAINT FK_UserRole_User FOREIGN KEY (UserId) REFERENCES dbo.[User] (Id),
        CONSTRAINT FK_UserRole_Role FOREIGN KEY (RoleId) REFERENCES dbo.Role (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.Branch', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Branch
    (
        Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Branch PRIMARY KEY,
        TenantId    UNIQUEIDENTIFIER NOT NULL,
        Name        NVARCHAR(200) NOT NULL,
        Code        NVARCHAR(50) NOT NULL,
        IsActive    BIT NOT NULL CONSTRAINT DF_Branch_IsActive DEFAULT (1),
        IsDeleted   BIT NOT NULL CONSTRAINT DF_Branch_IsDeleted DEFAULT (0),
        CreatedAt   DATETIME2(3) NOT NULL CONSTRAINT DF_Branch_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy   UNIQUEIDENTIFIER NULL,
        UpdatedAt   DATETIME2(3) NULL,
        UpdatedBy   UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_Branch_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id)
    );

    CREATE UNIQUE INDEX UX_Branch_Tenant_Code_Active
        ON dbo.Branch (TenantId, Code)
        WHERE IsDeleted = 0;
END
GO

IF OBJECT_ID(N'dbo.UserBranch', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserBranch
    (
        UserId   UNIQUEIDENTIFIER NOT NULL,
        BranchId UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT PK_UserBranch PRIMARY KEY (UserId, BranchId),
        CONSTRAINT FK_UserBranch_User FOREIGN KEY (UserId) REFERENCES dbo.[User] (Id),
        CONSTRAINT FK_UserBranch_Branch FOREIGN KEY (BranchId) REFERENCES dbo.Branch (Id)
    );
END
GO

IF OBJECT_ID(N'dbo.FeatureFlag', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FeatureFlag
    (
        Id         UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_FeatureFlag PRIMARY KEY,
        FeatureKey NVARCHAR(100) NOT NULL,
        ScopeType  NVARCHAR(20) NOT NULL, -- Global | Tenant | Branch
        TenantId   UNIQUEIDENTIFIER NULL,
        BranchId   UNIQUEIDENTIFIER NULL,
        IsEnabled  BIT NOT NULL,
        CreatedAt  DATETIME2(3) NOT NULL CONSTRAINT DF_FeatureFlag_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt  DATETIME2(3) NULL
    );

    CREATE UNIQUE INDEX UX_FeatureFlag_Scope
        ON dbo.FeatureFlag (FeatureKey, ScopeType, TenantId, BranchId);
END
GO

IF OBJECT_ID(N'dbo.EmailTemplate', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.EmailTemplate
    (
        Id           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_EmailTemplate PRIMARY KEY,
        TenantId     UNIQUEIDENTIFIER NULL, -- NULL = platform default
        TemplateKey  NVARCHAR(100) NOT NULL,
        Culture      NVARCHAR(10) NOT NULL CONSTRAINT DF_EmailTemplate_Culture DEFAULT (N'es'),
        Subject      NVARCHAR(300) NOT NULL,
        HtmlBody     NVARCHAR(MAX) NOT NULL,
        LogoUrl      NVARCHAR(500) NULL,
        PrimaryColor NVARCHAR(20) NULL,
        IsActive     BIT NOT NULL CONSTRAINT DF_EmailTemplate_IsActive DEFAULT (1),
        CreatedAt    DATETIME2(3) NOT NULL CONSTRAINT DF_EmailTemplate_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt    DATETIME2(3) NULL
    );

    CREATE UNIQUE INDEX UX_EmailTemplate_Tenant_Key_Culture
        ON dbo.EmailTemplate (TemplateKey, Culture, TenantId);
END
GO

IF OBJECT_ID(N'dbo.DatabaseVersion', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DatabaseVersion
    (
        VersionId   INT NOT NULL IDENTITY(1,1) CONSTRAINT PK_DatabaseVersion PRIMARY KEY,
        ScriptName  NVARCHAR(200) NOT NULL,
        AppliedAt   DATETIME2(3) NOT NULL CONSTRAINT DF_DatabaseVersion_AppliedAt DEFAULT (SYSUTCDATETIME())
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.DatabaseVersion WHERE ScriptName = N'002_CreateCoreTables.sql')
BEGIN
    INSERT INTO dbo.DatabaseVersion (ScriptName) VALUES (N'002_CreateCoreTables.sql');
END
GO
