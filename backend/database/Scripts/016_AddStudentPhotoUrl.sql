/*
  SchoolCore — SQL Server 2022
  Script: 016_AddStudentPhotoUrl.sql
  Short photo reference (document GUID or http URL). Not a data-URL blob.
  Idempotent.
*/
USE db_a0b4b3_schoolcore;
GO

IF COL_LENGTH(N'dbo.Student', N'PhotoUrl') IS NULL
    ALTER TABLE dbo.Student ADD PhotoUrl NVARCHAR(500) NULL;
GO
