# -*- coding: utf-8 -*-
"""Generate SchoolCore MVP SPs Phases 3-6."""
from pathlib import Path

SP_DIR = Path(r"c:\Proyectos\AppFabric\SchoolCore\schoolcore\backend\database\StoredProcedures")


def write_sp(name: str, body: str) -> None:
    content = f"""/*
  SchoolCore — SQL Server 2022
  SP: {name}
*/
USE [SchoolCore];
GO

{body.strip()}
GO
"""
    (SP_DIR / f"{name}.sql").write_text(content, encoding="utf-8")


def main() -> None:
    # ===== Student =====
    write_sp(
        "sp_Student_List",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Student_List
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER=NULL, @Status NVARCHAR(30)=NULL,
    @Page INT=1, @PageSize INT=50, @Search NVARCHAR(100)=NULL, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 100 SET @PageSize = 100;
    SELECT @TotalCount = COUNT(1) FROM dbo.Student s
    WHERE s.TenantId=@TenantId AND s.IsDeleted=0
      AND (@BranchId IS NULL OR s.BranchId=@BranchId)
      AND (@Status IS NULL OR s.Status=@Status)
      AND (@Search IS NULL OR s.FirstName LIKE N'%'+@Search+N'%' OR s.LastName LIKE N'%'+@Search+N'%' OR s.EnrollmentNumber LIKE N'%'+@Search+N'%');
    SELECT s.Id, s.TenantId, s.BranchId, s.EnrollmentNumber, s.FirstName, s.LastName, s.Gender, s.BirthDate, s.Email, s.Phone,
           s.Address, s.EducationLevelId, s.Grade, s.GroupCode, s.Status, s.EnrollmentDate, s.BloodType, s.Allergies, s.MedicalNotes,
           s.ScholarshipPercent, s.SchoolCycleId, s.ClassroomId, s.CreatedAt, s.UpdatedAt, b.Name AS BranchName
    FROM dbo.Student s
    INNER JOIN dbo.Branch b ON b.Id = s.BranchId
    WHERE s.TenantId=@TenantId AND s.IsDeleted=0
      AND (@BranchId IS NULL OR s.BranchId=@BranchId)
      AND (@Status IS NULL OR s.Status=@Status)
      AND (@Search IS NULL OR s.FirstName LIKE N'%'+@Search+N'%' OR s.LastName LIKE N'%'+@Search+N'%' OR s.EnrollmentNumber LIKE N'%'+@Search+N'%')
    ORDER BY s.LastName, s.FirstName
    OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
""",
    )
    write_sp(
        "sp_Student_GetById",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Student_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT s.Id, s.TenantId, s.BranchId, s.EnrollmentNumber, s.FirstName, s.LastName, s.Gender, s.BirthDate, s.Email, s.Phone,
           s.Address, s.EducationLevelId, s.Grade, s.GroupCode, s.Status, s.EnrollmentDate, s.BloodType, s.Allergies, s.MedicalNotes,
           s.ScholarshipPercent, s.SchoolCycleId, s.ClassroomId, s.CreatedAt, s.UpdatedAt, b.Name AS BranchName
    FROM dbo.Student s INNER JOIN dbo.Branch b ON b.Id=s.BranchId
    WHERE s.TenantId=@TenantId AND s.Id=@Id AND s.IsDeleted=0;
END
""",
    )
    write_sp(
        "sp_Student_Create",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Student_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER,
    @EnrollmentNumber NVARCHAR(50)=NULL, @FirstName NVARCHAR(100), @LastName NVARCHAR(100),
    @Gender CHAR(1)=NULL, @BirthDate DATE=NULL, @Email NVARCHAR(256)=NULL, @Phone NVARCHAR(50)=NULL,
    @Address NVARCHAR(400)=NULL, @EducationLevelId UNIQUEIDENTIFIER=NULL, @Grade NVARCHAR(50)=NULL,
    @GroupCode NVARCHAR(50)=NULL, @Status NVARCHAR(30)=N'active', @EnrollmentDate DATE=NULL,
    @BloodType NVARCHAR(10)=NULL, @Allergies NVARCHAR(500)=NULL, @MedicalNotes NVARCHAR(1000)=NULL,
    @ScholarshipPercent DECIMAL(5,2)=0, @SchoolCycleId UNIQUEIDENTIFIER=NULL, @ClassroomId UNIQUEIDENTIFIER=NULL,
    @CreatedBy UNIQUEIDENTIFIER=NULL
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
        EducationLevelId,Grade,GroupCode,Status,EnrollmentDate,BloodType,Allergies,MedicalNotes,ScholarshipPercent,SchoolCycleId,ClassroomId,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@BranchId,@EnrollmentNumber,@FirstName,@LastName,@Gender,@BirthDate,@Email,@Phone,@Address,
        @EducationLevelId,@Grade,@GroupCode,@Status,@EnrollmentDate,@BloodType,@Allergies,@MedicalNotes,@ScholarshipPercent,@SchoolCycleId,@ClassroomId,SYSUTCDATETIME(),@CreatedBy);
    COMMIT;
    EXEC dbo.sp_Student_GetById @TenantId=@TenantId, @Id=@Id;
