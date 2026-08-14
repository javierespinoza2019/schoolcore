/*
  SchoolCore — SQL Server 2022
  SP: sp_System_GetUtcDate
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_System_GetUtcDate
AS
BEGIN
    SET NOCOUNT ON;
    SELECT SYSUTCDATETIME() AS UtcNow;
END
GO
