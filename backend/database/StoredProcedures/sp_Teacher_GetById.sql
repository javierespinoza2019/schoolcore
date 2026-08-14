/*
  SchoolCore — SQL Server 2022
  SP: sp_Teacher_GetById
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Teacher_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT
        t.Id, t.TenantId, t.BranchId, t.FirstName, t.LastName, t.Email, t.Phone, t.Specialty, t.SubjectsJson,
        t.EmploymentType, t.MonthlySalary, t.EducationLevelId, t.Status, t.HireDate, t.ScheduleNotes,
        t.LevelName, t.PhotoUrl, t.CreatedAt, t.UpdatedAt,
        b.Name AS BranchName,
        COALESCE(NULLIF(LTRIM(RTRIM(el.Name)), N''), t.LevelName) AS EducationLevelName
    FROM dbo.Teacher t
    LEFT JOIN dbo.Branch b ON b.Id = t.BranchId AND b.TenantId = t.TenantId
    LEFT JOIN dbo.EducationLevel el ON el.Id = t.EducationLevelId AND el.TenantId = t.TenantId AND el.IsDeleted = 0
    WHERE t.TenantId = @TenantId AND t.Id = @Id AND t.IsDeleted = 0;
END
GO
