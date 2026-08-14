/*
  SchoolCore — SQL Server 2022
  SP: sp_Enrollment_SaveWizard
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Enrollment_SaveWizard
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @CurrentStep INT,
    @Step1StudentJson NVARCHAR(MAX)=NULL, @Step2GuardiansJson NVARCHAR(MAX)=NULL, @Step3AcademicJson NVARCHAR(MAX)=NULL,
    @Step4DocumentsJson NVARCHAR(MAX)=NULL, @Step5FinanceJson NVARCHAR(MAX)=NULL, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Enrollment SET CurrentStep=@CurrentStep,
        Step1StudentJson = COALESCE(@Step1StudentJson, Step1StudentJson),
        Step2GuardiansJson = COALESCE(@Step2GuardiansJson, Step2GuardiansJson),
        Step3AcademicJson = COALESCE(@Step3AcademicJson, Step3AcademicJson),
        Step4DocumentsJson = COALESCE(@Step4DocumentsJson, Step4DocumentsJson),
        Step5FinanceJson = COALESCE(@Step5FinanceJson, Step5FinanceJson),
        UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0 AND Status=N'draft';
    IF @@ROWCOUNT=0 THROW 51004, 'Enrollment not found or not editable.', 1;
    EXEC dbo.sp_Enrollment_GetById @TenantId=@TenantId, @Id=@Id;
END
GO
