# -*- coding: utf-8 -*-
"""Generate SchoolCore MVP stored procedures (Phases 2-6)."""
from pathlib import Path

SP_DIR = Path(r"c:\Proyectos\AppFabric\SchoolCore\schoolcore\backend\database\StoredProcedures")


def write_sp(name: str, body: str) -> None:
    content = f"""/*
  SchoolCore — SQL Server 2022
  SP: {name}
*/
USE [SchoolCore];
GO

{body.strip()}
GO
"""
    (SP_DIR / f"{name}.sql").write_text(content, encoding="utf-8")


def crud_list(entity: str, table: str, columns: str, search_cols: list[str] | None = None, extra_where: str = "") -> None:
    search = ""
    if search_cols:
        ors = " OR ".join([f"{c} LIKE N'%' + @Search + N'%'" for c in search_cols])
        search = f"AND (@Search IS NULL OR {ors})"
    write_sp(
        f"sp_{entity}_List",
        f"""
CREATE OR ALTER PROCEDURE dbo.sp_{entity}_List
    @TenantId UNIQUEIDENTIFIER,
    @Page INT = 1,
    @PageSize INT = 50,
    @Search NVARCHAR(100) = NULL,
    @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1;
    IF @PageSize < 1 SET @PageSize = 50;
    IF @PageSize > 100 SET @PageSize = 100;

    SELECT @TotalCount = COUNT(1)
    FROM dbo.[{table}]
    WHERE TenantId = @TenantId AND IsDeleted = 0
      {search}
      {extra_where};

    SELECT {columns}
    FROM dbo.[{table}]
    WHERE TenantId = @TenantId AND IsDeleted = 0
      {search}
      {extra_where}
    ORDER BY CreatedAt DESC
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
""",
    )


def crud_get(entity: str, table: str, columns: str) -> None:
    write_sp(
        f"sp_{entity}_GetById",
        f"""
CREATE OR ALTER PROCEDURE dbo.sp_{entity}_GetById
    @TenantId UNIQUEIDENTIFIER,
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT {columns}
    FROM dbo.[{table}]
    WHERE TenantId = @TenantId AND Id = @Id AND IsDeleted = 0;
END
""",
    )


def crud_soft_delete(entity: str, table: str) -> None:
    write_sp(
        f"sp_{entity}_SoftDelete",
        f"""
CREATE OR ALTER PROCEDURE dbo.sp_{entity}_SoftDelete
    @TenantId UNIQUEIDENTIFIER,
    @Id UNIQUEIDENTIFIER,
    @UpdatedBy UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.[{table}]
    SET IsDeleted = 1, UpdatedAt = SYSUTCDATETIME(), UpdatedBy = @UpdatedBy
    WHERE TenantId = @TenantId AND Id = @Id AND IsDeleted = 0;
    IF @@ROWCOUNT = 0 THROW 51004, '{entity} not found.', 1;
END
""",
    )


