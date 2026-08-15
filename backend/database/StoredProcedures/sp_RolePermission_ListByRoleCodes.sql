/*
  SchoolCore — SQL Server 2022
  SP: sp_RolePermission_ListByRoleCodes
  @RoleCodesCsv: códigos separados por coma (p.ej. Director,Cashier)
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_RolePermission_ListByRoleCodes
    @RoleCodesCsv NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH Codes AS (
        SELECT LTRIM(RTRIM(value)) AS Code
        FROM STRING_SPLIT(@RoleCodesCsv, N',')
        WHERE LTRIM(RTRIM(value)) <> N''
    )
    SELECT DISTINCT rp.ViewCode, rp.ActionCode
    FROM dbo.RolePermission rp
    INNER JOIN dbo.Role r ON r.Id = rp.RoleId
    INNER JOIN Codes c ON c.Code = r.Code
    ORDER BY rp.ViewCode, rp.ActionCode;
END
GO
