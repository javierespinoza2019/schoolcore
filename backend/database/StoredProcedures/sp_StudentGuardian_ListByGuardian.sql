/*
  SchoolCore — SQL Server 2022
  SP: sp_StudentGuardian_ListByGuardian
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_StudentGuardian_ListByGuardian
    @TenantId UNIQUEIDENTIFIER,
    @GuardianId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT s.Id, s.TenantId, s.BranchId, s.EnrollmentNumber, s.FirstName, s.LastName,
           s.LevelName, s.Grade, s.GroupCode, s.Status, s.PhotoUrl, s.CreatedAt,
           b.Name AS BranchName, sg.Relationship, sg.IsPrimary
    FROM dbo.StudentGuardian sg
    INNER JOIN dbo.Student s ON s.Id = sg.StudentId AND s.TenantId = sg.TenantId AND s.IsDeleted = 0
    LEFT JOIN dbo.Branch b ON b.Id = s.BranchId AND b.TenantId = s.TenantId
    WHERE sg.TenantId = @TenantId AND sg.GuardianId = @GuardianId
    ORDER BY s.LastName, s.FirstName;
END
GO
