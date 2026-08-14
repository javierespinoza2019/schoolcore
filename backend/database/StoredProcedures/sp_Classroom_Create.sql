/*
  SchoolCore — SQL Server 2022
  SP: sp_Classroom_Create
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Classroom_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER, @Name NVARCHAR(100),
    @EducationLevelId UNIQUEIDENTIFIER=NULL, @Grade NVARCHAR(50)=NULL, @GroupCode NVARCHAR(50)=NULL, @Capacity INT=0,
    @RoomType NVARCHAR(50)=NULL, @Building NVARCHAR(100)=NULL, @FloorNumber INT=NULL, @Status NVARCHAR(30)=N'available',
    @TeacherId UNIQUEIDENTIFIER=NULL, @ScheduleNotes NVARCHAR(500)=NULL, @EquipmentJson NVARCHAR(MAX)=NULL,
    @LevelName NVARCHAR(80)=NULL, @AssignedTeacherName NVARCHAR(200)=NULL, @AssignedGroupsJson NVARCHAR(MAX)=NULL,
    @CreatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    IF @BranchId IS NULL OR @BranchId = '00000000-0000-0000-0000-000000000000'
        THROW 51002, 'Branch is required.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Branch WHERE Id=@BranchId AND TenantId=@TenantId AND IsDeleted=0)
        THROW 51003, 'Branch not found.', 1;
    INSERT INTO dbo.Classroom (Id,TenantId,BranchId,Name,EducationLevelId,Grade,GroupCode,Capacity,Occupied,RoomType,Building,FloorNumber,Status,TeacherId,ScheduleNotes,EquipmentJson,LevelName,AssignedTeacherName,AssignedGroupsJson,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@BranchId,@Name,@EducationLevelId,@Grade,@GroupCode,@Capacity,0,@RoomType,@Building,@FloorNumber,@Status,@TeacherId,@ScheduleNotes,@EquipmentJson,@LevelName,@AssignedTeacherName,@AssignedGroupsJson,SYSUTCDATETIME(),@CreatedBy);
    EXEC dbo.sp_Classroom_GetById @TenantId=@TenantId, @Id=@Id;
END
GO
