/*
  SchoolCore — SQL Server 2022
  SP: sp_EmailTemplate_List
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_EmailTemplate_List @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    -- Platform defaults + tenant overrides
    SELECT Id, TenantId, TemplateKey, Culture, Subject, HtmlBody, LogoUrl, PrimaryColor, IsActive, CreatedAt, UpdatedAt
    FROM dbo.EmailTemplate
    WHERE (TenantId IS NULL OR TenantId = @TenantId) AND IsActive = 1
    ORDER BY TemplateKey, Culture, CASE WHEN TenantId IS NULL THEN 0 ELSE 1 END;
END
GO
