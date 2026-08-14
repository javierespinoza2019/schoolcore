/*
  SchoolCore — SQL Server 2022
  SP: sp_EducationLevel_GetById
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_EducationLevel_GetById
    @TenantId UNIQUEIDENTIFIER,
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, Name, Code, GradeCount, SortOrder, IsActive, CreatedAt, UpdatedAt
    FROM dbo.[EducationLevel]
    WHERE TenantId = @TenantId AND Id = @Id AND IsDeleted = 0;
END
GO
