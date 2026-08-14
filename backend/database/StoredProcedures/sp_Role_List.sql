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
    SELECT Id, Code, Name, IsSystem FROM dbo.Role ORDER BY Name;
END
GO
