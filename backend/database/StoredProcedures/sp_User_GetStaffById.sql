/*
  SchoolCore — SQL Server 2022
  SP: sp_User_GetStaffById
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_User_GetStaffById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.Id, u.TenantId, u.Email, u.FirstName, u.LastName, u.IsActive, u.LastLoginAt, u.CreatedAt, u.UpdatedAt
    FROM dbo.[User] u WHERE u.TenantId=@TenantId AND u.Id=@Id AND u.IsDeleted=0;
    SELECT r.Id AS RoleId, r.Code AS RoleCode, r.Name AS RoleName
    FROM dbo.UserRole ur INNER JOIN dbo.Role r ON r.Id = ur.RoleId WHERE ur.UserId=@Id;
    SELECT ub.BranchId, b.Name AS BranchName, b.Code AS BranchCode
    FROM dbo.UserBranch ub INNER JOIN dbo.Branch b ON b.Id = ub.BranchId AND b.IsDeleted=0
    WHERE ub.UserId=@Id AND b.TenantId=@TenantId;
END
GO
