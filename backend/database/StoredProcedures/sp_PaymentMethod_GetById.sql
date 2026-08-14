/*
  SchoolCore — SQL Server 2022
  SP: sp_PaymentMethod_GetById
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_PaymentMethod_GetById
    @TenantId UNIQUEIDENTIFIER,
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, Name, Info, IsActive, SortOrder, CreatedAt, UpdatedAt
    FROM dbo.[PaymentMethod]
    WHERE TenantId = @TenantId AND Id = @Id AND IsDeleted = 0;
END
GO
