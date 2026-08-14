# -*- coding: utf-8 -*-
"""Generate SchoolCore MVP SPs Phases 5-6 (Finance, Cash, Reports, Notifications)."""
from pathlib import Path

SP_DIR = Path(r"c:\Proyectos\AppFabric\SchoolCore\schoolcore\backend\database\StoredProcedures")


def write_sp(name: str, body: str) -> None:
    content = f"""/*
  SchoolCore — SQL Server 2022
  SP: {name}
*/
USE [SchoolCore];
GO

{body.strip()}
GO
"""
    (SP_DIR / f"{name}.sql").write_text(content, encoding="utf-8")


def main() -> None:
    write_sp(
        "sp_AuditLog_Create",
        """
CREATE OR ALTER PROCEDURE dbo.sp_AuditLog_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @UserId UNIQUEIDENTIFIER=NULL,
    @EntityType NVARCHAR(50), @EntityId UNIQUEIDENTIFIER=NULL, @Action NVARCHAR(50), @DetailsJson NVARCHAR(MAX)=NULL
AS BEGIN SET NOCOUNT ON;
    INSERT INTO dbo.AuditLog (Id, TenantId, UserId, EntityType, EntityId, Action, DetailsJson, CreatedAt)
    VALUES (@Id, @TenantId, @UserId, @EntityType, @EntityId, @Action, @DetailsJson, SYSUTCDATETIME());
END
""",
    )

    # Charge
    write_sp(
        "sp_Charge_List",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Charge_List
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER=NULL, @StudentId UNIQUEIDENTIFIER=NULL, @Status NVARCHAR(30)=NULL,
    @Page INT=1, @PageSize INT=50, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 100 SET @PageSize = 100;
    -- Refresh overdue (informational mora)
    UPDATE dbo.Charge SET Status=N'overdue', MoraInfoDays = DATEDIFF(DAY, DueDate, CAST(SYSUTCDATETIME() AS DATE)), UpdatedAt=SYSUTCDATETIME()
    WHERE TenantId=@TenantId AND IsDeleted=0 AND Status=N'pending' AND DueDate < CAST(SYSUTCDATETIME() AS DATE);

    SELECT @TotalCount = COUNT(1) FROM dbo.Charge
    WHERE TenantId=@TenantId AND IsDeleted=0
      AND (@BranchId IS NULL OR BranchId=@BranchId)
      AND (@StudentId IS NULL OR StudentId=@StudentId)
      AND (@Status IS NULL OR Status=@Status);
    SELECT c.Id, c.TenantId, c.BranchId, c.StudentId, c.PaymentConceptId, c.ConceptName, c.ConceptType, c.GrossAmount,
           c.ScholarshipPercent, c.NetAmount, c.AmountPaid, c.DueDate, c.Status, c.SchoolCycleId, c.MoraInfoDays, c.CreatedAt,
           s.FirstName + N' ' + s.LastName AS StudentName
    FROM dbo.Charge c INNER JOIN dbo.Student s ON s.Id=c.StudentId
    WHERE c.TenantId=@TenantId AND c.IsDeleted=0
      AND (@BranchId IS NULL OR c.BranchId=@BranchId)
      AND (@StudentId IS NULL OR c.StudentId=@StudentId)
      AND (@Status IS NULL OR c.Status=@Status)
    ORDER BY c.DueDate DESC OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
""",
    )
    write_sp(
        "sp_Charge_GetById",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Charge_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT c.Id, c.TenantId, c.BranchId, c.StudentId, c.PaymentConceptId, c.ConceptName, c.ConceptType, c.GrossAmount,
           c.ScholarshipPercent, c.NetAmount, c.AmountPaid, c.DueDate, c.Status, c.SchoolCycleId, c.MoraInfoDays, c.CreatedAt,
           s.FirstName + N' ' + s.LastName AS StudentName
    FROM dbo.Charge c INNER JOIN dbo.Student s ON s.Id=c.StudentId
    WHERE c.TenantId=@TenantId AND c.Id=@Id AND c.IsDeleted=0;
END
""",
    )
    write_sp(
        "sp_Charge_Create",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Charge_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER, @StudentId UNIQUEIDENTIFIER,
    @PaymentConceptId UNIQUEIDENTIFIER=NULL, @ConceptName NVARCHAR(200), @ConceptType NVARCHAR(50),
    @GrossAmount DECIMAL(18,2), @ScholarshipPercent DECIMAL(5,2)=NULL, @DueDate DATE,
    @SchoolCycleId UNIQUEIDENTIFIER=NULL, @CreatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Student WHERE TenantId=@TenantId AND Id=@StudentId AND IsDeleted=0)
        THROW 51004, 'Student not found.', 1;
    -- Beca aplicada al generar el cargo (monto neto)
    DECLARE @Sch DECIMAL(5,2) = COALESCE(@ScholarshipPercent, (SELECT ScholarshipPercent FROM dbo.Student WHERE Id=@StudentId));
    IF @Sch < 0 SET @Sch = 0; IF @Sch > 100 SET @Sch = 100;
    DECLARE @Net DECIMAL(18,2) = ROUND(@GrossAmount * (1 - (@Sch / 100.0)), 2);

    INSERT INTO dbo.Charge (Id,TenantId,BranchId,StudentId,PaymentConceptId,ConceptName,ConceptType,GrossAmount,ScholarshipPercent,NetAmount,AmountPaid,DueDate,Status,SchoolCycleId,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@BranchId,@StudentId,@PaymentConceptId,@ConceptName,@ConceptType,@GrossAmount,@Sch,@Net,0,@DueDate,N'pending',@SchoolCycleId,SYSUTCDATETIME(),@CreatedBy);

    INSERT INTO dbo.AuditLog (Id, TenantId, UserId, EntityType, EntityId, Action, DetailsJson, CreatedAt)
    VALUES (NEWID(), @TenantId, @CreatedBy, N'Charge', @Id, N'Create', CONCAT(N'{"netAmount":', @Net, N'}'), SYSUTCDATETIME());

    EXEC dbo.sp_Charge_GetById @TenantId=@TenantId, @Id=@Id;
