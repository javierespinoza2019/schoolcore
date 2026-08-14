/*
  SchoolCore — SQL Server 2022
  SP: sp_SchoolCycle_GetById
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_SchoolCycle_GetById
    @TenantId UNIQUEIDENTIFIER,
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, Name, StartDate, EndDate, IsActive, CreatedAt, UpdatedAt
    FROM dbo.[SchoolCycle]
    WHERE TenantId = @TenantId AND Id = @Id AND IsDeleted = 0;
END
GO
