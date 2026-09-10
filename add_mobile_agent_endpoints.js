const fs = require('fs');
const path = require('path');

console.log('🚀 Adding Dedicated Mobile Developer APIs for Agent Accounts & Due List in AccountController.cs...');

const accountCtrlPath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\EcollectApi\\Controllers\\AccountController.cs';

if (fs.existsSync(accountCtrlPath)) {
  let content = fs.readFileSync(accountCtrlPath, 'utf8');

  // Check if agent-accounts is already added
  if (!content.includes('agent-accounts')) {
    const mobileEndpoints = `
        // ============================================================
        // 9. MOBILE API: AGENT MAPPED ACCOUNTS (IntegrationStatus == 'N')
        // ============================================================
        /// <summary>
        /// Fetch all customer accounts mapped under a specific agent for mobile app
        /// </summary>
        [HttpGet("agent-accounts")]
        [HttpGet("agent/{agentCode}/accounts")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAgentAccounts(
            [FromQuery] string? agentCode,
            [FromRoute] string? agentCodeRoute = null,
            [FromQuery] string? branchCode = null,
            [FromQuery] string? productType = "ALL",
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 100)
        {
            try
            {
                var targetAgentCode = (!string.IsNullOrWhiteSpace(agentCode) ? agentCode : agentCodeRoute)?.Trim();

                if (string.IsNullOrWhiteSpace(targetAgentCode))
                {
                    return BadRequest(new { success = false, status = "ERROR", message = "agentCode parameter is required." });
                }

                var query = _context.Accounts
                    .AsNoTracking()
                    .Where(a => !a.IsDeleted && a.Status == "Active");

                // Filter strictly by Agent Code or Agent ID string match
                query = query.Where(a => 
                    a.AssignedAgentCode == targetAgentCode || 
                    (a.AssignedAgentId.HasValue && a.AssignedAgentId.Value.ToString() == targetAgentCode));

                // Optional Branch Code Filter
                if (!string.IsNullOrWhiteSpace(branchCode) && branchCode != "ALL")
                {
                    query = query.Where(a => a.BranchCode == branchCode.Trim());
                }

                // Optional Product Type Filter (LOAN, RD, DAILY_DEPOSIT, FD)
                if (!string.IsNullOrWhiteSpace(productType) && productType != "ALL")
                {
                    query = query.Where(a => a.ProductType.ToUpper() == productType.Trim().ToUpper());
                }

                // Optional Search (Account Number, Customer Name, Mobile Number)
                if (!string.IsNullOrWhiteSpace(search) && search != "ALL")
                {
                    var s = search.Trim().ToLower();
                    query = query.Where(a =>
                        a.AccountNumber.ToLower().Contains(s) ||
                        a.CustomerName.ToLower().Contains(s) ||
                        (a.MobileNumber != null && a.MobileNumber.Contains(s)));
                }

                var totalCount = await query.CountAsync();

                var accounts = await query
                    .OrderBy(a => a.CustomerName)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(a => new
                    {
                        id = a.Id,
                        accountNumber = a.AccountNumber,
                        customerName = a.CustomerName,
                        mobileNumber = a.MobileNumber ?? "",
                        productType = a.ProductType,
                        branchCode = a.BranchCode,
                        outstandingAmount = a.OutstandingAmount,
                        dueAmount = a.DueAmount,
                        emiAmount = a.EmiAmount,
                        emiFrequency = a.EmiFrequency,
                        lastPaidDate = a.LastPaidDate.HasValue ? a.LastPaidDate.Value.ToString("yyyy-MM-dd") : null,
                        nextDueDate = a.NextDueDate.HasValue ? a.NextDueDate.Value.ToString("yyyy-MM-dd") : null,
                        assignedAgentCode = a.AssignedAgentCode ?? targetAgentCode,
                        assignedAgentName = a.AssignedAgentName ?? "",
                        isDue = a.DueAmount > 0,
                        status = a.Status,
                        createdAt = a.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    status = "SUCCESS",
                    agentCode = targetAgentCode,
                    totalAccounts = totalCount,
                    currentPage = page,
                    pageSize = pageSize,
                    data = accounts
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching agent accounts for mobile");
                return StatusCode(500, new { success = false, status = "ERROR", message = ex.Message });
            }
        }

        // ============================================================
        // 10. MOBILE API: AGENT CUSTOMER DUE / DEMAND LIST (IntegrationStatus == 'N')
        // ============================================================
        /// <summary>
        /// Fetch active due demand list mapped under an agent for daily mobile collections
        /// </summary>
        [HttpGet("agent-due-list")]
        [HttpGet("agent/{agentCode}/dues")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAgentDueList(
            [FromQuery] string? agentCode,
            [FromRoute] string? agentCodeRoute = null,
            [FromQuery] string? branchCode = null,
            [FromQuery] string? productType = "ALL",
            [FromQuery] string? dueDate = null,
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 100)
        {
            try
            {
                var targetAgentCode = (!string.IsNullOrWhiteSpace(agentCode) ? agentCode : agentCodeRoute)?.Trim();

                if (string.IsNullOrWhiteSpace(targetAgentCode))
                {
                    return BadRequest(new { success = false, status = "ERROR", message = "agentCode parameter is required." });
                }

                var query = _context.Accounts
                    .AsNoTracking()
                    .Where(a => !a.IsDeleted && a.Status == "Active" && a.DueAmount > 0);

                // Filter strictly by Agent Code
                query = query.Where(a => 
                    a.AssignedAgentCode == targetAgentCode || 
                    (a.AssignedAgentId.HasValue && a.AssignedAgentId.Value.ToString() == targetAgentCode));

                // Optional Branch Code Filter
                if (!string.IsNullOrWhiteSpace(branchCode) && branchCode != "ALL")
                {
                    query = query.Where(a => a.BranchCode == branchCode.Trim());
                }

                // Optional Product Type Filter
                if (!string.IsNullOrWhiteSpace(productType) && productType != "ALL")
                {
                    query = query.Where(a => a.ProductType.ToUpper() == productType.Trim().ToUpper());
                }

                // Optional Due Date Filter (e.g. dues on or before date)
                if (!string.IsNullOrWhiteSpace(dueDate) && dueDate != "ALL")
                {
                    if (dueDate.Equals("TODAY", StringComparison.OrdinalIgnoreCase))
                    {
                        var todayEnd = DateTime.UtcNow.Date.AddDays(1);
                        query = query.Where(a => a.NextDueDate.HasValue && a.NextDueDate.Value < todayEnd);
                    }
                    else if (DateTime.TryParse(dueDate, out var parsedDate))
                    {
                        var targetEnd = parsedDate.Date.AddDays(1);
                        query = query.Where(a => a.NextDueDate.HasValue && a.NextDueDate.Value < targetEnd);
                    }
                }

                // Optional Search (Customer name, mobile, account)
                if (!string.IsNullOrWhiteSpace(search) && search != "ALL")
                {
                    var s = search.Trim().ToLower();
                    query = query.Where(a =>
                        a.AccountNumber.ToLower().Contains(s) ||
                        a.CustomerName.ToLower().Contains(s) ||
                        (a.MobileNumber != null && a.MobileNumber.Contains(s)));
                }

                var totalDueRecords = await query.CountAsync();
                var totalDueAmount = await query.SumAsync(a => (decimal?)a.DueAmount) ?? 0m;
                var totalEmiAmount = await query.SumAsync(a => (decimal?)a.EmiAmount) ?? 0m;

                var rawList = await query
                    .OrderBy(a => a.NextDueDate ?? DateTime.MaxValue)
                    .ThenByDescending(a => a.DueAmount)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var now = DateTime.UtcNow.Date;

                var duesList = rawList.Select(a =>
                {
                    int dpd = 0;
                    if (a.NextDueDate.HasValue && a.NextDueDate.Value.Date < now)
                    {
                        dpd = (int)(now - a.NextDueDate.Value.Date).TotalDays;
                    }
                    else if (a.LastPaidDate.HasValue && a.LastPaidDate.Value.Date < now)
                    {
                        dpd = (int)(now - a.LastPaidDate.Value.Date).TotalDays;
                    }

                    string riskLevel = "Regular (0 DPD)";
                    if (dpd > 90) riskLevel = "NPA (>90 DPD)";
                    else if (dpd > 60) riskLevel = "SMA-2 (61-90 DPD)";
                    else if (dpd > 30) riskLevel = "SMA-1 (31-60 DPD)";
                    else if (dpd > 0) riskLevel = $"SMA-0 ({dpd} DPD)";

                    return new
                    {
                        id = a.Id,
                        accountNumber = a.AccountNumber,
                        customerName = a.CustomerName,
                        mobileNumber = a.MobileNumber ?? "",
                        productType = a.ProductType,
                        branchCode = a.BranchCode,
                        dueAmount = a.DueAmount,
                        emiAmount = a.EmiAmount,
                        outstandingAmount = a.OutstandingAmount,
                        emiFrequency = a.EmiFrequency,
                        nextDueDate = a.NextDueDate.HasValue ? a.NextDueDate.Value.ToString("yyyy-MM-dd") : null,
                        lastPaidDate = a.LastPaidDate.HasValue ? a.LastPaidDate.Value.ToString("yyyy-MM-dd") : null,
                        daysPastDue = dpd,
                        riskCategory = riskLevel,
                        assignedAgentCode = a.AssignedAgentCode ?? targetAgentCode,
                        assignedAgentName = a.AssignedAgentName ?? "",
                        status = a.Status
                    };
                }).ToList();

                return Ok(new
                {
                    success = true,
                    status = "SUCCESS",
                    agentCode = targetAgentCode,
                    summary = new
                    {
                        totalCustomersDue = totalDueRecords,
                        totalDueAmount = totalDueAmount,
                        totalEmiAmount = totalEmiAmount
                    },
                    currentPage = page,
                    pageSize = pageSize,
                    data = duesList
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching agent due list for mobile");
                return StatusCode(500, new { success = false, status = "ERROR", message = ex.Message });
            }
        }
`;

    // Insert before last closing brace in AccountController.cs
    const lastBraceIndex = content.lastIndexOf('    }');
    if (lastBraceIndex !== -1) {
      content = content.substring(0, lastBraceIndex) + mobileEndpoints + content.substring(lastBraceIndex);
      fs.writeFileSync(accountCtrlPath, content, 'utf8');
      console.log('✅ Added GetAgentAccounts and GetAgentDueList endpoints to AccountController.cs');
    }
  } else {
    console.log('ℹ️ Agent mobile endpoints already exist in AccountController.cs');
  }
}
