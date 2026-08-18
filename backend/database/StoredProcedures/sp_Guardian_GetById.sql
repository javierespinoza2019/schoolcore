/*
  SchoolCore — SQL Server 2022
  SP: sp_Guardian_GetById
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Guardian_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT g.Id, g.TenantId, g.FirstName, g.LastName, g.Email, g.Phone, g.Occupation, g.Address, g.Status, g.PhotoUrl,
           g.CreatedAt, g.UpdatedAt,
           (SELECT COUNT(1)
            FROM dbo.StudentGuardian sg
            INNER JOIN dbo.Student s ON s.Id = sg.StudentId AND s.TenantId = sg.TenantId AND s.IsDeleted = 0
            WHERE sg.TenantId = g.TenantId AND sg.GuardianId = g.Id) AS ChildrenCount
    FROM dbo.Guardian g
    WHERE g.TenantId=@TenantId AND g.Id=@Id AND g.IsDeleted=0;
END
GO
