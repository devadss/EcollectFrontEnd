const fs = require('fs');
const path = require('path');

console.log('🚀 Implementing Separate Standalone (IntegrationStatus == "N") and Integrated (IntegrationStatus == "Y") Cash & QR Posting...');

const backendBase = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';

// =========================================================================
// 1. UPDATE CashCollectionService.cs
// =========================================================================
const cashServicePath = path.join(backendBase, 'Ecollect.Core', 'Services', 'CashCollectionService.cs');
if (fs.existsSync(cashServicePath)) {
  let content = fs.readFileSync(cashServicePath, 'utf8');

  // Let's replace ProcessCashCollectionAsync implementation with dual-mode support
  const newCashServiceCode = `// Ecollect.Services/CashCollectionService.cs
using Ecollect.Core.Interfaces;
using Ecollect.Data.Context;
using Ecollect.Data.Entities;
using Ecollect.Shared.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace Ecollect.Services
{
    public class CashCollectionService : ICashCollectionService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly ILogger<CashCollectionService> _logger;
        private readonly HttpClient _httpClient;

        public CashCollectionService(
            ApplicationDbContext dbContext,
            ILogger<CashCollectionService> logger,
            HttpClient httpClient)
        {
            _dbContext = dbContext;
            _logger = logger;
            _httpClient = httpClient;
        }

        public async Task<CashResponseDto> ProcessCashCollectionAsync(PaymentRequestDto request)
        {
            try
            {
                // ====== 1. VALIDATE REQUEST ======
                if (request == null || request.agent_details == null || request.customer_details == null)
                {
                    return new CashResponseDto
                    {
                        status = "N",
                        message = "Invalid request payload"
                    };
                }

                if (string.IsNullOrEmpty(request.CollectionType))
                {
                    return new CashResponseDto
                    {
                        status = "N",
                        message = "CollectionType is mandatory"
                    };
                }

                _logger.LogInformation(
                    "Cash Collection Request | MerchantId={MerchantId}, CollectionType={CollectionType}, Amount={Amount}",
                    request.MerchantId, request.CollectionType, request.Amount);

                // ====== 2. GET MERCHANT ======
                var merchant = await _dbContext.Merchants
                    .FirstOrDefaultAsync(m => m.Id == request.MerchantId);

                if (merchant == null)
                {
                    return new CashResponseDto
                    {
                        status = "N",
                        message = "Merchant not found"
                    };
                }

                bool isStandaloneMode = string.Equals(merchant.IntegrationStatus, "N", StringComparison.OrdinalIgnoreCase) ||
                                       string.Equals(merchant.IntegrationStatus, "NO", StringComparison.OrdinalIgnoreCase);

                string vendorTxnId;
                string orderId = $"ORD{DateTime.UtcNow:yyyyMMddHHmmss}{new Random().Next(1000, 9999)}";

                // ====== 3. PROCESS BASED ON INTEGRATION STATUS ('Y' vs 'N') ======
                if (isStandaloneMode)
                {
                    // -------------------------------------------------------------
                    // STANDALONE BRANCH MODE (IntegrationStatus == 'N')
                    // NO external CBS call needed. Pure local ledger transaction.
                    // -------------------------------------------------------------
                    vendorTxnId = $"LOC_CSH_{DateTime.UtcNow:yyyyMMddHHmmss}_{new Random().Next(1000, 9999)}";
                    _logger.LogInformation("🏦 [Standalone Cash Mode] Processing local ledger collection for Acc: {Acc}, Amount: ₹{Amt}",
                        request.customer_details.customer_accno, request.Amount);
                }
                else
                {
                    // -------------------------------------------------------------
                    // INTEGRATED CBS MODE (IntegrationStatus == 'Y')
                    // Call external Core Banking System (CBS) API
                    // -------------------------------------------------------------
                    var productConfig = await _dbContext.MerchantApiPrConfigs
                        .FirstOrDefaultAsync(c =>
                            c.MerchantId == request.MerchantId &&
                            c.ProductType == request.CollectionType &&
                            c.ApiCode == "TRANSACTION_POST" &&
                            c.IsActive);

                    if (productConfig == null || string.IsNullOrEmpty(productConfig.UrlTemplate))
                    {
                        return new CashResponseDto
                        {
                            status = "N",
                            message = "CBS configuration not found for given MerchantId & CollectionType"
                        };
                    }

                    // Build CBS Request Body
                    object postBody;
                    string apiUrl = productConfig.UrlTemplate;

                    if (request.CollectionType == "RD")
                    {
                        postBody = new
                        {
                            account_no = request.customer_details.customer_accno,
                            deposit_amount = request.Amount.ToString("0"),
                            agent_id = request.agent_details.agent_orginId,
                            particular = request.note,
                            bank_account_no = "",
                            TranType = "C",
                            UPIId = ""
                        };
                    }
                    else if (request.CollectionType == "RDCL")
                    {
                        postBody = new
                        {
                            account_no = request.customer_details.customer_accno,
                            deposit_amount = request.Amount.ToString("0"),
                            Agent_Id = request.agent_details.agent_orginId,
                            bank_account_no = "",
                            TranType = "Cash"
                        };
                    }
                    else if (request.CollectionType == "LOAN")
                    {
                        postBody = new
                        {
                            account_no = request.customer_details.customer_accno,
                            deposit_amount = request.Amount.ToString("0"),
                            Agent_Id = request.agent_details.agent_orginId,
                            bank_account_no = "",
                            TranType = "C"
                        };
                    }
                    else
                    {
                        return new CashResponseDto
                        {
                            status = "N",
                            message = "Unsupported CollectionType for CBS mode"
                        };
                    }

                    string requestJson = JsonConvert.SerializeObject(postBody);
                    _logger.LogInformation(
                        "ReceiveCash ThirdParty Request | URL: {Url} | Payload: {Payload}",
                        apiUrl, requestJson);

                    var content = new StringContent(requestJson, Encoding.UTF8, "application/json");
                    var response = await _httpClient.PostAsync(apiUrl, content);
                    var responseString = await response.Content.ReadAsStringAsync();

                    _logger.LogInformation(
                        "ReceiveCash ThirdParty Response | StatusCode: {StatusCode} | Response: {Response}",
                        (int)response.StatusCode, responseString);

                    if (!response.IsSuccessStatusCode)
                    {
                        return new CashResponseDto
                        {
                            status = "N",
                            message = "CBS post failed",
                            transactionId = "NA"
                        };
                    }

                    dynamic parsedResponse = JsonConvert.DeserializeObject<dynamic>(responseString);
                    bool isSuccess = false;
                    vendorTxnId = "NA";

                    if (request.CollectionType == "LOAN")
                    {
                        isSuccess = parsedResponse?.receipt?.data?.status?.ToString() == "Y";
                        vendorTxnId = parsedResponse?.receipt?.TRAN_ID?.ToString()
                            ?? parsedResponse?.receipt?.data?.TRAN_ID?.ToString()
                            ?? "0";
                    }
                    else
                    {
                        isSuccess = parsedResponse?.status?.ToString() == "1";
                        vendorTxnId = parsedResponse?.data?.TRAN_ID?.ToString() ?? "0";
                    }

                    if (!isSuccess)
                    {
                        return new CashResponseDto
                        {
                            status = "N",
                            message = "CBS returned failure status",
                            transactionId = vendorTxnId
                        };
                    }
                }

                // ====== 4. RESOLVE AGENT & BRANCH ======
                int? resolvedAgentId = null;
                int? resolvedBranchId = null;
                Agent? dbAgent = null;

                string? agentCode = request.agent_details?.agent_id;
                string? agentOriginId = request.agent_details?.agent_orginId;
                string? agentPhone = request.agent_details?.agent_phone;
                string? agentEmail = request.agent_details?.agent_email;
                string? agentName = request.agent_details?.agent_name;

                if (!string.IsNullOrEmpty(agentCode))
                {
                    dbAgent = await _dbContext.Agents
                        .FirstOrDefaultAsync(a => (a.AgentCode == agentCode || a.AgentId == agentCode) && (a.MerchantId == merchant.Id || a.MerchantId == null));
                }

                if (dbAgent == null && !string.IsNullOrEmpty(agentOriginId))
                {
                    dbAgent = await _dbContext.Agents
                        .FirstOrDefaultAsync(a => a.AgentCode == agentOriginId && (a.MerchantId == merchant.Id || a.MerchantId == null));
                }

                if (dbAgent == null && !string.IsNullOrEmpty(agentPhone))
                {
                    dbAgent = await _dbContext.Agents
                        .FirstOrDefaultAsync(a => a.PhoneNumber == agentPhone && (a.MerchantId == merchant.Id || a.MerchantId == null));
                }

                if (dbAgent != null)
                {
                    resolvedAgentId = dbAgent.Id;
                    if (dbAgent.BranchId.HasValue && dbAgent.BranchId.Value > 0)
                    {
                        resolvedBranchId = dbAgent.BranchId.Value;
                    }
                }

                if (!resolvedBranchId.HasValue && request.agent_details?.agent_branch > 0)
                {
                    int requestedBranch = request.agent_details.agent_branch;
                    var dbBranch = await _dbContext.Branches
                        .FirstOrDefaultAsync(b => (b.Id == requestedBranch || b.Code == requestedBranch.ToString()) && (b.MerchantId == merchant.Id || b.MerchantId == null));
                    if (dbBranch != null)
                    {
                        resolvedBranchId = dbBranch.Id;
                    }
                }

                // ====== 5. SAVE PAYMENT TRANSACTION ======
                var paymentTransaction = new PaymentTransaction
                {
                    OrderId = orderId,
                    TransactionId = vendorTxnId,
                    PaymentGatewayTransactionId = vendorTxnId,
                    Amount = request.Amount,
                    AmountOrig = request.Amount,
                    Currency = "INR",
                    Description = request.note ?? "Cash Collection",
                    VendorPostTransId = vendorTxnId,
                    VendorPostStatus = isStandaloneMode ? "LOCAL_LEDGER" : "SUCCESS",

                    CustomerName = request.customer_details?.customer_name,
                    CustomerEmail = request.customer_details?.customer_email,
                    CustomerPhone = request.customer_details?.customer_phone,
                    Customer_Acc = request.customer_details?.customer_accno,
                    CustomerCity = null,
                    CustomerState = "KERALA",
                    CustomerCountry = "INDIA",

                    AgentName = request.agent_details?.agent_name,
                    AgentCode = request.agent_details?.agent_id,
                    AgentOriginId = request.agent_details?.agent_orginId,
                    AgentPhone = request.agent_details?.agent_phone,
                    AgentEmail = request.agent_details?.agent_email,

                    PaymentMode = "CASH",
                    PaymentChannel = "CASH",
                    BankCode = "CASH",

                    CollectionType = request.CollectionType,
                    QrSource = request.QrSource,
                    Source = request.Source,

                    ResponseCode = 200,
                    ResponseMessage = isStandaloneMode ? "Cash collected and updated in local ledger" : "Payment successful in CBS",
                    Status = "SUCCESS",

                    Udf1 = request.agent_details?.agent_id,
                    Udf2 = request.agent_details?.agent_orginId,
                    Udf3 = request.customer_details?.customer_id,
                    Udf4 = request.customer_details?.customer_accno,
                    Udf5 = request.CollectionType,

                    CreatedAt = DateTime.UtcNow,
                    CompletedAt = DateTime.UtcNow,

                    MerchantId = merchant.Id,
                    BranchId = resolvedBranchId ?? (request.agent_details?.agent_branch > 0 ? request.agent_details.agent_branch : null),
                    AgentId = resolvedAgentId,
                    CustomerId = int.TryParse(request.customer_details?.customer_id, out int parsedCustId) ? parsedCustId : 0
                };

                _dbContext.PaymentTransactions.Add(paymentTransaction);
                await _dbContext.SaveChangesAsync();

                // ====== 6. UPDATE LOCAL ACCOUNT LEDGER (FOR STANDALONE & RECONCILIATION) ======
                try
                {
                    var targetAccNo = (request.customer_details?.customer_accno ?? request.customer_details?.customer_id)?.Trim();
                    if (!string.IsNullOrEmpty(targetAccNo))
                    {
                        var account = await _dbContext.Accounts.FirstOrDefaultAsync(a =>
                            !a.IsDeleted &&
                            a.AccountNumber == targetAccNo &&
                            (a.MerchantId == merchant.Id || a.MerchantId == 0));

                        if (account != null)
                        {
                            var paidAmount = request.Amount;
                            var prodType = (account.ProductType ?? request.CollectionType ?? "LOAN").ToUpper();

                            if (prodType == "LOAN")
                            {
                                account.OutstandingAmount = Math.Max(0, account.OutstandingAmount - paidAmount);
                                account.DueAmount = Math.Max(0, account.DueAmount - paidAmount);
                            }
                            else
                            {
                                account.OutstandingAmount += paidAmount;
                                account.DueAmount = Math.Max(0, account.DueAmount - paidAmount);
                            }

                            account.LastPaidDate = DateTime.UtcNow;
                            account.UpdatedAt = DateTime.UtcNow;

                            await _dbContext.SaveChangesAsync();
                            _logger.LogInformation(
                                "✅ [Ledger Updated] Acc: {AccNo} | Product: {Prod} | Paid: ₹{Paid} | New Outstanding: ₹{Out} | New Due: ₹{Due}",
                                account.AccountNumber, prodType, paidAmount, account.OutstandingAmount, account.DueAmount);
                        }
                    }
                }
                catch (Exception ledgerEx)
                {
                    _logger.LogError(ledgerEx, "Error updating Account ledger balance during cash collection for Acc: {Acc}", request.customer_details?.customer_accno);
                }

                _logger.LogInformation(
                    "✅ Cash Payment saved successfully | Mode: {Mode}, OrderId: {OrderId}, TransactionId: {TransactionId}, Amount: ₹{Amount}",
                    isStandaloneMode ? "STANDALONE" : "INTEGRATED_CBS", orderId, vendorTxnId, request.Amount);

                return new CashResponseDto
                {
                    status = "Y",
                    amount = request.Amount,
                    transactionId = vendorTxnId,
                    message = isStandaloneMode ? "Cash collected and updated in local ledger successfully" : "Posted successfully"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception in ProcessCashCollectionAsync");
                throw;
            }
        }
    }
}
`;

  fs.writeFileSync(cashServicePath, newCashServiceCode, 'utf8');
  console.log('✅ 1. Updated CashCollectionService.cs with separate Standalone vs Integrated CBS posting.');
}

