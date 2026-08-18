/*
  SchoolCore — SQL Server 2022
  SP: sp_Student_Create
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Student_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER,
    @EnrollmentNumber NVARCHAR(50)=NULL, @FirstName NVARCHAR(100), @LastName NVARCHAR(100),
    @Gender CHAR(1)=NULL, @BirthDate DATE=NULL, @Email NVARCHAR(256)=NULL, @Phone NVARCHAR(50)=NULL,
    @Address NVARCHAR(400)=NULL, @EducationLevelId UNIQUEIDENTIFIER=NULL, @Grade NVARCHAR(20)=NULL,
    @GroupCode NVARCHAR(10)=NULL, @Status NVARCHAR(30)=N'active', @EnrollmentDate DATE=NULL,
    @BloodType NVARCHAR(5)=NULL, @Allergies NVARCHAR(500)=NULL, @MedicalNotes NVARCHAR(1000)=NULL,
    @ScholarshipPercent DECIMAL(5,2)=0, @SchoolCycleId UNIQUEIDENTIFIER=NULL, @ClassroomId UNIQUEIDENTIFIER=NULL,
    @LevelName NVARCHAR(100)=NULL, @PhotoUrl NVARCHAR(500)=NULL, @CreatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRAN;
    IF @EnrollmentNumber IS NULL OR LTRIM(RTRIM(@EnrollmentNumber)) = N''
    BEGIN
        DECLARE @Fmt NVARCHAR(50);
        EXEC dbo.sp_TenantSequence_Next @TenantId=@TenantId, @SequenceKey=N'Enrollment', @Prefix=N'ENR-', @PadLength=6, @FormattedValue=@Fmt OUTPUT;
        SET @EnrollmentNumber = @Fmt;
    END
    IF EXISTS (SELECT 1 FROM dbo.Student WHERE TenantId=@TenantId AND EnrollmentNumber=@EnrollmentNumber AND IsDeleted=0)
        THROW 51001, 'Enrollment number already exists.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Branch WHERE Id=@BranchId AND TenantId=@TenantId AND IsDeleted=0)
        THROW 51004, 'Branch not found.', 1;
    INSERT INTO dbo.Student (Id,TenantId,BranchId,EnrollmentNumber,FirstName,LastName,Gender,BirthDate,Email,Phone,Address,
        EducationLevelId,Grade,GroupCode,Status,EnrollmentDate,BloodType,Allergies,MedicalNotes,ScholarshipPercent,SchoolCycleId,ClassroomId,LevelName,PhotoUrl,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@BranchId,@EnrollmentNumber,@FirstName,@LastName,@Gender,@BirthDate,@Email,@Phone,@Address,
        @EducationLevelId,@Grade,@GroupCode,@Status,@EnrollmentDate,@BloodType,@Allergies,@MedicalNotes,@ScholarshipPercent,@SchoolCycleId,@ClassroomId,@LevelName,@PhotoUrl,SYSUTCDATETIME(),@CreatedBy);
    COMMIT;
    EXEC dbo.sp_Student_GetById @TenantId=@TenantId, @Id=@Id;
END
GO
