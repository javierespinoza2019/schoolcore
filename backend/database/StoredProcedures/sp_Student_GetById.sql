/*
  SchoolCore — SQL Server 2022
  SP: sp_Student_GetById
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Student_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT s.Id, s.TenantId, s.BranchId, s.EnrollmentNumber, s.FirstName, s.LastName, s.Gender, s.BirthDate, s.Email, s.Phone,
           s.Address, s.EducationLevelId, s.Grade, s.GroupCode, s.Status, s.EnrollmentDate, s.BloodType, s.Allergies, s.MedicalNotes,
           s.ScholarshipPercent, s.SchoolCycleId, s.ClassroomId, s.LevelName, s.PhotoUrl, s.CreatedAt, s.UpdatedAt, b.Name AS BranchName,
           COALESCE(NULLIF(LTRIM(RTRIM(el.Name)), N''), s.LevelName) AS EducationLevelName
    FROM dbo.Student s
    INNER JOIN dbo.Branch b ON b.Id=s.BranchId
    LEFT JOIN dbo.EducationLevel el ON el.Id = s.EducationLevelId AND el.TenantId = s.TenantId AND el.IsDeleted = 0
    WHERE s.TenantId=@TenantId AND s.Id=@Id AND s.IsDeleted=0;
END
GO
