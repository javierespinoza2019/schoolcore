/*
  SchoolCore — SQL Server 2022
  SP: sp_SchoolCycle_Create
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_SchoolCycle_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @Name NVARCHAR(200),
    @StartDate DATE, @EndDate DATE, @IsActive BIT = 0, @CreatedBy UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @IsActive = 1
        UPDATE dbo.SchoolCycle SET IsActive = 0, UpdatedAt = SYSUTCDATETIME() WHERE TenantId = @TenantId AND IsDeleted = 0 AND IsActive = 1;
    INSERT INTO dbo.SchoolCycle (Id, TenantId, Name, StartDate, EndDate, IsActive, CreatedAt, CreatedBy)
    VALUES (@Id, @TenantId, @Name, @StartDate, @EndDate, @IsActive, SYSUTCDATETIME(), @CreatedBy);
    SELECT Id, TenantId, Name, StartDate, EndDate, IsActive, CreatedAt, UpdatedAt FROM dbo.SchoolCycle WHERE Id = @Id;
END
GO
