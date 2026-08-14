/*
  SchoolCore — SQL Server 2022
  SP: sp_StudentGuardian_Unlink
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_StudentGuardian_Unlink
    @TenantId UNIQUEIDENTIFIER, @StudentId UNIQUEIDENTIFIER, @GuardianId UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    DELETE FROM dbo.StudentGuardian WHERE TenantId=@TenantId AND StudentId=@StudentId AND GuardianId=@GuardianId;
END
GO
