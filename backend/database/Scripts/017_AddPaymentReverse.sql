/*
  SchoolCore — SQL Server 2022
  Script: 017_AddPaymentReverse.sql
  BR-59C: anulación/reverso contable de pagos.
  Idempotent.
*/
USE db_a0b4b3_schoolcore;
GO

IF COL_LENGTH(N'dbo.Payment', N'Status') IS NULL
    ALTER TABLE dbo.Payment ADD Status NVARCHAR(30) NOT NULL
        CONSTRAINT DF_Payment_Status DEFAULT (N'posted');
GO

IF COL_LENGTH(N'dbo.Payment', N'VoidReason') IS NULL
    ALTER TABLE dbo.Payment ADD VoidReason NVARCHAR(500) NULL;
GO

IF COL_LENGTH(N'dbo.Payment', N'VoidedAt') IS NULL
    ALTER TABLE dbo.Payment ADD VoidedAt DATETIME2(3) NULL;
GO

IF COL_LENGTH(N'dbo.Payment', N'VoidedBy') IS NULL
    ALTER TABLE dbo.Payment ADD VoidedBy UNIQUEIDENTIFIER NULL;
GO

IF COL_LENGTH(N'dbo.Payment', N'ReverseCashSessionId') IS NULL
    ALTER TABLE dbo.Payment ADD ReverseCashSessionId UNIQUEIDENTIFIER NULL;
GO

IF COL_LENGTH(N'dbo.Payment', N'ReverseMovementId') IS NULL
    ALTER TABLE dbo.Payment ADD ReverseMovementId UNIQUEIDENTIFIER NULL;
GO

/* Backfill legacy rows */
UPDATE dbo.Payment SET Status = N'posted' WHERE Status IS NULL OR Status = N'';
GO

IF NOT EXISTS (SELECT 1 FROM dbo.DatabaseVersion WHERE ScriptName = N'017_AddPaymentReverse.sql')
BEGIN
    INSERT INTO dbo.DatabaseVersion (ScriptName) VALUES (N'017_AddPaymentReverse.sql');
END
GO