END
""",
    )

    # Payment (full amount only — no partial)
    write_sp(
        "sp_Payment_Create",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Payment_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER, @StudentId UNIQUEIDENTIFIER,
    @ChargeId UNIQUEIDENTIFIER, @CashSessionId UNIQUEIDENTIFIER=NULL, @PaymentMethodId UNIQUEIDENTIFIER=NULL,
    @Amount DECIMAL(18,2), @Reference NVARCHAR(100)=NULL, @IdempotencyKey NVARCHAR(100)=NULL,
    @Notes NVARCHAR(500)=NULL, @CreatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRAN;

    IF @IdempotencyKey IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.Payment WHERE TenantId=@TenantId AND IdempotencyKey=@IdempotencyKey AND IsDeleted=0)
    BEGIN
        DECLARE @Existing UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM dbo.Payment WHERE TenantId=@TenantId AND IdempotencyKey=@IdempotencyKey AND IsDeleted=0);
        COMMIT;
        SELECT Id, TenantId, BranchId, StudentId, ChargeId, CashSessionId, PaymentMethodId, Amount, Folio, PaidAt, Reference, Notes, CreatedAt
        FROM dbo.Payment WHERE Id=@Existing;
        RETURN;
    END

    DECLARE @Net DECIMAL(18,2), @Paid DECIMAL(18,2), @Status NVARCHAR(30);
    SELECT @Net=NetAmount, @Paid=AmountPaid, @Status=Status FROM dbo.Charge WITH (UPDLOCK)
    WHERE TenantId=@TenantId AND Id=@ChargeId AND IsDeleted=0 AND StudentId=@StudentId;
    IF @Net IS NULL THROW 51004, 'Charge not found.', 1;
    IF @Status = N'paid' THROW 51009, 'Charge already paid.', 1;
    -- No partial payments in v1
    IF @Amount <> @Net THROW 51009, 'Partial payments are not allowed in cash v1. Amount must equal net charge.', 1;

    IF @CashSessionId IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM dbo.CashSession WHERE Id=@CashSessionId AND TenantId=@TenantId AND BranchId=@BranchId AND Status=N'open' AND IsDeleted=0)
            THROW 51009, 'Cash session is not open for this branch.', 1;
    END

    DECLARE @Folio NVARCHAR(50);
    EXEC dbo.sp_TenantSequence_Next @TenantId=@TenantId, @SequenceKey=N'PaymentFolio', @Prefix=N'FOL-', @PadLength=6, @FormattedValue=@Folio OUTPUT;

    INSERT INTO dbo.Payment (Id,TenantId,BranchId,StudentId,ChargeId,CashSessionId,PaymentMethodId,Amount,Folio,PaidAt,Reference,IdempotencyKey,Notes,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@BranchId,@StudentId,@ChargeId,@CashSessionId,@PaymentMethodId,@Amount,@Folio,SYSUTCDATETIME(),@Reference,@IdempotencyKey,@Notes,SYSUTCDATETIME(),@CreatedBy);

    UPDATE dbo.Charge SET AmountPaid=@Net, Status=N'paid', UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@CreatedBy
    WHERE Id=@ChargeId;

    IF @CashSessionId IS NOT NULL
    BEGIN
        INSERT INTO dbo.CashMovement (Id,TenantId,CashSessionId,MovementType,Category,Concept,Amount,PaymentMethodName,Reference,StudentId,PaymentId,OccurredAt,CreatedBy)
        SELECT NEWID(), @TenantId, @CashSessionId, N'income', c.ConceptType, c.ConceptName + N' - ' + s.FirstName + N' ' + s.LastName,
               @Amount, pm.Name, @Reference, @StudentId, @Id, SYSUTCDATETIME(), @CreatedBy
        FROM dbo.Charge c
        INNER JOIN dbo.Student s ON s.Id=c.StudentId
        LEFT JOIN dbo.PaymentMethod pm ON pm.Id=@PaymentMethodId
        WHERE c.Id=@ChargeId;

        UPDATE dbo.CashSession SET TotalIncome = TotalIncome + @Amount, UpdatedAt=SYSUTCDATETIME()
        WHERE Id=@CashSessionId;
    END

    INSERT INTO dbo.AuditLog (Id, TenantId, UserId, EntityType, EntityId, Action, DetailsJson, CreatedAt)
    VALUES (NEWID(), @TenantId, @CreatedBy, N'Payment', @Id, N'Create', CONCAT(N'{"folio":"', @Folio, N'","amount":', @Amount, N'}'), SYSUTCDATETIME());

    COMMIT;
    SELECT Id, TenantId, BranchId, StudentId, ChargeId, CashSessionId, PaymentMethodId, Amount, Folio, PaidAt, Reference, Notes, CreatedAt
    FROM dbo.Payment WHERE Id=@Id;
END
""",
    )
    write_sp(
        "sp_Payment_List",
        """
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
           s.FirstName + N' ' + s.LastName AS StudentName, pm.Name AS PaymentMethodName
    FROM dbo.Payment p
    INNER JOIN dbo.Student s ON s.Id=p.StudentId
    LEFT JOIN dbo.PaymentMethod pm ON pm.Id=p.PaymentMethodId
    WHERE p.TenantId=@TenantId AND p.IsDeleted=0
      AND (@BranchId IS NULL OR p.BranchId=@BranchId) AND (@StudentId IS NULL OR p.StudentId=@StudentId)
    ORDER BY p.PaidAt DESC OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
""",
    )
    write_sp(
        "sp_Payment_GetById",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Payment_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT p.Id, p.TenantId, p.BranchId, p.StudentId, p.ChargeId, p.CashSessionId, p.PaymentMethodId, p.Amount, p.Folio, p.PaidAt, p.Reference, p.Notes, p.CreatedAt,
           s.FirstName + N' ' + s.LastName AS StudentName, pm.Name AS PaymentMethodName
    FROM dbo.Payment p
    INNER JOIN dbo.Student s ON s.Id=p.StudentId
    LEFT JOIN dbo.PaymentMethod pm ON pm.Id=p.PaymentMethodId
    WHERE p.TenantId=@TenantId AND p.Id=@Id AND p.IsDeleted=0;
END
""",
    )

    # Expense
    write_sp(
        "sp_Expense_List",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Expense_List
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER=NULL, @Page INT=1, @PageSize INT=50, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 100 SET @PageSize = 100;
    SELECT @TotalCount = COUNT(1) FROM dbo.Expense WHERE TenantId=@TenantId AND IsDeleted=0 AND (@BranchId IS NULL OR BranchId=@BranchId);
    SELECT Id, TenantId, BranchId, CashSessionId, Concept, Category, Amount, ExpenseDate, Vendor, PaymentMethodId, Reference, CreatedAt
    FROM dbo.Expense WHERE TenantId=@TenantId AND IsDeleted=0 AND (@BranchId IS NULL OR BranchId=@BranchId)
    ORDER BY ExpenseDate DESC OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
""",
    )
    write_sp(
        "sp_Expense_Create",
        """
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
""",
    )
    write_sp(
        "sp_Expense_SoftDelete",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Expense_SoftDelete @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    UPDATE dbo.Expense SET IsDeleted=1, UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'Expense not found.', 1;
    INSERT INTO dbo.AuditLog (Id, TenantId, UserId, EntityType, EntityId, Action, CreatedAt)
    VALUES (NEWID(), @TenantId, @UpdatedBy, N'Expense', @Id, N'SoftDelete', SYSUTCDATETIME());
END
""",
    )

    # Cash session
    write_sp(
        "sp_CashSession_Open",
        """
CREATE OR ALTER PROCEDURE dbo.sp_CashSession_Open
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER, @UserId UNIQUEIDENTIFIER,
    @Shift NVARCHAR(30)=N'morning', @OpeningAmount DECIMAL(18,2)=0, @Notes NVARCHAR(500)=NULL, @CreatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.CashSession WHERE TenantId=@TenantId AND BranchId=@BranchId AND UserId=@UserId AND Shift=@Shift AND Status=N'open' AND IsDeleted=0)
        THROW 51009, 'An open cash session already exists for this user/branch/shift.', 1;
    INSERT INTO dbo.CashSession (Id,TenantId,BranchId,UserId,Shift,OpenedAt,OpeningAmount,Status,Notes,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@BranchId,@UserId,@Shift,SYSUTCDATETIME(),@OpeningAmount,N'open',@Notes,SYSUTCDATETIME(),@CreatedBy);
    INSERT INTO dbo.AuditLog (Id, TenantId, UserId, EntityType, EntityId, Action, CreatedAt)
    VALUES (NEWID(), @TenantId, @CreatedBy, N'CashSession', @Id, N'Open', SYSUTCDATETIME());
    SELECT Id, TenantId, BranchId, UserId, Shift, OpenedAt, ClosedAt, OpeningAmount, TotalIncome, TotalExpense, ClosingAmount, DifferenceAmount, Status, Notes, CreatedAt
    FROM dbo.CashSession WHERE Id=@Id;
