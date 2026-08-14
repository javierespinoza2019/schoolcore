/*
  SchoolCore — SQL Server 2022
  SP: sp_EducationLevel_Create
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_EducationLevel_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @Name NVARCHAR(100), @Code NVARCHAR(50),
    @GradeCount INT = 0, @SortOrder INT = 0, @IsActive BIT = 1, @CreatedBy UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.EducationLevel WHERE TenantId=@TenantId AND Code=@Code AND IsDeleted=0)
        THROW 51001, 'EducationLevel code already exists.', 1;
    INSERT INTO dbo.EducationLevel (Id,TenantId,Name,Code,GradeCount,SortOrder,IsActive,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@Name,@Code,@GradeCount,@SortOrder,@IsActive,SYSUTCDATETIME(),@CreatedBy);
    SELECT Id, TenantId, Name, Code, GradeCount, SortOrder, IsActive, CreatedAt, UpdatedAt FROM dbo.EducationLevel WHERE Id=@Id;
END
GO
