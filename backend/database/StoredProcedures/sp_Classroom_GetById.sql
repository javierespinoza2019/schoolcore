/*
  SchoolCore — SQL Server 2022
  SP: sp_Classroom_GetById
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Classroom_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT
        c.Id, c.TenantId, c.BranchId, c.Name, c.EducationLevelId, c.Grade, c.GroupCode,
        c.Capacity, c.Occupied, c.RoomType, c.Building, c.FloorNumber, c.Status,
        c.TeacherId, c.ScheduleNotes, c.EquipmentJson, c.CreatedAt, c.UpdatedAt,
        c.LevelName, c.AssignedTeacherName, c.AssignedGroupsJson,
        b.Name AS BranchName,
        COALESCE(NULLIF(LTRIM(RTRIM(el.Name)), N''), c.LevelName) AS EducationLevelName,
        COALESCE(
            NULLIF(LTRIM(RTRIM(c.AssignedTeacherName)), N''),
            NULLIF(LTRIM(RTRIM(CONCAT(t.FirstName, N' ', t.LastName))), N'')
        ) AS TeacherName
    FROM dbo.Classroom c
    LEFT JOIN dbo.Branch b ON b.Id = c.BranchId AND b.TenantId = c.TenantId
    LEFT JOIN dbo.EducationLevel el ON el.Id = c.EducationLevelId AND el.TenantId = c.TenantId AND el.IsDeleted = 0
    LEFT JOIN dbo.Teacher t ON t.Id = c.TeacherId AND t.TenantId = c.TenantId AND t.IsDeleted = 0
    WHERE c.TenantId = @TenantId AND c.Id = @Id AND c.IsDeleted = 0;
END
GO