END
""",
    )
    write_sp(
        "sp_CashSession_GetById",
        """
CREATE OR ALTER PROCEDURE dbo.sp_CashSession_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT Id, TenantId, BranchId, UserId, Shift, OpenedAt, ClosedAt, OpeningAmount, TotalIncome, TotalExpense, ClosingAmount, DifferenceAmount, Status, Notes, CreatedAt
    FROM dbo.CashSession WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
END
""",
    )
    write_sp(
        "sp_CashSession_GetOpen",
        """
CREATE OR ALTER PROCEDURE dbo.sp_CashSession_GetOpen
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER, @UserId UNIQUEIDENTIFIER, @Shift NVARCHAR(30)=NULL
AS BEGIN SET NOCOUNT ON;
    SELECT TOP 1 Id, TenantId, BranchId, UserId, Shift, OpenedAt, ClosedAt, OpeningAmount, TotalIncome, TotalExpense, ClosingAmount, DifferenceAmount, Status, Notes, CreatedAt
    FROM dbo.CashSession
    WHERE TenantId=@TenantId AND BranchId=@BranchId AND UserId=@UserId AND Status=N'open' AND IsDeleted=0
      AND (@Shift IS NULL OR Shift=@Shift)
    ORDER BY OpenedAt DESC;
END
""",
    )
    write_sp(
        "sp_CashSession_List",
        """
