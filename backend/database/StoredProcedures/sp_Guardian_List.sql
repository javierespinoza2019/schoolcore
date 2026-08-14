/*
  SchoolCore — SQL Server 2022
  SP: sp_Guardian_List
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Guardian_List
    @TenantId UNIQUEIDENTIFIER, @Page INT=1, @PageSize INT=50, @Search NVARCHAR(100)=NULL, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 100 SET @PageSize = 100;
    SELECT @TotalCount = COUNT(1) FROM dbo.Guardian WHERE TenantId=@TenantId AND IsDeleted=0
      AND (@Search IS NULL OR FirstName LIKE N'%'+@Search+N'%' OR LastName LIKE N'%'+@Search+N'%' OR Email LIKE N'%'+@Search+N'%');
    SELECT g.Id, g.TenantId, g.FirstName, g.LastName, g.Email, g.Phone, g.Occupation, g.Address, g.Status, g.CreatedAt, g.UpdatedAt,
           (SELECT COUNT(1) FROM dbo.StudentGuardian sg WHERE sg.TenantId=g.TenantId AND sg.GuardianId=g.Id) AS ChildrenCount
    FROM dbo.Guardian g
    WHERE g.TenantId=@TenantId AND g.IsDeleted=0
      AND (@Search IS NULL OR g.FirstName LIKE N'%'+@Search+N'%' OR g.LastName LIKE N'%'+@Search+N'%' OR g.Email LIKE N'%'+@Search+N'%')
    ORDER BY g.LastName, g.FirstName OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO
