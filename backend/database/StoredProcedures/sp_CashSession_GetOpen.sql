/*
  SchoolCore — SQL Server 2022
  SP: sp_CashSession_GetOpen
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_CashSession_GetOpen
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER, @UserId UNIQUEIDENTIFIER, @Shift NVARCHAR(30)=NULL
AS BEGIN SET NOCOUNT ON;
    SELECT TOP 1 Id, TenantId, BranchId, UserId, Shift, OpenedAt, ClosedAt, OpeningAmount, TotalIncome, TotalExpense, ClosingAmount, DifferenceAmount, Status, Notes, CreatedAt
    FROM dbo.CashSession
    WHERE TenantId=@TenantId AND BranchId=@BranchId AND UserId=@UserId AND Status=N'open' AND IsDeleted=0
      AND (@Shift IS NULL OR Shift=@Shift)
    ORDER BY OpenedAt DESC;
END
GO
