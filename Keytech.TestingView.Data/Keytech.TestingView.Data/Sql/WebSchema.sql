/****** Web schema for TestingView.com website ******/
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'Web')
    EXEC('CREATE SCHEMA [Web]');
GO

IF OBJECT_ID(N'[Web].[ExternalLogins]', N'U') IS NULL
BEGIN
    CREATE TABLE [Web].[ExternalLogins](
        [ExternalLoginId] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Web_ExternalLogins_Id] DEFAULT NEWSEQUENTIALID(),
        [UserId] UNIQUEIDENTIFIER NOT NULL,
        [Provider] NVARCHAR(64) NOT NULL,
        [ProviderSubject] NVARCHAR(256) NOT NULL,
        [Email] NVARCHAR(320) NULL,
        [DisplayName] NVARCHAR(256) NULL,
        [PictureUrl] NVARCHAR(2048) NULL,
        [CreatedAt] DATETIMEOFFSET NOT NULL CONSTRAINT [DF_Web_ExternalLogins_CreatedAt] DEFAULT SYSDATETIMEOFFSET(),
        [UpdatedAt] DATETIMEOFFSET NOT NULL CONSTRAINT [DF_Web_ExternalLogins_UpdatedAt] DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT [PK_Web_ExternalLogins] PRIMARY KEY CLUSTERED ([ExternalLoginId]),
        CONSTRAINT [FK_Web_ExternalLogins_Users] FOREIGN KEY ([UserId]) REFERENCES [Administration].[Users]([UserId])
    );
    CREATE UNIQUE INDEX [UX_Web_ExternalLogins_ProviderSubject] ON [Web].[ExternalLogins]([Provider], [ProviderSubject]);
    CREATE INDEX [IX_Web_ExternalLogins_UserId] ON [Web].[ExternalLogins]([UserId]);
END
GO

-- Existing deployments may have been created without column defaults.
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Web_ExternalLogins_CreatedAt')
    ALTER TABLE [Web].[ExternalLogins] ADD CONSTRAINT [DF_Web_ExternalLogins_CreatedAt] DEFAULT (SYSDATETIMEOFFSET()) FOR [CreatedAt];
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Web_ExternalLogins_UpdatedAt')
    ALTER TABLE [Web].[ExternalLogins] ADD CONSTRAINT [DF_Web_ExternalLogins_UpdatedAt] DEFAULT (SYSDATETIMEOFFSET()) FOR [UpdatedAt];
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Web_ExternalLogins_Id')
    ALTER TABLE [Web].[ExternalLogins] ADD CONSTRAINT [DF_Web_ExternalLogins_Id] DEFAULT (NEWSEQUENTIALID()) FOR [ExternalLoginId];
GO

IF OBJECT_ID(N'[Web].[StripeCustomers]', N'U') IS NULL
BEGIN
    CREATE TABLE [Web].[StripeCustomers](
        [StripeCustomerId] NVARCHAR(128) NOT NULL,
        [UserId] UNIQUEIDENTIFIER NOT NULL,
        [Email] NVARCHAR(320) NULL,
        [CreatedAt] DATETIMEOFFSET NOT NULL CONSTRAINT [DF_Web_StripeCustomers_CreatedAt] DEFAULT SYSDATETIMEOFFSET(),
        [UpdatedAt] DATETIMEOFFSET NOT NULL CONSTRAINT [DF_Web_StripeCustomers_UpdatedAt] DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT [PK_Web_StripeCustomers] PRIMARY KEY CLUSTERED ([StripeCustomerId]),
        CONSTRAINT [FK_Web_StripeCustomers_Users] FOREIGN KEY ([UserId]) REFERENCES [Administration].[Users]([UserId])
    );
    CREATE UNIQUE INDEX [UX_Web_StripeCustomers_UserId] ON [Web].[StripeCustomers]([UserId]);
END
GO

