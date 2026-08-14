/*
  SchoolCore — SQL Server 2022
  SP: sp_Notification_Create
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Notification_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @UserId UNIQUEIDENTIFIER, @Category NVARCHAR(50),
    @Title NVARCHAR(200), @Body NVARCHAR(1000)=NULL, @LinkUrl NVARCHAR(500)=NULL
AS BEGIN SET NOCOUNT ON;
    INSERT INTO dbo.Notification (Id,TenantId,UserId,Category,Title,Body,LinkUrl,IsRead,CreatedAt)
    VALUES (@Id,@TenantId,@UserId,@Category,@Title,@Body,@LinkUrl,0,SYSUTCDATETIME());
    SELECT Id, TenantId, UserId, Category, Title, Body, LinkUrl, IsRead, ReadAt, CreatedAt FROM dbo.Notification WHERE Id=@Id;
END
GO
