/*
  SchoolCore — SQL Server 2022
  SP: sp_EducationLevel_Update
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_EducationLevel_Update
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @Name NVARCHAR(100), @Code NVARCHAR(50),
    @GradeCount INT, @SortOrder INT, @IsActive BIT, @UpdatedBy UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.EducationLevel WHERE TenantId=@TenantId AND Code=@Code AND Id<>@Id AND IsDeleted=0)
        THROW 51001, 'EducationLevel code already exists.', 1;
    UPDATE dbo.EducationLevel SET Name=@Name, Code=@Code, GradeCount=@GradeCount, SortOrder=@SortOrder, IsActive=@IsActive,
        UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'EducationLevel not found.', 1;
    SELECT Id, TenantId, Name, Code, GradeCount, SortOrder, IsActive, CreatedAt, UpdatedAt FROM dbo.EducationLevel WHERE Id=@Id;
END
GO
