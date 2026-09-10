const fs = require('fs');
const path = require('path');

console.log('🚀 Updating Backend for Multi-Tenant Webhook with ApiKeys Lookup...');

const backendBase = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';

// 1. Update ApiKeys.cs entity
const apiKeysPath = path.join(backendBase, 'Ecollect.Data', 'Entities', 'ApiKeys.cs');
const apiKeysContent = `using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ecollect.Data.Entities
{
    [Table("ApiKeys")]
    public class ApiKeys
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ApiKeyId { get; set; }

        [Required]
        public int TenantId { get; set; }

        [MaxLength(255)]
        public string? TenantName { get; set; }

        [MaxLength(100)]
        public string? Mid { get; set; }

        [MaxLength(100)]
        public string? ProviderName { get; set; }

        [Required]
        [MaxLength(255)]
        public string ApiKey { get; set; }

        [Required]
        [MaxLength(100)]
        public string Salt { get; set; }

        [MaxLength(255)]
        public string? EncryptionKey { get; set; }

        [MaxLength(255)]
        public string? DecryptionKey { get; set; }

        [Required]
        [MaxLength(20)]
        public string Mode { get; set; } = "LIVE";

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
`;

fs.writeFileSync(apiKeysPath, apiKeysContent, 'utf8');
console.log('✅ 1. Updated ApiKeys.cs with TenantName and Mid.');

