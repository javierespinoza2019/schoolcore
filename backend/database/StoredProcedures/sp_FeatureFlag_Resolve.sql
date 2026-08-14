/*
  SchoolCore — SQL Server 2022
  SP: sp_FeatureFlag_Resolve
  Resolution order: Branch > Tenant > Global
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_FeatureFlag_Resolve
    @TenantId   UNIQUEIDENTIFIER,
    @BranchId   UNIQUEIDENTIFIER = NULL,
    @FeatureKey NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @IsEnabled BIT = NULL;

    IF @BranchId IS NOT NULL
    BEGIN
        SELECT TOP (1) @IsEnabled = IsEnabled
        FROM dbo.FeatureFlag
        WHERE FeatureKey = @FeatureKey
          AND ScopeType = N'Branch'
          AND TenantId = @TenantId
          AND BranchId = @BranchId;
    END

    IF @IsEnabled IS NULL
    BEGIN
        SELECT TOP (1) @IsEnabled = IsEnabled
        FROM dbo.FeatureFlag
        WHERE FeatureKey = @FeatureKey
          AND ScopeType = N'Tenant'
          AND TenantId = @TenantId
          AND BranchId IS NULL;
    END

    IF @IsEnabled IS NULL
    BEGIN
        SELECT TOP (1) @IsEnabled = IsEnabled
        FROM dbo.FeatureFlag
        WHERE FeatureKey = @FeatureKey
          AND ScopeType = N'Global'
          AND TenantId IS NULL
          AND BranchId IS NULL;
    END

    SELECT CAST(ISNULL(@IsEnabled, 0) AS BIT) AS IsEnabled;
END
GO
