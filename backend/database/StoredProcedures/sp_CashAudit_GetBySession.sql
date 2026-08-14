/*
  SchoolCore — SQL Server 2022
  SP: sp_CashAudit_GetBySession
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_CashAudit_GetBySession @TenantId UNIQUEIDENTIFIER, @CashSessionId UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT Id, TenantId, CashSessionId, BillsJson, CoinsJson, TotalCash, TotalCard, TotalTransfer, TotalCheck, SystemTotal, DifferenceAmount, Observations, CreatedAt
    FROM dbo.CashAudit WHERE TenantId=@TenantId AND CashSessionId=@CashSessionId;
END
GO