// 2. Update PaymentController.cs
const paymentCtrlPath = path.join(backendBase, 'EcollectApi', 'Controllers', 'PaymentController.cs');
if (fs.existsSync(paymentCtrlPath)) {
  let content = fs.readFileSync(paymentCtrlPath, 'utf8');

  // Replace PaymentWebhook method and ExtractMerchantIdFromOrderId
  const webhookStartMarker = '[HttpPost("webhook/payment")]';
  const nextMethodMarker = '[HttpPost("webhook/settlement")]';

  const startIndex = content.indexOf(webhookStartMarker);
  const endIndex = content.indexOf(nextMethodMarker);

  if (startIndex !== -1 && endIndex !== -1) {
    const updatedWebhookCode = `[HttpPost("webhook/payment")]
        [HttpGet("webhook/payment")]
        [AllowAnonymous]
        public async Task<IActionResult> PaymentWebhook()
        {
            var correlationId = Guid.NewGuid().ToString("N");
            var startTime = DateTime.UtcNow;

            try
            {
                // 1. EXTRACT ALL WEBHOOK FIELDS (Supports Form-data, Form-urlencoded, JSON Body, and Query parameters)
                var allFields = await ExtractWebhookPayloadAsync(Request);

                _logger.LogInformation(
                    "PAYMENT WEBHOOK RECEIVED | CorrelationId: {CorrelationId} | Total Fields: {Count} | Data: {@WebhookData}",
                    correlationId,
                    allFields.Count,
                    allFields
                );

                var orderId = allFields.GetValueOrDefault("order_id") ?? allFields.GetValueOrDefault("orderId");
                var hash = allFields.GetValueOrDefault("hash") ?? allFields.GetValueOrDefault("Hash");
                var transactionId = allFields.GetValueOrDefault("transaction_id") ?? allFields.GetValueOrDefault("transactionId");
                var incomingApiKey = allFields.GetValueOrDefault("api_key") ?? allFields.GetValueOrDefault("apiKey") ?? allFields.GetValueOrDefault("key");
                var incomingMid = allFields.GetValueOrDefault("mid") ?? allFields.GetValueOrDefault("merchant_id") ?? allFields.GetValueOrDefault("merchantId");
                var amountStr = allFields.GetValueOrDefault("amount") ?? "0";
                var responseCode = allFields.GetValueOrDefault("response_code") ?? allFields.GetValueOrDefault("responseCode") ?? "";
                var pgStatus = allFields.GetValueOrDefault("status") ?? allFields.GetValueOrDefault("payment_status") ?? "";

                // Basic validation
                if (string.IsNullOrWhiteSpace(orderId))
                    return BadRequest(new { success = false, message = "Missing order_id in webhook payload." });

                if (string.IsNullOrWhiteSpace(hash))
                    return BadRequest(new { success = false, message = "Missing hash signature in webhook payload." });

                // 2. STRICT MULTI-TENANT MERCHANT RESOLUTION VIA ApiKeys TABLE
                ApiKeys? apiKeyRecord = null;

                // Step A: Primary Lookup by ApiKey
                if (!string.IsNullOrWhiteSpace(incomingApiKey))
                {
                    apiKeyRecord = await _dbContext.ApiKeys
                        .AsNoTracking()
                        .FirstOrDefaultAsync(k => k.ApiKey == incomingApiKey.Trim() && k.IsActive);

                    if (apiKeyRecord != null)
                    {
                        _logger.LogInformation("✅ Webhook Tenant resolved via ApiKey: TenantId: {TenantId} ({TenantName})",
                            apiKeyRecord.TenantId, apiKeyRecord.TenantName ?? "N/A");
                    }
                }

                // Step B: Secondary Lookup by MID (if ApiKey not matched or not provided)
                if (apiKeyRecord == null && !string.IsNullOrWhiteSpace(incomingMid))
                {
                    apiKeyRecord = await _dbContext.ApiKeys
                        .AsNoTracking()
                        .FirstOrDefaultAsync(k => (k.Mid == incomingMid.Trim() || k.TenantId.ToString() == incomingMid.Trim()) && k.IsActive);

                    if (apiKeyRecord != null)
                    {
                        _logger.LogInformation("✅ Webhook Tenant resolved via MID: TenantId: {TenantId} ({TenantName})",
                            apiKeyRecord.TenantId, apiKeyRecord.TenantName ?? "N/A");
                    }
                }

                // Step C: Fallback Check on existing PaymentTransaction in database
                if (apiKeyRecord == null)
                {
                    var existingTx = await _dbContext.PaymentTransactions
                        .AsNoTracking()
                        .FirstOrDefaultAsync(p => p.OrderId == orderId.Trim());

                    if (existingTx != null && existingTx.MerchantId > 0)
                    {
                        apiKeyRecord = await _dbContext.ApiKeys
                            .AsNoTracking()
                            .FirstOrDefaultAsync(k => k.TenantId == existingTx.MerchantId && k.IsActive);
                    }
                }

                // Reject if tenant cannot be resolved from ApiKeys table (NO HARDCODED DEFAULT MERCHANT 1)
                if (apiKeyRecord == null || string.IsNullOrWhiteSpace(apiKeyRecord.Salt))
                {
                    _logger.LogError("❌ UNRESOLVED TENANT: Webhook rejected. No active ApiKey row found in ApiKeys table for ApiKey: '{ApiKey}', MID: '{Mid}', OrderId: '{OrderId}'",
                        incomingApiKey, incomingMid, orderId);

                    return BadRequest(new 
                    { 
                        success = false, 
                        message = "Unauthorized: Webhook tenant could not be identified in ApiKeys configuration." 
                    });
                }

                int tenantId = apiKeyRecord.TenantId;

                // 3. CRYPTOGRAPHIC HASH VERIFICATION USING THIS MERCHANT'S SALT (Before modifying Database)
                var fieldsForHash = allFields
                    .Where(kvp => !kvp.Key.Equals("hash", StringComparison.OrdinalIgnoreCase))
                    .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);

                var calculatedHash = _paymentHelper.GenerateHash(apiKeyRecord.Salt, fieldsForHash);

                if (!calculatedHash.Equals(hash.Trim(), StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning("❌ HASH MISMATCH for TenantId: {TenantId} ({TenantName}), OrderId: {OrderId}. Expected: {Expected}, Received: {Received}",
                        tenantId, apiKeyRecord.TenantName, orderId, calculatedHash, hash);

                    return Unauthorized(new { success = false, message = "Invalid cryptographic hash signature." });
                }

                _logger.LogInformation("✅ HASH VERIFIED for TenantId: {TenantId} ({TenantName}), OrderId: {OrderId}",
                    tenantId, apiKeyRecord.TenantName, orderId);

                decimal amount = decimal.TryParse(amountStr, out var parsedAmt) ? parsedAmt : 0m;
                bool isSuccess = (responseCode == "0" || responseCode == "00" ||
                                  pgStatus.Equals("SUCCESS", StringComparison.OrdinalIgnoreCase) ||
                                  pgStatus.Equals("COMPLETED", StringComparison.OrdinalIgnoreCase) ||
                                  pgStatus.Equals("PAID", StringComparison.OrdinalIgnoreCase));

                // 4. INSERT OR UPDATE TRANSACTION STRICTLY AGAINST THIS MERCHANT (Tenant Isolation)
                var transaction = await _paymentHelper.CreateOrUpdatePaymentAsync(
                    orderId,
                    amount,
                    allFields.GetValueOrDefault("currency") ?? "INR",
                    allFields.GetValueOrDefault("description") ?? "Payment",
                    tenantId, // Strictly using resolved TenantId from ApiKeys table
                    allFields
                );

                // 5. HANDLE PAYMENT FAILURE AT GATEWAY
                if (!isSuccess)
                {
                    var failMessage = allFields.GetValueOrDefault("response_message") ?? allFields.GetValueOrDefault("error_desc") ?? "Payment failed at gateway";
                    await _paymentHelper.UpdatePaymentStatusAsync(orderId, "FAILED", transactionId, failMessage);
                    await _paymentHelper.SendPaymentNotificationAsync(transaction);

                    return Ok(new
                    {
                        success = true,
                        message = "Payment status marked as FAILED based on gateway callback",
                        orderId,
                        transactionId,
                        tenantId,
                        tenantName = apiKeyRecord.TenantName,
                        status = "FAILED"
                    });
                }

                // 6. POST TO CBS FOR THIS SPECIFIC MERCHANT
                var cbsResult = await _paymentHelper.PostToThirdPartyCBSAsync(orderId, transaction, allFields);

                if (!cbsResult.Success)
                {
                    await _paymentHelper.UpdatePaymentStatusAsync(
                        orderId,
                        "PENDING_CBS",
                        transactionId: transactionId,
                        responseMessage: $"Payment verified; CBS posting queued: {cbsResult.Message}",
                        cbsTxnId: cbsResult.TransactionId
                    );

                    await _paymentHelper.SendPaymentNotificationAsync(transaction);

                    return Ok(new
                    {
                        success = true,
                        message = "Payment verified; CBS posting pending",
                        orderId,
                        transactionId,
                        tenantId,
                        tenantName = apiKeyRecord.TenantName,
                        cbsStatus = "PENDING"
                    });
                }

                // 7. MARK STATUS SUCCESS & TRIGGER SOUNDBOX / FCM NOTIFICATIONS
                await _paymentHelper.UpdatePaymentStatusAsync(
                    orderId,
                    "SUCCESS",
                    transactionId: transactionId,
                    responseMessage: "Payment verified & CBS posted successfully",
                    cbsTxnId: cbsResult.TransactionId
                );

                await _paymentHelper.SendPaymentNotificationAsync(transaction);

                return Ok(new
                {
                    success = true,
                    message = "Webhook processed successfully",
                    orderId,
                    transactionId,
                    tenantId,
                    tenantName = apiKeyRecord.TenantName,
                    status = "SUCCESS",
                    cbsTransactionId = cbsResult.TransactionId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error processing multi-tenant webhook for OrderId");
                return StatusCode(500, new { success = false, message = "Internal server error processing webhook", error = ex.Message });
            }
        }

        /// <summary>
        /// Robust helper to extract Form, JSON Body, and Query parameters dynamically into a Case-Insensitive Dictionary
        /// </summary>
        private async Task<Dictionary<string, string>> ExtractWebhookPayloadAsync(HttpRequest request)
        {
            var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            // 1. Read Form data if available (Form-urlencoded or Multipart)
            if (request.HasFormContentType)
            {
                var form = await request.ReadFormAsync();
                foreach (var key in form.Keys)
                {
                    dict[key] = form[key].ToString();
                }
            }

            // 2. Read Query parameters (e.g. for return_url GET redirects)
            foreach (var q in request.Query)
            {
                if (!dict.ContainsKey(q.Key))
                    dict[q.Key] = q.Value.ToString();
            }

            // 3. If body is JSON, deserialize JSON properties
            if (dict.Count == 0 && (request.ContentLength == null || request.ContentLength > 0))
            {
                request.EnableBuffering();
                using var reader = new StreamReader(request.Body, System.Text.Encoding.UTF8, leaveOpen: true);
                var bodyStr = await reader.ReadToEndAsync();
                request.Body.Position = 0;

                if (!string.IsNullOrWhiteSpace(bodyStr))
                {
                    try
                    {
                        var jsonObj = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, object>>(bodyStr);
                        if (jsonObj != null)
                        {
                            foreach (var kv in jsonObj)
                            {
                                dict[kv.Key] = kv.Value?.ToString() ?? "";
                            }
                        }
                    }
                    catch { /* Not raw JSON, ignore */ }
                }
            }

            return dict;
        }

        `;

    content = content.substring(0, startIndex) + updatedWebhookCode + content.substring(endIndex);
    fs.writeFileSync(paymentCtrlPath, content, 'utf8');
    console.log('✅ 2. Updated PaymentController.cs with robust multi-tenant webhook logic.');
  } else {
    console.error('❌ Could not locate webhook block markers in PaymentController.cs');
  }
}

