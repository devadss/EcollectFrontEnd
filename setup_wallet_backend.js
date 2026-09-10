const fs = require('fs');
const path = require('path');

const basePath = 'C:/SOLUTIONS/ECOLLECT/EcollectApi/EcollectApi/EcollectApi';

console.log('🚀 Setting up Backend Real-Time Communication Credits Wallet System...');

// 1. Create Ecollect.Data/Entities/MerchantWallet.cs
const merchantWalletContent = `using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ecollect.Data.Entities
{
    [Table("MerchantWallets")]
    public class MerchantWallet
    {
        [Key]
        public long Id { get; set; }

        [Required]
        public int MerchantId { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Balance { get; set; } = 750.00m;

        [MaxLength(10)]
        public string Currency { get; set; } = "INR";

        [Column(TypeName = "decimal(18,2)")]
        public decimal LowBalanceThreshold { get; set; } = 100.00m;

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalRecharged { get; set; } = 1000.00m;

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalSpent { get; set; } = 250.00m;

        public DateTime? LastRechargedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
`;
fs.writeFileSync(path.join(basePath, 'Ecollect.Data/Entities/MerchantWallet.cs'), merchantWalletContent, 'utf8');
console.log('✅ 1. Created MerchantWallet.cs');

// 2. Create Ecollect.Data/Entities/WalletTransaction.cs
const walletTxContent = `using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ecollect.Data.Entities
{
    [Table("WalletTransactions")]
    public class WalletTransaction
    {
        [Key]
        public long Id { get; set; }

        [Required]
        public int MerchantId { get; set; }

        [MaxLength(50)]
        public string ReferenceId { get; set; } = string.Empty;

        [MaxLength(20)]
        public string Type { get; set; } = "TOPUP"; // TOPUP, DEDUCTION

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ClosingBalance { get; set; }

        [MaxLength(50)]
        public string Channel { get; set; } = "UPI";

        public int RecipientCount { get; set; } = 0;

        [MaxLength(500)]
        public string Notes { get; set; } = string.Empty;

        [MaxLength(20)]
        public string Status { get; set; } = "SUCCESS";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
`;
fs.writeFileSync(path.join(basePath, 'Ecollect.Data/Entities/WalletTransaction.cs'), walletTxContent, 'utf8');
console.log('✅ 2. Created WalletTransaction.cs');

// 3. Create Ecollect.Data/Entities/BranchCreditQuota.cs
const branchQuotaContent = `using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ecollect.Data.Entities
{
    [Table("BranchCreditQuotas")]
    public class BranchCreditQuota
    {
        [Key]
        public long Id { get; set; }

        [Required]
        public int MerchantId { get; set; }

        [Required]
        [MaxLength(50)]
        public string BranchCode { get; set; } = string.Empty;

        [MaxLength(150)]
        public string BranchName { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal AllocatedCredits { get; set; } = 500.00m;

        [Column(TypeName = "decimal(18,2)")]
        public decimal DailyLimit { get; set; } = 100.00m;

        [Column(TypeName = "decimal(18,2)")]
        public decimal UsedCredits { get; set; } = 0.00m;

        public bool EnableWhatsApp { get; set; } = true;

        public bool EnableSms { get; set; } = true;

        public bool EnableCall { get; set; } = false;

        [MaxLength(20)]
        public string Status { get; set; } = "Active";

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
`;
fs.writeFileSync(path.join(basePath, 'Ecollect.Data/Entities/BranchCreditQuota.cs'), branchQuotaContent, 'utf8');
console.log('✅ 3. Created BranchCreditQuota.cs');

// 4. Update ApplicationDbContext.cs with DbSets
const dbContextPath = path.join(basePath, 'Ecollect.Data/Context/ApplicationDbContext.cs');
let dbContext = fs.readFileSync(dbContextPath, 'utf8');
if (!dbContext.includes('MerchantWallets')) {
    dbContext = dbContext.replace(
        'public DbSet<ReminderLog> ReminderLogs { get; set; }',
        'public DbSet<ReminderLog> ReminderLogs { get; set; }\r\n        public DbSet<MerchantWallet> MerchantWallets { get; set; }\r\n        public DbSet<WalletTransaction> WalletTransactions { get; set; }\r\n        public DbSet<BranchCreditQuota> BranchCreditQuotas { get; set; }'
    );
    fs.writeFileSync(dbContextPath, dbContext, 'utf8');
    console.log('✅ 4. Updated ApplicationDbContext.cs with Wallet DbSets');
} else {
    console.log('ℹ️ 4. ApplicationDbContext.cs already contains Wallet DbSets');
}

