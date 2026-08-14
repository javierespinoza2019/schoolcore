/*
  SchoolCore — SQL Server 2022
  Script: 008_CreateFinanceTables.sql
  Phase 5: Charge, Payment, Expense, CashSession, CashMovement, CashAudit, AuditLog.
  Cash v1 constraints. Idempotent.
*/
USE db_a0b4b3_schoolcore;
GO

IF OBJECT_ID(N'dbo.AuditLog', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditLog
    (
        Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditLog PRIMARY KEY,
        TenantId    UNIQUEIDENTIFIER NOT NULL,
        UserId      UNIQUEIDENTIFIER NULL,
        EntityType  NVARCHAR(50) NOT NULL,
        EntityId    UNIQUEIDENTIFIER NULL,
        Action      NVARCHAR(50) NOT NULL,
        DetailsJson NVARCHAR(MAX) NULL,
        CreatedAt   DATETIME2(3) NOT NULL CONSTRAINT DF_AuditLog_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_AuditLog_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id)
    );

    CREATE INDEX IX_AuditLog_Tenant_Created
        ON dbo.AuditLog (TenantId, CreatedAt DESC);
END
GO

IF OBJECT_ID(N'dbo.Charge', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Charge
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Charge PRIMARY KEY,
        TenantId            UNIQUEIDENTIFIER NOT NULL,
        BranchId            UNIQUEIDENTIFIER NOT NULL,
        StudentId           UNIQUEIDENTIFIER NOT NULL,
        PaymentConceptId    UNIQUEIDENTIFIER NULL,
        ConceptName         NVARCHAR(200) NOT NULL,
        ConceptType         NVARCHAR(50) NOT NULL,
        GrossAmount         DECIMAL(18,2) NOT NULL,
        ScholarshipPercent  DECIMAL(5,2) NOT NULL CONSTRAINT DF_Charge_Scholarship DEFAULT (0),
        NetAmount           DECIMAL(18,2) NOT NULL,
        AmountPaid          DECIMAL(18,2) NOT NULL CONSTRAINT DF_Charge_AmountPaid DEFAULT (0),
        DueDate             DATE NOT NULL,
        Status              NVARCHAR(30) NOT NULL CONSTRAINT DF_Charge_Status DEFAULT (N'pending'), -- pending|paid|overdue (no partial v1)
        SchoolCycleId       UNIQUEIDENTIFIER NULL,
        MoraInfoDays        INT NULL, -- informational only
        IsDeleted           BIT NOT NULL CONSTRAINT DF_Charge_IsDeleted DEFAULT (0),
        CreatedAt           DATETIME2(3) NOT NULL CONSTRAINT DF_Charge_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy           UNIQUEIDENTIFIER NULL,
        UpdatedAt           DATETIME2(3) NULL,
        UpdatedBy           UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_Charge_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id),
        CONSTRAINT FK_Charge_Branch FOREIGN KEY (BranchId) REFERENCES dbo.Branch (Id),
        CONSTRAINT FK_Charge_Student FOREIGN KEY (StudentId) REFERENCES dbo.Student (Id),
        CONSTRAINT FK_Charge_PaymentConcept FOREIGN KEY (PaymentConceptId) REFERENCES dbo.PaymentConcept (Id),
        CONSTRAINT CK_Charge_NoPartial CHECK (AmountPaid = 0 OR AmountPaid = NetAmount)
    );

    CREATE INDEX IX_Charge_Tenant_Student
        ON dbo.Charge (TenantId, StudentId, Status)
        WHERE IsDeleted = 0;

    CREATE INDEX IX_Charge_Tenant_Due
        ON dbo.Charge (TenantId, DueDate, Status)
        WHERE IsDeleted = 0;
END
GO

