/*
  SchoolCore — SQL Server 2022
  SP: sp_EducationLevel_List
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_EducationLevel_List
    @TenantId UNIQUEIDENTIFIER,
    @Page INT = 1,
    @PageSize INT = 50,
    @Search NVARCHAR(100) = NULL,
    @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1;
    IF @PageSize < 1 SET @PageSize = 50;
    IF @PageSize > 100 SET @PageSize = 100;

    SELECT @TotalCount = COUNT(1)
    FROM dbo.[EducationLevel]
    WHERE TenantId = @TenantId AND IsDeleted = 0
      AND (@Search IS NULL OR Name LIKE N'%' + @Search + N'%' OR Code LIKE N'%' + @Search + N'%')
      ;

    SELECT Id, TenantId, Name, Code, GradeCount, SortOrder, IsActive, CreatedAt, UpdatedAt
    FROM dbo.[EducationLevel]
    WHERE TenantId = @TenantId AND IsDeleted = 0
      AND (@Search IS NULL OR Name LIKE N'%' + @Search + N'%' OR Code LIKE N'%' + @Search + N'%')
      
    ORDER BY CreatedAt DESC
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO
