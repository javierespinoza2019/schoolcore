/*
  SchoolCore — SQL Server 2022
  SP: sp_StudentGuardian_ListByStudent
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_StudentGuardian_ListByStudent @TenantId UNIQUEIDENTIFIER, @StudentId UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT g.Id, g.FirstName, g.LastName, g.Email, g.Phone, g.Occupation, g.Address, g.Status, g.PhotoUrl,
           sg.Relationship, sg.IsPrimary
    FROM dbo.StudentGuardian sg
    INNER JOIN dbo.Guardian g ON g.Id = sg.GuardianId AND g.TenantId = sg.TenantId AND g.IsDeleted=0
    WHERE sg.TenantId=@TenantId AND sg.StudentId=@StudentId;
END
GO
