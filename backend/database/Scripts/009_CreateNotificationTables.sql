/*
  SchoolCore — SQL Server 2022
  Script: 009_CreateNotificationTables.sql
  Phase 6: In-app Notification.
  Idempotent.
*/
USE db_a0b4b3_schoolcore;
GO

IF OBJECT_ID(N'dbo.Notification', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Notification
    (
        Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Notification PRIMARY KEY,
        TenantId    UNIQUEIDENTIFIER NOT NULL,
        UserId      UNIQUEIDENTIFIER NOT NULL,
        Category    NVARCHAR(50) NOT NULL,
        Title       NVARCHAR(200) NOT NULL,
        Body        NVARCHAR(1000) NULL,
        LinkUrl     NVARCHAR(500) NULL,
        IsRead      BIT NOT NULL CONSTRAINT DF_Notification_IsRead DEFAULT (0),
        ReadAt      DATETIME2(3) NULL,
        CreatedAt   DATETIME2(3) NOT NULL CONSTRAINT DF_Notification_CreatedAt DEFAULT (SYSUTCDATETIME()),
        IsDeleted   BIT NOT NULL CONSTRAINT DF_Notification_IsDeleted DEFAULT (0),
        CONSTRAINT FK_Notification_Tenant FOREIGN KEY (TenantId) REFERENCES dbo.Tenant (Id),
        CONSTRAINT FK_Notification_User FOREIGN KEY (UserId) REFERENCES dbo.[User] (Id)
    );

    CREATE INDEX IX_Notification_User_Unread
        ON dbo.Notification (TenantId, UserId, IsRead, CreatedAt DESC)
        WHERE IsDeleted = 0;
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.DatabaseVersion WHERE ScriptName = N'009_CreateNotificationTables.sql')
BEGIN
    INSERT INTO dbo.DatabaseVersion (ScriptName) VALUES (N'009_CreateNotificationTables.sql');
END
GO