IF OBJECT_ID(N'[Web].[StripeSubscriptions]', N'U') IS NULL
BEGIN
    CREATE TABLE [Web].[StripeSubscriptions](
        [StripeSubscriptionId] NVARCHAR(128) NOT NULL,
        [UserId] UNIQUEIDENTIFIER NOT NULL,
        [StripeCustomerId] NVARCHAR(128) NOT NULL,
        [PlanId] UNIQUEIDENTIFIER NOT NULL,
        [Status] NVARCHAR(64) NOT NULL,
        [CurrentPeriodEnd] DATETIMEOFFSET NULL,
        [CancelAtPeriodEnd] BIT NOT NULL CONSTRAINT [DF_Web_StripeSubscriptions_CancelAtPeriodEnd] DEFAULT 0,
        [CreatedAt] DATETIMEOFFSET NOT NULL CONSTRAINT [DF_Web_StripeSubscriptions_CreatedAt] DEFAULT SYSDATETIMEOFFSET(),
        [UpdatedAt] DATETIMEOFFSET NOT NULL CONSTRAINT [DF_Web_StripeSubscriptions_UpdatedAt] DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT [PK_Web_StripeSubscriptions] PRIMARY KEY CLUSTERED ([StripeSubscriptionId]),
        CONSTRAINT [FK_Web_StripeSubscriptions_Users] FOREIGN KEY ([UserId]) REFERENCES [Administration].[Users]([UserId]),
        CONSTRAINT [FK_Web_StripeSubscriptions_Plans] FOREIGN KEY ([PlanId]) REFERENCES [Administration].[Plans]([PlanId])
    );
    CREATE INDEX [IX_Web_StripeSubscriptions_UserId] ON [Web].[StripeSubscriptions]([UserId]);
END
GO

IF OBJECT_ID(N'[Web].[StripeEvents]', N'U') IS NULL
BEGIN
    CREATE TABLE [Web].[StripeEvents](
        [StripeEventId] NVARCHAR(128) NOT NULL,
        [EventType] NVARCHAR(128) NOT NULL,
        [ProcessedAt] DATETIMEOFFSET NOT NULL CONSTRAINT [DF_Web_StripeEvents_ProcessedAt] DEFAULT SYSDATETIMEOFFSET(),
        [PayloadHash] NVARCHAR(128) NULL,
        CONSTRAINT [PK_Web_StripeEvents] PRIMARY KEY CLUSTERED ([StripeEventId])
    );
END
GO

IF OBJECT_ID(N'[Web].[AccountAuditEvents]', N'U') IS NULL
BEGIN
    CREATE TABLE [Web].[AccountAuditEvents](
        [AccountAuditEventId] BIGINT IDENTITY(1,1) NOT NULL,
        [UserId] UNIQUEIDENTIFIER NULL,
        [EventType] NVARCHAR(128) NOT NULL,
        [Details] NVARCHAR(MAX) NULL,
        [CreatedAt] DATETIMEOFFSET NOT NULL CONSTRAINT [DF_Web_AccountAuditEvents_CreatedAt] DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT [PK_Web_AccountAuditEvents] PRIMARY KEY CLUSTERED ([AccountAuditEventId])
    );
    CREATE INDEX [IX_Web_AccountAuditEvents_UserId] ON [Web].[AccountAuditEvents]([UserId]);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Web_AccountAuditEvents_CreatedAt')
    ALTER TABLE [Web].[AccountAuditEvents] ADD CONSTRAINT [DF_Web_AccountAuditEvents_CreatedAt] DEFAULT (SYSDATETIMEOFFSET()) FOR [CreatedAt];
GO

CREATE OR ALTER PROCEDURE [Web].[GetExternalLoginByProvider]
    @Provider NVARCHAR(64),
    @ProviderSubject NVARCHAR(256)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ExternalLoginId, UserId, Provider, ProviderSubject, Email, DisplayName, PictureUrl, CreatedAt, UpdatedAt
    FROM [Web].ExternalLogins
    WHERE Provider = @Provider AND ProviderSubject = @ProviderSubject;
END
GO

CREATE OR ALTER PROCEDURE [Web].[UpsertExternalLogin]
    @UserId UNIQUEIDENTIFIER,
    @Provider NVARCHAR(64),
    @ProviderSubject NVARCHAR(256),
    @Email NVARCHAR(320) = NULL,
    @DisplayName NVARCHAR(256) = NULL,
    @PictureUrl NVARCHAR(2048) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @now DATETIMEOFFSET = SYSDATETIMEOFFSET();
    MERGE [Web].ExternalLogins AS T
    USING (SELECT @UserId AS UserId, @Provider AS Provider, @ProviderSubject AS ProviderSubject) AS S
    ON T.Provider = S.Provider AND T.ProviderSubject = S.ProviderSubject
    WHEN MATCHED THEN
        UPDATE SET UserId = @UserId, Email = @Email, DisplayName = @DisplayName, PictureUrl = @PictureUrl, UpdatedAt = @now
    WHEN NOT MATCHED THEN
        INSERT (UserId, Provider, ProviderSubject, Email, DisplayName, PictureUrl, CreatedAt, UpdatedAt)
        VALUES (@UserId, @Provider, @ProviderSubject, @Email, @DisplayName, @PictureUrl, @now, @now);
END
GO

