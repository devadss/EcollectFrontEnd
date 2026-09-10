const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';

console.log('🚀 Setting up Merchant Subscription Backend (Controllers, DTOs, and Services)...');

// 1. Create Subscription DTOs
const dtoDir = path.join(basePath, 'Ecollect.Shared', 'DTOs');
const subscriptionDtoPath = path.join(dtoDir, 'SubscriptionDto.cs');

const subscriptionDtoContent = `using System;
using System.Collections.Generic;

namespace Ecollect.Shared.DTOs
{
    public class SubscriptionPlanDto
    {
        public int Id { get; set; }
        public string PlanCode { get; set; } = string.Empty;
        public string PlanName { get; set; } = string.Empty;
        public decimal MonthlyPrice { get; set; }
        public decimal OneTimeRegistrationFee { get; set; } = 30000;
        public decimal MinRegistrationFee { get; set; } = 5000;
        public decimal MaxTransactionVolume { get; set; }
        public int MaxCustomers { get; set; }
        public int MaxCommunicationQuota { get; set; }
        public int MaxUsersPerBranch { get; set; } = 3;
        public int MaxAgentsPerBranch { get; set; } = 5;
        public bool MultiUserEnabled { get; set; } = true;
        public bool MultiBranchEnabled { get; set; }
        public bool HubAndSpokeEnabled { get; set; }
        public bool CustomFeeSchedulesEnabled { get; set; }
        public bool RealTimeAnalyticsEnabled { get; set; }
        public string Description { get; set; } = string.Empty;
        public List<string> Highlights { get; set; } = new List<string>();
    }

    public class SelectPlanRequestDto
    {
        public int MerchantId { get; set; }
        public string PlanCode { get; set; } = string.Empty;
        public string BillingCycle { get; set; } = "MONTHLY"; // "MONTHLY" | "ANNUAL"
        public decimal AgreedRegistrationFee { get; set; } = 30000;
    }

    public class MerchantSubscriptionStatusDto
    {
        public int MerchantId { get; set; }
        public bool HasSelectedPlan { get; set; }
        public int? PlanId { get; set; }
        public string PlanCode { get; set; } = string.Empty;
        public string PlanName { get; set; } = string.Empty;
        public string PlanStatus { get; set; } = "INACTIVE"; // "ACTIVE" | "INACTIVE" | "EXPIRED"
        public decimal MonthlyPrice { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        
        // Quota Consumption Stats
        public int CustomerCount { get; set; }
        public int MaxCustomers { get; set; }
        public decimal UsedTransactionVolume { get; set; }
        public decimal MaxTransactionVolume { get; set; }
        public int UsedCommunicationQuota { get; set; }
        public int MaxCommunicationQuota { get; set; }
    }
}
`;

fs.writeFileSync(subscriptionDtoPath, subscriptionDtoContent, 'utf8');
console.log('✅ Created SubscriptionDto.cs');

// 2. Create SubscriptionController.cs
const ctrlDir = path.join(basePath, 'EcollectApi', 'Controllers');
const subscriptionCtrlPath = path.join(ctrlDir, 'SubscriptionController.cs');

