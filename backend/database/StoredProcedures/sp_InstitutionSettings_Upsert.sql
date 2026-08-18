/*
  SchoolCore — SQL Server 2022
  SP: sp_InstitutionSettings_Upsert
  Updates institution profile + Tenant.TimeZoneId only (no historical timestamp rewrite).
*/
USE db_a0b4b3_schoolcore;
GO

CREATE OR ALTER PROCEDURE dbo.sp_InstitutionSettings_Upsert
    @TenantId UNIQUEIDENTIFIER, @DisplayName NVARCHAR(200), @LegalName NVARCHAR(300)=NULL, @TaxId NVARCHAR(20)=NULL,
    @Phone NVARCHAR(50)=NULL, @Email NVARCHAR(256)=NULL, @Website NVARCHAR(300)=NULL, @Address NVARCHAR(400)=NULL,
    @LogoUrl NVARCHAR(500)=NULL, @PrimaryColor NVARCHAR(20)=NULL, @TimeZoneId NVARCHAR(64)=NULL, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @TimeZoneId IS NOT NULL AND LEN(@TimeZoneId) > 0
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM dbo.TimeZoneCatalog WHERE Id = @TimeZoneId AND IsActive = 1)
            THROW 52001, 'Time zone is not in the allowed catalog.', 1;

        UPDATE dbo.Tenant SET TimeZoneId = @TimeZoneId WHERE Id = @TenantId;
    END

    IF EXISTS (SELECT 1 FROM dbo.InstitutionSettings WHERE TenantId = @TenantId)
        UPDATE dbo.InstitutionSettings
        SET DisplayName=@DisplayName, LegalName=@LegalName, TaxId=@TaxId, Phone=@Phone, Email=@Email,
            Website=@Website, Address=@Address, LogoUrl=@LogoUrl, PrimaryColor=@PrimaryColor,
            UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
        WHERE TenantId=@TenantId;
    ELSE
        INSERT INTO dbo.InstitutionSettings (TenantId, DisplayName, LegalName, TaxId, Phone, Email, Website, Address, LogoUrl, PrimaryColor, UpdatedAt, UpdatedBy)
        VALUES (@TenantId, @DisplayName, @LegalName, @TaxId, @Phone, @Email, @Website, @Address, @LogoUrl, @PrimaryColor, SYSUTCDATETIME(), @UpdatedBy);

    SELECT
        s.TenantId, s.DisplayName, s.LegalName, s.TaxId, s.Phone, s.Email, s.Website, s.Address, s.LogoUrl, s.PrimaryColor,
        ISNULL(t.TimeZoneId, N'America/Mexico_City') AS TimeZoneId,
        s.UpdatedAt
    FROM dbo.InstitutionSettings s
    INNER JOIN dbo.Tenant t ON t.Id = s.TenantId
    WHERE s.TenantId = @TenantId;
END
GO
