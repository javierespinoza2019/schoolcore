/*
  SchoolCore — SQL Server 2022
  SP: sp_TimeZone_ListCatalog
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_TimeZone_ListCatalog
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, DisplayNameEs, DisplayNameEn, SortOrder
    FROM dbo.TimeZoneCatalog
    WHERE IsActive = 1
    ORDER BY SortOrder, Id;
END
GO
