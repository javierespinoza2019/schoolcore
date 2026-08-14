/*
  SchoolCore — SQL Server 2022
  SP: sp_Report_Morosity
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Report_Morosity
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Charge SET Status=N'overdue', MoraInfoDays = DATEDIFF(DAY, DueDate, CAST(SYSUTCDATETIME() AS DATE))
    WHERE TenantId=@TenantId AND IsDeleted=0 AND Status=N'pending' AND DueDate < CAST(SYSUTCDATETIME() AS DATE);

    SELECT c.Id AS ChargeId, c.StudentId, s.FirstName + N' ' + s.LastName AS StudentName, c.ConceptName,
           c.NetAmount, c.DueDate, c.MoraInfoDays, c.Status, el.Name AS LevelName
    FROM dbo.Charge c
    INNER JOIN dbo.Student s ON s.Id=c.StudentId
    LEFT JOIN dbo.EducationLevel el ON el.Id=s.EducationLevelId
    WHERE c.TenantId=@TenantId AND c.IsDeleted=0 AND c.Status=N'overdue'
      AND (@BranchId IS NULL OR c.BranchId=@BranchId)
    ORDER BY c.DueDate;

    SELECT ISNULL(el.Name, N'Sin nivel') AS LevelName, COUNT(1) AS OverdueCount, SUM(c.NetAmount) AS OverdueAmount
    FROM dbo.Charge c
    INNER JOIN dbo.Student s ON s.Id=c.StudentId
    LEFT JOIN dbo.EducationLevel el ON el.Id=s.EducationLevelId
    WHERE c.TenantId=@TenantId AND c.IsDeleted=0 AND c.Status=N'overdue'
      AND (@BranchId IS NULL OR c.BranchId=@BranchId)
    GROUP BY el.Name;
END
GO