CREATE OR ALTER PROCEDURE dbo.sp_CashSession_List
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER=NULL, @Page INT=1, @PageSize INT=50, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 100 SET @PageSize = 100;
    SELECT @TotalCount = COUNT(1) FROM dbo.CashSession WHERE TenantId=@TenantId AND IsDeleted=0 AND (@BranchId IS NULL OR BranchId=@BranchId);
    SELECT Id, TenantId, BranchId, UserId, Shift, OpenedAt, ClosedAt, OpeningAmount, TotalIncome, TotalExpense, ClosingAmount, DifferenceAmount, Status, Notes, CreatedAt
    FROM dbo.CashSession WHERE TenantId=@TenantId AND IsDeleted=0 AND (@BranchId IS NULL OR BranchId=@BranchId)
    ORDER BY OpenedAt DESC OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
""",
    )
    write_sp(
        "sp_CashAudit_Save",
        """
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
""",
    )
    write_sp(
        "sp_CashSession_Close",
        """
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
""",
    )
    write_sp(
        "sp_CashMovement_ListBySession",
        """
CREATE OR ALTER PROCEDURE dbo.sp_CashMovement_ListBySession @TenantId UNIQUEIDENTIFIER, @CashSessionId UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT Id, TenantId, CashSessionId, MovementType, Category, Concept, Amount, PaymentMethodName, Reference, StudentId, PaymentId, ExpenseId, OccurredAt
    FROM dbo.CashMovement WHERE TenantId=@TenantId AND CashSessionId=@CashSessionId
    ORDER BY OccurredAt;
