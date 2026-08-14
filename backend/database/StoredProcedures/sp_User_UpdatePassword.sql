/*
  SchoolCore — SQL Server 2022
  SP: sp_User_UpdatePassword
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_User_UpdatePassword
    @UserId       UNIQUEIDENTIFIER,
    @TenantId     UNIQUEIDENTIFIER,
    @PasswordHash NVARCHAR(500),
    @UpdatedBy    UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.[User]
    SET
        PasswordHash = @PasswordHash,
        AccessFailedCount = 0,
        LockoutEndUtc = NULL,
        UpdatedAt = SYSUTCDATETIME(),
        UpdatedBy = @UpdatedBy
    WHERE Id = @UserId
      AND TenantId = @TenantId
      AND IsDeleted = 0;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
