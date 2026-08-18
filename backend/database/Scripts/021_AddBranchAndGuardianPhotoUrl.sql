/*
  SchoolCore — SQL Server 2022
  Script: 021_AddBranchAndGuardianPhotoUrl.sql
  Short photo reference (document GUID or http URL). Not a data-URL blob.
  Idempotent.
*/
USE db_a0b4b3_schoolcore;
GO

IF COL_LENGTH(N'dbo.Branch', N'PhotoUrl') IS NULL
    ALTER TABLE dbo.Branch ADD PhotoUrl NVARCHAR(500) NULL;

IF COL_LENGTH(N'dbo.Guardian', N'PhotoUrl') IS NULL
    ALTER TABLE dbo.Guardian ADD PhotoUrl NVARCHAR(500) NULL;
GO
