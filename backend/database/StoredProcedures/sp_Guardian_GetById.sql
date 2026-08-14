/*
  SchoolCore — SQL Server 2022
  SP: sp_Guardian_GetById
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Guardian_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT Id, TenantId, FirstName, LastName, Email, Phone, Occupation, Address, Status, CreatedAt, UpdatedAt
    FROM dbo.Guardian WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
END
GO
