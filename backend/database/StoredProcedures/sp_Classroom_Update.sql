/*
  SchoolCore — SQL Server 2022
  SP: sp_Classroom_Update
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Classroom_Update
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER, @Name NVARCHAR(100),
    @EducationLevelId UNIQUEIDENTIFIER=NULL, @Grade NVARCHAR(50)=NULL, @GroupCode NVARCHAR(50)=NULL, @Capacity INT=0,
    @Occupied INT=0, @RoomType NVARCHAR(50)=NULL, @Building NVARCHAR(100)=NULL, @FloorNumber INT=NULL, @Status NVARCHAR(30),
    @TeacherId UNIQUEIDENTIFIER=NULL, @ScheduleNotes NVARCHAR(500)=NULL, @EquipmentJson NVARCHAR(MAX)=NULL,
    @LevelName NVARCHAR(80)=NULL, @AssignedTeacherName NVARCHAR(200)=NULL, @AssignedGroupsJson NVARCHAR(MAX)=NULL,
    @UpdatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    IF @BranchId IS NULL OR @BranchId = '00000000-0000-0000-0000-000000000000'
        THROW 51002, 'Branch is required.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Branch WHERE Id=@BranchId AND TenantId=@TenantId AND IsDeleted=0)
        THROW 51003, 'Branch not found.', 1;
    UPDATE dbo.Classroom SET BranchId=@BranchId, Name=@Name, EducationLevelId=@EducationLevelId, Grade=@Grade, GroupCode=@GroupCode,
        Capacity=@Capacity, Occupied=@Occupied, RoomType=@RoomType, Building=@Building, FloorNumber=@FloorNumber, Status=@Status,
        TeacherId=@TeacherId, ScheduleNotes=@ScheduleNotes, EquipmentJson=@EquipmentJson,
        LevelName=@LevelName, AssignedTeacherName=@AssignedTeacherName, AssignedGroupsJson=@AssignedGroupsJson,
        UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'Classroom not found.', 1;
    EXEC dbo.sp_Classroom_GetById @TenantId=@TenantId, @Id=@Id;
END
GO
