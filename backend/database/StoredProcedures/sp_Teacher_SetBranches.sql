/*
  SchoolCore — SQL Server 2022
  SP: sp_Teacher_SetBranches
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Teacher_SetBranches
    @TenantId UNIQUEIDENTIFIER, @TeacherId UNIQUEIDENTIFIER, @BranchIdsCsv NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Teacher WHERE TenantId=@TenantId AND Id=@TeacherId AND IsDeleted=0)
        THROW 51004, 'Teacher not found.', 1;
    DELETE FROM dbo.TeacherBranch WHERE TeacherId=@TeacherId;
    INSERT INTO dbo.TeacherBranch (TeacherId, BranchId)
    SELECT @TeacherId, TRY_CONVERT(UNIQUEIDENTIFIER, LTRIM(RTRIM(s.value)))
    FROM STRING_SPLIT(@BranchIdsCsv, ',') s
    WHERE TRY_CONVERT(UNIQUEIDENTIFIER, LTRIM(RTRIM(s.value))) IS NOT NULL
      AND EXISTS (
          SELECT 1 FROM dbo.Branch b
          WHERE b.Id = TRY_CONVERT(UNIQUEIDENTIFIER, LTRIM(RTRIM(s.value)))
            AND b.TenantId=@TenantId AND b.IsDeleted=0
      );
    SELECT tb.BranchId, b.Name AS BranchName, b.Code AS BranchCode
    FROM dbo.TeacherBranch tb
    INNER JOIN dbo.Branch b ON b.Id = tb.BranchId
    WHERE tb.TeacherId=@TeacherId;
END
GO
