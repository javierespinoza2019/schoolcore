/*
  SchoolCore — SQL Server 2022
  SP: sp_FeatureFlag_SetTenant
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_FeatureFlag_SetTenant
    @TenantId UNIQUEIDENTIFIER, @FeatureKey NVARCHAR(100), @IsEnabled BIT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Id UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM dbo.FeatureFlag WHERE FeatureKey=@FeatureKey AND ScopeType=N'Tenant' AND TenantId=@TenantId AND BranchId IS NULL);
    IF @Id IS NULL
        INSERT INTO dbo.FeatureFlag (Id, FeatureKey, ScopeType, TenantId, BranchId, IsEnabled, CreatedAt)
        VALUES (NEWID(), @FeatureKey, N'Tenant', @TenantId, NULL, @IsEnabled, SYSUTCDATETIME());
    ELSE
        UPDATE dbo.FeatureFlag SET IsEnabled=@IsEnabled, UpdatedAt=SYSUTCDATETIME() WHERE Id=@Id;
    EXEC dbo.sp_FeatureFlag_Resolve @TenantId=@TenantId, @BranchId=NULL, @FeatureKey=@FeatureKey;
END
GO
