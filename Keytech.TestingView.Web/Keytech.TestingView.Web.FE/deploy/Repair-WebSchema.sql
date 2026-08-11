-- Repair Web schema for databases created without column defaults (IIS / manual DDL).

-- ExternalLogins
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Web_ExternalLogins_CreatedAt')
    ALTER TABLE [Web].[ExternalLogins] ADD CONSTRAINT [DF_Web_ExternalLogins_CreatedAt] DEFAULT (SYSDATETIMEOFFSET()) FOR [CreatedAt];
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Web_ExternalLogins_UpdatedAt')
    ALTER TABLE [Web].[ExternalLogins] ADD CONSTRAINT [DF_Web_ExternalLogins_UpdatedAt] DEFAULT (SYSDATETIMEOFFSET()) FOR [UpdatedAt];
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Web_ExternalLogins_Id')
    ALTER TABLE [Web].[ExternalLogins] ADD CONSTRAINT [DF_Web_ExternalLogins_Id] DEFAULT (NEWSEQUENTIALID()) FOR [ExternalLoginId];
GO

-- AccountAuditEvents
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Web_AccountAuditEvents_CreatedAt')
    ALTER TABLE [Web].[AccountAuditEvents] ADD CONSTRAINT [DF_Web_AccountAuditEvents_CreatedAt] DEFAULT (SYSDATETIMEOFFSET()) FOR [CreatedAt];
GO

-- StripeCustomers
IF OBJECT_ID(N'[Web].[StripeCustomers]', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Web_StripeCustomers_CreatedAt')
        ALTER TABLE [Web].[StripeCustomers] ADD CONSTRAINT [DF_Web_StripeCustomers_CreatedAt] DEFAULT (SYSDATETIMEOFFSET()) FOR [CreatedAt];
    IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Web_StripeCustomers_UpdatedAt')
        ALTER TABLE [Web].[StripeCustomers] ADD CONSTRAINT [DF_Web_StripeCustomers_UpdatedAt] DEFAULT (SYSDATETIMEOFFSET()) FOR [UpdatedAt];
END
GO

-- StripeSubscriptions
IF OBJECT_ID(N'[Web].[StripeSubscriptions]', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Web_StripeSubscriptions_CreatedAt')
        ALTER TABLE [Web].[StripeSubscriptions] ADD CONSTRAINT [DF_Web_StripeSubscriptions_CreatedAt] DEFAULT (SYSDATETIMEOFFSET()) FOR [CreatedAt];
    IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Web_StripeSubscriptions_UpdatedAt')
        ALTER TABLE [Web].[StripeSubscriptions] ADD CONSTRAINT [DF_Web_StripeSubscriptions_UpdatedAt] DEFAULT (SYSDATETIMEOFFSET()) FOR [UpdatedAt];
END
GO

-- StripeEvents
IF OBJECT_ID(N'[Web].[StripeEvents]', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('Web.StripeEvents', 'ProcessedAt') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Web_StripeEvents_ProcessedAt')
        ALTER TABLE [Web].[StripeEvents] ADD CONSTRAINT [DF_Web_StripeEvents_ProcessedAt] DEFAULT (SYSDATETIMEOFFSET()) FOR [ProcessedAt];
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

CREATE OR ALTER PROCEDURE [Web].[InsertAccountAuditEvent]
    @UserId UNIQUEIDENTIFIER = NULL,
    @EventType NVARCHAR(128),
    @Details NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @now DATETIMEOFFSET = SYSDATETIMEOFFSET();

    IF COL_LENGTH('Web.AccountAuditEvents', 'AccountAuditEventId') IS NOT NULL
        INSERT INTO [Web].AccountAuditEvents (UserId, EventType, Details, CreatedAt)
        VALUES (@UserId, @EventType, @Details, @now);
    ELSE
        INSERT INTO [Web].AccountAuditEvents (AuditEventId, UserId, EventType, Details, CreatedAt)
        VALUES (NEWID(), @UserId, @EventType, @Details, @now);
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
