/*
  SchoolCore — SQL Server 2022
  SP: sp_Report_Enrollment
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Report_Enrollment
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER=NULL, @SchoolCycleId UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ISNULL(el.Name, N'Sin nivel') AS LevelName, COUNT(1) AS StudentCount
    FROM dbo.Student s
    LEFT JOIN dbo.EducationLevel el ON el.Id = s.EducationLevelId
    WHERE s.TenantId=@TenantId AND s.IsDeleted=0 AND s.Status=N'active'
      AND (@BranchId IS NULL OR s.BranchId=@BranchId)
      AND (@SchoolCycleId IS NULL OR s.SchoolCycleId=@SchoolCycleId)
    GROUP BY el.Name
    ORDER BY StudentCount DESC;

    SELECT b.Name AS BranchName, COUNT(1) AS StudentCount
    FROM dbo.Student s INNER JOIN dbo.Branch b ON b.Id=s.BranchId
    WHERE s.TenantId=@TenantId AND s.IsDeleted=0 AND s.Status=N'active'
      AND (@BranchId IS NULL OR s.BranchId=@BranchId)
    GROUP BY b.Name ORDER BY StudentCount DESC;
END
GO
