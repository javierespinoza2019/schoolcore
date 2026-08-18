/*
  SchoolCore — SQL Server 2022
  Script: 990_CleanOperationalData.sql

  Limpia SOLO datos operativos de un tenant (QA / reinicio de pruebas).
  NO es un script de migración: ejecutar a mano, con backup previo.

  GARANTÍA: NUNCA borra ni desactiva Tenant ni User (ni UserRole / UserBranch).
  Solo invalida sesiones (RefreshToken / PasswordResetToken); el login sigue válido.

  BORRA (operativo):
    Finanzas/caja: CashMovement, CashAudit, Payment, Expense, Charge, CashSession, AuditLog
    Personas/académico: Notification, TimelineEvent, Document, StudentGuardian,
                        Enrollment, Student, Guardian, Classroom, Teacher
    Auth sesión: RefreshToken, PasswordResetToken
    Contadores: TenantSequence (reset NextValue = 1)

  CONSERVA (configuración / identidad):
    Tenant, Branch, User, Role, UserRole, UserBranch
    FeatureFlag, EmailTemplate, RolePermission, TimeZoneCatalog, DatabaseVersion
    InstitutionSettings, SchoolCycle, EducationLevel
    PaymentMethod, PaymentConcept, PaymentConceptAmount

  Notas:
  - Tras borrar Document, limpia Branch.PhotoUrl (FK lógica al FileId/document).
  - No elimina archivos físicos en disco (solo metadatos Document).
  - Requiere @ConfirmDelete = 1 y un TenantId o TenantCode válido.
*/
USE db_a0b4b3_schoolcore;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

/* ========== PARÁMETROS (editar antes de ejecutar) ========== */
DECLARE @TenantId       UNIQUEIDENTIFIER = NULL;   -- opcional si usas @TenantCode
DECLARE @TenantCode     NVARCHAR(50)     = N'IT'; -- TODO: código del tenant a limpiar
DECLARE @ConfirmDelete  BIT              = 0;      -- poner en 1 para ejecutar el borrado
/* ========================================================== */

IF @TenantId IS NULL AND NULLIF(LTRIM(RTRIM(@TenantCode)), N'') IS NOT NULL
    SELECT @TenantId = Id FROM dbo.Tenant WHERE Code = @TenantCode;

IF @TenantId IS NULL
    THROW 50090, 'Tenant no encontrado. Indica @TenantId o @TenantCode válido.', 1;

IF @ConfirmDelete <> 1
    THROW 50091, 'Abortado: pon @ConfirmDelete = 1 para confirmar la limpieza operativa.', 1;

DECLARE @TenantName NVARCHAR(200) =
    (SELECT Name FROM dbo.Tenant WHERE Id = @TenantId);
DECLARE @UsersBefore INT =
    (SELECT COUNT(*) FROM dbo.[User] WHERE TenantId = @TenantId);

PRINT N'Limpiando datos operativos del tenant: '
    + ISNULL(@TenantName, N'?') + N' (' + CONVERT(NVARCHAR(36), @TenantId) + N')';
PRINT N'Usuarios a conservar: ' + CONVERT(NVARCHAR(20), @UsersBefore);

BEGIN TRANSACTION;

/* --- Finanzas / caja (hijos primero) --- */
DELETE FROM dbo.CashMovement WHERE TenantId = @TenantId;
DELETE FROM dbo.CashAudit    WHERE TenantId = @TenantId;
DELETE FROM dbo.Payment      WHERE TenantId = @TenantId;
DELETE FROM dbo.Expense      WHERE TenantId = @TenantId;
DELETE FROM dbo.Charge       WHERE TenantId = @TenantId;
DELETE FROM dbo.CashSession  WHERE TenantId = @TenantId;
DELETE FROM dbo.AuditLog     WHERE TenantId = @TenantId;

/* --- Notificaciones / timeline / documentos --- */
DELETE FROM dbo.Notification  WHERE TenantId = @TenantId;
DELETE FROM dbo.TimelineEvent WHERE TenantId = @TenantId;
DELETE FROM dbo.Document      WHERE TenantId = @TenantId;

/* Branch se conserva; quitar referencia a foto operativa */
IF COL_LENGTH(N'dbo.Branch', N'PhotoUrl') IS NOT NULL
    UPDATE dbo.Branch SET PhotoUrl = NULL WHERE TenantId = @TenantId;

/* --- Personas / académico --- */
DELETE FROM dbo.StudentGuardian WHERE TenantId = @TenantId;
DELETE FROM dbo.Enrollment      WHERE TenantId = @TenantId;

/* Student.ClassroomId → Classroom */
IF COL_LENGTH(N'dbo.Student', N'ClassroomId') IS NOT NULL
    UPDATE dbo.Student SET ClassroomId = NULL WHERE TenantId = @TenantId;

DELETE FROM dbo.Student   WHERE TenantId = @TenantId;
DELETE FROM dbo.Guardian  WHERE TenantId = @TenantId;

/* Classroom.TeacherId → Teacher */
IF COL_LENGTH(N'dbo.Classroom', N'TeacherId') IS NOT NULL
    UPDATE dbo.Classroom SET TeacherId = NULL WHERE TenantId = @TenantId;

DELETE FROM dbo.Classroom WHERE TenantId = @TenantId;
DELETE FROM dbo.Teacher   WHERE TenantId = @TenantId;

/* --- Solo tokens de sesión / reset (NO borra dbo.User ni dbo.Tenant) --- */
DELETE rt
FROM dbo.RefreshToken rt
INNER JOIN dbo.[User] u ON u.Id = rt.UserId
WHERE u.TenantId = @TenantId;

DELETE prt
FROM dbo.PasswordResetToken prt
WHERE prt.TenantId = @TenantId;

/* --- Contadores operativos (matrículas, folios, etc.) --- */
IF OBJECT_ID(N'dbo.TenantSequence', N'U') IS NOT NULL
BEGIN
    UPDATE dbo.TenantSequence
    SET NextValue = 1,
        UpdatedAt = SYSUTCDATETIME()
    WHERE TenantId = @TenantId;
END

/* Salvaguarda: identidad intacta */
IF NOT EXISTS (SELECT 1 FROM dbo.Tenant WHERE Id = @TenantId)
    THROW 50092, 'Abortado: el Tenant desapareció (no debería ocurrir). ROLLBACK.', 1;

IF (SELECT COUNT(*) FROM dbo.[User] WHERE TenantId = @TenantId) <> @UsersBefore
    THROW 50093, 'Abortado: cambió el conteo de User (no debería ocurrir). ROLLBACK.', 1;

COMMIT TRANSACTION;

PRINT N'Limpieza operativa completada. Tenant y usuarios intactos.';

/* Resumen: operativas en 0; Tenant/User/Branch conservados */
SELECT N'Student' AS [Table], COUNT(*) AS RowsLeft FROM dbo.Student WHERE TenantId = @TenantId
UNION ALL SELECT N'Guardian', COUNT(*) FROM dbo.Guardian WHERE TenantId = @TenantId
UNION ALL SELECT N'Enrollment', COUNT(*) FROM dbo.Enrollment WHERE TenantId = @TenantId
UNION ALL SELECT N'Teacher', COUNT(*) FROM dbo.Teacher WHERE TenantId = @TenantId
UNION ALL SELECT N'Classroom', COUNT(*) FROM dbo.Classroom WHERE TenantId = @TenantId
UNION ALL SELECT N'Charge', COUNT(*) FROM dbo.Charge WHERE TenantId = @TenantId
UNION ALL SELECT N'Payment', COUNT(*) FROM dbo.Payment WHERE TenantId = @TenantId
UNION ALL SELECT N'CashSession', COUNT(*) FROM dbo.CashSession WHERE TenantId = @TenantId
UNION ALL SELECT N'Document', COUNT(*) FROM dbo.Document WHERE TenantId = @TenantId
UNION ALL SELECT N'Notification', COUNT(*) FROM dbo.Notification WHERE TenantId = @TenantId
UNION ALL SELECT N'Tenant (conservado)', COUNT(*) FROM dbo.Tenant WHERE Id = @TenantId
UNION ALL SELECT N'Branch (conservado)', COUNT(*) FROM dbo.Branch WHERE TenantId = @TenantId AND IsDeleted = 0
UNION ALL SELECT N'User (conservado)', COUNT(*) FROM dbo.[User] WHERE TenantId = @TenantId AND IsDeleted = 0
UNION ALL SELECT N'UserRole (conservado)', COUNT(*) FROM dbo.UserRole ur
           INNER JOIN dbo.[User] u ON u.Id = ur.UserId WHERE u.TenantId = @TenantId;
GO
