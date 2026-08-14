/*
  SchoolCore — SQL Server 2022
  SP: sp_Document_Create
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Document_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @FileId UNIQUEIDENTIFIER, @UploaderUserId UNIQUEIDENTIFIER,
    @EntityType NVARCHAR(50), @EntityId UNIQUEIDENTIFIER, @OriginalFileName NVARCHAR(260), @ContentType NVARCHAR(100),
    @Extension NVARCHAR(10), @SizeBytes BIGINT, @RelativePath NVARCHAR(500), @Status NVARCHAR(30)=N'pending',
    @CreatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    INSERT INTO dbo.Document (Id,TenantId,FileId,UploaderUserId,EntityType,EntityId,OriginalFileName,ContentType,Extension,SizeBytes,RelativePath,Status,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@FileId,@UploaderUserId,@EntityType,@EntityId,@OriginalFileName,@ContentType,@Extension,@SizeBytes,@RelativePath,@Status,SYSUTCDATETIME(),@CreatedBy);
    SELECT Id, TenantId, FileId, UploaderUserId, EntityType, EntityId, OriginalFileName, ContentType, Extension, SizeBytes, RelativePath, Status, CreatedAt
    FROM dbo.Document WHERE Id=@Id;
END
GO
