/*
  SchoolCore — SQL Server 2022
  SP: sp_InstitutionSettings_Get
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_InstitutionSettings_Get @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        s.TenantId,
        s.DisplayName,
        s.LegalName,
        s.TaxId,
        s.Phone,
        s.Email,
        s.Website,
        s.Address,
        s.LogoUrl,
        s.PrimaryColor,
        ISNULL(t.TimeZoneId, N'America/Mexico_City') AS TimeZoneId,
        s.UpdatedAt
    FROM dbo.InstitutionSettings s
    INNER JOIN dbo.Tenant t ON t.Id = s.TenantId
    WHERE s.TenantId = @TenantId;
END
GO
