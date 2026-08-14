# Generates SchoolCore MVP stored procedures (Phases 2-6)
$ErrorActionPreference = "Stop"
$spDir = "c:\Proyectos\AppFabric\SchoolCore\schoolcore\backend\database\StoredProcedures"

function Write-Sp([string]$name, [string]$body) {
  $header = @"
/*
  SchoolCore — SQL Server 2022
  SP: $name
*/
USE [SchoolCore];
GO

"@
  Set-Content -Path (Join-Path $spDir "$name.sql") -Value ($header + $body + "`r`nGO`r`n") -Encoding UTF8
}

# ===== Helper: standard soft-delete CRUD generator for simple entities =====
# (We'll write critical SPs explicitly below)

# --- TenantSequence ---
Write-Sp "sp_TenantSequence_Next" @"
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
"@

# --- Branch ---
Write-Sp "sp_Branch_List" @"
CREATE OR ALTER PROCEDURE dbo.sp_Branch_List
    @TenantId UNIQUEIDENTIFIER, @Page INT = 1, @PageSize INT = 50, @Search NVARCHAR(100) = NULL, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 100 SET @PageSize = 100;
    SELECT @TotalCount = COUNT(1) FROM dbo.Branch WHERE TenantId = @TenantId AND IsDeleted = 0
      AND (@Search IS NULL OR Name LIKE N'%' + @Search + N'%' OR Code LIKE N'%' + @Search + N'%');
    SELECT Id, TenantId, Name, Code, IsActive, Address, City, [State], PostalCode, Phone, Email, CreatedAt, UpdatedAt
    FROM dbo.Branch WHERE TenantId = @TenantId AND IsDeleted = 0
      AND (@Search IS NULL OR Name LIKE N'%' + @Search + N'%' OR Code LIKE N'%' + @Search + N'%')
    ORDER BY Name OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
"@
Write-Sp "sp_Branch_GetById" @"
CREATE OR ALTER PROCEDURE dbo.sp_Branch_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS BEGIN SET NOCOUNT ON;
    SELECT Id, TenantId, Name, Code, IsActive, Address, City, [State], PostalCode, Phone, Email, CreatedAt, UpdatedAt
    FROM dbo.Branch WHERE TenantId = @TenantId AND Id = @Id AND IsDeleted = 0;
END
"@
Write-Sp "sp_Branch_Create" @"
CREATE OR ALTER PROCEDURE dbo.sp_Branch_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @Name NVARCHAR(200), @Code NVARCHAR(50), @IsActive BIT = 1,
    @Address NVARCHAR(300)=NULL, @City NVARCHAR(100)=NULL, @State NVARCHAR(100)=NULL, @PostalCode NVARCHAR(20)=NULL,
    @Phone NVARCHAR(50)=NULL, @Email NVARCHAR(256)=NULL, @CreatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.Branch WHERE TenantId=@TenantId AND Code=@Code AND IsDeleted=0)
        THROW 51001, 'Branch code already exists for this tenant.', 1;
    INSERT INTO dbo.Branch (Id,TenantId,Name,Code,IsActive,Address,City,[State],PostalCode,Phone,Email,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@Name,@Code,@IsActive,@Address,@City,@State,@PostalCode,@Phone,@Email,SYSUTCDATETIME(),@CreatedBy);
    SELECT Id, TenantId, Name, Code, IsActive, Address, City, [State], PostalCode, Phone, Email, CreatedAt, UpdatedAt FROM dbo.Branch WHERE Id=@Id;
END
"@
Write-Sp "sp_Branch_Update" @"
CREATE OR ALTER PROCEDURE dbo.sp_Branch_Update
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @Name NVARCHAR(200), @Code NVARCHAR(50), @IsActive BIT,
    @Address NVARCHAR(300)=NULL, @City NVARCHAR(100)=NULL, @State NVARCHAR(100)=NULL, @PostalCode NVARCHAR(20)=NULL,
    @Phone NVARCHAR(50)=NULL, @Email NVARCHAR(256)=NULL, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.Branch WHERE TenantId=@TenantId AND Code=@Code AND Id<>@Id AND IsDeleted=0)
        THROW 51001, 'Branch code already exists for this tenant.', 1;
    UPDATE dbo.Branch SET Name=@Name,Code=@Code,IsActive=@IsActive,Address=@Address,City=@City,[State]=@State,
        PostalCode=@PostalCode,Phone=@Phone,Email=@Email,UpdatedAt=SYSUTCDATETIME(),UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'Branch not found.', 1;
    SELECT Id, TenantId, Name, Code, IsActive, Address, City, [State], PostalCode, Phone, Email, CreatedAt, UpdatedAt FROM dbo.Branch WHERE Id=@Id;
END
"@
Write-Sp "sp_Branch_SoftDelete" @"
CREATE OR ALTER PROCEDURE dbo.sp_Branch_SoftDelete @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    UPDATE dbo.Branch SET IsDeleted=1, IsActive=0, UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'Branch not found.', 1;
END
"@

Write-Host "Generated core SPs batch 1"
Get-ChildItem $spDir -Filter "sp_Branch*.sql" | Measure-Object | Select-Object -ExpandProperty Count