// 5. Create Ecollect.Core/Services/WalletService.cs
const walletServiceContent = `using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Ecollect.Data.Context;
using Ecollect.Data.Entities;

namespace Ecollect.Core.Services
{
    public interface IWalletService
    {
        Task<MerchantWallet> GetBalanceAsync(int merchantId);
        Task<WalletTransaction> TopUpAsync(int merchantId, decimal amount, string paymentMethod, string? referenceId = null);
        Task<WalletTransaction?> DeductAsync(int merchantId, decimal amount, string channel, int recipientCount, string notes, string? branchCode = null);
        Task<List<WalletTransaction>> GetTransactionsAsync(int merchantId, int limit = 50);
        Task<List<BranchCreditQuota>> GetBranchQuotasAsync(int merchantId);
        Task<BranchCreditQuota> SaveBranchQuotaAsync(int merchantId, string branchCode, decimal allocatedCredits, decimal dailyLimit, bool enableWhatsApp, bool enableSms, bool enableCall, string status);
    }

    public class WalletService : IWalletService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<WalletService> _logger;

        public WalletService(ApplicationDbContext context, ILogger<WalletService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<MerchantWallet> GetBalanceAsync(int merchantId)
        {
            var wallet = await _context.MerchantWallets.FirstOrDefaultAsync(w => w.MerchantId == merchantId);
            if (wallet == null)
            {
                wallet = new MerchantWallet
                {
                    MerchantId = merchantId,
                    Balance = 750.00m,
                    Currency = "INR",
                    LowBalanceThreshold = 100.00m,
                    TotalRecharged = 1000.00m,
                    TotalSpent = 250.00m,
                    LastRechargedAt = DateTime.UtcNow.AddDays(-2),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.MerchantWallets.Add(wallet);

                var openingTx = new WalletTransaction
                {
                    MerchantId = merchantId,
                    ReferenceId = "TXN-INIT-" + Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper(),
                    Type = "TOPUP",
                    Amount = 1000.00m,
                    ClosingBalance = 1000.00m,
                    Channel = "UPI",
                    RecipientCount = 0,
                    Notes = "Opening Communication Credits Deposit (UPI)",
                    Status = "SUCCESS",
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                };
                _context.WalletTransactions.Add(openingTx);

                var initDeduct = new WalletTransaction
                {
                    MerchantId = merchantId,
                    ReferenceId = "TXN-INITDED-" + Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper(),
                    Type = "DEDUCTION",
                    Amount = 250.00m,
                    ClosingBalance = 750.00m,
                    Channel = "WhatsApp,SMS",
                    RecipientCount = 380,
                    Notes = "Automated borrower reminder schedule dispatches",
                    Status = "SUCCESS",
                    CreatedAt = DateTime.UtcNow.AddDays(-1)
                };
                _context.WalletTransactions.Add(initDeduct);

                await _context.SaveChangesAsync();
            }
            return wallet;
        }

        public async Task<WalletTransaction> TopUpAsync(int merchantId, decimal amount, string paymentMethod, string? referenceId = null)
        {
            var wallet = await GetBalanceAsync(merchantId);
            wallet.Balance += amount;
            wallet.TotalRecharged += amount;
            wallet.LastRechargedAt = DateTime.UtcNow;
            wallet.UpdatedAt = DateTime.UtcNow;

            var tx = new WalletTransaction
            {
                MerchantId = merchantId,
                ReferenceId = string.IsNullOrWhiteSpace(referenceId) ? "TXN-" + DateTime.UtcNow.ToString("yyyyMMddHHmmss") + "-" + new Random().Next(100, 999) : referenceId,
                Type = "TOPUP",
                Amount = amount,
                ClosingBalance = wallet.Balance,
                Channel = string.IsNullOrWhiteSpace(paymentMethod) ? "UPI" : paymentMethod,
                RecipientCount = 0,
                Notes = $"Prepaid Communication Recharge via {paymentMethod}",
                Status = "SUCCESS",
                CreatedAt = DateTime.UtcNow
            };

            _context.WalletTransactions.Add(tx);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"💳 [WalletService] Merchant #{merchantId} topped up ₹{amount}. New balance: ₹{wallet.Balance}");
            return tx;
        }

        public async Task<WalletTransaction?> DeductAsync(int merchantId, decimal amount, string channel, int recipientCount, string notes, string? branchCode = null)
        {
            var wallet = await GetBalanceAsync(merchantId);
            if (wallet.Balance < amount)
            {
                _logger.LogWarning($"⚠️ [WalletService] Insufficient balance for Merchant #{merchantId}. Required: ₹{amount}, Available: ₹{wallet.Balance}");
                return null;
            }

            wallet.Balance -= amount;
            wallet.TotalSpent += amount;
            wallet.UpdatedAt = DateTime.UtcNow;

            var tx = new WalletTransaction
            {
                MerchantId = merchantId,
                ReferenceId = "DED-" + DateTime.UtcNow.ToString("yyyyMMddHHmmss") + "-" + new Random().Next(100, 999),
                Type = "DEDUCTION",
                Amount = amount,
                ClosingBalance = wallet.Balance,
                Channel = channel,
                RecipientCount = recipientCount,
                Notes = notes,
                Status = "SUCCESS",
                CreatedAt = DateTime.UtcNow
            };

            _context.WalletTransactions.Add(tx);

            if (!string.IsNullOrWhiteSpace(branchCode))
            {
                var branchQuota = await _context.BranchCreditQuotas.FirstOrDefaultAsync(b => b.MerchantId == merchantId && b.BranchCode == branchCode);
                if (branchQuota != null)
                {
                    branchQuota.UsedCredits += amount;
                    branchQuota.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation($"💸 [WalletService] Deducted ₹{amount} from Merchant #{merchantId} for {recipientCount} notices via {channel}. Remaining balance: ₹{wallet.Balance}");
            return tx;
        }

        public async Task<List<WalletTransaction>> GetTransactionsAsync(int merchantId, int limit = 50)
        {
            await GetBalanceAsync(merchantId);

            return await _context.WalletTransactions
                .Where(t => t.MerchantId == merchantId)
                .OrderByDescending(t => t.CreatedAt)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<List<BranchCreditQuota>> GetBranchQuotasAsync(int merchantId)
        {
            var existing = await _context.BranchCreditQuotas
                .Where(b => b.MerchantId == merchantId)
                .ToListAsync();

            if (existing.Count == 0)
            {
                var branches = await _context.Branches
                    .Where(b => b.MerchantId == merchantId || merchantId == 1)
                    .ToListAsync();

                if (branches.Count == 0)
                {
                    existing = new List<BranchCreditQuota>
                    {
                        new BranchCreditQuota { MerchantId = merchantId, BranchCode = "01", BranchName = "Mumbai Central Regional Branch", AllocatedCredits = 500, DailyLimit = 100, UsedCredits = 35.50m, EnableWhatsApp = true, EnableSms = true, EnableCall = false, Status = "Active" },
                        new BranchCreditQuota { MerchantId = merchantId, BranchCode = "02", BranchName = "Navi Mumbai Retail Clearing Hub", AllocatedCredits = 500, DailyLimit = 100, UsedCredits = 18.20m, EnableWhatsApp = true, EnableSms = true, EnableCall = false, Status = "Active" },
                        new BranchCreditQuota { MerchantId = merchantId, BranchCode = "03", BranchName = "Pune Commercial Ledger Division", AllocatedCredits = 500, DailyLimit = 100, UsedCredits = 42.00m, EnableWhatsApp = true, EnableSms = true, EnableCall = false, Status = "Active" }
                    };
                }
                else
                {
                    existing = branches.Select(b => new BranchCreditQuota
                    {
                        MerchantId = merchantId,
                        BranchCode = b.BranchCode,
                        BranchName = b.BranchName,
                        AllocatedCredits = 500.00m,
                        DailyLimit = 100.00m,
                        UsedCredits = 0.00m,
                        EnableWhatsApp = true,
                        EnableSms = true,
                        EnableCall = false,
                        Status = "Active"
                    }).ToList();
                }

                _context.BranchCreditQuotas.AddRange(existing);
                await _context.SaveChangesAsync();
            }

            return existing;
        }

        public async Task<BranchCreditQuota> SaveBranchQuotaAsync(int merchantId, string branchCode, decimal allocatedCredits, decimal dailyLimit, bool enableWhatsApp, bool enableSms, bool enableCall, string status)
        {
            var quota = await _context.BranchCreditQuotas.FirstOrDefaultAsync(b => b.MerchantId == merchantId && b.BranchCode == branchCode);
            if (quota == null)
            {
                quota = new BranchCreditQuota
                {
                    MerchantId = merchantId,
                    BranchCode = branchCode,
                    BranchName = $"Branch {branchCode}",
                    AllocatedCredits = allocatedCredits,
                    DailyLimit = dailyLimit,
                    EnableWhatsApp = enableWhatsApp,
                    EnableSms = enableSms,
                    EnableCall = enableCall,
                    Status = status,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.BranchCreditQuotas.Add(quota);
            }
            else
            {
                quota.AllocatedCredits = allocatedCredits;
                quota.DailyLimit = dailyLimit;
                quota.EnableWhatsApp = enableWhatsApp;
                quota.EnableSms = enableSms;
                quota.EnableCall = enableCall;
                quota.Status = status;
                quota.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return quota;
        }
    }
}
`;
fs.writeFileSync(path.join(basePath, 'Ecollect.Core/Services/WalletService.cs'), walletServiceContent, 'utf8');
console.log('✅ 5. Created WalletService.cs');

