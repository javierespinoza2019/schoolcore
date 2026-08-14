/*
  SchoolCore — SQL Server 2022
  SP: sp_PaymentConcept_Update
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_PaymentConcept_Update
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @Name NVARCHAR(200), @ConceptType NVARCHAR(50),
    @DefaultAmount DECIMAL(18,2), @DifferentiatedByLevel BIT, @IsActive BIT, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.PaymentConcept SET Name=@Name, ConceptType=@ConceptType, DefaultAmount=@DefaultAmount,
        DifferentiatedByLevel=@DifferentiatedByLevel, IsActive=@IsActive, UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'PaymentConcept not found.', 1;
    SELECT Id, TenantId, Name, ConceptType, DefaultAmount, DifferentiatedByLevel, IsActive, CreatedAt, UpdatedAt FROM dbo.PaymentConcept WHERE Id=@Id;
END
GO
