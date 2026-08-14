/*
  SchoolCore — SQL Server 2022
  SP: sp_User_UpdateStaff
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_User_UpdateStaff
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @Email NVARCHAR(256), @FirstName NVARCHAR(100),
    @LastName NVARCHAR(100), @IsActive BIT, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.[User] WHERE TenantId=@TenantId AND Email=@Email AND Id<>@Id AND IsDeleted=0)
        THROW 51001, 'Email already exists for this tenant.', 1;
    UPDATE dbo.[User] SET Email=@Email, FirstName=@FirstName, LastName=@LastName, IsActive=@IsActive,
        UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'User not found.', 1;
    SELECT Id, TenantId, Email, FirstName, LastName, IsActive, LastLoginAt, CreatedAt, UpdatedAt FROM dbo.[User] WHERE Id=@Id;
END
GO
