/*
  SchoolCore — SQL Server 2022
  SP: sp_PaymentConcept_List
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_PaymentConcept_List
    @TenantId UNIQUEIDENTIFIER, @Page INT=1, @PageSize INT=50, @Search NVARCHAR(100)=NULL, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 100 SET @PageSize = 100;
    SELECT @TotalCount = COUNT(1) FROM dbo.PaymentConcept
    WHERE TenantId=@TenantId AND IsDeleted=0 AND (@Search IS NULL OR Name LIKE N'%'+@Search+N'%');
    SELECT Id, TenantId, Name, ConceptType, DefaultAmount, DifferentiatedByLevel, IsActive, CreatedAt, UpdatedAt
    FROM dbo.PaymentConcept
    WHERE TenantId=@TenantId AND IsDeleted=0 AND (@Search IS NULL OR Name LIKE N'%'+@Search+N'%')
    ORDER BY Name OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO
