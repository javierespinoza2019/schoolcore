/*
  SchoolCore — SQL Server 2022
  SP: sp_Auth_ResetAccessFailed
  Clears lockout counters and records LastLoginAt on successful login.
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Auth_ResetAccessFailed
    @UserId   UNIQUEIDENTIFIER,
    @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.[User]
    SET
        AccessFailedCount = 0,
        LockoutEndUtc = NULL,
        LastLoginAt = SYSUTCDATETIME(),
        UpdatedAt = SYSUTCDATETIME()
    WHERE Id = @UserId
      AND TenantId = @TenantId
      AND IsDeleted = 0;
END
GO
