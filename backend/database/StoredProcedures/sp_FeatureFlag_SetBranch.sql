/*
  SchoolCore — SQL Server 2022
  SP: sp_FeatureFlag_SetBranch
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_FeatureFlag_SetBranch
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER, @FeatureKey NVARCHAR(100), @IsEnabled BIT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Branch WHERE Id=@BranchId AND TenantId=@TenantId AND IsDeleted=0)
        THROW 51004, 'Branch not found.', 1;
    DECLARE @Id UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM dbo.FeatureFlag WHERE FeatureKey=@FeatureKey AND ScopeType=N'Branch' AND TenantId=@TenantId AND BranchId=@BranchId);
    IF @Id IS NULL
        INSERT INTO dbo.FeatureFlag (Id, FeatureKey, ScopeType, TenantId, BranchId, IsEnabled, CreatedAt)
        VALUES (NEWID(), @FeatureKey, N'Branch', @TenantId, @BranchId, @IsEnabled, SYSUTCDATETIME());
    ELSE
        UPDATE dbo.FeatureFlag SET IsEnabled=@IsEnabled, UpdatedAt=SYSUTCDATETIME() WHERE Id=@Id;
    EXEC dbo.sp_FeatureFlag_Resolve @TenantId=@TenantId, @BranchId=@BranchId, @FeatureKey=@FeatureKey;
END
GO
