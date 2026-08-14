/*
  SchoolCore — SQL Server 2022
  SP: sp_Student_List
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Student_List
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER=NULL, @Status NVARCHAR(30)=NULL,
    @Page INT=1, @PageSize INT=50, @Search NVARCHAR(100)=NULL, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 200 SET @PageSize = 200;
    SELECT @TotalCount = COUNT(1) FROM dbo.Student s
    WHERE s.TenantId=@TenantId AND s.IsDeleted=0
      AND (@BranchId IS NULL OR s.BranchId=@BranchId)
      AND (@Status IS NULL OR s.Status=@Status)
      AND (@Search IS NULL OR s.FirstName LIKE N'%'+@Search+N'%' OR s.LastName LIKE N'%'+@Search+N'%' OR s.EnrollmentNumber LIKE N'%'+@Search+N'%');
    SELECT s.Id, s.TenantId, s.BranchId, s.EnrollmentNumber, s.FirstName, s.LastName, s.Gender, s.BirthDate, s.Email, s.Phone,
           s.Address, s.EducationLevelId, s.Grade, s.GroupCode, s.Status, s.EnrollmentDate, s.BloodType, s.Allergies, s.MedicalNotes,
           s.ScholarshipPercent, s.SchoolCycleId, s.ClassroomId, s.LevelName, s.PhotoUrl, s.CreatedAt, s.UpdatedAt, b.Name AS BranchName,
           COALESCE(NULLIF(LTRIM(RTRIM(el.Name)), N''), s.LevelName) AS EducationLevelName
    FROM dbo.Student s
    INNER JOIN dbo.Branch b ON b.Id = s.BranchId
    LEFT JOIN dbo.EducationLevel el ON el.Id = s.EducationLevelId AND el.TenantId = s.TenantId AND el.IsDeleted = 0
    WHERE s.TenantId=@TenantId AND s.IsDeleted=0
      AND (@BranchId IS NULL OR s.BranchId=@BranchId)
      AND (@Status IS NULL OR s.Status=@Status)
      AND (@Search IS NULL OR s.FirstName LIKE N'%'+@Search+N'%' OR s.LastName LIKE N'%'+@Search+N'%' OR s.EnrollmentNumber LIKE N'%'+@Search+N'%')
    ORDER BY s.LastName, s.FirstName
    OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO
