/*
  SchoolCore — SQL Server 2022
  SP: sp_PaymentMethod_Update
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_PaymentMethod_Update
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @Name NVARCHAR(150), @Info NVARCHAR(500)=NULL,
    @IsActive BIT, @SortOrder INT, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.PaymentMethod SET Name=@Name, Info=@Info, IsActive=@IsActive, SortOrder=@SortOrder,
        UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'PaymentMethod not found.', 1;
    SELECT Id, TenantId, Name, Info, IsActive, SortOrder, CreatedAt, UpdatedAt FROM dbo.PaymentMethod WHERE Id=@Id;
END
GO
