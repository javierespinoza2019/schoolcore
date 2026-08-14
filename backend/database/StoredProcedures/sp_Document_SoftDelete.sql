/*
  SchoolCore — SQL Server 2022
  SP: sp_Document_SoftDelete
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Document_SoftDelete @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @DeletedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    UPDATE dbo.Document SET IsDeleted=1, DeletedAt=SYSUTCDATETIME(), DeletedBy=@DeletedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'Document not found.', 1;
END
GO
