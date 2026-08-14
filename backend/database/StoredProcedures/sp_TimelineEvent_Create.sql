/*
  SchoolCore — SQL Server 2022
  SP: sp_TimelineEvent_Create
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_TimelineEvent_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @EntityType NVARCHAR(50), @EntityId UNIQUEIDENTIFIER,
    @EventDate DATETIME2(3), @Title NVARCHAR(200), @Description NVARCHAR(1000)=NULL, @Icon NVARCHAR(50)=NULL,
    @Badge NVARCHAR(50)=NULL, @CreatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    INSERT INTO dbo.TimelineEvent (Id,TenantId,EntityType,EntityId,EventDate,Title,Description,Icon,Badge,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@EntityType,@EntityId,@EventDate,@Title,@Description,@Icon,@Badge,SYSUTCDATETIME(),@CreatedBy);
    SELECT Id, TenantId, EntityType, EntityId, EventDate, Title, Description, Icon, Badge, CreatedAt FROM dbo.TimelineEvent WHERE Id=@Id;
END
GO
