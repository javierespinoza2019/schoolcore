/*
  SchoolCore — SQL Server 2022
  SP: sp_Report_IncomeExpense
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Report_IncomeExpense
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER=NULL, @FromDate DATE, @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    ;WITH Months AS (
        SELECT DATEFROMPARTS(YEAR(@FromDate), MONTH(@FromDate), 1) AS MonthStart
        UNION ALL
        SELECT DATEADD(MONTH, 1, MonthStart) FROM Months WHERE DATEADD(MONTH, 1, MonthStart) <= @ToDate
    )
    SELECT FORMAT(m.MonthStart, 'yyyy-MM') AS Period,
           ISNULL((SELECT SUM(p.Amount) FROM dbo.Payment p WHERE p.TenantId=@TenantId AND p.IsDeleted=0
                AND ISNULL(p.Status, N'posted') = N'posted'
                AND (@BranchId IS NULL OR p.BranchId=@BranchId)
                AND p.PaidAt >= m.MonthStart AND p.PaidAt < DATEADD(MONTH,1,m.MonthStart)), 0) AS Income,
           ISNULL((SELECT SUM(e.Amount) FROM dbo.Expense e WHERE e.TenantId=@TenantId AND e.IsDeleted=0
                AND (@BranchId IS NULL OR e.BranchId=@BranchId)
                AND e.ExpenseDate >= m.MonthStart AND e.ExpenseDate < DATEADD(MONTH,1,m.MonthStart)), 0) AS Expense
    FROM Months m
    OPTION (MAXRECURSION 120);
END
GO
