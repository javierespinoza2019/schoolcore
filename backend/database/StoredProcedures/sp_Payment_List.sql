/*
  SchoolCore — SQL Server 2022
  SP: sp_Payment_List
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Payment_List
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER=NULL, @StudentId UNIQUEIDENTIFIER=NULL,
    @Page INT=1, @PageSize INT=50, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 100 SET @PageSize = 100;
    SELECT @TotalCount = COUNT(1) FROM dbo.Payment WHERE TenantId=@TenantId AND IsDeleted=0
      AND (@BranchId IS NULL OR BranchId=@BranchId) AND (@StudentId IS NULL OR StudentId=@StudentId);
    SELECT p.Id, p.TenantId, p.BranchId, p.StudentId, p.ChargeId, p.CashSessionId, p.PaymentMethodId, p.Amount, p.Folio, p.PaidAt, p.Reference, p.Notes, p.CreatedAt,
           p.Status, p.VoidReason, p.VoidedAt, p.VoidedBy, p.ReverseCashSessionId, p.ReverseMovementId,
           s.FirstName + N' ' + s.LastName AS StudentName, pm.Name AS PaymentMethodName
    FROM dbo.Payment p
    INNER JOIN dbo.Student s ON s.Id=p.StudentId
    LEFT JOIN dbo.PaymentMethod pm ON pm.Id=p.PaymentMethodId
    WHERE p.TenantId=@TenantId AND p.IsDeleted=0
      AND (@BranchId IS NULL OR p.BranchId=@BranchId) AND (@StudentId IS NULL OR p.StudentId=@StudentId)
    ORDER BY p.PaidAt DESC OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO
