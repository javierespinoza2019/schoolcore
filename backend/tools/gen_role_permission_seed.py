# Generates 019_CreateAndSeedRolePermission.sql
from pathlib import Path

ALL = ["view", "create", "edit", "delete", "export", "approve"]
RW = ["view", "create", "edit"]
RWD = ["view", "create", "edit", "delete"]
RO = ["view"]
rows: list[tuple[str, str, str]] = []


def add(rid: str, views: list[str], actions: list[str]) -> None:
    for v in views:
        for a in actions:
            rows.append((rid, v, a))


add("11111111-1111-1111-1111-111111111001", ["*"], ["*"])
add(
    "11111111-1111-1111-1111-111111111002",
    [
        "dashboard",
        "students",
        "parents",
        "teachers",
        "classrooms",
        "branches",
        "enrollments",
        "finance",
        "cash",
        "reports",
        "notifications",
    ],
    ALL,
)
add("11111111-1111-1111-1111-111111111003", ["dashboard"], RO)
add(
    "11111111-1111-1111-1111-111111111003",
    ["students", "parents", "teachers", "classrooms"],
    RWD,
)
add("11111111-1111-1111-1111-111111111003", ["enrollments"], RW)
add(
    "11111111-1111-1111-1111-111111111003",
    ["reports", "notifications", "settings"],
    RO,
)
add("11111111-1111-1111-1111-111111111004", ["dashboard", "students", "notifications"], RO)
add(
    "11111111-1111-1111-1111-111111111004",
    ["finance"],
    ["view", "create", "edit", "export", "approve"],
)
add("11111111-1111-1111-1111-111111111004", ["cash"], ALL)
add(
    "11111111-1111-1111-1111-111111111005",
    ["dashboard", "students", "cash", "notifications", "settings"],
    RO,
)
add("11111111-1111-1111-1111-111111111005", ["finance"], ALL)
add("11111111-1111-1111-1111-111111111005", ["reports"], ["view", "export"])
add("11111111-1111-1111-1111-111111111006", ["dashboard", "notifications"], RO)
add(
    "11111111-1111-1111-1111-111111111006",
    ["students", "parents", "enrollments"],
    RW,
)

vals = []
for i, (rid, v, a) in enumerate(rows):
    uid = f"aaaaaaaa-{i + 1:04d}-0001-0001-000000000001"
    vals.append(
        f"    (CONVERT(UNIQUEIDENTIFIER, '{uid}'), CONVERT(UNIQUEIDENTIFIER, '{rid}'), N'{v}', N'{a}')"
    )

out = Path(__file__).resolve().parents[1] / "database" / "Scripts" / "019_CreateAndSeedRolePermission.sql"
text = f"""/*
  SchoolCore — SQL Server 2022
  Script: 019_CreateAndSeedRolePermission.sql
  Tabla RolePermission + seed alineado a RolePermissionMatrix (MVP staff).
*/
USE db_a0b4b3_schoolcore;
GO

IF OBJECT_ID(N'dbo.RolePermission', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RolePermission
    (
        Id         UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_RolePermission PRIMARY KEY,
        RoleId     UNIQUEIDENTIFIER NOT NULL,
        ViewCode   NVARCHAR(50) NOT NULL,
        ActionCode NVARCHAR(20) NOT NULL,
        CreatedAt  DATETIME2(3) NOT NULL CONSTRAINT DF_RolePermission_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt  DATETIME2(3) NULL,
        CONSTRAINT FK_RolePermission_Role FOREIGN KEY (RoleId) REFERENCES dbo.Role (Id)
    );

    CREATE UNIQUE INDEX UX_RolePermission_Role_View_Action
        ON dbo.RolePermission (RoleId, ViewCode, ActionCode);
END
GO

DELETE FROM dbo.RolePermission
WHERE RoleId IN (
    CONVERT(UNIQUEIDENTIFIER, '11111111-1111-1111-1111-111111111001'),
    CONVERT(UNIQUEIDENTIFIER, '11111111-1111-1111-1111-111111111002'),
    CONVERT(UNIQUEIDENTIFIER, '11111111-1111-1111-1111-111111111003'),
    CONVERT(UNIQUEIDENTIFIER, '11111111-1111-1111-1111-111111111004'),
    CONVERT(UNIQUEIDENTIFIER, '11111111-1111-1111-1111-111111111005'),
    CONVERT(UNIQUEIDENTIFIER, '11111111-1111-1111-1111-111111111006')
);
GO

INSERT INTO dbo.RolePermission (Id, RoleId, ViewCode, ActionCode)
VALUES
{',\n'.join(vals)};
GO

IF NOT EXISTS (SELECT 1 FROM dbo.DatabaseVersion WHERE ScriptName = N'019_CreateAndSeedRolePermission.sql')
BEGIN
    INSERT INTO dbo.DatabaseVersion (ScriptName) VALUES (N'019_CreateAndSeedRolePermission.sql');
END
GO
"""
out.write_text(text, encoding="utf-8")
print(f"Wrote {len(rows)} rows to {out}")
