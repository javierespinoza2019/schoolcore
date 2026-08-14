/*
  SchoolCore — SQL Server 2022
  SP: sp_TimeZone_Resolve
  Resolution: Branch.TimeZoneId → Tenant.TimeZoneId → America/Mexico_City
  Does not mutate any business timestamps.
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_TimeZone_Resolve
    @TenantId UNIQUEIDENTIFIER,
    @BranchId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @BranchTz NVARCHAR(64) = NULL;
    DECLARE @TenantTz NVARCHAR(64) = NULL;
    DECLARE @Effective NVARCHAR(64);
    DECLARE @Source NVARCHAR(20);

    IF @BranchId IS NOT NULL
    BEGIN
        SELECT @BranchTz = TimeZoneId
        FROM dbo.Branch
        WHERE TenantId = @TenantId AND Id = @BranchId AND IsDeleted = 0;
    END

    SELECT @TenantTz = TimeZoneId
    FROM dbo.Tenant
    WHERE Id = @TenantId;

    IF @BranchTz IS NOT NULL AND LEN(@BranchTz) > 0
    BEGIN
        SET @Effective = @BranchTz;
        SET @Source = N'Branch';
    END
    ELSE IF @TenantTz IS NOT NULL AND LEN(@TenantTz) > 0
    BEGIN
        SET @Effective = @TenantTz;
        SET @Source = N'Tenant';
    END
    ELSE
    BEGIN
        SET @Effective = N'America/Mexico_City';
        SET @Source = N'Platform';
    END

    SELECT
        @Effective AS EffectiveTimeZoneId,
        @Source AS Source,
        @TenantTz AS TenantTimeZoneId,
        @BranchTz AS BranchTimeZoneId;
END
GO
