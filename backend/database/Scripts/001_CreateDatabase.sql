/*
  SchoolCore — SQL Server 2022
  Script: 001_CreateDatabase.sql
  Idempotent: creates database if missing.
*/
IF DB_ID(N'db_a0b4b3_schoolcore') IS NULL
BEGIN
    CREATE DATABASE db_a0b4b3_schoolcore;
END
GO

ALTER DATABASE db_a0b4b3_schoolcore SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;
GO
