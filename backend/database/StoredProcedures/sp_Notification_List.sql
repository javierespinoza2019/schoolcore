/*
  SchoolCore — SQL Server 2022
  SP: sp_Notification_List
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Notification_List
    @TenantId UNIQUEIDENTIFIER, @UserId UNIQUEIDENTIFIER, @UnreadOnly BIT=0, @Page INT=1, @PageSize INT=50, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 100 SET @PageSize = 100;
    SELECT @TotalCount = COUNT(1) FROM dbo.Notification
    WHERE TenantId=@TenantId AND UserId=@UserId AND IsDeleted=0 AND (@UnreadOnly=0 OR IsRead=0);
    SELECT Id, TenantId, UserId, Category, Title, Body, LinkUrl, IsRead, ReadAt, CreatedAt
    FROM dbo.Notification
    WHERE TenantId=@TenantId AND UserId=@UserId AND IsDeleted=0 AND (@UnreadOnly=0 OR IsRead=0)
    ORDER BY CreatedAt DESC OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO
