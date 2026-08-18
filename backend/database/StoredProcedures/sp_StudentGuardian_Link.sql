/*
  SchoolCore — SQL Server 2022
  SP: sp_StudentGuardian_Link
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_StudentGuardian_Link
    @TenantId UNIQUEIDENTIFIER, @StudentId UNIQUEIDENTIFIER, @GuardianId UNIQUEIDENTIFIER,
    @Relationship NVARCHAR(50), @IsPrimary BIT=0
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Student WHERE TenantId=@TenantId AND Id=@StudentId AND IsDeleted=0) THROW 51004, 'Student not found.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Guardian WHERE TenantId=@TenantId AND Id=@GuardianId AND IsDeleted=0) THROW 51004, 'Guardian not found.', 1;
    IF EXISTS (SELECT 1 FROM dbo.StudentGuardian WHERE TenantId=@TenantId AND StudentId=@StudentId AND GuardianId=@GuardianId)
        UPDATE dbo.StudentGuardian
        SET Relationship=@Relationship, IsPrimary=@IsPrimary
        WHERE TenantId=@TenantId AND StudentId=@StudentId AND GuardianId=@GuardianId;
    ELSE
        INSERT INTO dbo.StudentGuardian (StudentId, GuardianId, TenantId, Relationship, IsPrimary)
        VALUES (@StudentId, @GuardianId, @TenantId, @Relationship, @IsPrimary);
END
GO
