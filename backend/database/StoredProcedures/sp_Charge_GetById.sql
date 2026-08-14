/*
  SchoolCore — SQL Server 2022
  SP: sp_Charge_GetById
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Charge_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT c.Id, c.TenantId, c.BranchId, c.StudentId, c.PaymentConceptId, c.ConceptName, c.ConceptType, c.GrossAmount,
           c.ScholarshipPercent, c.NetAmount, c.AmountPaid, c.DueDate, c.Status, c.SchoolCycleId, c.MoraInfoDays, c.CreatedAt,
           s.FirstName + N' ' + s.LastName AS StudentName
    FROM dbo.Charge c INNER JOIN dbo.Student s ON s.Id=c.StudentId
    WHERE c.TenantId=@TenantId AND c.Id=@Id AND c.IsDeleted=0;
END
GO
