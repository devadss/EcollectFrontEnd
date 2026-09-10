-- ============================================================================
-- SQL SERVER DDL SCRIPT: COMMUNICATION CREDITS WALLET SYSTEM
-- Ecollect Database - Merchant & Branch Quota Management
-- ============================================================================

-- 1. Table: MerchantWallets
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MerchantWallets]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[MerchantWallets] (
        [Id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [MerchantId] INT NOT NULL,
        [Balance] DECIMAL(18,2) NOT NULL DEFAULT 750.00,
        [Currency] NVARCHAR(10) NOT NULL DEFAULT 'INR',
        [LowBalanceThreshold] DECIMAL(18,2) NOT NULL DEFAULT 100.00,
        [TotalRecharged] DECIMAL(18,2) NOT NULL DEFAULT 1000.00,
        [TotalSpent] DECIMAL(18,2) NOT NULL DEFAULT 250.00,
        [LastRechargedAt] DATETIME2 NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE NONCLUSTERED INDEX [IX_MerchantWallets_MerchantId] ON [dbo].[MerchantWallets] ([MerchantId]);
    PRINT '✅ Created table [MerchantWallets] with index';
END
ELSE
BEGIN
    PRINT 'ℹ️ Table [MerchantWallets] already exists';
END
GO

-- 2. Table: WalletTransactions
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[WalletTransactions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[WalletTransactions] (
        [Id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [MerchantId] INT NOT NULL,
        [ReferenceId] NVARCHAR(50) NOT NULL DEFAULT '',
        [Type] NVARCHAR(20) NOT NULL DEFAULT 'TOPUP', -- 'TOPUP' or 'DEDUCTION'
        [Amount] DECIMAL(18,2) NOT NULL,
        [ClosingBalance] DECIMAL(18,2) NOT NULL,
        [Channel] NVARCHAR(50) NOT NULL DEFAULT 'UPI', -- 'UPI', 'NetBanking', 'Card', 'WhatsApp', 'SMS', 'Call'
        [RecipientCount] INT NOT NULL DEFAULT 0,
        [Notes] NVARCHAR(500) NOT NULL DEFAULT '',
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE NONCLUSTERED INDEX [IX_WalletTransactions_MerchantId_CreatedAt] ON [dbo].[WalletTransactions] ([MerchantId], [CreatedAt] DESC);
    PRINT '✅ Created table [WalletTransactions] with index';
END
ELSE
BEGIN
    PRINT 'ℹ️ Table [WalletTransactions] already exists';
END
GO

-- 3. Table: BranchCreditQuotas
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[BranchCreditQuotas]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[BranchCreditQuotas] (
        [Id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [MerchantId] INT NOT NULL,
        [BranchCode] NVARCHAR(50) NOT NULL,
        [BranchName] NVARCHAR(150) NOT NULL DEFAULT '',
        [AllocatedCredits] DECIMAL(18,2) NOT NULL DEFAULT 500.00,
        [DailyLimit] DECIMAL(18,2) NOT NULL DEFAULT 100.00,
        [UsedCredits] DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        [EnableWhatsApp] BIT NOT NULL DEFAULT 1,
        [EnableSms] BIT NOT NULL DEFAULT 1,
        [EnableCall] BIT NOT NULL DEFAULT 0,
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'Active',
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE NONCLUSTERED INDEX [IX_BranchCreditQuotas_Merchant_Branch] ON [dbo].[BranchCreditQuotas] ([MerchantId], [BranchCode]);
    PRINT '✅ Created table [BranchCreditQuotas] with index';
END
ELSE
BEGIN
    PRINT 'ℹ️ Table [BranchCreditQuotas] already exists';
END
GO

-- 4. Seed Default Merchant #1 Wallet (if empty)
IF NOT EXISTS (SELECT 1 FROM [dbo].[MerchantWallets] WHERE [MerchantId] = 1)
BEGIN
    INSERT INTO [dbo].[MerchantWallets] ([MerchantId], [Balance], [Currency], [LowBalanceThreshold], [TotalRecharged], [TotalSpent], [LastRechargedAt], [CreatedAt], [UpdatedAt])
    VALUES (1, 750.00, 'INR', 100.00, 1000.00, 250.00, DATEADD(day, -2, GETUTCDATE()), GETUTCDATE(), GETUTCDATE());

    INSERT INTO [dbo].[WalletTransactions] ([MerchantId], [ReferenceId], [Type], [Amount], [ClosingBalance], [Channel], [RecipientCount], [Notes], [Status], [CreatedAt])
    VALUES 
    (1, 'TXN-INIT-001', 'TOPUP', 1000.00, 1000.00, 'UPI', 0, 'Opening Communication Credits Deposit (UPI)', 'SUCCESS', DATEADD(day, -2, GETUTCDATE())),
    (1, 'TXN-INIT-002', 'DEDUCTION', 250.00, 750.00, 'WhatsApp,SMS', 380, 'Automated borrower reminder schedule dispatches', 'SUCCESS', DATEADD(day, -1, GETUTCDATE()));

    PRINT '✅ Seeded initial wallet and opening ledger for Merchant #1';
END
GO
