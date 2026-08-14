/*
  SchoolCore — SQL Server 2022
  SP: sp_PaymentConcept_Create
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_PaymentConcept_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @Name NVARCHAR(200), @ConceptType NVARCHAR(50),
    @DefaultAmount DECIMAL(18,2), @DifferentiatedByLevel BIT=0, @IsActive BIT=1, @CreatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.PaymentConcept (Id,TenantId,Name,ConceptType,DefaultAmount,DifferentiatedByLevel,IsActive,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@Name,@ConceptType,@DefaultAmount,@DifferentiatedByLevel,@IsActive,SYSUTCDATETIME(),@CreatedBy);
    SELECT Id, TenantId, Name, ConceptType, DefaultAmount, DifferentiatedByLevel, IsActive, CreatedAt, UpdatedAt FROM dbo.PaymentConcept WHERE Id=@Id;
END
GO
