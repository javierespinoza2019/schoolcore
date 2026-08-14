/*
  SchoolCore — SQL Server 2022
  SP: sp_Expense_Create
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Expense_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER, @CashSessionId UNIQUEIDENTIFIER=NULL,
    @Concept NVARCHAR(200), @Category NVARCHAR(100), @Amount DECIMAL(18,2), @ExpenseDate DATE,
    @Vendor NVARCHAR(200)=NULL, @PaymentMethodId UNIQUEIDENTIFIER=NULL, @Reference NVARCHAR(100)=NULL,
    @CreatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRAN;
    INSERT INTO dbo.Expense (Id,TenantId,BranchId,CashSessionId,Concept,Category,Amount,ExpenseDate,Vendor,PaymentMethodId,Reference,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@BranchId,@CashSessionId,@Concept,@Category,@Amount,@ExpenseDate,@Vendor,@PaymentMethodId,@Reference,SYSUTCDATETIME(),@CreatedBy);

    IF @CashSessionId IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM dbo.CashSession WHERE Id=@CashSessionId AND TenantId=@TenantId AND Status=N'open' AND IsDeleted=0)
            THROW 51009, 'Cash session is not open.', 1;
        INSERT INTO dbo.CashMovement (Id,TenantId,CashSessionId,MovementType,Category,Concept,Amount,Reference,ExpenseId,OccurredAt,CreatedBy)
        VALUES (NEWID(),@TenantId,@CashSessionId,N'expense',@Category,@Concept,@Amount,@Reference,@Id,SYSUTCDATETIME(),@CreatedBy);
        UPDATE dbo.CashSession SET TotalExpense = TotalExpense + @Amount, UpdatedAt=SYSUTCDATETIME() WHERE Id=@CashSessionId;
    END

    INSERT INTO dbo.AuditLog (Id, TenantId, UserId, EntityType, EntityId, Action, DetailsJson, CreatedAt)
    VALUES (NEWID(), @TenantId, @CreatedBy, N'Expense', @Id, N'Create', CONCAT(N'{"amount":', @Amount, N'}'), SYSUTCDATETIME());
    COMMIT;
    SELECT Id, TenantId, BranchId, CashSessionId, Concept, Category, Amount, ExpenseDate, Vendor, PaymentMethodId, Reference, CreatedAt
    FROM dbo.Expense WHERE Id=@Id;
END
GO
