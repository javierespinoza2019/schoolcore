/*
  SchoolCore — SQL Server 2022
  SP: sp_Teacher_Update
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Teacher_Update
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER, @FirstName NVARCHAR(100), @LastName NVARCHAR(100),
    @Email NVARCHAR(256)=NULL, @Phone NVARCHAR(50)=NULL, @Specialty NVARCHAR(150)=NULL, @SubjectsJson NVARCHAR(MAX)=NULL,
    @EmploymentType NVARCHAR(50)=NULL, @MonthlySalary DECIMAL(18,2)=NULL, @EducationLevelId UNIQUEIDENTIFIER=NULL,
    @Status NVARCHAR(30), @HireDate DATE=NULL, @ScheduleNotes NVARCHAR(500)=NULL,
    @LevelName NVARCHAR(80)=NULL, @PhotoUrl NVARCHAR(500)=NULL, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    IF @BranchId IS NULL OR @BranchId = '00000000-0000-0000-0000-000000000000'
        THROW 51002, 'Branch is required.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Branch WHERE Id=@BranchId AND TenantId=@TenantId AND IsDeleted=0)
        THROW 51003, 'Branch not found.', 1;
    UPDATE dbo.Teacher SET BranchId=@BranchId, FirstName=@FirstName, LastName=@LastName, Email=@Email, Phone=@Phone, Specialty=@Specialty,
        SubjectsJson=@SubjectsJson, EmploymentType=@EmploymentType, MonthlySalary=@MonthlySalary, EducationLevelId=@EducationLevelId,
        Status=@Status, HireDate=@HireDate, ScheduleNotes=@ScheduleNotes, LevelName=@LevelName, PhotoUrl=@PhotoUrl,
        UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'Teacher not found.', 1;
    EXEC dbo.sp_Teacher_GetById @TenantId=@TenantId, @Id=@Id;
END
GO
