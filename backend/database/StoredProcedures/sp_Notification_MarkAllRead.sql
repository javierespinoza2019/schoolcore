/*
  SchoolCore — SQL Server 2022
  SP: sp_Notification_MarkAllRead
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Notification_MarkAllRead
    @TenantId UNIQUEIDENTIFIER, @UserId UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    UPDATE dbo.Notification SET IsRead=1, ReadAt=SYSUTCDATETIME()
    WHERE TenantId=@TenantId AND UserId=@UserId AND IsDeleted=0 AND IsRead=0;
END
GO
