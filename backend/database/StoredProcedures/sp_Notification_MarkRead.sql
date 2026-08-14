/*
  SchoolCore — SQL Server 2022
  SP: sp_Notification_MarkRead
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Notification_MarkRead
    @TenantId UNIQUEIDENTIFIER, @UserId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    UPDATE dbo.Notification SET IsRead=1, ReadAt=SYSUTCDATETIME()
    WHERE TenantId=@TenantId AND UserId=@UserId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'Notification not found.', 1;
END
GO
