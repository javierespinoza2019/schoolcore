/*
  SchoolCore — SQL Server 2022
  SP: sp_CashSession_List
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_CashSession_List
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER=NULL, @Page INT=1, @PageSize INT=50, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 100 SET @PageSize = 100;
    SELECT @TotalCount = COUNT(1) FROM dbo.CashSession WHERE TenantId=@TenantId AND IsDeleted=0 AND (@BranchId IS NULL OR BranchId=@BranchId);
    SELECT Id, TenantId, BranchId, UserId, Shift, OpenedAt, ClosedAt, OpeningAmount, TotalIncome, TotalExpense, ClosingAmount, DifferenceAmount, Status, Notes, CreatedAt
    FROM dbo.CashSession WHERE TenantId=@TenantId AND IsDeleted=0 AND (@BranchId IS NULL OR BranchId=@BranchId)
    ORDER BY OpenedAt DESC OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO
