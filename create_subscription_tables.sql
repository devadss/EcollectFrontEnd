-- ============================================================
-- eCollect Merchant Subscription Plans & Billing Schema
-- ============================================================

-- 1. Subscription Plans Master Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SubscriptionPlans')
BEGIN
    CREATE TABLE SubscriptionPlans (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        PlanCode VARCHAR(50) NOT NULL UNIQUE,
        PlanName NVARCHAR(100) NOT NULL,
        MonthlyPrice DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        OneTimeRegistrationFee DECIMAL(18,2) NOT NULL DEFAULT 30000.00,
        MinRegistrationFee DECIMAL(18,2) NOT NULL DEFAULT 5000.00,
        MaxTransactionVolume DECIMAL(18,2) NOT NULL DEFAULT 0.00, -- 0 = Unlimited
        MaxCustomers INT NOT NULL DEFAULT 0, -- 0 = Unlimited
        MaxCommunicationQuota INT NOT NULL DEFAULT 0, -- Combined SMS, WhatsApp & Voice Calls
        MaxUsersPerBranch INT NOT NULL DEFAULT 3,
        MaxAgentsPerBranch INT NOT NULL DEFAULT 5,
        MultiUserEnabled BIT NOT NULL DEFAULT 1,
        MultiBranchEnabled BIT NOT NULL DEFAULT 0,
        HubAndSpokeEnabled BIT NOT NULL DEFAULT 0,
        CustomFeeSchedulesEnabled BIT NOT NULL DEFAULT 0,
        RealTimeAnalyticsEnabled BIT NOT NULL DEFAULT 0,
        Description NVARCHAR(500) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NULL
    );
END
GO

-- Pre-populate Standard 4 Tiers
IF NOT EXISTS (SELECT * FROM SubscriptionPlans WHERE PlanCode = 'NANO')
BEGIN
    INSERT INTO SubscriptionPlans (
        PlanCode, PlanName, MonthlyPrice, OneTimeRegistrationFee, MinRegistrationFee,
        MaxTransactionVolume, MaxCustomers, MaxCommunicationQuota, MaxUsersPerBranch, MaxAgentsPerBranch,
        MultiUserEnabled, MultiBranchEnabled, HubAndSpokeEnabled, CustomFeeSchedulesEnabled, RealTimeAnalyticsEnabled,
        Description
    ) VALUES (
        'NANO', N'Basic (Nano) Plan', 399.00, 30000.00, 5000.00,
        10000.00, 50, 500, 1, 2,
        0, 0, 0, 0, 0,
        N'Fits micro institutions (Nano) needing collection automation. Includes 50 customers & 500 total communications.'
    );
END

IF NOT EXISTS (SELECT * FROM SubscriptionPlans WHERE PlanCode = 'GENESIS')
BEGIN
    INSERT INTO SubscriptionPlans (
        PlanCode, PlanName, MonthlyPrice, OneTimeRegistrationFee, MinRegistrationFee,
        MaxTransactionVolume, MaxCustomers, MaxCommunicationQuota, MaxUsersPerBranch, MaxAgentsPerBranch,
        MultiUserEnabled, MultiBranchEnabled, HubAndSpokeEnabled, CustomFeeSchedulesEnabled, RealTimeAnalyticsEnabled,
        Description
    ) VALUES (
        'GENESIS', N'Standard (Genesis) Plan', 999.00, 30000.00, 5000.00,
        100000.00, 200, 1500, 3, 5,
        1, 0, 0, 0, 0,
        N'Fits medium institutions needing collection automation. Includes 200 customers, 1500 communications, automated fee notices & receipts.'
    );
END

IF NOT EXISTS (SELECT * FROM SubscriptionPlans WHERE PlanCode = 'CLASSY')
BEGIN
    INSERT INTO SubscriptionPlans (
        PlanCode, PlanName, MonthlyPrice, OneTimeRegistrationFee, MinRegistrationFee,
        MaxTransactionVolume, MaxCustomers, MaxCommunicationQuota, MaxUsersPerBranch, MaxAgentsPerBranch,
        MultiUserEnabled, MultiBranchEnabled, HubAndSpokeEnabled, CustomFeeSchedulesEnabled, RealTimeAnalyticsEnabled,
        Description
    ) VALUES (
        'CLASSY', N'Premium (Classy) Plan', 3999.00, 30000.00, 5000.00,
        500000.00, 500, 5000, 5, 10,
        1, 1, 1, 1, 1,
        N'Fits large institutions needing automation. Includes 500 customers, 5000 communications, Real-Time Analytics, Multi-branch & Hub-and-Spoke.'
    );
END

IF NOT EXISTS (SELECT * FROM SubscriptionPlans WHERE PlanCode = 'CORPORATE')
BEGIN
    INSERT INTO SubscriptionPlans (
        PlanCode, PlanName, MonthlyPrice, OneTimeRegistrationFee, MinRegistrationFee,
        MaxTransactionVolume, MaxCustomers, MaxCommunicationQuota, MaxUsersPerBranch, MaxAgentsPerBranch,
        MultiUserEnabled, MultiBranchEnabled, HubAndSpokeEnabled, CustomFeeSchedulesEnabled, RealTimeAnalyticsEnabled,
        Description
    ) VALUES (
        'CORPORATE', N'Enterprise (Corporate) Plan', 0.00, 30000.00, 5000.00,
        0.00, 0, 0, 999, 999,
        1, 1, 1, 1, 1,
        N'Fits corporate entities with custom pricing, unlimited volume, customers, branches, and full hub-and-spoke multi-tier model.'
    );
END
GO

-- 2. Merchant Subscriptions Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MerchantSubscriptions')
BEGIN
    CREATE TABLE MerchantSubscriptions (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        MerchantId INT NOT NULL,
        PlanId INT NOT NULL,
        PlanCode VARCHAR(50) NOT NULL,
        PlanName NVARCHAR(100) NOT NULL,
        Status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'EXPIRED', 'CANCELLED', 'UPGRADED'
        BillingCycle VARCHAR(20) NOT NULL DEFAULT 'MONTHLY', -- 'MONTHLY', 'ANNUAL'
        AmountPaid DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        RegistrationFeePaid DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        ProratedDeduction DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        StartDate DATETIME NOT NULL DEFAULT GETDATE(),
        EndDate DATETIME NOT NULL,
        AutoRenew BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NULL,
        FOREIGN KEY (PlanId) REFERENCES SubscriptionPlans(Id)
    );
END
GO

-- 3. Add Columns to Merchants table if missing
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Merchants') AND name = 'PlanId')
BEGIN
    ALTER TABLE Merchants ADD PlanId INT NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Merchants') AND name = 'PlanCode')
BEGIN
    ALTER TABLE Merchants ADD PlanCode VARCHAR(50) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Merchants') AND name = 'PlanName')
BEGIN
    ALTER TABLE Merchants ADD PlanName NVARCHAR(100) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Merchants') AND name = 'HasSelectedPlan')
BEGIN
    ALTER TABLE Merchants ADD HasSelectedPlan BIT NOT NULL DEFAULT 0;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Merchants') AND name = 'PlanStatus')
BEGIN
    ALTER TABLE Merchants ADD PlanStatus VARCHAR(20) NULL DEFAULT 'PENDING';
END
GO
