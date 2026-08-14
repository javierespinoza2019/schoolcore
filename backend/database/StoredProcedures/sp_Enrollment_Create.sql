/*
  SchoolCore — SQL Server 2022
  SP: sp_Enrollment_Create
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Enrollment_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER, @SchoolCycleId UNIQUEIDENTIFIER,
    @CreatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRAN;
    DECLARE @Fmt NVARCHAR(50);
    EXEC dbo.sp_TenantSequence_Next @TenantId=@TenantId, @SequenceKey=N'Enrollment', @Prefix=N'ENR-', @PadLength=6, @FormattedValue=@Fmt OUTPUT;
    INSERT INTO dbo.Enrollment (Id,TenantId,BranchId,SchoolCycleId,EnrollmentNumber,Status,CurrentStep,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@BranchId,@SchoolCycleId,@Fmt,N'draft',1,SYSUTCDATETIME(),@CreatedBy);
    COMMIT;
    EXEC dbo.sp_Enrollment_GetById @TenantId=@TenantId, @Id=@Id;
END
GO
