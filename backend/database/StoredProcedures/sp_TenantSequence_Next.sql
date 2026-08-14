/*
  SchoolCore â€” SQL Server 2022
  SP: sp_TenantSequence_Next
*/
USE db_a0b4b3_schoolcore;
GO
CREATE OR ALTER PROCEDURE dbo.sp_TenantSequence_Next
    @TenantId UNIQUEIDENTIFIER,
    @SequenceKey NVARCHAR(50),
    @Prefix NVARCHAR(20) = NULL,
    @PadLength INT = 4,
    @FormattedValue NVARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    DECLARE @Next BIGINT;
    BEGIN TRAN;
    IF NOT EXISTS (SELECT 1 FROM dbo.TenantSequence WITH (UPDLOCK, HOLDLOCK) WHERE TenantId = @TenantId AND SequenceKey = @SequenceKey)
        INSERT INTO dbo.TenantSequence (TenantId, SequenceKey, NextValue, Prefix) VALUES (@TenantId, @SequenceKey, 1, @Prefix);
    UPDATE dbo.TenantSequence
    SET @Next = NextValue, NextValue = NextValue + 1, Prefix = COALESCE(@Prefix, Prefix), UpdatedAt = SYSUTCDATETIME()
    WHERE TenantId = @TenantId AND SequenceKey = @SequenceKey;
    DECLARE @Pfx NVARCHAR(20) = COALESCE((SELECT Prefix FROM dbo.TenantSequence WHERE TenantId = @TenantId AND SequenceKey = @SequenceKey), N'');
    SET @FormattedValue = @Pfx + RIGHT(REPLICATE(N'0', @PadLength) + CAST(@Next AS NVARCHAR(20)), @PadLength);
    COMMIT;
END
GO