IF OBJECT_ID(N'dbo.CashSession', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CashSession
    (
        Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_CashSession PRIMARY KEY,
        TenantId        UNIQUEIDENTIFIER NOT NULL,
        BranchId        UNIQUEIDENTIFIER NOT NULL,
        UserId          UNIQUEIDENTIFIER NOT NULL,
        Shift           NVARCHAR(30) NOT NULL CONSTRAINT DF_CashSession_Shift DEFAULT (N'morning'),
        OpenedAt        DATETIME2(3) NOT NULL CONSTRAINT DF_CashSession_OpenedAt DEFAULT (SYSUTCDATETIME()),
        ClosedAt        DATETIME2(3) NULL,
        OpeningAmount   DECIMAL(18,2) NOT NULL CONSTRAINT DF_CashSession_Opening DEFAULT (0),
        TotalIncome     DECIMAL(18,2) NOT NULL CONSTRAINT DF_CashSession_Income DEFAULT (0),
        TotalExpense    DECIMAL(18,2) NOT NULL CONSTRAINT DF_CashSession_Expense DEFAULT (0),
        ClosingAmount   DECIMAL(18,2) NULL,
        DifferenceAmount DECIMAL(18,2) NULL,
        Status          NVARCHAR(30) NOT NULL CONSTRAINT DF_CashSession_Status DEFAULT (N'open'), -- open|closed
        Notes           NVARCHAR(500) NULL,
        IsDeleted       BIT NOT NULL CONSTRAINT DF_CashSession_IsDeleted DEFAULT (0),
        CreatedAt       DATETIME2(3) NOT NULL CONSTRAINT DF_CashSession_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy       UNIQUEIDENTIFIER NULL,
        UpdatedAt       DATETIME2(3) NULL,
        UpdatedBy       UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_CashSession_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id),
        CONSTRAINT FK_CashSession_Branch FOREIGN KEY (BranchId) REFERENCES dbo.Branch (Id),
        CONSTRAINT FK_CashSession_User FOREIGN KEY (UserId) REFERENCES dbo.[User] (Id)
    );

    /* Cash v1: 1 open session per Tenant+Branch+User (+Shift) */
    CREATE UNIQUE INDEX UX_CashSession_Open_PerUserBranchShift
        ON dbo.CashSession (TenantId, BranchId, UserId, Shift)
        WHERE Status = N'open' AND IsDeleted = 0;

    CREATE INDEX IX_CashSession_Tenant_Branch
        ON dbo.CashSession (TenantId, BranchId, OpenedAt DESC)
        WHERE IsDeleted = 0;
END
GO

IF OBJECT_ID(N'dbo.Payment', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Payment
    (
        Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Payment PRIMARY KEY,
        TenantId        UNIQUEIDENTIFIER NOT NULL,
        BranchId        UNIQUEIDENTIFIER NOT NULL,
        StudentId       UNIQUEIDENTIFIER NOT NULL,
        ChargeId        UNIQUEIDENTIFIER NOT NULL,
        CashSessionId   UNIQUEIDENTIFIER NULL,
        PaymentMethodId UNIQUEIDENTIFIER NULL,
        Amount          DECIMAL(18,2) NOT NULL,
        Folio           NVARCHAR(50) NOT NULL,
        PaidAt          DATETIME2(3) NOT NULL CONSTRAINT DF_Payment_PaidAt DEFAULT (SYSUTCDATETIME()),
        Reference       NVARCHAR(100) NULL,
        IdempotencyKey  NVARCHAR(100) NULL,
        Notes           NVARCHAR(500) NULL,
        IsDeleted       BIT NOT NULL CONSTRAINT DF_Payment_IsDeleted DEFAULT (0),
        CreatedAt       DATETIME2(3) NOT NULL CONSTRAINT DF_Payment_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy       UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_Payment_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id),
        CONSTRAINT FK_Payment_Branch FOREIGN KEY (BranchId) REFERENCES dbo.Branch (Id),
        CONSTRAINT FK_Payment_Student FOREIGN KEY (StudentId) REFERENCES dbo.Student (Id),
        CONSTRAINT FK_Payment_Charge FOREIGN KEY (ChargeId) REFERENCES dbo.Charge (Id),
        CONSTRAINT FK_Payment_CashSession FOREIGN KEY (CashSessionId) REFERENCES dbo.CashSession (Id),
        CONSTRAINT FK_Payment_PaymentMethod FOREIGN KEY (PaymentMethodId) REFERENCES dbo.PaymentMethod (Id)
    );

    CREATE UNIQUE INDEX UX_Payment_Tenant_Folio_Active
        ON dbo.Payment (TenantId, Folio)
        WHERE IsDeleted = 0;

    CREATE UNIQUE INDEX UX_Payment_Tenant_Idempotency
        ON dbo.Payment (TenantId, IdempotencyKey)
        WHERE IdempotencyKey IS NOT NULL AND IsDeleted = 0;

    CREATE INDEX IX_Payment_Tenant_Student
        ON dbo.Payment (TenantId, StudentId, PaidAt DESC)
        WHERE IsDeleted = 0;
END
GO

