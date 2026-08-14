/*
  SchoolCore — SQL Server 2022
  SP: sp_Enrollment_Complete
*/
USE db_a0b4b3_schoolcore;
GO

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
GO
