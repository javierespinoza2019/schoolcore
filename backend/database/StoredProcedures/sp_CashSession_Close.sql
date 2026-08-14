/*
  SchoolCore — SQL Server 2022
  SP: sp_CashSession_Close
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_CashSession_Close
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @Notes NVARCHAR(500)=NULL, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRAN;
    -- Arqueo obligatorio
    IF NOT EXISTS (SELECT 1 FROM dbo.CashAudit WHERE TenantId=@TenantId AND CashSessionId=@Id)
        THROW 51009, 'Cash audit (arqueo) is required before closing the session.', 1;

    DECLARE @Opening DECIMAL(18,2), @Income DECIMAL(18,2), @Expense DECIMAL(18,2), @Diff DECIMAL(18,2);
    SELECT @Opening=OpeningAmount, @Income=TotalIncome, @Expense=TotalExpense FROM dbo.CashSession WITH (UPDLOCK)
    WHERE TenantId=@TenantId AND Id=@Id AND Status=N'open' AND IsDeleted=0;
    IF @Opening IS NULL THROW 51004, 'Open cash session not found.', 1;
    SELECT @Diff = DifferenceAmount FROM dbo.CashAudit WHERE TenantId=@TenantId AND CashSessionId=@Id;

    UPDATE dbo.CashSession
    SET Status=N'closed', ClosedAt=SYSUTCDATETIME(), ClosingAmount = @Opening + @Income - @Expense,
        DifferenceAmount=@Diff, Notes=COALESCE(@Notes, Notes), UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE Id=@Id;

    INSERT INTO dbo.AuditLog (Id, TenantId, UserId, EntityType, EntityId, Action, DetailsJson, CreatedAt)
    VALUES (NEWID(), @TenantId, @UpdatedBy, N'CashSession', @Id, N'Close', CONCAT(N'{"difference":', @Diff, N'}'), SYSUTCDATETIME());
    COMMIT;
    EXEC dbo.sp_CashSession_GetById @TenantId=@TenantId, @Id=@Id;
END
GO
