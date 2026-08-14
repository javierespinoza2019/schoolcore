/*
  SchoolCore — SQL Server 2022
  SP: sp_PaymentMethod_Create
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_PaymentMethod_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @Name NVARCHAR(150), @Info NVARCHAR(500)=NULL,
    @IsActive BIT=1, @SortOrder INT=0, @CreatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.PaymentMethod (Id,TenantId,Name,Info,IsActive,SortOrder,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@Name,@Info,@IsActive,@SortOrder,SYSUTCDATETIME(),@CreatedBy);
    SELECT Id, TenantId, Name, Info, IsActive, SortOrder, CreatedAt, UpdatedAt FROM dbo.PaymentMethod WHERE Id=@Id;
END
GO
