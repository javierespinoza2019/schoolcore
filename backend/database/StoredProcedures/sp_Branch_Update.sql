/*
  SchoolCore — SQL Server 2022
  SP: sp_Branch_Update
  Updates branch fields including optional TimeZoneId and PhotoUrl.
  Does NOT rewrite CreatedAt or any other historical timestamps.
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Branch_Update
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @Name NVARCHAR(200), @Code NVARCHAR(20), @IsActive BIT,
    @Address NVARCHAR(300)=NULL, @City NVARCHAR(100)=NULL, @State NVARCHAR(100)=NULL, @PostalCode NVARCHAR(10)=NULL,
    @Phone NVARCHAR(50)=NULL, @Email NVARCHAR(256)=NULL, @TimeZoneId NVARCHAR(64)=NULL,
    @DirectorName NVARCHAR(200)=NULL, @DirectorEmail NVARCHAR(256)=NULL, @DirectorPhone NVARCHAR(50)=NULL,
    @Capacity INT=NULL, @OpenedAt DATE=NULL, @Area NVARCHAR(80)=NULL, @Levels NVARCHAR(500)=NULL,
    @OperationalStatus NVARCHAR(30)=NULL, @PhotoUrl NVARCHAR(500)=NULL, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    IF @TimeZoneId IS NOT NULL AND LEN(@TimeZoneId) > 0
       AND NOT EXISTS (SELECT 1 FROM dbo.TimeZoneCatalog WHERE Id = @TimeZoneId AND IsActive = 1)
        THROW 52001, 'Time zone is not in the allowed catalog.', 1;

    IF EXISTS (SELECT 1 FROM dbo.Branch WHERE TenantId=@TenantId AND Code=@Code AND Id<>@Id AND IsDeleted=0)
        THROW 51001, 'Branch code already exists for this tenant.', 1;
    UPDATE dbo.Branch SET Name=@Name,Code=@Code,IsActive=@IsActive,Address=@Address,City=@City,[State]=@State,
        PostalCode=@PostalCode,Phone=@Phone,Email=@Email,TimeZoneId=@TimeZoneId,
        DirectorName=@DirectorName,DirectorEmail=@DirectorEmail,DirectorPhone=@DirectorPhone,
        Capacity=@Capacity,OpenedAt=@OpenedAt,Area=@Area,Levels=@Levels,OperationalStatus=@OperationalStatus,
        PhotoUrl=@PhotoUrl,
        UpdatedAt=SYSUTCDATETIME(),UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'Branch not found.', 1;
    EXEC dbo.sp_Branch_GetById @TenantId=@TenantId, @Id=@Id;
END
GO
