const fs = require('fs');
const { execSync } = require('child_process');

const dbInitPath = 'C:/SOLUTIONS/ECOLLECT/EcollectApi/EcollectApi/EcollectApi/Ecollect.Data/DbInitializer.cs';
let content = fs.readFileSync(dbInitPath, 'utf8');

// Replace the injected block cleanly
if (content.includes('// AUTO-CREATE SUBSCRIPTION TABLES IF NOT PRESENT')) {
  // Strip out old snippet
  const startIdx = content.indexOf('// ============================================================');
  const endIdx = content.indexOf('// ============================================================', startIdx + 50);
  const snippetEnd = content.indexOf('//', endIdx + 50);
  
  // Re-read clean file or fix braces
  const cleanSnippet = `
            try
            {
                await context.Database.ExecuteSqlRawAsync(@"
                    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SubscriptionPlans')
                    BEGIN
                        CREATE TABLE SubscriptionPlans (
                            Id INT IDENTITY(1,1) PRIMARY KEY,
                            PlanCode VARCHAR(50) NOT NULL UNIQUE,
                            PlanName NVARCHAR(100) NOT NULL,
                            MonthlyPrice DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                            OneTimeRegistrationFee DECIMAL(18,2) NOT NULL DEFAULT 30000.00,
                            MinRegistrationFee DECIMAL(18,2) NOT NULL DEFAULT 5000.00,
                            MaxTransactionVolume DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                            MaxCustomers INT NOT NULL DEFAULT 0,
                            MaxCommunicationQuota INT NOT NULL DEFAULT 0,
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

                        INSERT INTO SubscriptionPlans (PlanCode, PlanName, MonthlyPrice, OneTimeRegistrationFee, MinRegistrationFee, MaxTransactionVolume, MaxCustomers, MaxCommunicationQuota, MaxUsersPerBranch, MaxAgentsPerBranch, MultiUserEnabled, MultiBranchEnabled, HubAndSpokeEnabled, CustomFeeSchedulesEnabled, RealTimeAnalyticsEnabled, Description)
                        VALUES 
                        ('NANO', N'Basic (Nano) Plan', 399.00, 30000.00, 5000.00, 10000.00, 50, 500, 1, 2, 0, 0, 0, 0, 0, N'Fits micro institutions (Nano) needing collection automation.'),
                        ('GENESIS', N'Standard (Genesis) Plan', 999.00, 30000.00, 5000.00, 100000.00, 200, 1500, 3, 5, 1, 0, 0, 0, 0, N'Fits medium institutions needing collection automation.'),
                        ('CLASSY', N'Premium (Classy) Plan', 3999.00, 30000.00, 5000.00, 500000.00, 500, 5000, 5, 10, 1, 1, 1, 1, 1, N'Fits large institutions needing automation.'),
                        ('CORPORATE', N'Enterprise (Corporate) Plan', 0.00, 30000.00, 5000.00, 0.00, 0, 0, 999, 999, 1, 1, 1, 1, 1, N'Fits corporate entities with custom pricing.');
                    END

                    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MerchantSubscriptions')
                    BEGIN
                        CREATE TABLE MerchantSubscriptions (
                            Id INT IDENTITY(1,1) PRIMARY KEY,
                            MerchantId INT NOT NULL,
                            PlanId INT NOT NULL,
                            PlanCode VARCHAR(50) NOT NULL,
                            PlanName NVARCHAR(100) NOT NULL,
                            Status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
                            BillingCycle VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
                            AmountPaid DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                            RegistrationFeePaid DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                            ProratedDeduction DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                            StartDate DATETIME NOT NULL DEFAULT GETDATE(),
                            EndDate DATETIME NOT NULL,
                            AutoRenew BIT NOT NULL DEFAULT 1,
                            CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
                            UpdatedAt DATETIME NULL
                        );
                    END

                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Merchants') AND name = 'HasSelectedPlan')
                    BEGIN
                        ALTER TABLE Merchants ADD PlanId INT NULL;
                        ALTER TABLE Merchants ADD PlanCode VARCHAR(50) NULL;
                        ALTER TABLE Merchants ADD PlanName NVARCHAR(100) NULL;
                        ALTER TABLE Merchants ADD HasSelectedPlan BIT NOT NULL DEFAULT 0;
                        ALTER TABLE Merchants ADD PlanStatus VARCHAR(20) NULL DEFAULT 'PENDING';
                    END
                ");
            }
            catch (Exception ex)
            {
                Console.WriteLine("⚠️ Subscription DDL note: " + ex.Message);
            }
`;

  // Fix file by inserting cleanSnippet right inside InitializeAsync
  const initHeader = 'public static async Task InitializeAsync(ApplicationDbContext context)\n        {\n';
  const initHeaderCRLF = 'public static async Task InitializeAsync(ApplicationDbContext context)\r\n        {\r\n';

  if (content.includes(initHeader)) {
    content = content.replace(initHeader, initHeader + cleanSnippet);
  } else if (content.includes(initHeaderCRLF)) {
    content = content.replace(initHeaderCRLF, initHeaderCRLF + cleanSnippet);
  }
}

fs.writeFileSync(dbInitPath, content, 'utf8');

try {
  execSync('dotnet build EcollectApi\\EcollectApi.csproj', { cwd: 'C:/SOLUTIONS/ECOLLECT/EcollectApi/EcollectApi/EcollectApi', encoding: 'utf8' });
  console.log('✅ Clean build successful!');
} catch (e) {
  console.log('Build output:', e.stdout || e.message);
}
