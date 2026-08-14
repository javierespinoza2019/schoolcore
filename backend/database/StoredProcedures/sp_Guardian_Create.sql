/*
  SchoolCore — SQL Server 2022
  SP: sp_Guardian_Create
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Guardian_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @FirstName NVARCHAR(100), @LastName NVARCHAR(100),
    @Email NVARCHAR(256)=NULL, @Phone NVARCHAR(50)=NULL, @Occupation NVARCHAR(150)=NULL, @Address NVARCHAR(400)=NULL,
    @Status NVARCHAR(30)=N'active', @CreatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    INSERT INTO dbo.Guardian (Id,TenantId,FirstName,LastName,Email,Phone,Occupation,Address,Status,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@FirstName,@LastName,@Email,@Phone,@Occupation,@Address,@Status,SYSUTCDATETIME(),@CreatedBy);
    SELECT g.Id, g.TenantId, g.FirstName, g.LastName, g.Email, g.Phone, g.Occupation, g.Address, g.Status, g.CreatedAt, g.UpdatedAt,
           CAST(0 AS INT) AS ChildrenCount
    FROM dbo.Guardian g WHERE g.Id=@Id;
END
GO
