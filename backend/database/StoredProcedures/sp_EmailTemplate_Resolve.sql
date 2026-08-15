/*
  SchoolCore — SQL Server 2022
  SP: sp_EmailTemplate_Resolve
  Resuelve override de tenant; si no hay, plantilla global (TenantId NULL).
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_EmailTemplate_Resolve
    @TenantId UNIQUEIDENTIFIER,
    @TemplateKey NVARCHAR(100),
    @Culture NVARCHAR(10) = N'es'
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 Id, TenantId, TemplateKey, Culture, Subject, HtmlBody, LogoUrl, PrimaryColor, IsActive, CreatedAt, UpdatedAt
    FROM dbo.EmailTemplate
    WHERE TemplateKey = @TemplateKey
      AND Culture = @Culture
      AND IsActive = 1
      AND (TenantId = @TenantId OR TenantId IS NULL)
    ORDER BY CASE WHEN TenantId IS NULL THEN 1 ELSE 0 END; -- tenant override first
END
GO