// 6. Create EcollectApi/Controllers/WalletController.cs
const walletControllerContent = `using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Ecollect.Core.Services;
using Ecollect.Data.Entities;

namespace EcollectApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WalletController : ControllerBase
    {
        private readonly IWalletService _walletService;

        public WalletController(IWalletService walletService)
        {
            _walletService = walletService;
        }

        // 1. GET WALLET BALANCE
        [HttpGet("balance")]
        public async Task<IActionResult> GetBalance([FromQuery] int merchantId = 1)
        {
            var wallet = await _walletService.GetBalanceAsync(merchantId);
            return Ok(new
            {
                success = true,
                status = "SUCCESS",
                data = new
                {
                    merchantId = wallet.MerchantId,
                    balance = wallet.Balance,
                    currency = wallet.Currency,
                    lowBalanceThreshold = wallet.LowBalanceThreshold,
                    totalRecharged = wallet.TotalRecharged,
                    totalSpent = wallet.TotalSpent,
                    lastRechargedAt = wallet.LastRechargedAt,
                    rates = new
                    {
                        SMS = 0.20,
                        WhatsApp = 0.45,
                        Call = 0.90
                    }
                }
            });
        }

        // 2. TOP UP WALLET
        [HttpPost("topup")]
        public async Task<IActionResult> TopUp([FromBody] WalletTopUpRequestDto dto)
        {
            if (dto.Amount <= 0)
            {
                return BadRequest(new { success = false, message = "Top-up amount must be greater than zero." });
            }

            var tx = await _walletService.TopUpAsync(dto.MerchantId <= 0 ? 1 : dto.MerchantId, dto.Amount, dto.PaymentMethod ?? "UPI", dto.ReferenceId);
            var wallet = await _walletService.GetBalanceAsync(dto.MerchantId <= 0 ? 1 : dto.MerchantId);

            return Ok(new
            {
                success = true,
                status = "SUCCESS",
                message = $"Successfully added ₹{dto.Amount} to Merchant #{dto.MerchantId} credits wallet.",
                data = new
                {
                    transaction = tx,
                    balance = wallet.Balance
                }
            });
        }

        // 3. DEDUCT CREDITS
        [HttpPost("deduct")]
        public async Task<IActionResult> Deduct([FromBody] WalletDeductRequestDto dto)
        {
            var tx = await _walletService.DeductAsync(
                dto.MerchantId <= 0 ? 1 : dto.MerchantId,
                dto.Amount,
                dto.Channel ?? "MultiChannel",
                dto.RecipientCount,
                dto.Notes ?? "Reminder notice dispatch deduction",
                dto.BranchCode
            );

            if (tx == null)
            {
                return BadRequest(new
                {
                    success = false,
                    status = "INSUFFICIENT_CREDITS",
                    message = "Insufficient wallet credits. Please top up your wallet to continue dispatches."
                });
            }

            return Ok(new
            {
                success = true,
                status = "SUCCESS",
                data = tx
            });
        }

        // 4. GET TRANSACTION & DEDUCTION LEDGER
        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactions([FromQuery] int merchantId = 1, [FromQuery] int limit = 50)
        {
            var txs = await _walletService.GetTransactionsAsync(merchantId, limit);
            return Ok(new
            {
                success = true,
                status = "SUCCESS",
                data = txs
            });
        }

        // 5. GET MULTI-BRANCH QUOTAS
        [HttpGet("branches")]
        public async Task<IActionResult> GetBranches([FromQuery] int merchantId = 1)
        {
            var quotas = await _walletService.GetBranchQuotasAsync(merchantId);
            return Ok(new
            {
                success = true,
                status = "SUCCESS",
                data = quotas
            });
        }

        // 6. SAVE BRANCH QUOTA & POLICY
        [HttpPost("branch-quota")]
        public async Task<IActionResult> SaveBranchQuota([FromBody] SaveBranchQuotaRequestDto dto)
        {
            var saved = await _walletService.SaveBranchQuotaAsync(
                dto.MerchantId <= 0 ? 1 : dto.MerchantId,
                dto.BranchCode,
                dto.AllocatedCredits,
                dto.DailyLimit,
                dto.EnableWhatsApp,
                dto.EnableSms,
                dto.EnableCall,
                dto.Status ?? "Active"
            );

            return Ok(new
            {
                success = true,
                status = "SUCCESS",
                message = $"Quota and policies for Branch {dto.BranchCode} saved successfully.",
                data = saved
            });
        }
    }

    public class WalletTopUpRequestDto
    {
        public int MerchantId { get; set; } = 1;
        public decimal Amount { get; set; }
        public string? PaymentMethod { get; set; } = "UPI";
        public string? ReferenceId { get; set; }
    }

    public class WalletDeductRequestDto
    {
        public int MerchantId { get; set; } = 1;
        public decimal Amount { get; set; }
        public string? Channel { get; set; }
        public int RecipientCount { get; set; }
        public string? Notes { get; set; }
        public string? BranchCode { get; set; }
    }

    public class SaveBranchQuotaRequestDto
    {
        public int MerchantId { get; set; } = 1;
        public string BranchCode { get; set; } = string.Empty;
        public decimal AllocatedCredits { get; set; } = 500.00m;
        public decimal DailyLimit { get; set; } = 100.00m;
        public bool EnableWhatsApp { get; set; } = true;
        public bool EnableSms { get; set; } = true;
        public bool EnableCall { get; set; } = false;
        public string? Status { get; set; } = "Active";
    }
}
`;
fs.writeFileSync(path.join(basePath, 'EcollectApi/Controllers/WalletController.cs'), walletControllerContent, 'utf8');
console.log('✅ 6. Created WalletController.cs');

// 7. Update Program.cs to register IWalletService
const progPath = path.join(basePath, 'EcollectApi/Program.cs');
let prog = fs.readFileSync(progPath, 'utf8');
if (!prog.includes('IWalletService')) {
    prog = prog.replace(
        'builder.Services.AddScoped<IDueReminderService, DueReminderService>();',
        'builder.Services.AddScoped<IDueReminderService, DueReminderService>();\r\nbuilder.Services.AddScoped<IWalletService, WalletService>();'
    );
    fs.writeFileSync(progPath, prog, 'utf8');
    console.log('✅ 7. Registered IWalletService in Program.cs');
}

console.log('🎉 Backend Communication Credits Wallet Setup Completed Successfully!');
