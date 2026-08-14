/*
  SchoolCore — SQL Server 2022
  SP: sp_Enrollment_GetById
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Enrollment_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT Id, TenantId, BranchId, SchoolCycleId, StudentId, EnrollmentNumber, Status, CurrentStep,
           Step1StudentJson, Step2GuardiansJson, Step3AcademicJson, Step4DocumentsJson, Step5FinanceJson,
           CompletedAt, CreatedAt, UpdatedAt
    FROM dbo.Enrollment WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
END
GO