// 3. Update PaymentHelper.cs (Ensure tenant-safe CreateOrUpdatePaymentAsync)
const paymentHelperPath = path.join(backendBase, 'Ecollect.Core', 'Helpers', 'PaymentHelper.cs');
if (fs.existsSync(paymentHelperPath)) {
  let content = fs.readFileSync(paymentHelperPath, 'utf8');

  // Ensure CreateOrUpdatePaymentAsync sets MerchantId correctly
  if (!content.includes('GetApiKeyRecordByKeyAsync')) {
    const helperMethods = `
        /// <summary>
        /// Get API Keys record by ApiKey string
        /// </summary>
        public async Task<ApiKeys> GetApiKeyRecordByKeyAsync(string apiKey)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(apiKey))
                    return null;

                return await _dbContext.ApiKeys
                    .FirstOrDefaultAsync(m => m.ApiKey == apiKey.Trim() && m.IsActive);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting API keys for ApiKey: {ApiKey}", apiKey);
                return null;
            }
        }

        /// <summary>
        /// Get API Keys record by MID string
        /// </summary>
        public async Task<ApiKeys> GetApiKeyRecordByMidAsync(string mid)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(mid))
                    return null;

                return await _dbContext.ApiKeys
                    .FirstOrDefaultAsync(m => m.Mid == mid.Trim() && m.IsActive);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting API keys for MID: {Mid}", mid);
                return null;
            }
        }
`;
    // Insert before closing brace of PaymentHelper class
    const lastBraceIndex = content.lastIndexOf('    }');
    if (lastBraceIndex !== -1) {
      content = content.substring(0, lastBraceIndex) + helperMethods + content.substring(lastBraceIndex);
      fs.writeFileSync(paymentHelperPath, content, 'utf8');
      console.log('✅ 3. Updated PaymentHelper.cs with helper query methods.');
    }
  }
}

console.log('🎉 Backend multi-tenant webhook integration completed successfully!');