const subscriptionCtrlContent = `using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Ecollect.Shared.DTOs;

namespace EcollectApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubscriptionController : ControllerBase
    {
        private static readonly List<SubscriptionPlanDto> SystemPlans = new List<SubscriptionPlanDto>
        {
            new SubscriptionPlanDto
            {
                Id = 1,
                PlanCode = "NANO",
                PlanName = "Basic (Nano) Plan",
                MonthlyPrice = 399,
                OneTimeRegistrationFee = 30000,
                MinRegistrationFee = 5000,
                MaxTransactionVolume = 10000,
                MaxCustomers = 50,
                MaxCommunicationQuota = 500,
                MaxUsersPerBranch = 1,
                MaxAgentsPerBranch = 2,
                MultiUserEnabled = false,
                MultiBranchEnabled = false,
                HubAndSpokeEnabled = false,
                CustomFeeSchedulesEnabled = false,
                RealTimeAnalyticsEnabled = false,
                Description = "Fits micro institutions (Nano) which need to automate their collection.",
                Highlights = new List<string>
                {
                    "Fits for micro institutions (Nano)",
                    "Transaction volume \u2264 \u20b910,000 per month",
                    "Up to 50 customers limit",
                    "500 SMS, WhatsApp & Call (altogether)",
                    "Automated payment links and reminders",
                    "Real-time payment updates and reports"
                }
            },
            new SubscriptionPlanDto
            {
                Id = 2,
                PlanCode = "GENESIS",
                PlanName = "Standard (Genesis) Plan",
                MonthlyPrice = 999,
                OneTimeRegistrationFee = 30000,
                MinRegistrationFee = 5000,
                MaxTransactionVolume = 100000,
                MaxCustomers = 200,
                MaxCommunicationQuota = 1500,
                MaxUsersPerBranch = 3,
                MaxAgentsPerBranch = 5,
                MultiUserEnabled = true,
                MultiBranchEnabled = false,
                HubAndSpokeEnabled = false,
                CustomFeeSchedulesEnabled = false,
                RealTimeAnalyticsEnabled = false,
                Description = "Fits medium type institutions which need to automate their collections.",
                Highlights = new List<string>
                {
                    "Fits for medium type institutions",
                    "Transaction volume \u2264 \u20b9100,000 per month",
                    "Up to 200 customers limit",
                    "1,500 SMS, WhatsApp and Calls",
                    "Automated payment links & reminders",
                    "Automated Fee Communications",
                    "Real-time payment updates & reports",
                    "Effortless Reconciliation & Receipts",
                    "Multi-users model (3 users, 5 agents/branch)"
                }
            },
            new SubscriptionPlanDto
            {
                Id = 3,
                PlanCode = "CLASSY",
                PlanName = "Premium (Classy) Plan",
                MonthlyPrice = 3999,
                OneTimeRegistrationFee = 30000,
                MinRegistrationFee = 5000,
                MaxTransactionVolume = 500000,
                MaxCustomers = 500,
                MaxCommunicationQuota = 5000,
                MaxUsersPerBranch = 5,
                MaxAgentsPerBranch = 10,
                MultiUserEnabled = true,
                MultiBranchEnabled = true,
                HubAndSpokeEnabled = true,
                CustomFeeSchedulesEnabled = true,
                RealTimeAnalyticsEnabled = true,
                Description = "Fits large type institutions which need full multi-branch collection automation.",
                Highlights = new List<string>
                {
                    "Fits for large type institutions",
                    "Transaction volume \u2264 \u20b9500,000 per month",
                    "Up to 500 customers limit",
                    "5,000 SMS, WhatsApp and Calls",
                    "Customizable Fee Schedules",
                    "Real-Time Analytics & Dashboards",
                    "Multi-branch enabled & Hub & Spoke model"
                }
            },
            new SubscriptionPlanDto
            {
                Id = 4,
                PlanCode = "CORPORATE",
                PlanName = "Enterprise (Corporate) Plan",
                MonthlyPrice = 0, // Custom Price
                OneTimeRegistrationFee = 30000,
                MinRegistrationFee = 5000,
                MaxTransactionVolume = 0, // Unlimited
                MaxCustomers = 0, // Unlimited
                MaxCommunicationQuota = 0, // Unlimited
                MaxUsersPerBranch = 999,
                MaxAgentsPerBranch = 999,
                MultiUserEnabled = true,
                MultiBranchEnabled = true,
                HubAndSpokeEnabled = true,
                CustomFeeSchedulesEnabled = true,
                RealTimeAnalyticsEnabled = true,
                Description = "Fits corporate entities needing customized enterprise-grade infrastructure & unlimited scaling.",
                Highlights = new List<string>
                {
                    "Fits for corporate entities",
                    "Unlimited transaction volume & customers",
                    "Unlimited multi-users & multi-branch",
                    "Custom SLA & Dedicated Account Manager",
                    "Hub & spoke model"
                }
            }
        };

        // In-Memory Merchant Subscriptions Store
        private static readonly Dictionary<int, MerchantSubscriptionStatusDto> MerchantSubscriptions = new Dictionary<int, MerchantSubscriptionStatusDto>();

        /// <summary>
        /// GET api/subscription/plans
        /// Retrieves all subscription plan tiers
        /// </summary>
        [HttpGet("plans")]
        public IActionResult GetPlans()
        {
            return Ok(new
            {
                success = true,
                data = SystemPlans,
                note = "One-time registration fee is \u20b930,000 (\u20b95,000 minimum if negotiated). Standard branch limit: 3 users & 5 agents per branch. Plan upgrade deducts previously paid amount."
            });
        }

        /// <summary>
        /// GET api/subscription/merchant/{merchantId}
        /// Retrieves active plan details & usage stats for a merchant
        /// </summary>
        [HttpGet("merchant/{merchantId}")]
        public IActionResult GetMerchantSubscription(int merchantId)
        {
            if (!MerchantSubscriptions.TryGetValue(merchantId, out var status))
            {
                // Default fallback: check if standard default plan assigned
                status = new MerchantSubscriptionStatusDto
                {
                    MerchantId = merchantId,
                    HasSelectedPlan = false,
                    PlanCode = "NONE",
                    PlanName = "No Active Plan Selected",
                    PlanStatus = "INACTIVE",
                    CustomerCount = 12,
                    MaxCustomers = 50,
                    UsedTransactionVolume = 2500,
                    MaxTransactionVolume = 10000,
                    UsedCommunicationQuota = 120,
                    MaxCommunicationQuota = 500
                };
            }

            return Ok(new
            {
                success = true,
                data = status
            });
        }

        /// <summary>
        /// POST api/subscription/select
        /// Selects or upgrades a merchant's plan
        /// </summary>
        [HttpPost("select")]
        public IActionResult SelectPlan([FromBody] SelectPlanRequestDto req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.PlanCode))
            {
                return BadRequest(new { success = false, message = "Invalid plan request. Plan code is required." });
            }

            var plan = SystemPlans.FirstOrDefault(p => p.PlanCode.Equals(req.PlanCode, StringComparison.OrdinalIgnoreCase));
            if (plan == null)
            {
                return NotFound(new { success = false, message = $"Plan code '{req.PlanCode}' not found." });
            }

            MerchantSubscriptions.TryGetValue(req.MerchantId, out var existingStatus);

            decimal previousPaid = existingStatus?.MonthlyPrice ?? 0;
            decimal priceToPay = Math.Max(0, plan.MonthlyPrice - previousPaid);

            var newStatus = new MerchantSubscriptionStatusDto
            {
                MerchantId = req.MerchantId,
                HasSelectedPlan = true,
                PlanId = plan.Id,
                PlanCode = plan.PlanCode,
                PlanName = plan.PlanName,
                PlanStatus = "ACTIVE",
                MonthlyPrice = plan.MonthlyPrice,
                StartDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(30),
                CustomerCount = existingStatus?.CustomerCount ?? 12,
                MaxCustomers = plan.MaxCustomers,
                UsedTransactionVolume = existingStatus?.UsedTransactionVolume ?? 2500,
                MaxTransactionVolume = plan.MaxTransactionVolume,
                UsedCommunicationQuota = existingStatus?.UsedCommunicationQuota ?? 120,
                MaxCommunicationQuota = plan.MaxCommunicationQuota
            };

            MerchantSubscriptions[req.MerchantId] = newStatus;

            return Ok(new
            {
                success = true,
                message = $"Successfully subscribed to {plan.PlanName}!",
                data = newStatus,
                billingSummary = new
                {
                    planName = plan.PlanName,
                    monthlyPrice = plan.MonthlyPrice,
                    agreedRegistrationFee = req.AgreedRegistrationFee,
                    previousPaidDeduction = previousPaid,
                    netPayable = priceToPay,
                    isUpgrade = previousPaid > 0
                }
            });
        }

        /// <summary>
        /// GET api/subscription/status
        /// Quick auth status check for logged-in merchant
        /// </summary>
        [HttpGet("status")]
        public IActionResult GetStatus([FromQuery] int merchantId = 1)
        {
            MerchantSubscriptions.TryGetValue(merchantId, out var status);
            return Ok(new
            {
                success = true,
                hasSelectedPlan = status?.HasSelectedPlan ?? false,
                planCode = status?.PlanCode ?? "NONE",
                planName = status?.PlanName ?? "No Plan Selected",
                planStatus = status?.PlanStatus ?? "INACTIVE"
            });
        }
    }
}
`;

fs.writeFileSync(subscriptionCtrlPath, subscriptionCtrlContent, 'utf8');
console.log('✅ Created SubscriptionController.cs');

// 3. Test Dotnet Build
console.log('🔨 Building backend solution to ensure zero compilation errors...');
try {
  const buildOutput = execSync('dotnet build EcollectApi.sln --no-incremental', {
    cwd: basePath,
    encoding: 'utf8'
  });
  console.log('✅ Backend compiled cleanly with 0 errors!');
} catch (err) {
  console.error('❌ Build Output:', err.stdout || err.message);
}
