/*
  SchoolCore — SQL Server 2022
  SP: sp_Guardian_Update
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Guardian_Update
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @FirstName NVARCHAR(100), @LastName NVARCHAR(100),
    @Email NVARCHAR(256)=NULL, @Phone NVARCHAR(50)=NULL, @Occupation NVARCHAR(150)=NULL, @Address NVARCHAR(400)=NULL,
    @Status NVARCHAR(30), @UpdatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    UPDATE dbo.Guardian SET FirstName=@FirstName, LastName=@LastName, Email=@Email, Phone=@Phone, Occupation=@Occupation,
        Address=@Address, Status=@Status, UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'Guardian not found.', 1;
    SELECT Id, TenantId, FirstName, LastName, Email, Phone, Occupation, Address, Status, CreatedAt, UpdatedAt FROM dbo.Guardian WHERE Id=@Id;
END
GO
