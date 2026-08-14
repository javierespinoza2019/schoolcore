/*
  SchoolCore — SQL Server 2022
  SP: sp_Document_GetById
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Document_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT Id, TenantId, FileId, UploaderUserId, EntityType, EntityId, OriginalFileName, ContentType, Extension, SizeBytes, RelativePath, Status, CreatedAt
    FROM dbo.Document WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
END
GO
