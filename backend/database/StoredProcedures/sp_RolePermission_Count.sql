/*
  SchoolCore — SQL Server 2022
  SP: sp_RolePermission_Count
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_RolePermission_Count
AS
BEGIN
    SET NOCOUNT ON;
    SELECT COUNT(1) AS Cnt FROM dbo.RolePermission;
END
GO
