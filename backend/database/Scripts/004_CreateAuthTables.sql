/*
  SchoolCore — SQL Server 2022
  Script: 004_CreateAuthTables.sql
  Refresh tokens and password-reset tokens for Phase 1 auth.
  Idempotent.
*/
USE db_a0b4b3_schoolcore;
GO

IF OBJECT_ID(N'dbo.RefreshToken', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RefreshToken
    (
        Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_RefreshToken PRIMARY KEY,
        TenantId    UNIQUEIDENTIFIER NOT NULL,
        UserId      UNIQUEIDENTIFIER NOT NULL,
        TokenHash   NVARCHAR(128) NOT NULL,
        ExpiresAt   DATETIME2(3) NOT NULL,
        RevokedAt   DATETIME2(3) NULL,
        CreatedAt   DATETIME2(3) NOT NULL CONSTRAINT DF_RefreshToken_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedByIp NVARCHAR(45) NULL,
        CONSTRAINT FK_RefreshToken_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id),
        CONSTRAINT FK_RefreshToken_User FOREIGN KEY (UserId) REFERENCES dbo.[User] (Id)
    );

    CREATE UNIQUE INDEX UX_RefreshToken_TokenHash
        ON dbo.RefreshToken (TokenHash);

    CREATE INDEX IX_RefreshToken_Tenant_User
        ON dbo.RefreshToken (TenantId, UserId)
        INCLUDE (ExpiresAt, RevokedAt);
END
GO

IF OBJECT_ID(N'dbo.PasswordResetToken', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PasswordResetToken
    (
        Id        UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PasswordResetToken PRIMARY KEY,
        TenantId  UNIQUEIDENTIFIER NOT NULL,
        UserId    UNIQUEIDENTIFIER NOT NULL,
        TokenHash NVARCHAR(128) NOT NULL,
        ExpiresAt DATETIME2(3) NOT NULL,
        UsedAt    DATETIME2(3) NULL,
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_PasswordResetToken_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_PasswordResetToken_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id),
        CONSTRAINT FK_PasswordResetToken_User FOREIGN KEY (UserId) REFERENCES dbo.[User] (Id)
    );

    CREATE UNIQUE INDEX UX_PasswordResetToken_TokenHash
        ON dbo.PasswordResetToken (TokenHash);

    CREATE INDEX IX_PasswordResetToken_Tenant_User
        ON dbo.PasswordResetToken (TenantId, UserId)
        INCLUDE (ExpiresAt, UsedAt);
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.DatabaseVersion WHERE ScriptName = N'004_CreateAuthTables.sql')
BEGIN
    INSERT INTO dbo.DatabaseVersion (ScriptName) VALUES (N'004_CreateAuthTables.sql');
END
GO
