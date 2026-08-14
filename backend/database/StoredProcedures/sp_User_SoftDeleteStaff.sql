/*
  SchoolCore — SQL Server 2022
  SP: sp_User_SoftDeleteStaff
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_User_SoftDeleteStaff @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    UPDATE dbo.[User] SET IsDeleted=1, IsActive=0, UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'User not found.', 1;
    -- Invalidate refresh tokens
    UPDATE dbo.RefreshToken SET RevokedAt = SYSUTCDATETIME() WHERE TenantId=@TenantId AND UserId=@Id AND RevokedAt IS NULL;
END
GO
