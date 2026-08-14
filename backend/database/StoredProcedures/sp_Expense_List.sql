/*
  SchoolCore — SQL Server 2022
  SP: sp_Expense_List
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Expense_List
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER=NULL, @Page INT=1, @PageSize INT=50, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 100 SET @PageSize = 100;
    SELECT @TotalCount = COUNT(1) FROM dbo.Expense WHERE TenantId=@TenantId AND IsDeleted=0 AND (@BranchId IS NULL OR BranchId=@BranchId);
    SELECT Id, TenantId, BranchId, CashSessionId, Concept, Category, Amount, ExpenseDate, Vendor, PaymentMethodId, Reference, CreatedAt
    FROM dbo.Expense WHERE TenantId=@TenantId AND IsDeleted=0 AND (@BranchId IS NULL OR BranchId=@BranchId)
    ORDER BY ExpenseDate DESC OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO
