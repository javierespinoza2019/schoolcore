/*
  SchoolCore — SQL Server 2022
  SP: sp_CashMovement_ListBySession
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_CashMovement_ListBySession @TenantId UNIQUEIDENTIFIER, @CashSessionId UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT m.Id, m.TenantId, m.CashSessionId, m.MovementType, m.Category, m.Concept, m.Amount,
           m.PaymentMethodName, m.Reference, m.StudentId, m.PaymentId, m.ExpenseId, m.OccurredAt, m.CreatedBy,
           CASE WHEN s.Id IS NULL THEN NULL ELSE s.FirstName + N' ' + s.LastName END AS StudentName,
           CASE WHEN u.Id IS NULL THEN NULL ELSE u.FirstName + N' ' + u.LastName END AS CreatedByName
    FROM dbo.CashMovement m
    LEFT JOIN dbo.Student s ON s.Id = m.StudentId AND s.TenantId = m.TenantId
    LEFT JOIN dbo.[User] u ON u.Id = m.CreatedBy
    WHERE m.TenantId=@TenantId AND m.CashSessionId=@CashSessionId
    ORDER BY m.OccurredAt;
END
GO