CREATE OR ALTER PROCEDURE [Web].[UpsertStripeCustomer]
    @StripeCustomerId NVARCHAR(128),
    @UserId UNIQUEIDENTIFIER,
    @Email NVARCHAR(320) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @now DATETIMEOFFSET = SYSDATETIMEOFFSET();
    MERGE [Web].StripeCustomers AS T
    USING (SELECT @StripeCustomerId AS StripeCustomerId) AS S ON T.StripeCustomerId = S.StripeCustomerId
    WHEN MATCHED THEN UPDATE SET UserId = @UserId, Email = @Email, UpdatedAt = @now
    WHEN NOT MATCHED THEN INSERT (StripeCustomerId, UserId, Email, CreatedAt, UpdatedAt)
        VALUES (@StripeCustomerId, @UserId, @Email, @now, @now);
END
GO

CREATE OR ALTER PROCEDURE [Web].[GetStripeCustomerByUserId]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT StripeCustomerId, UserId, Email, CreatedAt, UpdatedAt FROM [Web].StripeCustomers WHERE UserId = @UserId;
END
GO

CREATE OR ALTER PROCEDURE [Web].[UpsertStripeSubscription]
    @StripeSubscriptionId NVARCHAR(128),
    @UserId UNIQUEIDENTIFIER,
    @StripeCustomerId NVARCHAR(128),
    @PlanId UNIQUEIDENTIFIER,
    @Status NVARCHAR(64),
    @CurrentPeriodEnd DATETIMEOFFSET = NULL,
    @CancelAtPeriodEnd BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @now DATETIMEOFFSET = SYSDATETIMEOFFSET();
    MERGE [Web].StripeSubscriptions AS T
    USING (SELECT @StripeSubscriptionId AS StripeSubscriptionId) AS S ON T.StripeSubscriptionId = S.StripeSubscriptionId
    WHEN MATCHED THEN
        UPDATE SET UserId = @UserId, StripeCustomerId = @StripeCustomerId, PlanId = @PlanId, Status = @Status,
            CurrentPeriodEnd = @CurrentPeriodEnd, CancelAtPeriodEnd = @CancelAtPeriodEnd, UpdatedAt = @now
    WHEN NOT MATCHED THEN
        INSERT (StripeSubscriptionId, UserId, StripeCustomerId, PlanId, Status, CurrentPeriodEnd, CancelAtPeriodEnd, CreatedAt, UpdatedAt)
        VALUES (@StripeSubscriptionId, @UserId, @StripeCustomerId, @PlanId, @Status, @CurrentPeriodEnd, @CancelAtPeriodEnd, @now, @now);
END
GO

CREATE OR ALTER PROCEDURE [Web].[GetActiveStripeSubscription]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 StripeSubscriptionId, UserId, StripeCustomerId, PlanId, Status, CurrentPeriodEnd, CancelAtPeriodEnd, CreatedAt, UpdatedAt
    FROM [Web].StripeSubscriptions
    WHERE UserId = @UserId AND Status IN ('active', 'trialing', 'past_due')
    ORDER BY UpdatedAt DESC;
END
GO

CREATE OR ALTER PROCEDURE [Web].[TryRecordStripeEvent]
    @StripeEventId NVARCHAR(128),
    @EventType NVARCHAR(128),
    @PayloadHash NVARCHAR(128) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF COL_LENGTH('Web.StripeEvents', 'StripeEventId') IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM [Web].StripeEvents WHERE StripeEventId = @StripeEventId)
        BEGIN
            INSERT INTO [Web].StripeEvents (StripeEventId, EventType, PayloadHash) VALUES (@StripeEventId, @EventType, @PayloadHash);
            SELECT CAST(1 AS BIT) AS WasInserted;
            RETURN;
        END
        SELECT CAST(0 AS BIT) AS WasInserted;
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM [Web].StripeEvents WHERE EventId = @StripeEventId)
    BEGIN
        INSERT INTO [Web].StripeEvents (EventId, EventType, Payload) VALUES (@StripeEventId, @EventType, @PayloadHash);
        SELECT CAST(1 AS BIT) AS WasInserted;
        RETURN;
    END
    SELECT CAST(0 AS BIT) AS WasInserted;
END
GO

CREATE OR ALTER PROCEDURE [Web].[InsertAccountAuditEvent]
    @UserId UNIQUEIDENTIFIER = NULL,
    @EventType NVARCHAR(128),
    @Details NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO [Web].AccountAuditEvents (UserId, EventType, Details, CreatedAt)
    VALUES (@UserId, @EventType, @Details, SYSDATETIMEOFFSET());
END
GO
