/*
  SchoolCore — SQL Server 2022
  SP: sp_Auth_GetRefreshToken
  Looks up an active (non-revoked, non-expired) refresh token by hash.
  Result sets: token row, user+tenant, roles, branches.
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Auth_GetRefreshToken
    @TokenHash NVARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @UserId UNIQUEIDENTIFIER;
    DECLARE @TenantId UNIQUEIDENTIFIER;
    DECLARE @TokenId UNIQUEIDENTIFIER;

    SELECT TOP (1)
        @TokenId = rt.Id,
        @UserId = rt.UserId,
        @TenantId = rt.TenantId
    FROM dbo.RefreshToken rt
    WHERE rt.TokenHash = @TokenHash
      AND rt.RevokedAt IS NULL
      AND rt.ExpiresAt > SYSUTCDATETIME();

    SELECT
        rt.Id,
        rt.TenantId,
        rt.UserId,
        rt.TokenHash,
        rt.ExpiresAt,
        rt.RevokedAt,
        rt.CreatedAt
    FROM dbo.RefreshToken rt
    WHERE rt.Id = @TokenId;

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
    WHERE u.Id = @UserId
      AND u.TenantId = @TenantId
      AND u.IsDeleted = 0
      AND u.IsActive = 1
      AND t.IsActive = 1;

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
