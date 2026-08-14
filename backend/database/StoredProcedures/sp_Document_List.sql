/*
  SchoolCore — SQL Server 2022
  SP: sp_Document_List
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Document_List
    @TenantId UNIQUEIDENTIFIER, @EntityType NVARCHAR(50)=NULL, @EntityId UNIQUEIDENTIFIER=NULL,
    @Page INT=1, @PageSize INT=50, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 100 SET @PageSize = 100;
    SELECT @TotalCount = COUNT(1) FROM dbo.Document
    WHERE TenantId=@TenantId AND IsDeleted=0
      AND (@EntityType IS NULL OR EntityType=@EntityType)
      AND (@EntityId IS NULL OR EntityId=@EntityId);
    SELECT Id, TenantId, FileId, UploaderUserId, EntityType, EntityId, OriginalFileName, ContentType, Extension, SizeBytes, RelativePath, Status, CreatedAt
    FROM dbo.Document
    WHERE TenantId=@TenantId AND IsDeleted=0
      AND (@EntityType IS NULL OR EntityType=@EntityType)
      AND (@EntityId IS NULL OR EntityId=@EntityId)
    ORDER BY CreatedAt DESC OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO
