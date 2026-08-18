/*
  SchoolCore — SQL Server 2022
  SP: sp_Branch_GetById
*/
USE db_a0b4b3_schoolcore;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Branch_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT Id, TenantId, Name, Code, IsActive, Address, City, [State], PostalCode, Phone, Email, TimeZoneId,
           DirectorName, DirectorEmail, DirectorPhone, Capacity, OpenedAt, Area, Levels, OperationalStatus,
           PhotoUrl, CreatedAt, UpdatedAt
    FROM dbo.Branch WHERE TenantId = @TenantId AND Id = @Id AND IsDeleted = 0;
END
GO
