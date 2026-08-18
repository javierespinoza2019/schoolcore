/*
  SchoolCore — SQL Server 2022
  SP: sp_Report_ByBranch
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Report_ByBranch
    @TenantId UNIQUEIDENTIFIER, @FromDate DATE, @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    SELECT b.Id AS BranchId, b.Name AS BranchName,
           (SELECT COUNT(1) FROM dbo.Student s WHERE s.TenantId=@TenantId AND s.BranchId=b.Id AND s.IsDeleted=0 AND s.Status=N'active') AS ActiveStudents,
           ISNULL((SELECT SUM(p.Amount) FROM dbo.Payment p WHERE p.TenantId=@TenantId AND p.BranchId=b.Id AND p.IsDeleted=0
                AND ISNULL(p.Status, N'posted') = N'posted'
                AND p.PaidAt >= @FromDate AND p.PaidAt < DATEADD(DAY,1,@ToDate)), 0) AS Income,
           ISNULL((SELECT SUM(e.Amount) FROM dbo.Expense e WHERE e.TenantId=@TenantId AND e.BranchId=b.Id AND e.IsDeleted=0
                AND e.ExpenseDate >= @FromDate AND e.ExpenseDate < DATEADD(DAY,1,@ToDate)), 0) AS Expense,
           ISNULL((SELECT SUM(c.NetAmount) FROM dbo.Charge c WHERE c.TenantId=@TenantId AND c.BranchId=b.Id AND c.IsDeleted=0 AND c.Status IN (N'pending', N'overdue')), 0) AS Outstanding
    FROM dbo.Branch b
    WHERE b.TenantId=@TenantId AND b.IsDeleted=0
    ORDER BY b.Name;
END
GO
