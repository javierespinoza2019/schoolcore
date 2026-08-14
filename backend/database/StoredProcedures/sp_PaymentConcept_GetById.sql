/*
  SchoolCore — SQL Server 2022
  SP: sp_PaymentConcept_GetById
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_PaymentConcept_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, Name, ConceptType, DefaultAmount, DifferentiatedByLevel, IsActive, CreatedAt, UpdatedAt
    FROM dbo.PaymentConcept WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    SELECT a.Id, a.PaymentConceptId, a.EducationLevelId, a.Amount, l.Name AS EducationLevelName
    FROM dbo.PaymentConceptAmount a
    INNER JOIN dbo.EducationLevel l ON l.Id = a.EducationLevelId
    WHERE a.TenantId=@TenantId AND a.PaymentConceptId=@Id;
END
GO
