/*
  SchoolCore — SQL Server 2022
  SP: sp_User_SetRoles
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_User_SetRoles
    @TenantId UNIQUEIDENTIFIER, @UserId UNIQUEIDENTIFIER, @RoleCodesCsv NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.[User] WHERE TenantId=@TenantId AND Id=@UserId AND IsDeleted=0)
        THROW 51004, 'User not found.', 1;
    DELETE FROM dbo.UserRole WHERE UserId=@UserId;
    INSERT INTO dbo.UserRole (UserId, RoleId)
    SELECT @UserId, r.Id
    FROM STRING_SPLIT(@RoleCodesCsv, ',') s
    INNER JOIN dbo.Role r ON r.Code = LTRIM(RTRIM(s.value));
    SELECT r.Id AS RoleId, r.Code AS RoleCode, r.Name AS RoleName
    FROM dbo.UserRole ur INNER JOIN dbo.Role r ON r.Id = ur.RoleId WHERE ur.UserId=@UserId;
END
GO
