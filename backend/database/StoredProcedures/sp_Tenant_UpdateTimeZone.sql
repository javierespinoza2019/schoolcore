/*
  SchoolCore — SQL Server 2022
  SP: sp_Tenant_UpdateTimeZone
  Updates ONLY Tenant.TimeZoneId. Never rewrites historical UTC columns.
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Tenant_UpdateTimeZone
    @TenantId UNIQUEIDENTIFIER,
    @TimeZoneId NVARCHAR(64)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.TimeZoneCatalog WHERE Id = @TimeZoneId AND IsActive = 1)
        THROW 52001, 'Time zone is not in the allowed catalog.', 1;

    UPDATE dbo.Tenant
    SET TimeZoneId = @TimeZoneId
    WHERE Id = @TenantId;

    IF @@ROWCOUNT = 0
        THROW 52002, 'Tenant not found.', 1;

    SELECT Id AS TenantId, TimeZoneId FROM dbo.Tenant WHERE Id = @TenantId;
END
GO
