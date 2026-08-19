/*
  SchoolCore — SQL Server 2022
  SP: sp_Document_SetStatus
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Document_SetStatus
    @TenantId UNIQUEIDENTIFIER,
    @Id UNIQUEIDENTIFIER,
    @Status NVARCHAR(30),
    @UpdatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @Status NOT IN (N'pending', N'verified', N'rejected')
        THROW 51002, 'Invalid document status.', 1;
    UPDATE dbo.Document
        SET Status = @Status
    WHERE TenantId = @TenantId AND Id = @Id AND IsDeleted = 0;
    IF @@ROWCOUNT = 0
        THROW 51004, 'Document not found.', 1;
    EXEC dbo.sp_Document_GetById @TenantId = @TenantId, @Id = @Id;
END
GO
