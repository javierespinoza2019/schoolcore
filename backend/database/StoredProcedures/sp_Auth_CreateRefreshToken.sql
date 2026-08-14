/*
  SchoolCore — SQL Server 2022
  SP: sp_Auth_CreateRefreshToken
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Auth_CreateRefreshToken
    @Id          UNIQUEIDENTIFIER,
    @TenantId    UNIQUEIDENTIFIER,
    @UserId      UNIQUEIDENTIFIER,
    @TokenHash   NVARCHAR(128),
    @ExpiresAt   DATETIME2(3),
    @CreatedByIp NVARCHAR(45) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.RefreshToken (Id, TenantId, UserId, TokenHash, ExpiresAt, CreatedAt, CreatedByIp)
    VALUES (@Id, @TenantId, @UserId, @TokenHash, @ExpiresAt, SYSUTCDATETIME(), @CreatedByIp);
END
GO
