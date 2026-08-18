/*
  SchoolCore — SQL Server 2022
  SP: sp_Branch_List
*/
USE db_a0b4b3_schoolcore;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Branch_List
    @TenantId UNIQUEIDENTIFIER, @Page INT = 1, @PageSize INT = 50, @Search NVARCHAR(100) = NULL, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 100 SET @PageSize = 100;
    SELECT @TotalCount = COUNT(1) FROM dbo.Branch WHERE TenantId = @TenantId AND IsDeleted = 0
      AND (@Search IS NULL OR Name LIKE N'%' + @Search + N'%' OR Code LIKE N'%' + @Search + N'%');
    SELECT Id, TenantId, Name, Code, IsActive, Address, City, [State], PostalCode, Phone, Email, TimeZoneId,
           DirectorName, DirectorEmail, DirectorPhone, Capacity, OpenedAt, Area, Levels, OperationalStatus,
           PhotoUrl, CreatedAt, UpdatedAt
    FROM dbo.Branch WHERE TenantId = @TenantId AND IsDeleted = 0
      AND (@Search IS NULL OR Name LIKE N'%' + @Search + N'%' OR Code LIKE N'%' + @Search + N'%')
    ORDER BY Name OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO
