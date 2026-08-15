/*
  SchoolCore — SQL Server 2022
  SP: sp_RolePermission_ReplaceForRole
  @PermissionsJson: [{"viewCode":"students","actionCode":"view"}, ...]
  No permite editar SuperAdmin.
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_RolePermission_ReplaceForRole
    @RoleId UNIQUEIDENTIFIER,
    @PermissionsJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Code NVARCHAR(50) = (SELECT Code FROM dbo.Role WHERE Id = @RoleId);
    IF @Code IS NULL
        THROW 51001, 'Role not found.', 1;
    IF @Code = N'SuperAdmin'
        THROW 51002, 'SuperAdmin permissions cannot be edited.', 1;

    BEGIN TRAN;

    DELETE FROM dbo.RolePermission WHERE RoleId = @RoleId;

    INSERT INTO dbo.RolePermission (Id, RoleId, ViewCode, ActionCode, CreatedAt)
    SELECT NEWID(), @RoleId, j.viewCode, j.actionCode, SYSUTCDATETIME()
    FROM OPENJSON(@PermissionsJson)
    WITH (
        viewCode NVARCHAR(50) '$.viewCode',
        actionCode NVARCHAR(20) '$.actionCode'
    ) j
    WHERE j.viewCode IS NOT NULL AND j.actionCode IS NOT NULL;

    COMMIT;

    SELECT rp.ViewCode, rp.ActionCode
    FROM dbo.RolePermission rp
    WHERE rp.RoleId = @RoleId
    ORDER BY rp.ViewCode, rp.ActionCode;
END
GO
