/*
  SchoolCore — SQL Server 2022
  SP: sp_Report_Concepts
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Report_Concepts
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER=NULL, @FromDate DATE, @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    SELECT c.ConceptName, c.ConceptType, COUNT(1) AS ChargeCount,
           SUM(CASE WHEN c.Status=N'paid' THEN c.NetAmount ELSE 0 END) AS PaidAmount,
           SUM(CASE WHEN c.Status<>N'paid' THEN c.NetAmount ELSE 0 END) AS PendingAmount
    FROM dbo.Charge c
    WHERE c.TenantId=@TenantId AND c.IsDeleted=0
      AND (@BranchId IS NULL OR c.BranchId=@BranchId)
      AND c.CreatedAt >= @FromDate AND c.CreatedAt < DATEADD(DAY, 1, @ToDate)
    GROUP BY c.ConceptName, c.ConceptType
    ORDER BY PaidAmount DESC;
END
GO
