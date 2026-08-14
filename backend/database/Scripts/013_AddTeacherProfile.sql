/*
  SchoolCore — SQL Server 2022
  Script: 013_AddTeacherProfile.sql
  Persist education level label when EducationLevelId is not resolved.
  Idempotent.
*/
USE db_a0b4b3_schoolcore;
GO

IF COL_LENGTH(N'dbo.Teacher', N'LevelName') IS NULL
    ALTER TABLE dbo.Teacher ADD LevelName NVARCHAR(80) NULL;
GO
