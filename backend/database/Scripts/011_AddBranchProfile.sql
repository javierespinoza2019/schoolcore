/*
  SchoolCore — SQL Server 2022
  Script: 011_AddBranchProfile.sql
  Campus profile fields used by Sucursales UI (director contact, capacity, etc.).
  Does not replace Director role / UserBranch assignment.
  Idempotent.
*/
USE db_a0b4b3_schoolcore;
GO

IF COL_LENGTH(N'dbo.Branch', N'DirectorName') IS NULL
    ALTER TABLE dbo.Branch ADD DirectorName NVARCHAR(200) NULL;
IF COL_LENGTH(N'dbo.Branch', N'DirectorEmail') IS NULL
    ALTER TABLE dbo.Branch ADD DirectorEmail NVARCHAR(256) NULL;
IF COL_LENGTH(N'dbo.Branch', N'DirectorPhone') IS NULL
    ALTER TABLE dbo.Branch ADD DirectorPhone NVARCHAR(50) NULL;
IF COL_LENGTH(N'dbo.Branch', N'Capacity') IS NULL
    ALTER TABLE dbo.Branch ADD Capacity INT NULL;
IF COL_LENGTH(N'dbo.Branch', N'OpenedAt') IS NULL
    ALTER TABLE dbo.Branch ADD OpenedAt DATE NULL;
IF COL_LENGTH(N'dbo.Branch', N'Area') IS NULL
    ALTER TABLE dbo.Branch ADD Area NVARCHAR(80) NULL;
IF COL_LENGTH(N'dbo.Branch', N'Levels') IS NULL
    ALTER TABLE dbo.Branch ADD Levels NVARCHAR(500) NULL;
IF COL_LENGTH(N'dbo.Branch', N'OperationalStatus') IS NULL
    ALTER TABLE dbo.Branch ADD OperationalStatus NVARCHAR(30) NULL;
GO
