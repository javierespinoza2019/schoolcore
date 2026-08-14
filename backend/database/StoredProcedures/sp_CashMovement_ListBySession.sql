/*
  SchoolCore — SQL Server 2022
  SP: sp_CashMovement_ListBySession
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_CashMovement_ListBySession @TenantId UNIQUEIDENTIFIER, @CashSessionId UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT Id, TenantId, CashSessionId, MovementType, Category, Concept, Amount, PaymentMethodName, Reference, StudentId, PaymentId, ExpenseId, OccurredAt
    FROM dbo.CashMovement WHERE TenantId=@TenantId AND CashSessionId=@CashSessionId
    ORDER BY OccurredAt;
END
GO
