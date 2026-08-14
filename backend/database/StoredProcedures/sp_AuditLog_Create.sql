/*
  SchoolCore — SQL Server 2022
  SP: sp_AuditLog_Create
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_AuditLog_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @UserId UNIQUEIDENTIFIER=NULL,
    @EntityType NVARCHAR(50), @EntityId UNIQUEIDENTIFIER=NULL, @Action NVARCHAR(50), @DetailsJson NVARCHAR(MAX)=NULL
AS BEGIN SET NOCOUNT ON;
    INSERT INTO dbo.AuditLog (Id, TenantId, UserId, EntityType, EntityId, Action, DetailsJson, CreatedAt)
    VALUES (@Id, @TenantId, @UserId, @EntityType, @EntityId, @Action, @DetailsJson, SYSUTCDATETIME());
END
GO
