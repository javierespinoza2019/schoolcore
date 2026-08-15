/*
  SchoolCore — SQL Server 2022
  SP: sp_Payment_Reverse
  BR-59C: reverso contable — anula pago, reabre cargo, genera egreso/reverso
  aunque el corte original esté cerrado.
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Payment_Reverse
    @TenantId UNIQUEIDENTIFIER,
    @Id UNIQUEIDENTIFIER,
    @Reason NVARCHAR(500),
    @ReverseCashSessionId UNIQUEIDENTIFIER = NULL,
    @UpdatedBy UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRAN;

    IF @Reason IS NULL OR LEN(LTRIM(RTRIM(@Reason))) < 5
        THROW 51009, N'Indica el motivo del reverso (mínimo 5 caracteres).', 1;

    DECLARE
        @BranchId UNIQUEIDENTIFIER,
        @StudentId UNIQUEIDENTIFIER,
        @ChargeId UNIQUEIDENTIFIER,
        @CashSessionId UNIQUEIDENTIFIER,
        @Amount DECIMAL(18,2),
        @Folio NVARCHAR(50),
        @Status NVARCHAR(30),
        @PaymentMethodName NVARCHAR(100),
        @TargetSessionId UNIQUEIDENTIFIER,
        @ReverseMovementId UNIQUEIDENTIFIER = NEWID(),
        @ReasonTrim NVARCHAR(500) = LTRIM(RTRIM(@Reason));

    SELECT
        @BranchId = p.BranchId,
        @StudentId = p.StudentId,
        @ChargeId = p.ChargeId,
        @CashSessionId = p.CashSessionId,
        @Amount = p.Amount,
        @Folio = p.Folio,
        @Status = p.Status,
        @PaymentMethodName = pm.Name
    FROM dbo.Payment p WITH (UPDLOCK, ROWLOCK)
    LEFT JOIN dbo.PaymentMethod pm ON pm.Id = p.PaymentMethodId
    WHERE p.TenantId = @TenantId AND p.Id = @Id AND p.IsDeleted = 0;

    IF @BranchId IS NULL
        THROW 51004, N'No se encontró el pago.', 1;

    IF @Status = N'voided'
        THROW 51009, N'Este pago ya fue anulado.', 1;

    /* Destino del movimiento de reverso:
       1) sesión abierta indicada (misma sucursal)
       2) sesión abierta del usuario en la sucursal
       3) sesión original del cobro (aunque esté cerrada) — BR-59C
    */
    IF @ReverseCashSessionId IS NOT NULL
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM dbo.CashSession
            WHERE Id = @ReverseCashSessionId AND TenantId = @TenantId AND BranchId = @BranchId
              AND Status = N'open' AND IsDeleted = 0
        )
            THROW 51009, N'El corte indicado para el reverso no está abierto en esta sucursal.', 1;
        SET @TargetSessionId = @ReverseCashSessionId;
    END
    ELSE IF @UpdatedBy IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM dbo.CashSession
            WHERE TenantId = @TenantId AND BranchId = @BranchId AND UserId = @UpdatedBy
              AND Status = N'open' AND IsDeleted = 0
        )
    BEGIN
        SELECT TOP 1 @TargetSessionId = Id
        FROM dbo.CashSession
        WHERE TenantId = @TenantId AND BranchId = @BranchId AND UserId = @UpdatedBy
          AND Status = N'open' AND IsDeleted = 0
        ORDER BY OpenedAt DESC;
    END
    ELSE IF @CashSessionId IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM dbo.CashSession
            WHERE Id = @CashSessionId AND TenantId = @TenantId AND IsDeleted = 0
        )
        SET @TargetSessionId = @CashSessionId;
    ELSE
        THROW 51009, N'No hay corte de caja disponible para registrar el reverso contable.', 1;

    UPDATE dbo.Payment
    SET Status = N'voided',
        VoidReason = @ReasonTrim,
        VoidedAt = SYSUTCDATETIME(),
        VoidedBy = @UpdatedBy,
        ReverseCashSessionId = @TargetSessionId,
        ReverseMovementId = @ReverseMovementId,
        IdempotencyKey = NULL,
        Notes = CASE
            WHEN Notes IS NULL OR Notes = N'' THEN CONCAT(N'Reverso: ', @ReasonTrim)
            ELSE CONCAT(Notes, N' | Reverso: ', @ReasonTrim)
        END
    WHERE Id = @Id;

    UPDATE dbo.Charge
    SET AmountPaid = 0,
        Status = N'pending',
        UpdatedAt = SYSUTCDATETIME(),
        UpdatedBy = @UpdatedBy
    WHERE TenantId = @TenantId AND Id = @ChargeId AND IsDeleted = 0;

    INSERT INTO dbo.CashMovement (
        Id, TenantId, CashSessionId, MovementType, Category, Concept, Amount,
        PaymentMethodName, Reference, StudentId, PaymentId, OccurredAt, CreatedBy
    )
    VALUES (
        @ReverseMovementId, @TenantId, @TargetSessionId, N'expense', N'Reverso',
        CONCAT(N'Reverso ', @Folio, N' — ', @ReasonTrim),
        @Amount, @PaymentMethodName, @Folio, @StudentId, @Id, SYSUTCDATETIME(), @UpdatedBy
    );

    UPDATE dbo.CashSession
    SET TotalExpense = TotalExpense + @Amount,
        UpdatedAt = SYSUTCDATETIME(),
        UpdatedBy = @UpdatedBy
    WHERE Id = @TargetSessionId;

    INSERT INTO dbo.AuditLog (Id, TenantId, UserId, EntityType, EntityId, Action, DetailsJson, CreatedAt)
    VALUES (
        NEWID(), @TenantId, @UpdatedBy, N'Payment', @Id, N'Reverse',
        CONCAT(
            N'{"folio":"', @Folio,
            N'","amount":', @Amount,
            N',"reverseCashSessionId":"', CAST(@TargetSessionId AS NVARCHAR(36)),
            N'","reason":"', REPLACE(@ReasonTrim, N'"', N''''), N'"}'
        ),
        SYSUTCDATETIME()
    );

    COMMIT;
    EXEC dbo.sp_Payment_GetById @TenantId = @TenantId, @Id = @Id;
END
GO
