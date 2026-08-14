/*
  SchoolCore — SQL Server 2022
  SP: sp_EmailTemplate_UpsertTenant
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_EmailTemplate_UpsertTenant
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @TemplateKey NVARCHAR(100), @Culture NVARCHAR(10),
    @Subject NVARCHAR(300), @HtmlBody NVARCHAR(MAX), @LogoUrl NVARCHAR(500)=NULL, @PrimaryColor NVARCHAR(20)=NULL,
    @IsActive BIT=1
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Existing UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM dbo.EmailTemplate WHERE TenantId=@TenantId AND TemplateKey=@TemplateKey AND Culture=@Culture);
    IF @Existing IS NOT NULL
    BEGIN
        UPDATE dbo.EmailTemplate SET Subject=@Subject, HtmlBody=@HtmlBody, LogoUrl=@LogoUrl, PrimaryColor=@PrimaryColor,
            IsActive=@IsActive, UpdatedAt=SYSUTCDATETIME() WHERE Id=@Existing;
        SET @Id = @Existing;
    END
    ELSE
        INSERT INTO dbo.EmailTemplate (Id,TenantId,TemplateKey,Culture,Subject,HtmlBody,LogoUrl,PrimaryColor,IsActive,CreatedAt)
        VALUES (@Id,@TenantId,@TemplateKey,@Culture,@Subject,@HtmlBody,@LogoUrl,@PrimaryColor,@IsActive,SYSUTCDATETIME());
    SELECT Id, TenantId, TemplateKey, Culture, Subject, HtmlBody, LogoUrl, PrimaryColor, IsActive, CreatedAt, UpdatedAt
    FROM dbo.EmailTemplate WHERE Id=@Id;
END
GO
