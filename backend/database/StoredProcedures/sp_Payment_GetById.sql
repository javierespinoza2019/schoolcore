/*
  SchoolCore — SQL Server 2022
  SP: sp_Payment_GetById
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Payment_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT p.Id, p.TenantId, p.BranchId, p.StudentId, p.ChargeId, p.CashSessionId, p.PaymentMethodId, p.Amount, p.Folio, p.PaidAt, p.Reference, p.Notes, p.CreatedAt,
           s.FirstName + N' ' + s.LastName AS StudentName, pm.Name AS PaymentMethodName
    FROM dbo.Payment p
    INNER JOIN dbo.Student s ON s.Id=p.StudentId
    LEFT JOIN dbo.PaymentMethod pm ON pm.Id=p.PaymentMethodId
    WHERE p.TenantId=@TenantId AND p.Id=@Id AND p.IsDeleted=0;
END
GO
