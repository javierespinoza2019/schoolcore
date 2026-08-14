/*
  SchoolCore — SQL Server 2022
  Script: 012_AddClassroomProfile.sql
  Persist salon form fields that are not covered by TeacherId / EducationLevelId alone.
  Idempotent.
*/
USE db_a0b4b3_schoolcore;
GO

IF COL_LENGTH(N'dbo.Classroom', N'LevelName') IS NULL
    ALTER TABLE dbo.Classroom ADD LevelName NVARCHAR(80) NULL;
IF COL_LENGTH(N'dbo.Classroom', N'AssignedTeacherName') IS NULL
    ALTER TABLE dbo.Classroom ADD AssignedTeacherName NVARCHAR(200) NULL;
IF COL_LENGTH(N'dbo.Classroom', N'AssignedGroupsJson') IS NULL
    ALTER TABLE dbo.Classroom ADD AssignedGroupsJson NVARCHAR(MAX) NULL;
GO
