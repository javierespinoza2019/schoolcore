/*
  SchoolCore — SQL Server 2022
  SP: sp_Teacher_List
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Teacher_List
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER=NULL, @Page INT=1, @PageSize INT=50, @Search NVARCHAR(100)=NULL, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 200 SET @PageSize = 200;
    SELECT @TotalCount = COUNT(1) FROM dbo.Teacher WHERE TenantId=@TenantId AND IsDeleted=0
      AND (@BranchId IS NULL OR BranchId=@BranchId)
      AND (@Search IS NULL OR FirstName LIKE N'%'+@Search+N'%' OR LastName LIKE N'%'+@Search+N'%' OR Email LIKE N'%'+@Search+N'%');
    SELECT
        t.Id, t.TenantId, t.BranchId, t.FirstName, t.LastName, t.Email, t.Phone, t.Specialty, t.SubjectsJson,
        t.EmploymentType, t.MonthlySalary, t.EducationLevelId, t.Status, t.HireDate, t.ScheduleNotes,
        t.LevelName, t.PhotoUrl, t.CreatedAt, t.UpdatedAt,
        b.Name AS BranchName,
        COALESCE(NULLIF(LTRIM(RTRIM(el.Name)), N''), t.LevelName) AS EducationLevelName
    FROM dbo.Teacher t
    LEFT JOIN dbo.Branch b ON b.Id = t.BranchId AND b.TenantId = t.TenantId
    LEFT JOIN dbo.EducationLevel el ON el.Id = t.EducationLevelId AND el.TenantId = t.TenantId AND el.IsDeleted = 0
    WHERE t.TenantId=@TenantId AND t.IsDeleted=0
      AND (@BranchId IS NULL OR t.BranchId=@BranchId)
      AND (@Search IS NULL OR t.FirstName LIKE N'%'+@Search+N'%' OR t.LastName LIKE N'%'+@Search+N'%' OR t.Email LIKE N'%'+@Search+N'%')
    ORDER BY t.LastName, t.FirstName OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO
