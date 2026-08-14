/*
  SchoolCore — SQL Server 2022
  SP: sp_Auth_CreatePasswordResetToken
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Auth_CreatePasswordResetToken
    @Id        UNIQUEIDENTIFIER,
    @TenantId  UNIQUEIDENTIFIER,
    @UserId    UNIQUEIDENTIFIER,
    @TokenHash NVARCHAR(128),
    @ExpiresAt DATETIME2(3)
AS
BEGIN
    SET NOCOUNT ON;

    -- Invalidate previous unused tokens for the same user.
    UPDATE dbo.PasswordResetToken
    SET UsedAt = SYSUTCDATETIME()
    WHERE UserId = @UserId
      AND TenantId = @TenantId
      AND UsedAt IS NULL
      AND ExpiresAt > SYSUTCDATETIME();

    INSERT INTO dbo.PasswordResetToken (Id, TenantId, UserId, TokenHash, ExpiresAt, CreatedAt)
    VALUES (@Id, @TenantId, @UserId, @TokenHash, @ExpiresAt, SYSUTCDATETIME());
END
GO
