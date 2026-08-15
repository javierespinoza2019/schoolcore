/*
  SchoolCore — SQL Server 2022
  SP: sp_Charge_Create
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Charge_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER, @StudentId UNIQUEIDENTIFIER,
    @PaymentConceptId UNIQUEIDENTIFIER=NULL, @ConceptName NVARCHAR(200), @ConceptType NVARCHAR(50),
    @GrossAmount DECIMAL(18,2), @ScholarshipPercent DECIMAL(5,2)=NULL, @DueDate DATE,
    @SchoolCycleId UNIQUEIDENTIFIER=NULL, @CreatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Student WHERE TenantId=@TenantId AND Id=@StudentId AND IsDeleted=0)
        THROW 51004, N'No se encontró el alumno.', 1;
    IF (@GrossAmount IS NULL OR @GrossAmount <= 0)
        THROW 51020, N'El cargo debe ser mayor a 0.', 1;
    -- Beca aplicada al generar el cargo (monto neto)
    DECLARE @Sch DECIMAL(5,2) = COALESCE(@ScholarshipPercent, (SELECT ScholarshipPercent FROM dbo.Student WHERE Id=@StudentId));
    IF @Sch < 0 SET @Sch = 0; IF @Sch > 100 SET @Sch = 100;
    DECLARE @Net DECIMAL(18,2) = ROUND(@GrossAmount * (1 - (@Sch / 100.0)), 2);
    IF @Net <= 0
        THROW 51020, N'El cargo debe ser mayor a 0.', 1;

    INSERT INTO dbo.Charge (Id,TenantId,BranchId,StudentId,PaymentConceptId,ConceptName,ConceptType,GrossAmount,ScholarshipPercent,NetAmount,AmountPaid,DueDate,Status,SchoolCycleId,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@BranchId,@StudentId,@PaymentConceptId,@ConceptName,@ConceptType,@GrossAmount,@Sch,@Net,0,@DueDate,N'pending',@SchoolCycleId,SYSUTCDATETIME(),@CreatedBy);

    INSERT INTO dbo.AuditLog (Id, TenantId, UserId, EntityType, EntityId, Action, DetailsJson, CreatedAt)
    VALUES (NEWID(), @TenantId, @CreatedBy, N'Charge', @Id, N'Create', CONCAT(N'{"netAmount":', @Net, N'}'), SYSUTCDATETIME());

    EXEC dbo.sp_Charge_GetById @TenantId=@TenantId, @Id=@Id;
END
GO
