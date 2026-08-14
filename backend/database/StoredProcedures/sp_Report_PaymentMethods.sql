/*
  SchoolCore — SQL Server 2022
  SP: sp_Report_PaymentMethods
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Report_PaymentMethods
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER=NULL, @FromDate DATE, @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ISNULL(pm.Name, N'Sin método') AS MethodName, COUNT(1) AS PaymentCount, SUM(p.Amount) AS TotalAmount
    FROM dbo.Payment p
    LEFT JOIN dbo.PaymentMethod pm ON pm.Id=p.PaymentMethodId
    WHERE p.TenantId=@TenantId AND p.IsDeleted=0
      AND (@BranchId IS NULL OR p.BranchId=@BranchId)
      AND p.PaidAt >= @FromDate AND p.PaidAt < DATEADD(DAY, 1, @ToDate)
    GROUP BY pm.Name
    ORDER BY TotalAmount DESC;
END
GO