END
""",
    )
    write_sp(
        "sp_Student_Update",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Student_Update
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER,
    @FirstName NVARCHAR(100), @LastName NVARCHAR(100), @Gender CHAR(1)=NULL, @BirthDate DATE=NULL,
    @Email NVARCHAR(256)=NULL, @Phone NVARCHAR(50)=NULL, @Address NVARCHAR(400)=NULL,
    @EducationLevelId UNIQUEIDENTIFIER=NULL, @Grade NVARCHAR(50)=NULL, @GroupCode NVARCHAR(50)=NULL,
    @Status NVARCHAR(30), @EnrollmentDate DATE=NULL, @BloodType NVARCHAR(10)=NULL,
    @Allergies NVARCHAR(500)=NULL, @MedicalNotes NVARCHAR(1000)=NULL, @ScholarshipPercent DECIMAL(5,2)=0,
    @SchoolCycleId UNIQUEIDENTIFIER=NULL, @ClassroomId UNIQUEIDENTIFIER=NULL, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Student SET BranchId=@BranchId, FirstName=@FirstName, LastName=@LastName, Gender=@Gender, BirthDate=@BirthDate,
        Email=@Email, Phone=@Phone, Address=@Address, EducationLevelId=@EducationLevelId, Grade=@Grade, GroupCode=@GroupCode,
        Status=@Status, EnrollmentDate=@EnrollmentDate, BloodType=@BloodType, Allergies=@Allergies, MedicalNotes=@MedicalNotes,
        ScholarshipPercent=@ScholarshipPercent, SchoolCycleId=@SchoolCycleId, ClassroomId=@ClassroomId,
        UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'Student not found.', 1;
    EXEC dbo.sp_Student_GetById @TenantId=@TenantId, @Id=@Id;
END
""",
    )
    write_sp(
        "sp_Student_SoftDelete",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Student_SoftDelete @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    UPDATE dbo.Student SET IsDeleted=1, Status=N'inactive', UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'Student not found.', 1;
END
""",
    )

    # ===== Guardian =====
    write_sp(
        "sp_Guardian_List",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Guardian_List
    @TenantId UNIQUEIDENTIFIER, @Page INT=1, @PageSize INT=50, @Search NVARCHAR(100)=NULL, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 100 SET @PageSize = 100;
    SELECT @TotalCount = COUNT(1) FROM dbo.Guardian WHERE TenantId=@TenantId AND IsDeleted=0
      AND (@Search IS NULL OR FirstName LIKE N'%'+@Search+N'%' OR LastName LIKE N'%'+@Search+N'%' OR Email LIKE N'%'+@Search+N'%');
    SELECT Id, TenantId, FirstName, LastName, Email, Phone, Occupation, Address, Status, CreatedAt, UpdatedAt
    FROM dbo.Guardian WHERE TenantId=@TenantId AND IsDeleted=0
      AND (@Search IS NULL OR FirstName LIKE N'%'+@Search+N'%' OR LastName LIKE N'%'+@Search+N'%' OR Email LIKE N'%'+@Search+N'%')
    ORDER BY LastName, FirstName OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
""",
    )
    write_sp(
        "sp_Guardian_GetById",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Guardian_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT Id, TenantId, FirstName, LastName, Email, Phone, Occupation, Address, Status, CreatedAt, UpdatedAt
    FROM dbo.Guardian WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
END
""",
    )
    write_sp(
        "sp_Guardian_Create",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Guardian_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @FirstName NVARCHAR(100), @LastName NVARCHAR(100),
    @Email NVARCHAR(256)=NULL, @Phone NVARCHAR(50)=NULL, @Occupation NVARCHAR(150)=NULL, @Address NVARCHAR(400)=NULL,
    @Status NVARCHAR(30)=N'active', @CreatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    INSERT INTO dbo.Guardian (Id,TenantId,FirstName,LastName,Email,Phone,Occupation,Address,Status,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@FirstName,@LastName,@Email,@Phone,@Occupation,@Address,@Status,SYSUTCDATETIME(),@CreatedBy);
    SELECT Id, TenantId, FirstName, LastName, Email, Phone, Occupation, Address, Status, CreatedAt, UpdatedAt FROM dbo.Guardian WHERE Id=@Id;
END
""",
    )
    write_sp(
        "sp_Guardian_Update",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Guardian_Update
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @FirstName NVARCHAR(100), @LastName NVARCHAR(100),
    @Email NVARCHAR(256)=NULL, @Phone NVARCHAR(50)=NULL, @Occupation NVARCHAR(150)=NULL, @Address NVARCHAR(400)=NULL,
    @Status NVARCHAR(30), @UpdatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    UPDATE dbo.Guardian SET FirstName=@FirstName, LastName=@LastName, Email=@Email, Phone=@Phone, Occupation=@Occupation,
        Address=@Address, Status=@Status, UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'Guardian not found.', 1;
    SELECT Id, TenantId, FirstName, LastName, Email, Phone, Occupation, Address, Status, CreatedAt, UpdatedAt FROM dbo.Guardian WHERE Id=@Id;
END
""",
    )
    write_sp(
        "sp_Guardian_SoftDelete",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Guardian_SoftDelete @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    UPDATE dbo.Guardian SET IsDeleted=1, Status=N'inactive', UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'Guardian not found.', 1;
END
""",
    )
    write_sp(
        "sp_StudentGuardian_Link",
        """
CREATE OR ALTER PROCEDURE dbo.sp_StudentGuardian_Link
    @TenantId UNIQUEIDENTIFIER, @StudentId UNIQUEIDENTIFIER, @GuardianId UNIQUEIDENTIFIER,
    @Relationship NVARCHAR(50), @IsPrimary BIT=0
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Student WHERE TenantId=@TenantId AND Id=@StudentId AND IsDeleted=0) THROW 51004, 'Student not found.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Guardian WHERE TenantId=@TenantId AND Id=@GuardianId AND IsDeleted=0) THROW 51004, 'Guardian not found.', 1;
    IF EXISTS (SELECT 1 FROM dbo.StudentGuardian WHERE StudentId=@StudentId AND GuardianId=@GuardianId)
        UPDATE dbo.StudentGuardian SET Relationship=@Relationship, IsPrimary=@IsPrimary WHERE StudentId=@StudentId AND GuardianId=@GuardianId;
    ELSE
        INSERT INTO dbo.StudentGuardian (StudentId, GuardianId, TenantId, Relationship, IsPrimary)
        VALUES (@StudentId, @GuardianId, @TenantId, @Relationship, @IsPrimary);
END
""",
    )
    write_sp(
        "sp_StudentGuardian_Unlink",
        """
CREATE OR ALTER PROCEDURE dbo.sp_StudentGuardian_Unlink
    @TenantId UNIQUEIDENTIFIER, @StudentId UNIQUEIDENTIFIER, @GuardianId UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    DELETE FROM dbo.StudentGuardian WHERE TenantId=@TenantId AND StudentId=@StudentId AND GuardianId=@GuardianId;
END
""",
    )
    write_sp(
        "sp_StudentGuardian_ListByStudent",
        """
CREATE OR ALTER PROCEDURE dbo.sp_StudentGuardian_ListByStudent @TenantId UNIQUEIDENTIFIER, @StudentId UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT g.Id, g.FirstName, g.LastName, g.Email, g.Phone, g.Occupation, g.Address, g.Status,
           sg.Relationship, sg.IsPrimary
    FROM dbo.StudentGuardian sg
    INNER JOIN dbo.Guardian g ON g.Id = sg.GuardianId AND g.IsDeleted=0
    WHERE sg.TenantId=@TenantId AND sg.StudentId=@StudentId;
END
""",
    )

    # ===== Document =====
    write_sp(
        "sp_Document_Create",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Document_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @FileId UNIQUEIDENTIFIER, @UploaderUserId UNIQUEIDENTIFIER,
    @EntityType NVARCHAR(50), @EntityId UNIQUEIDENTIFIER, @OriginalFileName NVARCHAR(260), @ContentType NVARCHAR(100),
    @Extension NVARCHAR(10), @SizeBytes BIGINT, @RelativePath NVARCHAR(500), @Status NVARCHAR(30)=N'pending',
    @CreatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    INSERT INTO dbo.Document (Id,TenantId,FileId,UploaderUserId,EntityType,EntityId,OriginalFileName,ContentType,Extension,SizeBytes,RelativePath,Status,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@FileId,@UploaderUserId,@EntityType,@EntityId,@OriginalFileName,@ContentType,@Extension,@SizeBytes,@RelativePath,@Status,SYSUTCDATETIME(),@CreatedBy);
    SELECT Id, TenantId, FileId, UploaderUserId, EntityType, EntityId, OriginalFileName, ContentType, Extension, SizeBytes, RelativePath, Status, CreatedAt
    FROM dbo.Document WHERE Id=@Id;
END
""",
    )
    write_sp(
        "sp_Document_GetById",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Document_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT Id, TenantId, FileId, UploaderUserId, EntityType, EntityId, OriginalFileName, ContentType, Extension, SizeBytes, RelativePath, Status, CreatedAt
    FROM dbo.Document WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
END
""",
    )
    write_sp(
        "sp_Document_List",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Document_List
    @TenantId UNIQUEIDENTIFIER, @EntityType NVARCHAR(50)=NULL, @EntityId UNIQUEIDENTIFIER=NULL,
    @Page INT=1, @PageSize INT=50, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 100 SET @PageSize = 100;
    SELECT @TotalCount = COUNT(1) FROM dbo.Document
    WHERE TenantId=@TenantId AND IsDeleted=0
      AND (@EntityType IS NULL OR EntityType=@EntityType)
      AND (@EntityId IS NULL OR EntityId=@EntityId);
    SELECT Id, TenantId, FileId, UploaderUserId, EntityType, EntityId, OriginalFileName, ContentType, Extension, SizeBytes, RelativePath, Status, CreatedAt
    FROM dbo.Document
    WHERE TenantId=@TenantId AND IsDeleted=0
      AND (@EntityType IS NULL OR EntityType=@EntityType)
      AND (@EntityId IS NULL OR EntityId=@EntityId)
    ORDER BY CreatedAt DESC OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
""",
    )
    write_sp(
        "sp_Document_SoftDelete",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Document_SoftDelete @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @DeletedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    UPDATE dbo.Document SET IsDeleted=1, DeletedAt=SYSUTCDATETIME(), DeletedBy=@DeletedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'Document not found.', 1;
END
""",
    )

    # ===== Timeline =====
    write_sp(
        "sp_TimelineEvent_List",
        """
CREATE OR ALTER PROCEDURE dbo.sp_TimelineEvent_List
    @TenantId UNIQUEIDENTIFIER, @EntityType NVARCHAR(50), @EntityId UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT Id, TenantId, EntityType, EntityId, EventDate, Title, Description, Icon, Badge, CreatedAt
    FROM dbo.TimelineEvent
    WHERE TenantId=@TenantId AND EntityType=@EntityType AND EntityId=@EntityId AND IsDeleted=0
    ORDER BY EventDate DESC;
END
""",
    )
    write_sp(
        "sp_TimelineEvent_Create",
        """
CREATE OR ALTER PROCEDURE dbo.sp_TimelineEvent_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @EntityType NVARCHAR(50), @EntityId UNIQUEIDENTIFIER,
    @EventDate DATETIME2(3), @Title NVARCHAR(200), @Description NVARCHAR(1000)=NULL, @Icon NVARCHAR(50)=NULL,
    @Badge NVARCHAR(50)=NULL, @CreatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    INSERT INTO dbo.TimelineEvent (Id,TenantId,EntityType,EntityId,EventDate,Title,Description,Icon,Badge,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@EntityType,@EntityId,@EventDate,@Title,@Description,@Icon,@Badge,SYSUTCDATETIME(),@CreatedBy);
    SELECT Id, TenantId, EntityType, EntityId, EventDate, Title, Description, Icon, Badge, CreatedAt FROM dbo.TimelineEvent WHERE Id=@Id;
END
""",
    )

    # ===== Teacher / Classroom / Enrollment =====
    write_sp(
        "sp_Teacher_List",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Teacher_List
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER=NULL, @Page INT=1, @PageSize INT=50, @Search NVARCHAR(100)=NULL, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 100 SET @PageSize = 100;
    SELECT @TotalCount = COUNT(1) FROM dbo.Teacher WHERE TenantId=@TenantId AND IsDeleted=0
      AND (@BranchId IS NULL OR BranchId=@BranchId)
      AND (@Search IS NULL OR FirstName LIKE N'%'+@Search+N'%' OR LastName LIKE N'%'+@Search+N'%' OR Email LIKE N'%'+@Search+N'%');
    SELECT Id, TenantId, BranchId, FirstName, LastName, Email, Phone, Specialty, SubjectsJson, EmploymentType, MonthlySalary,
           EducationLevelId, Status, HireDate, ScheduleNotes, CreatedAt, UpdatedAt
    FROM dbo.Teacher WHERE TenantId=@TenantId AND IsDeleted=0
      AND (@BranchId IS NULL OR BranchId=@BranchId)
      AND (@Search IS NULL OR FirstName LIKE N'%'+@Search+N'%' OR LastName LIKE N'%'+@Search+N'%' OR Email LIKE N'%'+@Search+N'%')
    ORDER BY LastName, FirstName OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
""",
    )
    write_sp(
        "sp_Teacher_GetById",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Teacher_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT Id, TenantId, BranchId, FirstName, LastName, Email, Phone, Specialty, SubjectsJson, EmploymentType, MonthlySalary,
           EducationLevelId, Status, HireDate, ScheduleNotes, CreatedAt, UpdatedAt
    FROM dbo.Teacher WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
END
""",
    )
    write_sp(
        "sp_Teacher_Create",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Teacher_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER, @FirstName NVARCHAR(100), @LastName NVARCHAR(100),
    @Email NVARCHAR(256)=NULL, @Phone NVARCHAR(50)=NULL, @Specialty NVARCHAR(150)=NULL, @SubjectsJson NVARCHAR(MAX)=NULL,
    @EmploymentType NVARCHAR(50)=NULL, @MonthlySalary DECIMAL(18,2)=NULL, @EducationLevelId UNIQUEIDENTIFIER=NULL,
    @Status NVARCHAR(30)=N'active', @HireDate DATE=NULL, @ScheduleNotes NVARCHAR(500)=NULL, @CreatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    INSERT INTO dbo.Teacher (Id,TenantId,BranchId,FirstName,LastName,Email,Phone,Specialty,SubjectsJson,EmploymentType,MonthlySalary,EducationLevelId,Status,HireDate,ScheduleNotes,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@BranchId,@FirstName,@LastName,@Email,@Phone,@Specialty,@SubjectsJson,@EmploymentType,@MonthlySalary,@EducationLevelId,@Status,@HireDate,@ScheduleNotes,SYSUTCDATETIME(),@CreatedBy);
    EXEC dbo.sp_Teacher_GetById @TenantId=@TenantId, @Id=@Id;
END
""",
    )
    write_sp(
        "sp_Teacher_Update",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Teacher_Update
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER, @FirstName NVARCHAR(100), @LastName NVARCHAR(100),
    @Email NVARCHAR(256)=NULL, @Phone NVARCHAR(50)=NULL, @Specialty NVARCHAR(150)=NULL, @SubjectsJson NVARCHAR(MAX)=NULL,
    @EmploymentType NVARCHAR(50)=NULL, @MonthlySalary DECIMAL(18,2)=NULL, @EducationLevelId UNIQUEIDENTIFIER=NULL,
    @Status NVARCHAR(30), @HireDate DATE=NULL, @ScheduleNotes NVARCHAR(500)=NULL, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    UPDATE dbo.Teacher SET BranchId=@BranchId, FirstName=@FirstName, LastName=@LastName, Email=@Email, Phone=@Phone, Specialty=@Specialty,
        SubjectsJson=@SubjectsJson, EmploymentType=@EmploymentType, MonthlySalary=@MonthlySalary, EducationLevelId=@EducationLevelId,
        Status=@Status, HireDate=@HireDate, ScheduleNotes=@ScheduleNotes, UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'Teacher not found.', 1;
    EXEC dbo.sp_Teacher_GetById @TenantId=@TenantId, @Id=@Id;
END
""",
    )
    write_sp(
        "sp_Teacher_SoftDelete",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Teacher_SoftDelete @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    UPDATE dbo.Teacher SET IsDeleted=1, Status=N'inactive', UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'Teacher not found.', 1;
END
""",
    )

    write_sp(
        "sp_Classroom_List",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Classroom_List
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER=NULL, @Page INT=1, @PageSize INT=50, @Search NVARCHAR(100)=NULL, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 100 SET @PageSize = 100;
    SELECT @TotalCount = COUNT(1) FROM dbo.Classroom WHERE TenantId=@TenantId AND IsDeleted=0
      AND (@BranchId IS NULL OR BranchId=@BranchId)
      AND (@Search IS NULL OR Name LIKE N'%'+@Search+N'%');
    SELECT Id, TenantId, BranchId, Name, EducationLevelId, Grade, GroupCode, Capacity, Occupied, RoomType, Building, FloorNumber,
           Status, TeacherId, ScheduleNotes, EquipmentJson, CreatedAt, UpdatedAt
    FROM dbo.Classroom WHERE TenantId=@TenantId AND IsDeleted=0
      AND (@BranchId IS NULL OR BranchId=@BranchId)
      AND (@Search IS NULL OR Name LIKE N'%'+@Search+N'%')
    ORDER BY Name OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
""",
    )
    write_sp(
        "sp_Classroom_GetById",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Classroom_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT Id, TenantId, BranchId, Name, EducationLevelId, Grade, GroupCode, Capacity, Occupied, RoomType, Building, FloorNumber,
           Status, TeacherId, ScheduleNotes, EquipmentJson, CreatedAt, UpdatedAt
    FROM dbo.Classroom WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
END
""",
    )
    write_sp(
        "sp_Classroom_Create",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Classroom_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER, @Name NVARCHAR(100),
    @EducationLevelId UNIQUEIDENTIFIER=NULL, @Grade NVARCHAR(50)=NULL, @GroupCode NVARCHAR(50)=NULL, @Capacity INT=0,
    @RoomType NVARCHAR(50)=NULL, @Building NVARCHAR(100)=NULL, @FloorNumber INT=NULL, @Status NVARCHAR(30)=N'available',
    @TeacherId UNIQUEIDENTIFIER=NULL, @ScheduleNotes NVARCHAR(500)=NULL, @EquipmentJson NVARCHAR(MAX)=NULL,
    @CreatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    INSERT INTO dbo.Classroom (Id,TenantId,BranchId,Name,EducationLevelId,Grade,GroupCode,Capacity,Occupied,RoomType,Building,FloorNumber,Status,TeacherId,ScheduleNotes,EquipmentJson,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@BranchId,@Name,@EducationLevelId,@Grade,@GroupCode,@Capacity,0,@RoomType,@Building,@FloorNumber,@Status,@TeacherId,@ScheduleNotes,@EquipmentJson,SYSUTCDATETIME(),@CreatedBy);
    EXEC dbo.sp_Classroom_GetById @TenantId=@TenantId, @Id=@Id;
END
""",
    )
    write_sp(
        "sp_Classroom_Update",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Classroom_Update
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER, @Name NVARCHAR(100),
    @EducationLevelId UNIQUEIDENTIFIER=NULL, @Grade NVARCHAR(50)=NULL, @GroupCode NVARCHAR(50)=NULL, @Capacity INT=0,
    @Occupied INT=0, @RoomType NVARCHAR(50)=NULL, @Building NVARCHAR(100)=NULL, @FloorNumber INT=NULL, @Status NVARCHAR(30),
    @TeacherId UNIQUEIDENTIFIER=NULL, @ScheduleNotes NVARCHAR(500)=NULL, @EquipmentJson NVARCHAR(MAX)=NULL,
    @UpdatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    UPDATE dbo.Classroom SET BranchId=@BranchId, Name=@Name, EducationLevelId=@EducationLevelId, Grade=@Grade, GroupCode=@GroupCode,
        Capacity=@Capacity, Occupied=@Occupied, RoomType=@RoomType, Building=@Building, FloorNumber=@FloorNumber, Status=@Status,
        TeacherId=@TeacherId, ScheduleNotes=@ScheduleNotes, EquipmentJson=@EquipmentJson, UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'Classroom not found.', 1;
    EXEC dbo.sp_Classroom_GetById @TenantId=@TenantId, @Id=@Id;
END
""",
    )
    write_sp(
        "sp_Classroom_SoftDelete",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Classroom_SoftDelete @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    UPDATE dbo.Classroom SET IsDeleted=1, UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'Classroom not found.', 1;
END
""",
    )

    write_sp(
        "sp_Enrollment_List",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Enrollment_List
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER=NULL, @Status NVARCHAR(30)=NULL,
    @Page INT=1, @PageSize INT=50, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 100 SET @PageSize = 100;
    SELECT @TotalCount = COUNT(1) FROM dbo.Enrollment WHERE TenantId=@TenantId AND IsDeleted=0
      AND (@BranchId IS NULL OR BranchId=@BranchId) AND (@Status IS NULL OR Status=@Status);
    SELECT Id, TenantId, BranchId, SchoolCycleId, StudentId, EnrollmentNumber, Status, CurrentStep, CompletedAt, CreatedAt, UpdatedAt
    FROM dbo.Enrollment WHERE TenantId=@TenantId AND IsDeleted=0
      AND (@BranchId IS NULL OR BranchId=@BranchId) AND (@Status IS NULL OR Status=@Status)
    ORDER BY CreatedAt DESC OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
""",
    )
    write_sp(
        "sp_Enrollment_GetById",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Enrollment_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT Id, TenantId, BranchId, SchoolCycleId, StudentId, EnrollmentNumber, Status, CurrentStep,
           Step1StudentJson, Step2GuardiansJson, Step3AcademicJson, Step4DocumentsJson, Step5FinanceJson,
           CompletedAt, CreatedAt, UpdatedAt
    FROM dbo.Enrollment WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
END
""",
    )
    write_sp(
        "sp_Enrollment_Create",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Enrollment_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER, @SchoolCycleId UNIQUEIDENTIFIER,
    @CreatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    BEGIN TRAN;
    DECLARE @Fmt NVARCHAR(50);
    EXEC dbo.sp_TenantSequence_Next @TenantId=@TenantId, @SequenceKey=N'Enrollment', @Prefix=N'ENR-', @PadLength=6, @FormattedValue=@Fmt OUTPUT;
    INSERT INTO dbo.Enrollment (Id,TenantId,BranchId,SchoolCycleId,EnrollmentNumber,Status,CurrentStep,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@BranchId,@SchoolCycleId,@Fmt,N'draft',1,SYSUTCDATETIME(),@CreatedBy);
    COMMIT;
    EXEC dbo.sp_Enrollment_GetById @TenantId=@TenantId, @Id=@Id;
END
""",
    )
    write_sp(
        "sp_Enrollment_SaveWizard",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Enrollment_SaveWizard
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @CurrentStep INT,
    @Step1StudentJson NVARCHAR(MAX)=NULL, @Step2GuardiansJson NVARCHAR(MAX)=NULL, @Step3AcademicJson NVARCHAR(MAX)=NULL,
    @Step4DocumentsJson NVARCHAR(MAX)=NULL, @Step5FinanceJson NVARCHAR(MAX)=NULL, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Enrollment SET CurrentStep=@CurrentStep,
        Step1StudentJson = COALESCE(@Step1StudentJson, Step1StudentJson),
        Step2GuardiansJson = COALESCE(@Step2GuardiansJson, Step2GuardiansJson),
        Step3AcademicJson = COALESCE(@Step3AcademicJson, Step3AcademicJson),
        Step4DocumentsJson = COALESCE(@Step4DocumentsJson, Step4DocumentsJson),
        Step5FinanceJson = COALESCE(@Step5FinanceJson, Step5FinanceJson),
        UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0 AND Status=N'draft';
    IF @@ROWCOUNT=0 THROW 51004, 'Enrollment not found or not editable.', 1;
    EXEC dbo.sp_Enrollment_GetById @TenantId=@TenantId, @Id=@Id;
END
""",
    )
    write_sp(
        "sp_Enrollment_Complete",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Enrollment_Complete
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @StudentId UNIQUEIDENTIFIER, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Student WHERE TenantId=@TenantId AND Id=@StudentId AND IsDeleted=0)
        THROW 51004, 'Student not found.', 1;
    UPDATE dbo.Enrollment SET Status=N'completed', StudentId=@StudentId, CompletedAt=SYSUTCDATETIME(),
        CurrentStep=5, UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0 AND Status=N'draft';
    IF @@ROWCOUNT=0 THROW 51004, 'Enrollment not found or already completed.', 1;
    EXEC dbo.sp_Enrollment_GetById @TenantId=@TenantId, @Id=@Id;
END
""",
    )

    print("Phases 3-4 SPs generated")
    print("count=", len(list(SP_DIR.glob("sp_*.sql"))))


if __name__ == "__main__":
    main()
