/*
  SchoolCore — SQL Server 2022
  SP: sp_Auth_UpdateLoginFailure
  Increments AccessFailedCount; locks account after @MaxAttempts for @LockoutMinutes.
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Auth_UpdateLoginFailure
    @UserId         UNIQUEIDENTIFIER,
    @TenantId       UNIQUEIDENTIFIER,
    @MaxAttempts    INT = 5,
    @LockoutMinutes INT = 15
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.[User]
    SET
        AccessFailedCount = AccessFailedCount + 1,
        LockoutEndUtc = CASE
            WHEN AccessFailedCount + 1 >= @MaxAttempts
                THEN DATEADD(MINUTE, @LockoutMinutes, SYSUTCDATETIME())
            ELSE LockoutEndUtc
        END,
        UpdatedAt = SYSUTCDATETIME()
    WHERE Id = @UserId
      AND TenantId = @TenantId
      AND IsDeleted = 0;

    SELECT
        AccessFailedCount,
        LockoutEndUtc
    FROM dbo.[User]
    WHERE Id = @UserId
      AND TenantId = @TenantId;
END
GO