def main() -> None:
    # ===== SchoolCycle =====
    cols = "Id, TenantId, Name, StartDate, EndDate, IsActive, CreatedAt, UpdatedAt"
    crud_list("SchoolCycle", "SchoolCycle", cols, ["Name"])
    crud_get("SchoolCycle", "SchoolCycle", cols)
    crud_soft_delete("SchoolCycle", "SchoolCycle")
    write_sp(
        "sp_SchoolCycle_Create",
        """
CREATE OR ALTER PROCEDURE dbo.sp_SchoolCycle_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @Name NVARCHAR(200),
    @StartDate DATE, @EndDate DATE, @IsActive BIT = 0, @CreatedBy UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @IsActive = 1
        UPDATE dbo.SchoolCycle SET IsActive = 0, UpdatedAt = SYSUTCDATETIME() WHERE TenantId = @TenantId AND IsDeleted = 0 AND IsActive = 1;
    INSERT INTO dbo.SchoolCycle (Id, TenantId, Name, StartDate, EndDate, IsActive, CreatedAt, CreatedBy)
    VALUES (@Id, @TenantId, @Name, @StartDate, @EndDate, @IsActive, SYSUTCDATETIME(), @CreatedBy);
    SELECT Id, TenantId, Name, StartDate, EndDate, IsActive, CreatedAt, UpdatedAt FROM dbo.SchoolCycle WHERE Id = @Id;
END
""",
    )
    write_sp(
        "sp_SchoolCycle_Update",
        """
CREATE OR ALTER PROCEDURE dbo.sp_SchoolCycle_Update
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @Name NVARCHAR(200),
    @StartDate DATE, @EndDate DATE, @IsActive BIT, @UpdatedBy UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @IsActive = 1
        UPDATE dbo.SchoolCycle SET IsActive = 0, UpdatedAt = SYSUTCDATETIME(), UpdatedBy = @UpdatedBy
        WHERE TenantId = @TenantId AND IsDeleted = 0 AND IsActive = 1 AND Id <> @Id;
    UPDATE dbo.SchoolCycle
    SET Name = @Name, StartDate = @StartDate, EndDate = @EndDate, IsActive = @IsActive,
        UpdatedAt = SYSUTCDATETIME(), UpdatedBy = @UpdatedBy
    WHERE TenantId = @TenantId AND Id = @Id AND IsDeleted = 0;
    IF @@ROWCOUNT = 0 THROW 51004, 'SchoolCycle not found.', 1;
    SELECT Id, TenantId, Name, StartDate, EndDate, IsActive, CreatedAt, UpdatedAt FROM dbo.SchoolCycle WHERE Id = @Id;
END
""",
    )

    # ===== InstitutionSettings =====
    write_sp(
        "sp_InstitutionSettings_Get",
        """
CREATE OR ALTER PROCEDURE dbo.sp_InstitutionSettings_Get @TenantId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TenantId, DisplayName, LegalName, TaxId, Phone, Email, Website, Address, LogoUrl, PrimaryColor, UpdatedAt
    FROM dbo.InstitutionSettings WHERE TenantId = @TenantId;
END
""",
    )
    write_sp(
        "sp_InstitutionSettings_Upsert",
        """
CREATE OR ALTER PROCEDURE dbo.sp_InstitutionSettings_Upsert
    @TenantId UNIQUEIDENTIFIER, @DisplayName NVARCHAR(200), @LegalName NVARCHAR(300)=NULL, @TaxId NVARCHAR(50)=NULL,
    @Phone NVARCHAR(50)=NULL, @Email NVARCHAR(256)=NULL, @Website NVARCHAR(300)=NULL, @Address NVARCHAR(400)=NULL,
    @LogoUrl NVARCHAR(500)=NULL, @PrimaryColor NVARCHAR(20)=NULL, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.InstitutionSettings WHERE TenantId = @TenantId)
        UPDATE dbo.InstitutionSettings
        SET DisplayName=@DisplayName, LegalName=@LegalName, TaxId=@TaxId, Phone=@Phone, Email=@Email,
            Website=@Website, Address=@Address, LogoUrl=@LogoUrl, PrimaryColor=@PrimaryColor,
            UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
        WHERE TenantId=@TenantId;
    ELSE
        INSERT INTO dbo.InstitutionSettings (TenantId, DisplayName, LegalName, TaxId, Phone, Email, Website, Address, LogoUrl, PrimaryColor, UpdatedAt, UpdatedBy)
        VALUES (@TenantId, @DisplayName, @LegalName, @TaxId, @Phone, @Email, @Website, @Address, @LogoUrl, @PrimaryColor, SYSUTCDATETIME(), @UpdatedBy);
    SELECT TenantId, DisplayName, LegalName, TaxId, Phone, Email, Website, Address, LogoUrl, PrimaryColor, UpdatedAt
    FROM dbo.InstitutionSettings WHERE TenantId = @TenantId;
END
""",
    )

    # ===== EducationLevel =====
    el_cols = "Id, TenantId, Name, Code, GradeCount, SortOrder, IsActive, CreatedAt, UpdatedAt"
    crud_list("EducationLevel", "EducationLevel", el_cols, ["Name", "Code"])
    crud_get("EducationLevel", "EducationLevel", el_cols)
    crud_soft_delete("EducationLevel", "EducationLevel")
    write_sp(
        "sp_EducationLevel_Create",
        """
CREATE OR ALTER PROCEDURE dbo.sp_EducationLevel_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @Name NVARCHAR(100), @Code NVARCHAR(50),
    @GradeCount INT = 0, @SortOrder INT = 0, @IsActive BIT = 1, @CreatedBy UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.EducationLevel WHERE TenantId=@TenantId AND Code=@Code AND IsDeleted=0)
        THROW 51001, 'EducationLevel code already exists.', 1;
    INSERT INTO dbo.EducationLevel (Id,TenantId,Name,Code,GradeCount,SortOrder,IsActive,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@Name,@Code,@GradeCount,@SortOrder,@IsActive,SYSUTCDATETIME(),@CreatedBy);
    SELECT Id, TenantId, Name, Code, GradeCount, SortOrder, IsActive, CreatedAt, UpdatedAt FROM dbo.EducationLevel WHERE Id=@Id;
END
""",
    )
    write_sp(
        "sp_EducationLevel_Update",
        """
CREATE OR ALTER PROCEDURE dbo.sp_EducationLevel_Update
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @Name NVARCHAR(100), @Code NVARCHAR(50),
    @GradeCount INT, @SortOrder INT, @IsActive BIT, @UpdatedBy UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.EducationLevel WHERE TenantId=@TenantId AND Code=@Code AND Id<>@Id AND IsDeleted=0)
        THROW 51001, 'EducationLevel code already exists.', 1;
    UPDATE dbo.EducationLevel SET Name=@Name, Code=@Code, GradeCount=@GradeCount, SortOrder=@SortOrder, IsActive=@IsActive,
        UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'EducationLevel not found.', 1;
    SELECT Id, TenantId, Name, Code, GradeCount, SortOrder, IsActive, CreatedAt, UpdatedAt FROM dbo.EducationLevel WHERE Id=@Id;
END
""",
    )

    # ===== PaymentMethod =====
    pm_cols = "Id, TenantId, Name, Info, IsActive, SortOrder, CreatedAt, UpdatedAt"
    crud_list("PaymentMethod", "PaymentMethod", pm_cols, ["Name"])
    crud_get("PaymentMethod", "PaymentMethod", pm_cols)
    crud_soft_delete("PaymentMethod", "PaymentMethod")
    write_sp(
        "sp_PaymentMethod_Create",
        """
CREATE OR ALTER PROCEDURE dbo.sp_PaymentMethod_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @Name NVARCHAR(150), @Info NVARCHAR(500)=NULL,
    @IsActive BIT=1, @SortOrder INT=0, @CreatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.PaymentMethod (Id,TenantId,Name,Info,IsActive,SortOrder,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@Name,@Info,@IsActive,@SortOrder,SYSUTCDATETIME(),@CreatedBy);
    SELECT Id, TenantId, Name, Info, IsActive, SortOrder, CreatedAt, UpdatedAt FROM dbo.PaymentMethod WHERE Id=@Id;
END
""",
    )
    write_sp(
        "sp_PaymentMethod_Update",
        """
CREATE OR ALTER PROCEDURE dbo.sp_PaymentMethod_Update
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @Name NVARCHAR(150), @Info NVARCHAR(500)=NULL,
    @IsActive BIT, @SortOrder INT, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.PaymentMethod SET Name=@Name, Info=@Info, IsActive=@IsActive, SortOrder=@SortOrder,
        UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'PaymentMethod not found.', 1;
    SELECT Id, TenantId, Name, Info, IsActive, SortOrder, CreatedAt, UpdatedAt FROM dbo.PaymentMethod WHERE Id=@Id;
END
""",
    )

    # ===== PaymentConcept =====
    write_sp(
        "sp_PaymentConcept_List",
        """
CREATE OR ALTER PROCEDURE dbo.sp_PaymentConcept_List
    @TenantId UNIQUEIDENTIFIER, @Page INT=1, @PageSize INT=50, @Search NVARCHAR(100)=NULL, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 100 SET @PageSize = 100;
    SELECT @TotalCount = COUNT(1) FROM dbo.PaymentConcept
    WHERE TenantId=@TenantId AND IsDeleted=0 AND (@Search IS NULL OR Name LIKE N'%'+@Search+N'%');
    SELECT Id, TenantId, Name, ConceptType, DefaultAmount, DifferentiatedByLevel, IsActive, CreatedAt, UpdatedAt
    FROM dbo.PaymentConcept
    WHERE TenantId=@TenantId AND IsDeleted=0 AND (@Search IS NULL OR Name LIKE N'%'+@Search+N'%')
    ORDER BY Name OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END
""",
    )
    write_sp(
        "sp_PaymentConcept_GetById",
        """
CREATE OR ALTER PROCEDURE dbo.sp_PaymentConcept_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, Name, ConceptType, DefaultAmount, DifferentiatedByLevel, IsActive, CreatedAt, UpdatedAt
    FROM dbo.PaymentConcept WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    SELECT a.Id, a.PaymentConceptId, a.EducationLevelId, a.Amount, l.Name AS EducationLevelName
    FROM dbo.PaymentConceptAmount a
    INNER JOIN dbo.EducationLevel l ON l.Id = a.EducationLevelId
    WHERE a.TenantId=@TenantId AND a.PaymentConceptId=@Id;
END
""",
    )
    write_sp(
        "sp_PaymentConcept_Create",
        """
CREATE OR ALTER PROCEDURE dbo.sp_PaymentConcept_Create
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @Name NVARCHAR(200), @ConceptType NVARCHAR(50),
    @DefaultAmount DECIMAL(18,2), @DifferentiatedByLevel BIT=0, @IsActive BIT=1, @CreatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.PaymentConcept (Id,TenantId,Name,ConceptType,DefaultAmount,DifferentiatedByLevel,IsActive,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@Name,@ConceptType,@DefaultAmount,@DifferentiatedByLevel,@IsActive,SYSUTCDATETIME(),@CreatedBy);
    SELECT Id, TenantId, Name, ConceptType, DefaultAmount, DifferentiatedByLevel, IsActive, CreatedAt, UpdatedAt FROM dbo.PaymentConcept WHERE Id=@Id;
END
""",
    )
    write_sp(
        "sp_PaymentConcept_Update",
        """
CREATE OR ALTER PROCEDURE dbo.sp_PaymentConcept_Update
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @Name NVARCHAR(200), @ConceptType NVARCHAR(50),
    @DefaultAmount DECIMAL(18,2), @DifferentiatedByLevel BIT, @IsActive BIT, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.PaymentConcept SET Name=@Name, ConceptType=@ConceptType, DefaultAmount=@DefaultAmount,
        DifferentiatedByLevel=@DifferentiatedByLevel, IsActive=@IsActive, UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'PaymentConcept not found.', 1;
    SELECT Id, TenantId, Name, ConceptType, DefaultAmount, DifferentiatedByLevel, IsActive, CreatedAt, UpdatedAt FROM dbo.PaymentConcept WHERE Id=@Id;
END
""",
    )
    write_sp(
        "sp_PaymentConcept_SoftDelete",
        """
CREATE OR ALTER PROCEDURE dbo.sp_PaymentConcept_SoftDelete @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    UPDATE dbo.PaymentConcept SET IsDeleted=1, IsActive=0, UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'PaymentConcept not found.', 1;
END
""",
    )
    write_sp(
        "sp_PaymentConcept_SetAmounts",
        """
CREATE OR ALTER PROCEDURE dbo.sp_PaymentConcept_SetAmounts
    @TenantId UNIQUEIDENTIFIER, @PaymentConceptId UNIQUEIDENTIFIER, @AmountsJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.PaymentConcept WHERE TenantId=@TenantId AND Id=@PaymentConceptId AND IsDeleted=0)
        THROW 51004, 'PaymentConcept not found.', 1;
    DELETE FROM dbo.PaymentConceptAmount WHERE TenantId=@TenantId AND PaymentConceptId=@PaymentConceptId;
    INSERT INTO dbo.PaymentConceptAmount (Id, TenantId, PaymentConceptId, EducationLevelId, Amount)
    SELECT NEWID(), @TenantId, @PaymentConceptId, EducationLevelId, Amount
    FROM OPENJSON(@AmountsJson)
    WITH (EducationLevelId UNIQUEIDENTIFIER '$.educationLevelId', Amount DECIMAL(18,2) '$.amount');
    SELECT a.Id, a.PaymentConceptId, a.EducationLevelId, a.Amount, l.Name AS EducationLevelName
    FROM dbo.PaymentConceptAmount a
    INNER JOIN dbo.EducationLevel l ON l.Id = a.EducationLevelId
    WHERE a.TenantId=@TenantId AND a.PaymentConceptId=@PaymentConceptId;
END
""",
    )

    # ===== Staff User =====
    write_sp(
        "sp_User_ListStaff",
        """
CREATE OR ALTER PROCEDURE dbo.sp_User_ListStaff
    @TenantId UNIQUEIDENTIFIER, @Page INT=1, @PageSize INT=50, @Search NVARCHAR(100)=NULL, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 SET @PageSize = 50; IF @PageSize > 100 SET @PageSize = 100;

    SELECT @TotalCount = COUNT(1) FROM dbo.[User] u
    WHERE u.TenantId=@TenantId AND u.IsDeleted=0
      AND (@Search IS NULL OR u.Email LIKE N'%'+@Search+N'%' OR u.FirstName LIKE N'%'+@Search+N'%' OR u.LastName LIKE N'%'+@Search+N'%');

    ;WITH PageUsers AS (
        SELECT u.Id, u.TenantId, u.Email, u.FirstName, u.LastName, u.IsActive, u.LastLoginAt, u.CreatedAt, u.UpdatedAt
        FROM dbo.[User] u
        WHERE u.TenantId=@TenantId AND u.IsDeleted=0
          AND (@Search IS NULL OR u.Email LIKE N'%'+@Search+N'%' OR u.FirstName LIKE N'%'+@Search+N'%' OR u.LastName LIKE N'%'+@Search+N'%')
        ORDER BY u.LastName, u.FirstName
        OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY
    )
    SELECT Id, TenantId, Email, FirstName, LastName, IsActive, LastLoginAt, CreatedAt, UpdatedAt
    FROM PageUsers;

    ;WITH PageUsers AS (
        SELECT u.Id
        FROM dbo.[User] u
        WHERE u.TenantId=@TenantId AND u.IsDeleted=0
          AND (@Search IS NULL OR u.Email LIKE N'%'+@Search+N'%' OR u.FirstName LIKE N'%'+@Search+N'%' OR u.LastName LIKE N'%'+@Search+N'%')
        ORDER BY u.LastName, u.FirstName
        OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY
    )
    SELECT pu.Id AS UserId, r.Id AS RoleId, r.Code AS RoleCode, r.Name AS RoleName
    FROM PageUsers pu
    INNER JOIN dbo.UserRole ur ON ur.UserId = pu.Id
    INNER JOIN dbo.Role r ON r.Id = ur.RoleId;

    ;WITH PageUsers AS (
        SELECT u.Id
        FROM dbo.[User] u
        WHERE u.TenantId=@TenantId AND u.IsDeleted=0
          AND (@Search IS NULL OR u.Email LIKE N'%'+@Search+N'%' OR u.FirstName LIKE N'%'+@Search+N'%' OR u.LastName LIKE N'%'+@Search+N'%')
        ORDER BY u.LastName, u.FirstName
        OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS ONLY
    )
    SELECT pu.Id AS UserId, ub.BranchId, b.Name AS BranchName, b.Code AS BranchCode
    FROM PageUsers pu
    INNER JOIN dbo.UserBranch ub ON ub.UserId = pu.Id
    INNER JOIN dbo.Branch b ON b.Id = ub.BranchId AND b.IsDeleted=0 AND b.TenantId=@TenantId;
END
""",
    )
    write_sp(
        "sp_User_GetStaffById",
        """
CREATE OR ALTER PROCEDURE dbo.sp_User_GetStaffById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.Id, u.TenantId, u.Email, u.FirstName, u.LastName, u.IsActive, u.LastLoginAt, u.CreatedAt, u.UpdatedAt
    FROM dbo.[User] u WHERE u.TenantId=@TenantId AND u.Id=@Id AND u.IsDeleted=0;
    SELECT r.Id AS RoleId, r.Code AS RoleCode, r.Name AS RoleName
    FROM dbo.UserRole ur INNER JOIN dbo.Role r ON r.Id = ur.RoleId WHERE ur.UserId=@Id;
    SELECT ub.BranchId, b.Name AS BranchName, b.Code AS BranchCode
    FROM dbo.UserBranch ub INNER JOIN dbo.Branch b ON b.Id = ub.BranchId AND b.IsDeleted=0
    WHERE ub.UserId=@Id AND b.TenantId=@TenantId;
END
""",
    )
    write_sp(
        "sp_User_CreateStaff",
        """
CREATE OR ALTER PROCEDURE dbo.sp_User_CreateStaff
    @Id UNIQUEIDENTIFIER, @TenantId UNIQUEIDENTIFIER, @Email NVARCHAR(256), @PasswordHash NVARCHAR(500),
    @FirstName NVARCHAR(100), @LastName NVARCHAR(100), @IsActive BIT=1, @CreatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.[User] WHERE TenantId=@TenantId AND Email=@Email AND IsDeleted=0)
        THROW 51001, 'Email already exists for this tenant.', 1;
    INSERT INTO dbo.[User] (Id,TenantId,Email,PasswordHash,FirstName,LastName,IsActive,CreatedAt,CreatedBy)
    VALUES (@Id,@TenantId,@Email,@PasswordHash,@FirstName,@LastName,@IsActive,SYSUTCDATETIME(),@CreatedBy);
    SELECT Id, TenantId, Email, FirstName, LastName, IsActive, LastLoginAt, CreatedAt, UpdatedAt FROM dbo.[User] WHERE Id=@Id;
END
""",
    )
    write_sp(
        "sp_User_UpdateStaff",
        """
CREATE OR ALTER PROCEDURE dbo.sp_User_UpdateStaff
    @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @Email NVARCHAR(256), @FirstName NVARCHAR(100),
    @LastName NVARCHAR(100), @IsActive BIT, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.[User] WHERE TenantId=@TenantId AND Email=@Email AND Id<>@Id AND IsDeleted=0)
        THROW 51001, 'Email already exists for this tenant.', 1;
    UPDATE dbo.[User] SET Email=@Email, FirstName=@FirstName, LastName=@LastName, IsActive=@IsActive,
        UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'User not found.', 1;
    SELECT Id, TenantId, Email, FirstName, LastName, IsActive, LastLoginAt, CreatedAt, UpdatedAt FROM dbo.[User] WHERE Id=@Id;
END
""",
    )
    write_sp(
        "sp_User_SoftDeleteStaff",
        """
CREATE OR ALTER PROCEDURE dbo.sp_User_SoftDeleteStaff @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER, @UpdatedBy UNIQUEIDENTIFIER=NULL
AS BEGIN SET NOCOUNT ON;
    UPDATE dbo.[User] SET IsDeleted=1, IsActive=0, UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@UpdatedBy
    WHERE TenantId=@TenantId AND Id=@Id AND IsDeleted=0;
    IF @@ROWCOUNT=0 THROW 51004, 'User not found.', 1;
    -- Invalidate refresh tokens
    UPDATE dbo.RefreshToken SET RevokedAt = SYSUTCDATETIME() WHERE TenantId=@TenantId AND UserId=@Id AND RevokedAt IS NULL;
END
""",
    )
    write_sp(
        "sp_User_SetRoles",
        """
CREATE OR ALTER PROCEDURE dbo.sp_User_SetRoles
    @TenantId UNIQUEIDENTIFIER, @UserId UNIQUEIDENTIFIER, @RoleCodesCsv NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.[User] WHERE TenantId=@TenantId AND Id=@UserId AND IsDeleted=0)
        THROW 51004, 'User not found.', 1;
    DELETE FROM dbo.UserRole WHERE UserId=@UserId;
    INSERT INTO dbo.UserRole (UserId, RoleId)
    SELECT @UserId, r.Id
    FROM STRING_SPLIT(@RoleCodesCsv, ',') s
    INNER JOIN dbo.Role r ON r.Code = LTRIM(RTRIM(s.value));
    SELECT r.Id AS RoleId, r.Code AS RoleCode, r.Name AS RoleName
    FROM dbo.UserRole ur INNER JOIN dbo.Role r ON r.Id = ur.RoleId WHERE ur.UserId=@UserId;
END
""",
    )
    write_sp(
        "sp_User_SetBranches",
        """
CREATE OR ALTER PROCEDURE dbo.sp_User_SetBranches
    @TenantId UNIQUEIDENTIFIER, @UserId UNIQUEIDENTIFIER, @BranchIdsCsv NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.[User] WHERE TenantId=@TenantId AND Id=@UserId AND IsDeleted=0)
        THROW 51004, 'User not found.', 1;
    DELETE FROM dbo.UserBranch WHERE UserId=@UserId;
    INSERT INTO dbo.UserBranch (UserId, BranchId)
    SELECT @UserId, TRY_CONVERT(UNIQUEIDENTIFIER, LTRIM(RTRIM(s.value)))
    FROM STRING_SPLIT(@BranchIdsCsv, ',') s
    WHERE TRY_CONVERT(UNIQUEIDENTIFIER, LTRIM(RTRIM(s.value))) IS NOT NULL
      AND EXISTS (SELECT 1 FROM dbo.Branch b WHERE b.Id = TRY_CONVERT(UNIQUEIDENTIFIER, LTRIM(RTRIM(s.value))) AND b.TenantId=@TenantId AND b.IsDeleted=0);
    SELECT ub.BranchId, b.Name AS BranchName, b.Code AS BranchCode
    FROM dbo.UserBranch ub INNER JOIN dbo.Branch b ON b.Id = ub.BranchId WHERE ub.UserId=@UserId;
END
""",
    )
    write_sp(
        "sp_Role_List",
        """
CREATE OR ALTER PROCEDURE dbo.sp_Role_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Code, Name, IsSystem FROM dbo.Role ORDER BY Name;
END
""",
    )

    # ===== EmailTemplate =====
    write_sp(
        "sp_EmailTemplate_List",
        """
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
""",
    )
    write_sp(
        "sp_EmailTemplate_GetById",
        """
CREATE OR ALTER PROCEDURE dbo.sp_EmailTemplate_GetById @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, TenantId, TemplateKey, Culture, Subject, HtmlBody, LogoUrl, PrimaryColor, IsActive, CreatedAt, UpdatedAt
    FROM dbo.EmailTemplate WHERE Id=@Id AND (TenantId IS NULL OR TenantId=@TenantId);
END
""",
    )
    write_sp(
        "sp_EmailTemplate_UpsertTenant",
        """
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
""",
    )
    write_sp(
        "sp_EmailTemplate_Deactivate",
        """
CREATE OR ALTER PROCEDURE dbo.sp_EmailTemplate_Deactivate @TenantId UNIQUEIDENTIFIER, @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.EmailTemplate SET IsActive=0, UpdatedAt=SYSUTCDATETIME()
    WHERE Id=@Id AND TenantId=@TenantId;
    IF @@ROWCOUNT=0 THROW 51004, 'EmailTemplate not found or not tenant-owned.', 1;
END
""",
    )

    # ===== FeatureFlag =====
    write_sp(
        "sp_FeatureFlag_ListForTenant",
        """
CREATE OR ALTER PROCEDURE dbo.sp_FeatureFlag_ListForTenant @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    ;WITH Keys AS (
        SELECT DISTINCT FeatureKey FROM dbo.FeatureFlag
    )
    SELECT k.FeatureKey,
           CAST(COALESCE(b.IsEnabled, t.IsEnabled, g.IsEnabled, 0) AS BIT) AS IsEnabled,
           CASE WHEN b.Id IS NOT NULL THEN N'Branch' WHEN t.Id IS NOT NULL THEN N'Tenant' WHEN g.Id IS NOT NULL THEN N'Global' ELSE N'None' END AS ResolvedFrom
    FROM Keys k
    LEFT JOIN dbo.FeatureFlag g ON g.FeatureKey=k.FeatureKey AND g.ScopeType=N'Global' AND g.TenantId IS NULL AND g.BranchId IS NULL
    LEFT JOIN dbo.FeatureFlag t ON t.FeatureKey=k.FeatureKey AND t.ScopeType=N'Tenant' AND t.TenantId=@TenantId AND t.BranchId IS NULL
    LEFT JOIN dbo.FeatureFlag b ON b.FeatureKey=k.FeatureKey AND b.ScopeType=N'Branch' AND b.TenantId=@TenantId AND b.BranchId=@BranchId
    ORDER BY k.FeatureKey;
END
""",
    )
    write_sp(
        "sp_FeatureFlag_SetTenant",
        """
CREATE OR ALTER PROCEDURE dbo.sp_FeatureFlag_SetTenant
    @TenantId UNIQUEIDENTIFIER, @FeatureKey NVARCHAR(100), @IsEnabled BIT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Id UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM dbo.FeatureFlag WHERE FeatureKey=@FeatureKey AND ScopeType=N'Tenant' AND TenantId=@TenantId AND BranchId IS NULL);
    IF @Id IS NULL
        INSERT INTO dbo.FeatureFlag (Id, FeatureKey, ScopeType, TenantId, BranchId, IsEnabled, CreatedAt)
        VALUES (NEWID(), @FeatureKey, N'Tenant', @TenantId, NULL, @IsEnabled, SYSUTCDATETIME());
    ELSE
        UPDATE dbo.FeatureFlag SET IsEnabled=@IsEnabled, UpdatedAt=SYSUTCDATETIME() WHERE Id=@Id;
    EXEC dbo.sp_FeatureFlag_Resolve @TenantId=@TenantId, @BranchId=NULL, @FeatureKey=@FeatureKey;
END
""",
    )
    write_sp(
        "sp_FeatureFlag_SetBranch",
        """
CREATE OR ALTER PROCEDURE dbo.sp_FeatureFlag_SetBranch
    @TenantId UNIQUEIDENTIFIER, @BranchId UNIQUEIDENTIFIER, @FeatureKey NVARCHAR(100), @IsEnabled BIT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.Branch WHERE Id=@BranchId AND TenantId=@TenantId AND IsDeleted=0)
        THROW 51004, 'Branch not found.', 1;
    DECLARE @Id UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM dbo.FeatureFlag WHERE FeatureKey=@FeatureKey AND ScopeType=N'Branch' AND TenantId=@TenantId AND BranchId=@BranchId);
    IF @Id IS NULL
        INSERT INTO dbo.FeatureFlag (Id, FeatureKey, ScopeType, TenantId, BranchId, IsEnabled, CreatedAt)
        VALUES (NEWID(), @FeatureKey, N'Branch', @TenantId, @BranchId, @IsEnabled, SYSUTCDATETIME());
    ELSE
        UPDATE dbo.FeatureFlag SET IsEnabled=@IsEnabled, UpdatedAt=SYSUTCDATETIME() WHERE Id=@Id;
    EXEC dbo.sp_FeatureFlag_Resolve @TenantId=@TenantId, @BranchId=@BranchId, @FeatureKey=@FeatureKey;
END
""",
    )

    print("Phase 2 SPs done")
    print("count=", len(list(SP_DIR.glob("sp_*.sql"))))


if __name__ == "__main__":
    main()
