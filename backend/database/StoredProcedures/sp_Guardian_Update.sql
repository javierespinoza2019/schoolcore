/*
  SchoolCore — SQL Server 2022
  SP: sp_Guardian_Update
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Guardian_Update
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @FirstName NVARCHAR(100), @LastName NVARCHAR(100),
    @Email NVARCHAR(256)=NULL, @Phone NVARCHAR(50)=NULL, @Occupation NVARCHAR(150)=NULL, @Address NVARCHAR(400)=NULL,
    @Status NVARCHAR(30), @PhotoUrl NVARCHAR(500)=NULL, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    UPDATE dbo.Guardian SET FirstName=@FirstName, LastName=@LastName, Email=@Email, Phone=@Phone, Occupation=@Occupation,
        Address=@Address, Status=@Status, PhotoUrl=@PhotoUrl, UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'Guardian not found.', 1;
    SELECT g.Id, g.TenantId, g.FirstName, g.LastName, g.Email, g.Phone, g.Occupation, g.Address, g.Status, g.PhotoUrl,
           g.CreatedAt, g.UpdatedAt,
           (SELECT COUNT(1)
            FROM dbo.StudentGuardian sg
            INNER JOIN dbo.Student s ON s.Id = sg.StudentId AND s.TenantId = sg.TenantId AND s.IsDeleted = 0
            WHERE sg.TenantId = g.TenantId AND sg.GuardianId = g.Id) AS ChildrenCount
    FROM dbo.Guardian g WHERE g.Id=@Id;
END
GO
