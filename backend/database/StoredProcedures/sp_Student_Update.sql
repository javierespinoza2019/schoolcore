/*
  SchoolCore — SQL Server 2022
  SP: sp_Student_Update
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Student_Update
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER,
    @FirstName NVARCHAR(100), @LastName NVARCHAR(100), @Gender CHAR(1)=NULL, @BirthDate DATE=NULL,
    @Email NVARCHAR(256)=NULL, @Phone NVARCHAR(50)=NULL, @Address NVARCHAR(400)=NULL,
    @EducationLevelId UNIQUEIDENTIFIER=NULL, @Grade NVARCHAR(50)=NULL, @GroupCode NVARCHAR(50)=NULL,
    @Status NVARCHAR(30), @EnrollmentDate DATE=NULL, @BloodType NVARCHAR(10)=NULL,
    @Allergies NVARCHAR(500)=NULL, @MedicalNotes NVARCHAR(1000)=NULL, @ScholarshipPercent DECIMAL(5,2)=0,
    @SchoolCycleId UNIQUEIDENTIFIER=NULL, @ClassroomId UNIQUEIDENTIFIER=NULL,
    @LevelName NVARCHAR(80)=NULL, @PhotoUrl NVARCHAR(500)=NULL, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Student SET BranchId=@BranchId, FirstName=@FirstName, LastName=@LastName, Gender=@Gender, BirthDate=@BirthDate,
        Email=@Email, Phone=@Phone, Address=@Address, EducationLevelId=@EducationLevelId, Grade=@Grade, GroupCode=@GroupCode,
        Status=@Status, EnrollmentDate=@EnrollmentDate, BloodType=@BloodType, Allergies=@Allergies, MedicalNotes=@MedicalNotes,
        ScholarshipPercent=@ScholarshipPercent, SchoolCycleId=@SchoolCycleId, ClassroomId=@ClassroomId, LevelName=@LevelName, PhotoUrl=@PhotoUrl,
        UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'Student not found.', 1;
    EXEC dbo.sp_Student_GetById @TenantId=@TenantId, @Id=@Id;
END
GO