END
""",
    )
    write_sp(
        "sp_CashAudit_GetBySession",
        """
CREATE OR ALTER PROCEDURE dbo.sp_CashAudit_GetBySession @TenantId UNIQUEIDENTIFIER, @CashSessionId UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT Id, TenantId, CashSessionId, BillsJson, CoinsJson, TotalCash, TotalCard, TotalTransfer, TotalCheck, SystemTotal, DifferenceAmount, Observations, CreatedAt
    FROM dbo.CashAudit WHERE TenantId=@TenantId AND CashSessionId=@CashSessionId;
END
""",
    )

    # Reports
    write_sp(
        "sp_Report_IncomeExpense",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Report_IncomeExpense
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER=NULL, @FromDate DATE, @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    ;WITH Months AS (
        SELECT DATEFROMPARTS(YEAR(@FromDate), MONTH(@FromDate), 1) AS MonthStart
        UNION ALL
        SELECT DATEADD(MONTH, 1, MonthStart) FROM Months WHERE DATEADD(MONTH, 1, MonthStart) <= @ToDate
    )
    SELECT FORMAT(m.MonthStart, 'yyyy-MM') AS Period,
           ISNULL((SELECT SUM(p.Amount) FROM dbo.Payment p WHERE p.TenantId=@TenantId AND p.IsDeleted=0
                AND (@BranchId IS NULL OR p.BranchId=@BranchId)
                AND p.PaidAt >= m.MonthStart AND p.PaidAt < DATEADD(MONTH,1,m.MonthStart)), 0) AS Income,
           ISNULL((SELECT SUM(e.Amount) FROM dbo.Expense e WHERE e.TenantId=@TenantId AND e.IsDeleted=0
                AND (@BranchId IS NULL OR e.BranchId=@BranchId)
                AND e.ExpenseDate >= m.MonthStart AND e.ExpenseDate < DATEADD(MONTH,1,m.MonthStart)), 0) AS Expense
    FROM Months m
    OPTION (MAXRECURSION 120);
END
""",
    )
    write_sp(
        "sp_Report_Enrollment",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Report_Enrollment
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER=NULL, @SchoolCycleId UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ISNULL(el.Name, N'Sin nivel') AS LevelName, COUNT(1) AS StudentCount
    FROM dbo.Student s
    LEFT JOIN dbo.EducationLevel el ON el.Id = s.EducationLevelId
    WHERE s.TenantId=@TenantId AND s.IsDeleted=0 AND s.Status=N'active'
      AND (@BranchId IS NULL OR s.BranchId=@BranchId)
      AND (@SchoolCycleId IS NULL OR s.SchoolCycleId=@SchoolCycleId)
    GROUP BY el.Name
    ORDER BY StudentCount DESC;

    SELECT b.Name AS BranchName, COUNT(1) AS StudentCount
    FROM dbo.Student s INNER JOIN dbo.Branch b ON b.Id=s.BranchId
    WHERE s.TenantId=@TenantId AND s.IsDeleted=0 AND s.Status=N'active'
      AND (@BranchId IS NULL OR s.BranchId=@BranchId)
    GROUP BY b.Name ORDER BY StudentCount DESC;
END
""",
    )
    write_sp(
        "sp_Report_Morosity",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Report_Morosity
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Charge SET Status=N'overdue', MoraInfoDays = DATEDIFF(DAY, DueDate, CAST(SYSUTCDATETIME() AS DATE))
    WHERE TenantId=@TenantId AND IsDeleted=0 AND Status=N'pending' AND DueDate < CAST(SYSUTCDATETIME() AS DATE);

    SELECT c.Id AS ChargeId, c.StudentId, s.FirstName + N' ' + s.LastName AS StudentName, c.ConceptName,
           c.NetAmount, c.DueDate, c.MoraInfoDays, c.Status, el.Name AS LevelName
    FROM dbo.Charge c
    INNER JOIN dbo.Student s ON s.Id=c.StudentId
    LEFT JOIN dbo.EducationLevel el ON el.Id=s.EducationLevelId
    WHERE c.TenantId=@TenantId AND c.IsDeleted=0 AND c.Status=N'overdue'
      AND (@BranchId IS NULL OR c.BranchId=@BranchId)
    ORDER BY c.DueDate;

    SELECT ISNULL(el.Name, N'Sin nivel') AS LevelName, COUNT(1) AS OverdueCount, SUM(c.NetAmount) AS OverdueAmount
    FROM dbo.Charge c
    INNER JOIN dbo.Student s ON s.Id=c.StudentId
    LEFT JOIN dbo.EducationLevel el ON el.Id=s.EducationLevelId
    WHERE c.TenantId=@TenantId AND c.IsDeleted=0 AND c.Status=N'overdue'
      AND (@BranchId IS NULL OR c.BranchId=@BranchId)
    GROUP BY el.Name;
END
""",
    )
    write_sp(
        "sp_Report_PaymentMethods",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Report_PaymentMethods
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER=NULL, @FromDate DATE, @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ISNULL(pm.Name, N'Sin método') AS MethodName, COUNT(1) AS PaymentCount, SUM(p.Amount) AS TotalAmount
    FROM dbo.Payment p
    LEFT JOIN dbo.PaymentMethod pm ON pm.Id=p.PaymentMethodId
    WHERE p.TenantId=@TenantId AND p.IsDeleted=0
      AND (@BranchId IS NULL OR p.BranchId=@BranchId)
      AND p.PaidAt >= @FromDate AND p.PaidAt < DATEADD(DAY, 1, @ToDate)
    GROUP BY pm.Name
    ORDER BY TotalAmount DESC;
END
""",
    )
    write_sp(
        "sp_Report_Concepts",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Report_Concepts
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER=NULL, @FromDate DATE, @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    SELECT c.ConceptName, c.ConceptType, COUNT(1) AS ChargeCount,
           SUM(CASE WHEN c.Status=N'paid' THEN c.NetAmount ELSE 0 END) AS PaidAmount,
           SUM(CASE WHEN c.Status<>N'paid' THEN c.NetAmount ELSE 0 END) AS PendingAmount
    FROM dbo.Charge c
    WHERE c.TenantId=@TenantId AND c.IsDeleted=0
      AND (@BranchId IS NULL OR c.BranchId=@BranchId)
      AND c.CreatedAt >= @FromDate AND c.CreatedAt < DATEADD(DAY, 1, @ToDate)
    GROUP BY c.ConceptName, c.ConceptType
    ORDER BY PaidAmount DESC;
END
""",
    )
    write_sp(
        "sp_Report_ByBranch",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Report_ByBranch
    @TenantId UNIQUEIDENTIFIER, @FromDate DATE, @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    SELECT b.Id AS BranchId, b.Name AS BranchName,
           (SELECT COUNT(1) FROM dbo.Student s WHERE s.TenantId=@TenantId AND s.BranchId=b.Id AND s.IsDeleted=0 AND s.Status=N'active') AS ActiveStudents,
           ISNULL((SELECT SUM(p.Amount) FROM dbo.Payment p WHERE p.TenantId=@TenantId AND p.BranchId=b.Id AND p.IsDeleted=0
                AND p.PaidAt >= @FromDate AND p.PaidAt < DATEADD(DAY,1,@ToDate)), 0) AS Income,
           ISNULL((SELECT SUM(e.Amount) FROM dbo.Expense e WHERE e.TenantId=@TenantId AND e.BranchId=b.Id AND e.IsDeleted=0
                AND e.ExpenseDate >= @FromDate AND e.ExpenseDate < DATEADD(DAY,1,@ToDate)), 0) AS Expense,
           ISNULL((SELECT SUM(c.NetAmount) FROM dbo.Charge c WHERE c.TenantId=@TenantId AND c.BranchId=b.Id AND c.IsDeleted=0 AND c.Status IN (N'pending', N'overdue')), 0) AS Outstanding
    FROM dbo.Branch b
    WHERE b.TenantId=@TenantId AND b.IsDeleted=0
    ORDER BY b.Name;
END
""",
    )

    # Notifications
    write_sp(
        "sp_Notification_List",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Notification_List
    @TenantId UNIQUEIDENTIFIER, @UserId UNIQUEIDENTIFIER, @UnreadOnly BIT=0, @Page INT=1, @PageSize INT=50, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 100 SET @PageSize = 100;
    SELECT @TotalCount = COUNT(1) FROM dbo.Notification
    WHERE TenantId=@TenantId AND UserId=@UserId AND IsDeleted=0 AND (@UnreadOnly=0 OR IsRead=0);
    SELECT Id, TenantId, UserId, Category, Title, Body, LinkUrl, IsRead, ReadAt, CreatedAt
    FROM dbo.Notification
    WHERE TenantId=@TenantId AND UserId=@UserId AND IsDeleted=0 AND (@UnreadOnly=0 OR IsRead=0)
    ORDER BY CreatedAt DESC OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
""",
    )
    write_sp(
        "sp_Notification_MarkRead",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Notification_MarkRead
    @TenantId UNIQUEIDENTIFIER, @UserId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    UPDATE dbo.Notification SET IsRead=1, ReadAt=SYSUTCDATETIME()
    WHERE TenantId=@TenantId AND UserId=@UserId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'Notification not found.', 1;
END
""",
    )
    write_sp(
        "sp_Notification_MarkAllRead",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Notification_MarkAllRead
    @TenantId UNIQUEIDENTIFIER, @UserId UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    UPDATE dbo.Notification SET IsRead=1, ReadAt=SYSUTCDATETIME()
    WHERE TenantId=@TenantId AND UserId=@UserId AND IsDeleted=0 AND IsRead=0;
END
""",
    )
    write_sp(
        "sp_Notification_Create",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Notification_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @UserId UNIQUEIDENTIFIER, @Category NVARCHAR(50),
    @Title NVARCHAR(200), @Body NVARCHAR(1000)=NULL, @LinkUrl NVARCHAR(500)=NULL
AS BEGIN SET NOCOUNT ON;
    INSERT INTO dbo.Notification (Id,TenantId,UserId,Category,Title,Body,LinkUrl,IsRead,CreatedAt)
    VALUES (@Id,@TenantId,@UserId,@Category,@Title,@Body,@LinkUrl,0,SYSUTCDATETIME());
    SELECT Id, TenantId, UserId, Category, Title, Body, LinkUrl, IsRead, ReadAt, CreatedAt FROM dbo.Notification WHERE Id=@Id;
END
""",
    )

    print("Phases 5-6 SPs generated")
    print("count=", len(list(SP_DIR.glob("sp_*.sql"))))


if __name__ == "__main__":
    main()
