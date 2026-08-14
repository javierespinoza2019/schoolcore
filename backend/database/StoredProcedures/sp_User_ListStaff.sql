/*
  SchoolCore — SQL Server 2022
  SP: sp_User_ListStaff
  Result sets: (1) users paged  (2) roles for page  (3) branches for page
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_User_ListStaff
    @TenantId UNIQUEIDENTIFIER, @Page INT=1, @PageSize INT=50, @Search NVARCHAR(100)=NULL, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 100 SET @PageSize = 100;

    SELECT @TotalCount = COUNT(1) FROM dbo.[User] u
    WHERE u.TenantId=@TenantId AND u.IsDeleted=0
      AND (@Search IS NULL OR u.Email LIKE N'%'+@Search+N'%' OR u.FirstName LIKE N'%'+@Search+N'%' OR u.LastName LIKE N'%'+@Search+N'%');

    ;WITH PageUsers AS (
        SELECT u.Id, u.TenantId, u.Email, u.FirstName, u.LastName, u.IsActive, u.LastLoginAt, u.CreatedAt, u.UpdatedAt
        FROM dbo.[User] u
        WHERE u.TenantId=@TenantId AND u.IsDeleted=0
          AND (@Search IS NULL OR u.Email LIKE N'%'+@Search+N'%' OR u.FirstName LIKE N'%'+@Search+N'%' OR u.LastName LIKE N'%'+@Search+N'%')
        ORDER BY u.LastName, u.FirstName
        OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY
    )
    SELECT Id, TenantId, Email, FirstName, LastName, IsActive, LastLoginAt, CreatedAt, UpdatedAt
    FROM PageUsers;

    ;WITH PageUsers AS (
        SELECT u.Id
        FROM dbo.[User] u
        WHERE u.TenantId=@TenantId AND u.IsDeleted=0
          AND (@Search IS NULL OR u.Email LIKE N'%'+@Search+N'%' OR u.FirstName LIKE N'%'+@Search+N'%' OR u.LastName LIKE N'%'+@Search+N'%')
        ORDER BY u.LastName, u.FirstName
        OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY
    )
    SELECT pu.Id AS UserId, r.Id AS RoleId, r.Code AS RoleCode, r.Name AS RoleName
    FROM PageUsers pu
    INNER JOIN dbo.UserRole ur ON ur.UserId = pu.Id
    INNER JOIN dbo.Role r ON r.Id = ur.RoleId;

    ;WITH PageUsers AS (
        SELECT u.Id
        FROM dbo.[User] u
        WHERE u.TenantId=@TenantId AND u.IsDeleted=0
          AND (@Search IS NULL OR u.Email LIKE N'%'+@Search+N'%' OR u.FirstName LIKE N'%'+@Search+N'%' OR u.LastName LIKE N'%'+@Search+N'%')
        ORDER BY u.LastName, u.FirstName
        OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY
    )
    SELECT pu.Id AS UserId, ub.BranchId, b.Name AS BranchName, b.Code AS BranchCode
    FROM PageUsers pu
    INNER JOIN dbo.UserBranch ub ON ub.UserId = pu.Id
    INNER JOIN dbo.Branch b ON b.Id = ub.BranchId AND b.IsDeleted=0 AND b.TenantId=@TenantId;
END
GO
