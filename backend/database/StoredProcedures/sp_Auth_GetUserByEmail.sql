/*
  SchoolCore — SQL Server 2022
  SP: sp_Auth_GetUserByEmail
  Returns user (+ tenant), roles, and branch ids. Optional TenantCode disambiguates.
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Auth_GetUserByEmail
    @Email      NVARCHAR(256),
    @TenantCode NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MatchCount INT;

    SELECT @MatchCount = COUNT(1)
    FROM dbo.[User] u
    INNER JOIN dbo.Tenant t ON t.Id = u.TenantId
    WHERE u.Email = @Email
      AND u.IsDeleted = 0
      AND (@TenantCode IS NULL OR t.Code = @TenantCode);

    IF @MatchCount > 1
    BEGIN
        -- Ambiguous without TenantCode: empty first result set with MatchCount hint via second empty sets.
        SELECT CAST(NULL AS UNIQUEIDENTIFIER) AS Id,
               CAST(NULL AS UNIQUEIDENTIFIER) AS TenantId,
               CAST(NULL AS NVARCHAR(256)) AS Email,
               CAST(NULL AS NVARCHAR(500)) AS PasswordHash,
               CAST(NULL AS NVARCHAR(100)) AS FirstName,
               CAST(NULL AS NVARCHAR(100)) AS LastName,
               CAST(0 AS BIT) AS IsActive,
               CAST(0 AS INT) AS AccessFailedCount,
               CAST(NULL AS DATETIME2(3)) AS LockoutEndUtc,
               CAST(NULL AS DATETIME2(3)) AS LastLoginAt,
               CAST(NULL AS NVARCHAR(50)) AS TenantCode,
               CAST(NULL AS NVARCHAR(200)) AS TenantName,
               CAST(1 AS BIT) AS IsAmbiguous;
        SELECT CAST(NULL AS NVARCHAR(50)) AS RoleCode WHERE 1 = 0;
        SELECT CAST(NULL AS UNIQUEIDENTIFIER) AS BranchId WHERE 1 = 0;
        RETURN;
    END;

    DECLARE @UserId UNIQUEIDENTIFIER;
    DECLARE @TenantId UNIQUEIDENTIFIER;

    SELECT TOP (1)
        @UserId = u.Id,
        @TenantId = u.TenantId
    FROM dbo.[User] u
    INNER JOIN dbo.Tenant t ON t.Id = u.TenantId
    WHERE u.Email = @Email
      AND u.IsDeleted = 0
      AND (@TenantCode IS NULL OR t.Code = @TenantCode);

    SELECT
        u.Id,
        u.TenantId,
        u.Email,
        u.PasswordHash,
        u.FirstName,
        u.LastName,
        u.IsActive,
        u.AccessFailedCount,
        u.LockoutEndUtc,
        u.LastLoginAt,
        t.Code AS TenantCode,
        t.Name AS TenantName,
        CAST(0 AS BIT) AS IsAmbiguous
    FROM dbo.[User] u
    INNER JOIN dbo.Tenant t ON t.Id = u.TenantId
    WHERE u.Id = @UserId;

    SELECT r.Code AS RoleCode
    FROM dbo.UserRole ur
    INNER JOIN dbo.Role r ON r.Id = ur.RoleId
    WHERE ur.UserId = @UserId
    ORDER BY r.Code;

    SELECT ub.BranchId
    FROM dbo.UserBranch ub
    INNER JOIN dbo.Branch b ON b.Id = ub.BranchId AND b.IsDeleted = 0 AND b.IsActive = 1
    WHERE ub.UserId = @UserId
      AND b.TenantId = @TenantId;
END
GO
