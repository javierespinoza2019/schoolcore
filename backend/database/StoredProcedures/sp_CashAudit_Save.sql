/*
  SchoolCore — SQL Server 2022
  SP: sp_CashAudit_Save
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_CashAudit_Save
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @CashSessionId UNIQUEIDENTIFIER,
    @BillsJson NVARCHAR(MAX)=NULL, @CoinsJson NVARCHAR(MAX)=NULL,
    @TotalCash DECIMAL(18,2), @TotalCard DECIMAL(18,2), @TotalTransfer DECIMAL(18,2), @TotalCheck DECIMAL(18,2),
    @Observations NVARCHAR(1000)=NULL, @CreatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Opening DECIMAL(18,2), @Income DECIMAL(18,2), @Expense DECIMAL(18,2), @Status NVARCHAR(30);
    SELECT @Opening=OpeningAmount, @Income=TotalIncome, @Expense=TotalExpense, @Status=Status
    FROM dbo.CashSession WHERE TenantId=@TenantId AND Id=@CashSessionId AND IsDeleted=0;
    IF @Opening IS NULL THROW 51004, 'Cash session not found.', 1;
    IF @Status <> N'open' THROW 51009, 'Cash session is not open.', 1;

    DECLARE @SystemTotal DECIMAL(18,2) = @Opening + @Income - @Expense;
    DECLARE @Counted DECIMAL(18,2) = @TotalCash + @TotalCard + @TotalTransfer + @TotalCheck;
    DECLARE @Diff DECIMAL(18,2) = @Counted - @SystemTotal;

    IF EXISTS (SELECT 1 FROM dbo.CashAudit WHERE TenantId=@TenantId AND CashSessionId=@CashSessionId)
        UPDATE dbo.CashAudit SET BillsJson=@BillsJson, CoinsJson=@CoinsJson, TotalCash=@TotalCash, TotalCard=@TotalCard,
            TotalTransfer=@TotalTransfer, TotalCheck=@TotalCheck, SystemTotal=@SystemTotal, DifferenceAmount=@Diff,
            Observations=@Observations, CreatedAt=SYSUTCDATETIME(), CreatedBy=@CreatedBy
        WHERE TenantId=@TenantId AND CashSessionId=@CashSessionId;
    ELSE
        INSERT INTO dbo.CashAudit (Id,TenantId,CashSessionId,BillsJson,CoinsJson,TotalCash,TotalCard,TotalTransfer,TotalCheck,SystemTotal,DifferenceAmount,Observations,CreatedAt,CreatedBy)
        VALUES (@Id,@TenantId,@CashSessionId,@BillsJson,@CoinsJson,@TotalCash,@TotalCard,@TotalTransfer,@TotalCheck,@SystemTotal,@Diff,@Observations,SYSUTCDATETIME(),@CreatedBy);

    INSERT INTO dbo.AuditLog (Id, TenantId, UserId, EntityType, EntityId, Action, DetailsJson, CreatedAt)
    VALUES (NEWID(), @TenantId, @CreatedBy, N'CashAudit', @CashSessionId, N'Save', CONCAT(N'{"difference":', @Diff, N'}'), SYSUTCDATETIME());

    SELECT Id, TenantId, CashSessionId, BillsJson, CoinsJson, TotalCash, TotalCard, TotalTransfer, TotalCheck, SystemTotal, DifferenceAmount, Observations, CreatedAt
    FROM dbo.CashAudit WHERE TenantId=@TenantId AND CashSessionId=@CashSessionId;
END
GO
