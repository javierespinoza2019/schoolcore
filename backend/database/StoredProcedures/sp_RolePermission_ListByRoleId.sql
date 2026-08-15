/*
  SchoolCore — SQL Server 2022
  SP: sp_RolePermission_ListByRoleId
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_RolePermission_ListByRoleId
    @RoleId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT rp.ViewCode, rp.ActionCode, r.Code AS RoleCode, r.Name AS RoleName
    FROM dbo.RolePermission rp
    INNER JOIN dbo.Role r ON r.Id = rp.RoleId
    WHERE rp.RoleId = @RoleId
    ORDER BY rp.ViewCode, rp.ActionCode;
END
GO
