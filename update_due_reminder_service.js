const fs = require('fs');
const path = require('path');

const filePath = 'C:/SOLUTIONS/ECOLLECT/EcollectApi/EcollectApi/EcollectApi/Ecollect.Core/Services/DueReminderService.cs';

const content = `using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Ecollect.Data.Context;
using Ecollect.Data.Entities;

namespace Ecollect.Core.Services
{
    public interface IDueReminderService
    {
        Task<int> ProcessDailyRemindersAsync(DateTime? checkDate = null);
        Task<bool> CustomizeAccountReminderAsync(long accountId, int daysBefore, string channels, string riskLevel, string? note);
        Task<ReminderConfiguration> GetConfigurationAsync(int merchantId, string branchCode);
        Task<ReminderConfiguration> SaveConfigurationAsync(ReminderConfiguration config);
        Task<List<ReminderLog>> GetRecentLogsAsync(string? branchCode, int limit = 50);
    }

    public class DueReminderService : IDueReminderService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DueReminderService> _logger;
        private readonly IWalletService _walletService;

        public DueReminderService(ApplicationDbContext context, ILogger<DueReminderService> logger, IWalletService walletService)
        {
            _context = context;
            _logger = logger;
            _walletService = walletService;
        }

        public async Task<int> ProcessDailyRemindersAsync(DateTime? checkDate = null)
        {
            var today = (checkDate ?? DateTime.UtcNow).Date;
            _logger.LogInformation($"🔔 [DueReminderService] Scanning accounts for reminders on {today:yyyy-MM-dd}");

            // 1. Fetch all active accounts in non-integrated mode (with NextDueDate or DueAmount > 0)
            var accounts = await _context.Accounts
                .Where(a => !a.IsDeleted && a.Status == "Active" && a.ReminderEnabled && a.DueAmount > 0)
                .ToListAsync();

            int sentCount = 0;

            foreach (var acc in accounts)
            {
                // Target due date
                DateTime targetDueDate = acc.NextDueDate?.Date ?? today.AddDays(acc.ReminderDaysBeforeDue);
                int daysRemaining = (targetDueDate - today).Days;

                bool shouldSend = false;

                if (acc.ReminderRiskLevel == "Standard" && daysRemaining == acc.ReminderDaysBeforeDue)
                {
                    shouldSend = true;
                }
                else if (acc.ReminderRiskLevel == "HighRisk" && (daysRemaining <= acc.ReminderDaysBeforeDue && daysRemaining >= 0))
                {
                    shouldSend = true;
                }
                else if (acc.ReminderRiskLevel == "Custom" && daysRemaining == acc.ReminderDaysBeforeDue)
                {
                    shouldSend = true;
                }

                if (acc.LastReminderSentAt.HasValue && acc.LastReminderSentAt.Value.Date == today)
                {
                    shouldSend = false;
                }

                if (shouldSend)
                {
                    var channels = (acc.ReminderChannels ?? "SMS,WhatsApp,Call").Split(',', StringSplitOptions.RemoveEmptyEntries);
                    
                    // Check wallet cost
                    decimal unitCost = 0;
                    foreach (var c in channels)
                    {
                        var tr = c.Trim().ToUpper();
                        if (tr == "SMS") unitCost += 0.20m;
                        else if (tr == "WHATSAPP") unitCost += 0.45m;
                        else if (tr == "CALL") unitCost += 0.90m;
                    }

                    // Check wallet balance
                    var wallet = await _walletService.GetBalanceAsync(1);
                    if (wallet.Balance < unitCost)
                    {
                        _logger.LogWarning($"⚠️ [DueReminderService] Insufficient Credits for Account #{acc.AccountNumber}. Required: ₹{unitCost}, Available: ₹{wallet.Balance}. Dispatches paused.");
                        continue;
                    }

                    // Deduct from wallet
                    await _walletService.DeductAsync(1, unitCost, string.Join(",", channels), 1, $"Auto reminder dispatch for Acc #{acc.AccountNumber}", acc.BranchCode);

                    foreach (var channel in channels)
                    {
                        var trimmedChannel = channel.Trim();
                        var msg = acc.ProductType.ToUpper() == "LOAN"
                            ? $"Dear {acc.CustomerName}, friendly reminder from DIGICOB Bank: Your Loan Account #{acc.AccountNumber} EMI of Rs.{acc.DueAmount:N2} is due on {targetDueDate:dd-MMM-yyyy}. Please pay on time."
                            : $"Dear {acc.CustomerName}, friendly reminder from DIGICOB Bank: Your {acc.ProductType} deposit of Rs.{acc.DueAmount:N2} is scheduled for {targetDueDate:dd-MMM-yyyy}.";

                        if (!string.IsNullOrEmpty(acc.CustomReminderNote))
                        {
                            msg += $" (Note: {acc.CustomReminderNote})";
                        }

                        _context.ReminderLogs.Add(new ReminderLog
                        {
                            AccountId = acc.Id,
                            AccountNumber = acc.AccountNumber,
                            CustomerName = acc.CustomerName,
                            MobileNumber = acc.MobileNumber,
                            BranchCode = acc.BranchCode,
                            Channel = trimmedChannel,
                            RiskLevel = acc.ReminderRiskLevel,
                            DueAmount = acc.DueAmount,
                            DueDate = targetDueDate,
                            SentAt = DateTime.UtcNow,
                            Status = "Delivered",
                            MessageContent = msg
                        });

                        sentCount++;
                    }

                    acc.LastReminderSentAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation($"✅ [DueReminderService] Dispatched {sentCount} due reminder alerts across all channels.");
            return sentCount;
        }

        public async Task<bool> CustomizeAccountReminderAsync(long accountId, int daysBefore, string channels, string riskLevel, string? note)
        {
            var acc = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == accountId);
            if (acc == null) return false;

            acc.ReminderDaysBeforeDue = daysBefore;
            acc.ReminderChannels = channels;
            acc.ReminderRiskLevel = riskLevel;
            acc.CustomReminderNote = note;
            acc.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<ReminderConfiguration> GetConfigurationAsync(int merchantId, string branchCode)
        {
            var config = await _context.ReminderConfigurations
                .FirstOrDefaultAsync(c => c.MerchantId == merchantId && (c.BranchCode == branchCode || c.BranchCode == "ALL"));

            if (config == null)
            {
                config = new ReminderConfiguration
                {
                    MerchantId = merchantId,
                    BranchCode = branchCode,
                    EnableAutomaticReminders = true,
                    DefaultDaysBeforeDue = 2,
                    EnableSms = true,
                    EnableWhatsApp = true,
                    EnableAutomatedCall = true,
                    HighRiskDaysBeforeDue = 3,
                    DailyExecutionTime = "08:00",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.ReminderConfigurations.Add(config);
                await _context.SaveChangesAsync();
            }

            return config;
        }

        public async Task<ReminderConfiguration> SaveConfigurationAsync(ReminderConfiguration config)
        {
            var existing = await _context.ReminderConfigurations
                .FirstOrDefaultAsync(c => c.MerchantId == config.MerchantId && c.BranchCode == config.BranchCode);

            if (existing != null)
            {
                existing.EnableAutomaticReminders = config.EnableAutomaticReminders;
                existing.DefaultDaysBeforeDue = config.DefaultDaysBeforeDue;
                existing.EnableSms = config.EnableSms;
                existing.EnableWhatsApp = config.EnableWhatsApp;
                existing.EnableAutomatedCall = config.EnableAutomatedCall;
                existing.HighRiskDaysBeforeDue = config.HighRiskDaysBeforeDue;
                existing.DailyExecutionTime = config.DailyExecutionTime;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                config.CreatedAt = DateTime.UtcNow;
                config.UpdatedAt = DateTime.UtcNow;
                _context.ReminderConfigurations.Add(config);
            }

            await _context.SaveChangesAsync();
            return existing ?? config;
        }

        public async Task<List<ReminderLog>> GetRecentLogsAsync(string? branchCode, int limit = 50)
        {
            var query = _context.ReminderLogs.AsQueryable();

            if (!string.IsNullOrEmpty(branchCode) && branchCode != "ALL")
            {
                query = query.Where(l => l.BranchCode == branchCode);
            }

            return await query
                .OrderByDescending(l => l.SentAt)
                .Take(limit)
                .ToListAsync();
        }
    }
}
`;

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Updated DueReminderService.cs with IWalletService integration.');
