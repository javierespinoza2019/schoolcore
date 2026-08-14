/*
  SchoolCore — SQL Server 2022
  SP: sp_PaymentMethod_SoftDelete
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_PaymentMethod_SoftDelete
    @TenantId UNIQUEIDENTIFIER,
    @Id UNIQUEIDENTIFIER,
    @UpdatedBy UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.[PaymentMethod]
    SET IsDeleted = 1, UpdatedAt = SYSUTCDATETIME(), UpdatedBy = @UpdatedBy
    WHERE TenantId = @TenantId AND Id = @Id AND IsDeleted = 0;
    IF @@ROWCOUNT = 0 THROW 51004, 'PaymentMethod not found.', 1;
END
GO
