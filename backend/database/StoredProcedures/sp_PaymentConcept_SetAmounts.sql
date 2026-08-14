/*
  SchoolCore — SQL Server 2022
  SP: sp_PaymentConcept_SetAmounts
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_PaymentConcept_SetAmounts
    @TenantId UNIQUEIDENTIFIER, @PaymentConceptId UNIQUEIDENTIFIER, @AmountsJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.PaymentConcept WHERE TenantId=@TenantId AND Id=@PaymentConceptId AND IsDeleted=0)
        THROW 51004, 'PaymentConcept not found.', 1;
    DELETE FROM dbo.PaymentConceptAmount WHERE TenantId=@TenantId AND PaymentConceptId=@PaymentConceptId;
    INSERT INTO dbo.PaymentConceptAmount (Id, TenantId, PaymentConceptId, EducationLevelId, Amount)
    SELECT NEWID(), @TenantId, @PaymentConceptId, EducationLevelId, Amount
    FROM OPENJSON(@AmountsJson)
    WITH (EducationLevelId UNIQUEIDENTIFIER '$.educationLevelId', Amount DECIMAL(18,2) '$.amount');
    SELECT a.Id, a.PaymentConceptId, a.EducationLevelId, a.Amount, l.Name AS EducationLevelName
    FROM dbo.PaymentConceptAmount a
    INNER JOIN dbo.EducationLevel l ON l.Id = a.EducationLevelId
    WHERE a.TenantId=@TenantId AND a.PaymentConceptId=@PaymentConceptId;
END
GO
