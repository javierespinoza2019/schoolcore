/*
  SchoolCore — SQL Server 2022
  SP: sp_TimelineEvent_List
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_TimelineEvent_List
    @TenantId UNIQUEIDENTIFIER, @EntityType NVARCHAR(50), @EntityId UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT Id, TenantId, EntityType, EntityId, EventDate, Title, Description, Icon, Badge, CreatedAt
    FROM dbo.TimelineEvent
    WHERE TenantId=@TenantId AND EntityType=@EntityType AND EntityId=@EntityId AND IsDeleted=0
    ORDER BY EventDate DESC;
END
GO
