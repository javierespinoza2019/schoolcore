/*
  SchoolCore — SQL Server 2022
  SP: sp_Auth_RevokeRefreshToken
  Revokes by TokenHash and/or all active tokens for a user within a tenant.
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Auth_RevokeRefreshToken
    @TokenHash NVARCHAR(128) = NULL,
    @UserId    UNIQUEIDENTIFIER = NULL,
    @TenantId  UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @TokenHash IS NOT NULL
    BEGIN
        UPDATE dbo.RefreshToken
        SET RevokedAt = SYSUTCDATETIME()
        WHERE TokenHash = @TokenHash
          AND RevokedAt IS NULL
          AND (@TenantId IS NULL OR TenantId = @TenantId)
          AND (@UserId IS NULL OR UserId = @UserId);
    END
    ELSE IF @UserId IS NOT NULL AND @TenantId IS NOT NULL
    BEGIN
        UPDATE dbo.RefreshToken
        SET RevokedAt = SYSUTCDATETIME()
        WHERE UserId = @UserId
          AND TenantId = @TenantId
          AND RevokedAt IS NULL;
    END
END
GO
