/*
  SchoolCore — SQL Server 2022
  Script: 015_AddTeacherPhotoUrl.sql
  Short photo reference (document GUID or http URL). Not a data-URL blob.
  Idempotent.
*/
USE db_a0b4b3_schoolcore;
GO

IF COL_LENGTH(N'dbo.Teacher', N'PhotoUrl') IS NULL
    ALTER TABLE dbo.Teacher ADD PhotoUrl NVARCHAR(500) NULL;
GO
