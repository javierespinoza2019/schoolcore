/*
  SchoolCore — SQL Server 2022
  SP: sp_EmailTemplate_Deactivate
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_EmailTemplate_Deactivate @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.EmailTemplate SET IsActive=0, UpdatedAt=SYSUTCDATETIME()
    WHERE Id=@Id AND TenantId=@TenantId;
    IF @@ROWCOUNT=0 THROW 51004, 'EmailTemplate not found or not tenant-owned.', 1;
END
GO
