/*
  SchoolCore — SQL Server 2022
  SP: sp_CashSession_GetById
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_CashSession_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT Id, TenantId, BranchId, UserId, Shift, OpenedAt, ClosedAt, OpeningAmount, TotalIncome, TotalExpense, ClosingAmount, DifferenceAmount, Status, Notes, CreatedAt
    FROM dbo.CashSession WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
END
GO
