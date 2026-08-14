/*
  SchoolCore — bootstrap tenant (AppFabric manual script)
  Replace placeholders before execution.
  Creates Tenant + first Branch + Super Admin user + role/branch links.
*/
USE db_a0b4b3_schoolcore;
GO

DECLARE @TenantId UNIQUEIDENTIFIER = NEWID();
DECLARE @BranchId UNIQUEIDENTIFIER = NEWID();
DECLARE @UserId   UNIQUEIDENTIFIER = NEWID();
DECLARE @RoleId   UNIQUEIDENTIFIER = (SELECT Id FROM dbo.Role WHERE Code = N'SuperAdmin');

DECLARE @TenantCode NVARCHAR(50)  = N'IT';              -- TODO
DECLARE @TenantName NVARCHAR(200) = N'Colegio IT';      -- TODO
DECLARE @BranchCode NVARCHAR(50)  = N'CC';
DECLARE @BranchName NVARCHAR(200) = N'Campus Central';
DECLARE @Email      NVARCHAR(256) = N'jespinoza.ova@gmail.com'; -- TODO
DECLARE @FirstName  NVARCHAR(100) = N'Super';
DECLARE @LastName   NVARCHAR(100) = N'Admin';
-- Password hash MUST be ASP.NET Identity V3 (PBKDF2). Generate with:
--   dotnet run --project schoolcore/backend/src/SchoolCore.API -- --hash-password "YourPassword123"
-- Paste the printed hash below (do not store plain text passwords).
DECLARE @PasswordHash NVARCHAR(500) = N'AQAAAAIAAYagAAAAEHbTwCDY+iRUXneBsO1VubK7RsbEU0QOf5w6lHbPPFQCZuHvC1tyXGYaaaW/WcFgFA==';

IF @RoleId IS NULL
    THROW 50001, 'SuperAdmin role not seeded. Run 003_SeedRolesAndFeatureFlags.sql first.', 1;

IF EXISTS (SELECT 1 FROM dbo.Tenant WHERE Code = @TenantCode)
    THROW 50002, 'Tenant code already exists.', 1;

INSERT INTO dbo.Tenant (Id, Code, Name, IsActive, CreatedAt)
VALUES (@TenantId, @TenantCode, @TenantName, 1, SYSUTCDATETIME());

INSERT INTO dbo.Branch (Id, TenantId, Name, Code, IsActive, IsDeleted, CreatedAt)
VALUES (@BranchId, @TenantId, @BranchName, @BranchCode, 1, 0, SYSUTCDATETIME());

INSERT INTO dbo.[User] (Id, TenantId, Email, PasswordHash, FirstName, LastName, IsActive, IsDeleted, CreatedAt)
VALUES (@UserId, @TenantId, @Email, @PasswordHash, @FirstName, @LastName, 1, 0, SYSUTCDATETIME());

INSERT INTO dbo.UserRole (UserId, RoleId) VALUES (@UserId, @RoleId);
INSERT INTO dbo.UserBranch (UserId, BranchId) VALUES (@UserId, @BranchId);

SELECT @TenantId AS TenantId, @BranchId AS BranchId, @UserId AS UserId, @Email AS Email;
GO
