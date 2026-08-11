-- Run once per SQL Server instance (Integrated Security / Windows auth).
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'IIS APPPOOL\TestingView')
    CREATE LOGIN [IIS APPPOOL\TestingView] FROM WINDOWS;
GO
USE TestingView;
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'IIS APPPOOL\TestingView')
    CREATE USER [IIS APPPOOL\TestingView] FOR LOGIN [IIS APPPOOL\TestingView];
GO
ALTER ROLE db_datareader ADD MEMBER [IIS APPPOOL\TestingView];
ALTER ROLE db_datawriter ADD MEMBER [IIS APPPOOL\TestingView];
GRANT EXECUTE TO [IIS APPPOOL\TestingView];
GO
