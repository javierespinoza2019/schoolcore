/*
  SchoolCore — SQL Server 2022
  SP: sp_Branch_Create
*/
USE db_a0b4b3_schoolcore;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Branch_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @Name NVARCHAR(200), @Code NVARCHAR(50), @IsActive BIT = 1,
    @Address NVARCHAR(300)=NULL, @City NVARCHAR(100)=NULL, @State NVARCHAR(100)=NULL, @PostalCode NVARCHAR(20)=NULL,
    @Phone NVARCHAR(50)=NULL, @Email NVARCHAR(256)=NULL, @TimeZoneId NVARCHAR(64)=NULL,
    @DirectorName NVARCHAR(200)=NULL, @DirectorEmail NVARCHAR(256)=NULL, @DirectorPhone NVARCHAR(50)=NULL,
    @Capacity INT=NULL, @OpenedAt DATE=NULL, @Area NVARCHAR(80)=NULL, @Levels NVARCHAR(500)=NULL,
    @OperationalStatus NVARCHAR(30)=NULL, @CreatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    IF @TimeZoneId IS NOT NULL AND LEN(@TimeZoneId) > 0
       AND NOT EXISTS (SELECT 1 FROM dbo.TimeZoneCatalog WHERE Id = @TimeZoneId AND IsActive = 1)
        THROW 52001, 'Time zone is not in the allowed catalog.', 1;

    IF EXISTS (SELECT 1 FROM dbo.Branch WHERE TenantId=@TenantId AND Code=@Code AND IsDeleted=0)
        THROW 51001, 'Branch code already exists for this tenant.', 1;
    INSERT INTO dbo.Branch (Id,TenantId,Name,Code,IsActive,Address,City,[State],PostalCode,Phone,Email,TimeZoneId,
        DirectorName,DirectorEmail,DirectorPhone,Capacity,OpenedAt,Area,Levels,OperationalStatus,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@Name,@Code,@IsActive,@Address,@City,@State,@PostalCode,@Phone,@Email,@TimeZoneId,
        @DirectorName,@DirectorEmail,@DirectorPhone,@Capacity,@OpenedAt,@Area,@Levels,@OperationalStatus,SYSUTCDATETIME(),@CreatedBy);
    EXEC dbo.sp_Branch_GetById @TenantId=@TenantId, @Id=@Id;
END
GO