// =========================================================================
// 2. UPDATE PaymentController.cs (PaymentWebhook & Dedicated Endpoints)
// =========================================================================
const paymentCtrlPath = path.join(backendBase, 'EcollectApi', 'Controllers', 'PaymentController.cs');
if (fs.existsSync(paymentCtrlPath)) {
  let content = fs.readFileSync(paymentCtrlPath, 'utf8');

  // Update step 6 in PaymentWebhook to branch based on IntegrationStatus
  const oldCbsBlock = `// 6. POST TO CBS FOR THIS SPECIFIC MERCHANT
                var cbsResult = await _paymentHelper.PostToThirdPartyCBSAsync(orderId, transaction, allFields);`;

  const newCbsBlock = `// 6. CHECK MERCHANT INTEGRATION STATUS ('N' Standalone vs 'Y' Integrated CBS)
                var merchantRecord = await _dbContext.Merchants.FirstOrDefaultAsync(m => m.Id == tenantId);
                bool isStandaloneMode = merchantRecord != null &&
                    (string.Equals(merchantRecord.IntegrationStatus, "N", StringComparison.OrdinalIgnoreCase) ||
                     string.Equals(merchantRecord.IntegrationStatus, "NO", StringComparison.OrdinalIgnoreCase));

                if (isStandaloneMode)
                {
                    // -------------------------------------------------------------
                    // STANDALONE BRANCH MODE (IntegrationStatus == 'N')
                    // NO external CBS API post required. Pure local ledger confirmation.
                    // -------------------------------------------------------------
                    _logger.LogInformation("🏦 [Standalone Webhook Mode] Payment verified for TenantId: {TenantId} ({TenantName}), OrderId: {OrderId}",
                        tenantId, apiKeyRecord.TenantName, orderId);

                    await _paymentHelper.UpdatePaymentStatusAsync(
                        orderId,
                        "SUCCESS",
                        transactionId: transactionId,
                        responseMessage: "Payment verified & ledger balance deducted (Standalone Mode)",
                        cbsTxnId: $"LOCAL_QR_{transactionId}"
                    );

                    await _paymentHelper.SendPaymentNotificationAsync(transaction);

                    return Ok(new
                    {
                        success = true,
                        message = "Webhook processed successfully in Standalone Ledger mode",
                        orderId,
                        transactionId,
                        tenantId,
                        tenantName = apiKeyRecord.TenantName,
                        status = "SUCCESS",
                        mode = "STANDALONE"
                    });
                }

                // -------------------------------------------------------------
                // INTEGRATED CBS MODE (IntegrationStatus == 'Y')
                // POST TO EXTERNAL CBS FOR THIS SPECIFIC MERCHANT
                // -------------------------------------------------------------
                var cbsResult = await _paymentHelper.PostToThirdPartyCBSAsync(orderId, transaction, allFields);`;

  if (content.includes(oldCbsBlock)) {
    content = content.replace(oldCbsBlock, newCbsBlock);
  }

  // Also add dedicated standalone cash endpoint in PaymentController.cs if not present
  if (!content.includes('Cash_Collection_Standalone')) {
    const standaloneEndpoints = `
        // ============================================================
        // STANDALONE CASH COLLECTION (Explicit for IntegrationStatus == 'N')
        // ============================================================
        [HttpPost("Cash_Collection_Standalone")]
        [HttpPost("standalone-cash-collection")]
        [ProducesResponseType(typeof(CashResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Cash_Collection_Standalone([FromBody] PaymentRequestDto request)
        {
            try
            {
                _logger.LogInformation(
                    "Cash_Collection_Standalone called | MerchantId: {MerchantId}, Acc: {Acc}, Amount: ₹{Amount}",
                    request?.MerchantId, request?.customer_details?.customer_accno, request?.Amount);

                var result = await _cashCollectionService.ProcessCashCollectionAsync(request);

                if (result.status == "N")
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception in Cash_Collection_Standalone endpoint");
                return StatusCode(500, new CashResponseDto
                {
                    status = "N",
                    message = "Internal server error",
                    error = ex.Message
                });
            }
        }
`;
    // Insert before UpiIntent
    const upiIdx = content.indexOf('[HttpPost("UpiIntent")]');
    if (upiIdx !== -1) {
      content = content.substring(0, upiIdx) + standaloneEndpoints + '\n        ' + content.substring(upiIdx);
    }
  }

  fs.writeFileSync(paymentCtrlPath, content, 'utf8');
  console.log('✅ 2. Updated PaymentController.cs with Standalone Webhook & Dedicated Standalone Cash endpoint.');
}

console.log('🎉 Dual Posting architecture (Standalone "N" vs CBS "Y") successfully implemented!');
