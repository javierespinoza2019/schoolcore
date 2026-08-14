/*
  SchoolCore — SQL Server 2022
  SP: sp_EmailTemplate_GetById
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_EmailTemplate_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, TemplateKey, Culture, Subject, HtmlBody, LogoUrl, PrimaryColor, IsActive, CreatedAt, UpdatedAt
    FROM dbo.EmailTemplate WHERE Id=@Id AND (TenantId IS NULL OR TenantId=@TenantId);
END
GO
