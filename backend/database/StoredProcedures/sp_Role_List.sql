/*
  SchoolCore — SQL Server 2022
  SP: sp_Role_List
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Role_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT r.Id, r.Code, r.Name, r.IsSystem,
           (
               SELECT COUNT(1)
               FROM dbo.UserRole ur
               INNER JOIN dbo.[User] u ON u.Id = ur.UserId AND u.IsDeleted = 0
               WHERE ur.RoleId = r.Id
           ) AS UserCount
    FROM dbo.Role r
    ORDER BY r.Name;
END
GO
