/*
  SchoolCore — SQL Server 2022
  SP: sp_Teacher_Create
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Teacher_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER, @FirstName NVARCHAR(100), @LastName NVARCHAR(100),
    @Email NVARCHAR(256)=NULL, @Phone NVARCHAR(50)=NULL, @Specialty NVARCHAR(150)=NULL, @SubjectsJson NVARCHAR(MAX)=NULL,
    @EmploymentType NVARCHAR(50)=NULL, @MonthlySalary DECIMAL(18,2)=NULL, @EducationLevelId UNIQUEIDENTIFIER=NULL,
    @Status NVARCHAR(30)=N'active', @HireDate DATE=NULL, @ScheduleNotes NVARCHAR(500)=NULL,
    @LevelName NVARCHAR(80)=NULL, @PhotoUrl NVARCHAR(500)=NULL, @CreatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    IF @BranchId IS NULL OR @BranchId = '00000000-0000-0000-0000-000000000000'
        THROW 51002, 'Branch is required.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Branch WHERE Id=@BranchId AND TenantId=@TenantId AND IsDeleted=0)
        THROW 51003, 'Branch not found.', 1;
    INSERT INTO dbo.Teacher (Id,TenantId,BranchId,FirstName,LastName,Email,Phone,Specialty,SubjectsJson,EmploymentType,MonthlySalary,EducationLevelId,Status,HireDate,ScheduleNotes,LevelName,PhotoUrl,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@BranchId,@FirstName,@LastName,@Email,@Phone,@Specialty,@SubjectsJson,@EmploymentType,@MonthlySalary,@EducationLevelId,@Status,@HireDate,@ScheduleNotes,@LevelName,@PhotoUrl,SYSUTCDATETIME(),@CreatedBy);
    EXEC dbo.sp_Teacher_GetById @TenantId=@TenantId, @Id=@Id;
END
GO
