/*
  SchoolCore — SQL Server 2022
  Script: 018_SeedEmailTemplates.sql
  Plantilla global PasswordReset (layout + variables). Idempotent.
*/
USE db_a0b4b3_schoolcore;
GO

DECLARE @Id UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, '33333333-3333-3333-3333-333333333001');
DECLARE @Html NVARCHAR(MAX) = N'<html><body style="font-family:Segoe UI,Arial,sans-serif;color:#1a1a1a;background:#f8fafc;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:28px;border:1px solid #e2e8f0;">
    <h2 style="margin:0 0 16px;color:{{PrimaryColor}};">{{SchoolName}}</h2>
    <p>Hola {{UserName}},</p>
    <p>Recibimos una solicitud para restablecer tu contraseña de SchoolCore.</p>
    <p style="margin:24px 0;">
      <a href="{{ResetUrl}}" style="display:inline-block;background:{{PrimaryColor}};color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600;">Restablecer contraseña</a>
    </p>
    <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
    <p style="color:#64748b;font-size:12px;margin-top:28px;">El enlace expira en 1 hora · {{Year}}</p>
  </div>
</body></html>';

IF NOT EXISTS (
    SELECT 1 FROM dbo.EmailTemplate
    WHERE TenantId IS NULL AND TemplateKey = N'PasswordReset' AND Culture = N'es'
)
BEGIN
    INSERT INTO dbo.EmailTemplate (Id, TenantId, TemplateKey, Culture, Subject, HtmlBody, LogoUrl, PrimaryColor, IsActive, CreatedAt)
    VALUES (
        @Id,
        NULL,
        N'PasswordReset',
        N'es',
        N'Recuperación de contraseña — {{SchoolName}}',
        @Html,
        NULL,
        N'#2563eb',
        1,
        SYSUTCDATETIME()
    );
END
ELSE
BEGIN
    UPDATE dbo.EmailTemplate
    SET Subject = N'Recuperación de contraseña — {{SchoolName}}',
        HtmlBody = @Html,
        PrimaryColor = COALESCE(PrimaryColor, N'#2563eb'),
        IsActive = 1,
        UpdatedAt = SYSUTCDATETIME()
    WHERE TenantId IS NULL AND TemplateKey = N'PasswordReset' AND Culture = N'es';
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.DatabaseVersion WHERE ScriptName = N'018_SeedEmailTemplates.sql')
BEGIN
    INSERT INTO dbo.DatabaseVersion (ScriptName) VALUES (N'018_SeedEmailTemplates.sql');
END
GO
