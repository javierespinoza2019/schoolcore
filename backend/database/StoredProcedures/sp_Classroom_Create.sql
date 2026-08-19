/*
  SchoolCore — SQL Server 2022
  SP: sp_Classroom_Create
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Classroom_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER, @Name NVARCHAR(100),
    @EducationLevelId UNIQUEIDENTIFIER=NULL, @Grade NVARCHAR(20)=NULL, @GroupCode NVARCHAR(10)=NULL, @Capacity INT=0,
    @RoomType NVARCHAR(50)=NULL, @Building NVARCHAR(100)=NULL, @FloorNumber INT=NULL, @Status NVARCHAR(30)=N'available',
    @TeacherId UNIQUEIDENTIFIER=NULL, @ScheduleNotes NVARCHAR(500)=NULL, @EquipmentJson NVARCHAR(MAX)=NULL,
    @LevelName NVARCHAR(100)=NULL, @AssignedTeacherName NVARCHAR(200)=NULL, @AssignedGroupsJson NVARCHAR(MAX)=NULL,
    @CreatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    IF @BranchId IS NULL OR @BranchId = '00000000-0000-0000-0000-000000000000'
        THROW 51002, 'Branch is required.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Branch WHERE Id=@BranchId AND TenantId=@TenantId AND IsDeleted=0)
        THROW 51003, 'Branch not found.', 1;
    IF @TeacherId IS NOT NULL
       AND NOT EXISTS (
            SELECT 1 FROM dbo.Teacher t
            WHERE t.Id=@TeacherId AND t.TenantId=@TenantId AND t.IsDeleted=0
              AND (
                    EXISTS (SELECT 1 FROM dbo.TeacherBranch tb WHERE tb.TeacherId=t.Id AND tb.BranchId=@BranchId)
                    OR (NOT EXISTS (SELECT 1 FROM dbo.TeacherBranch tb0 WHERE tb0.TeacherId=t.Id) AND t.BranchId=@BranchId)
                  )
       )
        THROW 51005, 'El profesor no está asignado a esta sucursal.', 1;
    INSERT INTO dbo.Classroom (Id,TenantId,BranchId,Name,EducationLevelId,Grade,GroupCode,Capacity,Occupied,RoomType,Building,FloorNumber,Status,TeacherId,ScheduleNotes,EquipmentJson,LevelName,AssignedTeacherName,AssignedGroupsJson,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@BranchId,@Name,@EducationLevelId,@Grade,@GroupCode,@Capacity,0,@RoomType,@Building,@FloorNumber,@Status,@TeacherId,@ScheduleNotes,@EquipmentJson,@LevelName,@AssignedTeacherName,@AssignedGroupsJson,SYSUTCDATETIME(),@CreatedBy);
    EXEC dbo.sp_Classroom_GetById @TenantId=@TenantId, @Id=@Id;
END
GO
