/*
  SchoolCore — SQL Server 2022
  SP: sp_Payment_Create
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Payment_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER, @StudentId UNIQUEIDENTIFIER,
    @ChargeId UNIQUEIDENTIFIER, @CashSessionId UNIQUEIDENTIFIER, @PaymentMethodId UNIQUEIDENTIFIER=NULL,
    @Amount DECIMAL(18,2), @Reference NVARCHAR(100)=NULL, @IdempotencyKey NVARCHAR(100)=NULL,
    @Notes NVARCHAR(500)=NULL, @CreatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRAN;

    IF @IdempotencyKey IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.Payment WHERE TenantId=@TenantId AND IdempotencyKey=@IdempotencyKey AND IsDeleted=0 AND Status=N'posted')
    BEGIN
        DECLARE @Existing UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM dbo.Payment WHERE TenantId=@TenantId AND IdempotencyKey=@IdempotencyKey AND IsDeleted=0 AND Status=N'posted');
        COMMIT;
        EXEC dbo.sp_Payment_GetById @TenantId=@TenantId, @Id=@Existing;
        RETURN;
    END

    DECLARE @Net DECIMAL(18,2), @Paid DECIMAL(18,2), @Status NVARCHAR(30);
    SELECT @Net=NetAmount, @Paid=AmountPaid, @Status=Status FROM dbo.Charge WITH (UPDLOCK)
    WHERE TenantId=@TenantId AND Id=@ChargeId AND IsDeleted=0 AND StudentId=@StudentId;
    IF @Net IS NULL THROW 51004, 'Charge not found.', 1;
    IF @Status = N'paid' THROW 51009, 'Charge already paid.', 1;
    -- No partial payments in v1
    IF @Amount <> @Net THROW 51009, 'Partial payments are not allowed in cash v1. Amount must equal net charge.', 1;

    -- BR-58B: todo cobro exige corte abierto (cualquier método de pago).
    IF @CashSessionId IS NULL
        THROW 51009, N'Debes abrir un corte de caja antes de registrar el cobro.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.CashSession WHERE Id=@CashSessionId AND TenantId=@TenantId AND BranchId=@BranchId AND Status=N'open' AND IsDeleted=0)
        THROW 51009, N'El corte de caja no está abierto para esta sucursal.', 1;

    DECLARE @Folio NVARCHAR(50);
    EXEC dbo.sp_TenantSequence_Next @TenantId=@TenantId, @SequenceKey=N'PaymentFolio', @Prefix=N'FOL-', @PadLength=6, @FormattedValue=@Folio OUTPUT;

    INSERT INTO dbo.Payment (Id,TenantId,BranchId,StudentId,ChargeId,CashSessionId,PaymentMethodId,Amount,Folio,PaidAt,Reference,IdempotencyKey,Notes,Status,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@BranchId,@StudentId,@ChargeId,@CashSessionId,@PaymentMethodId,@Amount,@Folio,SYSUTCDATETIME(),@Reference,@IdempotencyKey,@Notes,N'posted',SYSUTCDATETIME(),@CreatedBy);

    UPDATE dbo.Charge SET AmountPaid=@Net, Status=N'paid', UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@CreatedBy
    WHERE Id=@ChargeId;

    INSERT INTO dbo.CashMovement (Id,TenantId,CashSessionId,MovementType,Category,Concept,Amount,PaymentMethodName,Reference,StudentId,PaymentId,OccurredAt,CreatedBy)
    SELECT NEWID(), @TenantId, @CashSessionId, N'income', c.ConceptType, c.ConceptName + N' - ' + s.FirstName + N' ' + s.LastName,
           @Amount, pm.Name, @Reference, @StudentId, @Id, SYSUTCDATETIME(), @CreatedBy
    FROM dbo.Charge c
    INNER JOIN dbo.Student s ON s.Id=c.StudentId
    LEFT JOIN dbo.PaymentMethod pm ON pm.Id=@PaymentMethodId
    WHERE c.Id=@ChargeId;

    UPDATE dbo.CashSession SET TotalIncome = TotalIncome + @Amount, UpdatedAt=SYSUTCDATETIME()
    WHERE Id=@CashSessionId;

    INSERT INTO dbo.AuditLog (Id, TenantId, UserId, EntityType, EntityId, Action, DetailsJson, CreatedAt)
    VALUES (NEWID(), @TenantId, @CreatedBy, N'Payment', @Id, N'Create', CONCAT(N'{"folio":"', @Folio, N'","amount":', @Amount, N'}'), SYSUTCDATETIME());

    COMMIT;
    EXEC dbo.sp_Payment_GetById @TenantId=@TenantId, @Id=@Id;
END
GO
