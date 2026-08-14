/*
  SchoolCore — SQL Server 2022
  SP: sp_FeatureFlag_ListForTenant
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_FeatureFlag_ListForTenant @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    ;WITH Keys AS (
        SELECT DISTINCT FeatureKey FROM dbo.FeatureFlag
    )
    SELECT k.FeatureKey,
           CAST(COALESCE(b.IsEnabled, t.IsEnabled, g.IsEnabled, 0) AS BIT) AS IsEnabled,
           CASE WHEN b.Id IS NOT NULL THEN N'Branch' WHEN t.Id IS NOT NULL THEN N'Tenant' WHEN g.Id IS NOT NULL THEN N'Global' ELSE N'None' END AS ResolvedFrom
    FROM Keys k
    LEFT JOIN dbo.FeatureFlag g ON g.FeatureKey=k.FeatureKey AND g.ScopeType=N'Global' AND g.TenantId IS NULL AND g.BranchId IS NULL
    LEFT JOIN dbo.FeatureFlag t ON t.FeatureKey=k.FeatureKey AND t.ScopeType=N'Tenant' AND t.TenantId=@TenantId AND t.BranchId IS NULL
    LEFT JOIN dbo.FeatureFlag b ON b.FeatureKey=k.FeatureKey AND b.ScopeType=N'Branch' AND b.TenantId=@TenantId AND b.BranchId=@BranchId
    ORDER BY k.FeatureKey;
END
GO
