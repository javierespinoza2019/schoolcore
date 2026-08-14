/*
  SchoolCore — SQL Server 2022
  SP: sp_Charge_List
*/
USE db_a0b4b3_schoolcore;
GO

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
GO
