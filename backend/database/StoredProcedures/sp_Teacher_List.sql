/*
  SchoolCore — SQL Server 2022
  SP: sp_Teacher_List
  Result sets: (1) teachers paged  (2) branches for page
  Filtro sucursal: pertenencia TeacherBranch (fallback Teacher.BranchId).
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Teacher_List
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER=NULL, @Page INT=1, @PageSize INT=50, @Search NVARCHAR(100)=NULL, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 100 SET @PageSize = 100;

    SELECT @TotalCount = COUNT(1)
    FROM dbo.Teacher t
    WHERE t.TenantId=@TenantId AND t.IsDeleted=0
      AND (
            @BranchId IS NULL
            OR EXISTS (SELECT 1 FROM dbo.TeacherBranch tb WHERE tb.TeacherId=t.Id AND tb.BranchId=@BranchId)
            OR (NOT EXISTS (SELECT 1 FROM dbo.TeacherBranch tb0 WHERE tb0.TeacherId=t.Id) AND t.BranchId=@BranchId)
          )
      AND (@Search IS NULL OR t.FirstName LIKE N'%'+@Search+N'%' OR t.LastName LIKE N'%'+@Search+N'%' OR t.Email LIKE N'%'+@Search+N'%');

    ;WITH PageTeachers AS (
        SELECT t.Id
        FROM dbo.Teacher t
        WHERE t.TenantId=@TenantId AND t.IsDeleted=0
          AND (
                @BranchId IS NULL
                OR EXISTS (SELECT 1 FROM dbo.TeacherBranch tb WHERE tb.TeacherId=t.Id AND tb.BranchId=@BranchId)
                OR (NOT EXISTS (SELECT 1 FROM dbo.TeacherBranch tb0 WHERE tb0.TeacherId=t.Id) AND t.BranchId=@BranchId)
              )
          AND (@Search IS NULL OR t.FirstName LIKE N'%'+@Search+N'%' OR t.LastName LIKE N'%'+@Search+N'%' OR t.Email LIKE N'%'+@Search+N'%')
        ORDER BY t.LastName, t.FirstName
        OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY
    )
    SELECT
        t.Id, t.TenantId, t.BranchId, t.FirstName, t.LastName, t.Email, t.Phone, t.Specialty, t.SubjectsJson,
        t.EmploymentType, t.MonthlySalary, t.EducationLevelId, t.Status, t.HireDate, t.ScheduleNotes,
        t.LevelName, t.PhotoUrl, t.CreatedAt, t.UpdatedAt,
        b.Name AS BranchName,
        COALESCE(NULLIF(LTRIM(RTRIM(el.Name)), N''), t.LevelName) AS EducationLevelName
    FROM PageTeachers pt
    INNER JOIN dbo.Teacher t ON t.Id = pt.Id
    LEFT JOIN dbo.Branch b ON b.Id = t.BranchId AND b.TenantId = t.TenantId
    LEFT JOIN dbo.EducationLevel el ON el.Id = t.EducationLevelId AND el.TenantId = t.TenantId AND el.IsDeleted = 0
    ORDER BY t.LastName, t.FirstName;

    ;WITH PageTeachers AS (
        SELECT t.Id
        FROM dbo.Teacher t
        WHERE t.TenantId=@TenantId AND t.IsDeleted=0
          AND (
                @BranchId IS NULL
                OR EXISTS (SELECT 1 FROM dbo.TeacherBranch tb WHERE tb.TeacherId=t.Id AND tb.BranchId=@BranchId)
                OR (NOT EXISTS (SELECT 1 FROM dbo.TeacherBranch tb0 WHERE tb0.TeacherId=t.Id) AND t.BranchId=@BranchId)
              )
          AND (@Search IS NULL OR t.FirstName LIKE N'%'+@Search+N'%' OR t.LastName LIKE N'%'+@Search+N'%' OR t.Email LIKE N'%'+@Search+N'%')
        ORDER BY t.LastName, t.FirstName
        OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY
    )
    SELECT pt.Id AS TeacherId, tb.BranchId, b.Name AS BranchName, b.Code AS BranchCode
    FROM PageTeachers pt
    INNER JOIN dbo.TeacherBranch tb ON tb.TeacherId = pt.Id
    INNER JOIN dbo.Branch b ON b.Id = tb.BranchId AND b.IsDeleted=0 AND b.TenantId=@TenantId;
END
GO
