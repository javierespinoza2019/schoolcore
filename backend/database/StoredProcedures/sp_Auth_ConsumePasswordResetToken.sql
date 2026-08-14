/*
  SchoolCore — SQL Server 2022
  SP: sp_Auth_ConsumePasswordResetToken
  Marks token as used if valid; returns user id / tenant id.
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Auth_ConsumePasswordResetToken
    @TokenHash NVARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Id UNIQUEIDENTIFIER;
    DECLARE @UserId UNIQUEIDENTIFIER;
    DECLARE @TenantId UNIQUEIDENTIFIER;

    SELECT TOP (1)
        @Id = prt.Id,
        @UserId = prt.UserId,
        @TenantId = prt.TenantId
    FROM dbo.PasswordResetToken prt
    INNER JOIN dbo.[User] u ON u.Id = prt.UserId AND u.TenantId = prt.TenantId
    WHERE prt.TokenHash = @TokenHash
      AND prt.UsedAt IS NULL
      AND prt.ExpiresAt > SYSUTCDATETIME()
      AND u.IsDeleted = 0
      AND u.IsActive = 1;

    IF @Id IS NULL
    BEGIN
        SELECT CAST(NULL AS UNIQUEIDENTIFIER) AS UserId,
               CAST(NULL AS UNIQUEIDENTIFIER) AS TenantId,
               CAST(0 AS BIT) AS Success;
        RETURN;
    END;

    UPDATE dbo.PasswordResetToken
    SET UsedAt = SYSUTCDATETIME()
    WHERE Id = @Id
      AND UsedAt IS NULL;

    SELECT @UserId AS UserId,
           @TenantId AS TenantId,
           CAST(1 AS BIT) AS Success;
END
GO
