/*
  SchoolCore — SQL Server 2022
  SP: sp_CashSession_Open
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_CashSession_Open
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER, @UserId UNIQUEIDENTIFIER,
    @Shift NVARCHAR(30)=N'morning', @OpeningAmount DECIMAL(18,2)=0, @Notes NVARCHAR(500)=NULL, @CreatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.CashSession WHERE TenantId=@TenantId AND BranchId=@BranchId AND UserId=@UserId AND Shift=@Shift AND Status=N'open' AND IsDeleted=0)
        THROW 51009, 'An open cash session already exists for this user/branch/shift.', 1;
    INSERT INTO dbo.CashSession (Id,TenantId,BranchId,UserId,Shift,OpenedAt,OpeningAmount,Status,Notes,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@BranchId,@UserId,@Shift,SYSUTCDATETIME(),@OpeningAmount,N'open',@Notes,SYSUTCDATETIME(),@CreatedBy);
    INSERT INTO dbo.AuditLog (Id, TenantId, UserId, EntityType, EntityId, Action, CreatedAt)
    VALUES (NEWID(), @TenantId, @CreatedBy, N'CashSession', @Id, N'Open', SYSUTCDATETIME());
    SELECT Id, TenantId, BranchId, UserId, Shift, OpenedAt, ClosedAt, OpeningAmount, TotalIncome, TotalExpense, ClosingAmount, DifferenceAmount, Status, Notes, CreatedAt
    FROM dbo.CashSession WHERE Id=@Id;
END
GO