IF OBJECT_ID(N'dbo.Expense', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Expense
    (
        Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Expense PRIMARY KEY,
        TenantId        UNIQUEIDENTIFIER NOT NULL,
        BranchId        UNIQUEIDENTIFIER NOT NULL,
        CashSessionId   UNIQUEIDENTIFIER NULL,
        Concept         NVARCHAR(200) NOT NULL,
        Category        NVARCHAR(100) NOT NULL,
        Amount          DECIMAL(18,2) NOT NULL,
        ExpenseDate     DATE NOT NULL,
        Vendor          NVARCHAR(200) NULL,
        PaymentMethodId UNIQUEIDENTIFIER NULL,
        Reference       NVARCHAR(100) NULL,
        IsDeleted       BIT NOT NULL CONSTRAINT DF_Expense_IsDeleted DEFAULT (0),
        CreatedAt       DATETIME2(3) NOT NULL CONSTRAINT DF_Expense_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy       UNIQUEIDENTIFIER NULL,
        UpdatedAt       DATETIME2(3) NULL,
        UpdatedBy       UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_Expense_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id),
        CONSTRAINT FK_Expense_Branch FOREIGN KEY (BranchId) REFERENCES dbo.Branch (Id),
        CONSTRAINT FK_Expense_CashSession FOREIGN KEY (CashSessionId) REFERENCES dbo.CashSession (Id),
        CONSTRAINT FK_Expense_PaymentMethod FOREIGN KEY (PaymentMethodId) REFERENCES dbo.PaymentMethod (Id)
    );

    CREATE INDEX IX_Expense_Tenant_Branch
        ON dbo.Expense (TenantId, BranchId, ExpenseDate DESC)
        WHERE IsDeleted = 0;
END
GO

IF OBJECT_ID(N'dbo.CashMovement', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CashMovement
    (
        Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_CashMovement PRIMARY KEY,
        TenantId        UNIQUEIDENTIFIER NOT NULL,
        CashSessionId   UNIQUEIDENTIFIER NOT NULL,
        MovementType    NVARCHAR(20) NOT NULL, -- income | expense
        Category        NVARCHAR(100) NOT NULL,
        Concept         NVARCHAR(300) NOT NULL,
        Amount          DECIMAL(18,2) NOT NULL,
        PaymentMethodName NVARCHAR(100) NULL,
        Reference       NVARCHAR(100) NULL,
        StudentId       UNIQUEIDENTIFIER NULL,
        PaymentId       UNIQUEIDENTIFIER NULL,
        ExpenseId       UNIQUEIDENTIFIER NULL,
        OccurredAt      DATETIME2(3) NOT NULL CONSTRAINT DF_CashMovement_OccurredAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy       UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_CashMovement_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id),
        CONSTRAINT FK_CashMovement_Session FOREIGN KEY (CashSessionId) REFERENCES dbo.CashSession (Id)
    );

    CREATE INDEX IX_CashMovement_Session
        ON dbo.CashMovement (TenantId, CashSessionId, OccurredAt);
END
GO

IF OBJECT_ID(N'dbo.CashAudit', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CashAudit
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_CashAudit PRIMARY KEY,
        TenantId            UNIQUEIDENTIFIER NOT NULL,
        CashSessionId       UNIQUEIDENTIFIER NOT NULL,
        BillsJson           NVARCHAR(MAX) NULL,
        CoinsJson           NVARCHAR(MAX) NULL,
        TotalCash           DECIMAL(18,2) NOT NULL CONSTRAINT DF_CashAudit_Cash DEFAULT (0),
        TotalCard           DECIMAL(18,2) NOT NULL CONSTRAINT DF_CashAudit_Card DEFAULT (0),
        TotalTransfer       DECIMAL(18,2) NOT NULL CONSTRAINT DF_CashAudit_Transfer DEFAULT (0),
        TotalCheck          DECIMAL(18,2) NOT NULL CONSTRAINT DF_CashAudit_Check DEFAULT (0),
        SystemTotal         DECIMAL(18,2) NOT NULL,
        DifferenceAmount    DECIMAL(18,2) NOT NULL,
        Observations        NVARCHAR(1000) NULL,
        CreatedAt           DATETIME2(3) NOT NULL CONSTRAINT DF_CashAudit_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy           UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_CashAudit_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id),
        CONSTRAINT FK_CashAudit_Session FOREIGN KEY (CashSessionId) REFERENCES dbo.CashSession (Id)
    );

    CREATE UNIQUE INDEX UX_CashAudit_Session
        ON dbo.CashAudit (TenantId, CashSessionId);
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.DatabaseVersion WHERE ScriptName = N'008_CreateFinanceTables.sql')
BEGIN
    INSERT INTO dbo.DatabaseVersion (ScriptName) VALUES (N'008_CreateFinanceTables.sql');
END
GO
