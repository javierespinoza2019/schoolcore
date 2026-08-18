/*
  SchoolCore — SQL Server 2022
  SP: sp_Guardian_SoftDelete
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Guardian_SoftDelete @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Guardian WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0)
        THROW 51004, 'Guardian not found.', 1;

    BEGIN TRAN;
    DELETE FROM dbo.StudentGuardian WHERE TenantId=@TenantId AND GuardianId=@Id;
    UPDATE dbo.Guardian SET IsDeleted=1, Status=N'inactive', UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    COMMIT TRAN;
END
GO
