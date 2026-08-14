/*
  SchoolCore — SQL Server 2022
  SP: sp_Expense_SoftDelete
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Expense_SoftDelete @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    UPDATE dbo.Expense SET IsDeleted=1, UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'Expense not found.', 1;
    INSERT INTO dbo.AuditLog (Id, TenantId, UserId, EntityType, EntityId, Action, CreatedAt)
    VALUES (NEWID(), @TenantId, @UpdatedBy, N'Expense', @Id, N'SoftDelete', SYSUTCDATETIME());
END
GO
