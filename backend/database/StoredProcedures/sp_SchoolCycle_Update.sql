/*
  SchoolCore — SQL Server 2022
  SP: sp_SchoolCycle_Update
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_SchoolCycle_Update
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @Name NVARCHAR(200),
    @StartDate DATE, @EndDate DATE, @IsActive BIT, @UpdatedBy UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @IsActive = 1
        UPDATE dbo.SchoolCycle SET IsActive = 0, UpdatedAt = SYSUTCDATETIME(), UpdatedBy = @UpdatedBy
        WHERE TenantId = @TenantId AND IsDeleted = 0 AND IsActive = 1 AND Id <> @Id;
    UPDATE dbo.SchoolCycle
    SET Name = @Name, StartDate = @StartDate, EndDate = @EndDate, IsActive = @IsActive,
        UpdatedAt = SYSUTCDATETIME(), UpdatedBy = @UpdatedBy
    WHERE TenantId = @TenantId AND Id = @Id AND IsDeleted = 0;
    IF @@ROWCOUNT = 0 THROW 51004, 'SchoolCycle not found.', 1;
    SELECT Id, TenantId, Name, StartDate, EndDate, IsActive, CreatedAt, UpdatedAt FROM dbo.SchoolCycle WHERE Id = @Id;
END
GO
