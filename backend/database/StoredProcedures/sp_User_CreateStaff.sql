/*
  SchoolCore — SQL Server 2022
  SP: sp_User_CreateStaff
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_User_CreateStaff
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @Email NVARCHAR(256), @PasswordHash NVARCHAR(500),
    @FirstName NVARCHAR(100), @LastName NVARCHAR(100), @IsActive BIT=1, @CreatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.[User] WHERE TenantId=@TenantId AND Email=@Email AND IsDeleted=0)
        THROW 51001, 'Email already exists for this tenant.', 1;
    INSERT INTO dbo.[User] (Id,TenantId,Email,PasswordHash,FirstName,LastName,IsActive,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@Email,@PasswordHash,@FirstName,@LastName,@IsActive,SYSUTCDATETIME(),@CreatedBy);
    SELECT Id, TenantId, Email, FirstName, LastName, IsActive, LastLoginAt, CreatedAt, UpdatedAt FROM dbo.[User] WHERE Id=@Id;
END
GO
