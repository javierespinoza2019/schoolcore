/*
  SchoolCore — SQL Server 2022
  SP: sp_User_SetBranches
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_User_SetBranches
    @TenantId UNIQUEIDENTIFIER, @UserId UNIQUEIDENTIFIER, @BranchIdsCsv NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.[User] WHERE TenantId=@TenantId AND Id=@UserId AND IsDeleted=0)
        THROW 51004, 'User not found.', 1;
    DELETE FROM dbo.UserBranch WHERE UserId=@UserId;
    INSERT INTO dbo.UserBranch (UserId, BranchId)
    SELECT @UserId, TRY_CONVERT(UNIQUEIDENTIFIER, LTRIM(RTRIM(s.value)))
    FROM STRING_SPLIT(@BranchIdsCsv, ',') s
    WHERE TRY_CONVERT(UNIQUEIDENTIFIER, LTRIM(RTRIM(s.value))) IS NOT NULL
      AND EXISTS (SELECT 1 FROM dbo.Branch b WHERE b.Id = TRY_CONVERT(UNIQUEIDENTIFIER, LTRIM(RTRIM(s.value))) AND b.TenantId=@TenantId AND b.IsDeleted=0);
    SELECT ub.BranchId, b.Name AS BranchName, b.Code AS BranchCode
    FROM dbo.UserBranch ub INNER JOIN dbo.Branch b ON b.Id = ub.BranchId WHERE ub.UserId=@UserId;
END
GO
