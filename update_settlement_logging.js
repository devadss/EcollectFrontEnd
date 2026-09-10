const fs = require('fs');
const path = require('path');

console.log('🚀 Enhancing Settlement Webhook with Comprehensive Payload & Header Logging...');

const backendBase = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';
const paymentCtrlPath = path.join(backendBase, 'EcollectApi', 'Controllers', 'PaymentController.cs');

if (fs.existsSync(paymentCtrlPath)) {
  let content = fs.readFileSync(paymentCtrlPath, 'utf8');

  const settlementStartMarker = '[HttpPost("webhook/settlement")]';
  const historyStartMarker = '[HttpGet("transaction-history")]';

  const startIndex = content.indexOf(settlementStartMarker);
  const endIndex = content.indexOf(historyStartMarker);

  if (startIndex !== -1 && endIndex !== -1) {
    const updatedSettlementCode = `[HttpPost("webhook/settlement")]
        [HttpGet("webhook/settlement")]
        [AllowAnonymous]
        public async Task<IActionResult> SettlementWebhook()
        {
            var correlationId = Guid.NewGuid().ToString("N");
            var receivedAt = DateTime.UtcNow;

            try
            {
                // 1. CAPTURE HTTP METHOD & HEADERS
                var headers = Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString());
                var contentType = Request.ContentType ?? "Unknown";

                // 2. CAPTURE RAW BODY STREAM SAFELY
                Request.EnableBuffering();
                string rawBody = string.Empty;
                if (Request.ContentLength > 0 || Request.Body.CanRead)
                {
                    using (var reader = new StreamReader(Request.Body, System.Text.Encoding.UTF8, leaveOpen: true))
                    {
                        rawBody = await reader.ReadToEndAsync();
                        Request.Body.Position = 0;
                    }
                }

                // 3. EXTRACT ALL PARSED FIELDS (FORM, JSON, & QUERY STRING)
                var allFields = await ExtractWebhookPayloadAsync(Request);

                // 4. STRUCTURED & DETAILED LOGGING
                _logger.LogInformation(
                    "============================================================\\n" +
                    "📢 [SETTLEMENT WEBHOOK RECEIVED]\\n" +
                    "CorrelationId : {CorrelationId}\\n" +
                    "Timestamp     : {Timestamp:yyyy-MM-dd HH:mm:ss.fff} UTC\\n" +
                    "HTTP Method   : {Method}\\n" +
                    "Content-Type  : {ContentType}\\n" +
                    "Query String  : {QueryString}\\n" +
                    "Raw Body Size : {BodyLength} bytes\\n" +
                    "------------------------------------------------------------\\n" +
                    "RAW PAYLOAD:\\n{RawBody}\\n" +
                    "------------------------------------------------------------\\n" +
                    "PARSED FIELDS ({FieldCount}):\\n{@ParsedFields}\\n" +
                    "------------------------------------------------------------\\n" +
                    "REQUEST HEADERS:\\n{@Headers}\\n" +
                    "============================================================",
                    correlationId,
                    receivedAt,
                    Request.Method,
                    contentType,
                    Request.QueryString.ToString(),
                    rawBody.Length,
                    string.IsNullOrWhiteSpace(rawBody) ? "(Empty Body)" : rawBody,
                    allFields.Count,
                    allFields,
                    headers
                );

                // 5. ATTEMPT TO IDENTIFY SETTLEMENT IDENTIFIERS
                var settlementId = allFields.GetValueOrDefault("settlement_id") ?? allFields.GetValueOrDefault("settlementId") ?? allFields.GetValueOrDefault("id");
                var utrOrBankRef = allFields.GetValueOrDefault("bank_reference") ?? allFields.GetValueOrDefault("utr") ?? allFields.GetValueOrDefault("bank_ref_no") ?? allFields.GetValueOrDefault("rrn");
                var payoutAmount = allFields.GetValueOrDefault("payout_amount") ?? allFields.GetValueOrDefault("amount") ?? allFields.GetValueOrDefault("net_amount");
                var settlementStatus = allFields.GetValueOrDefault("status") ?? allFields.GetValueOrDefault("completed") ?? allFields.GetValueOrDefault("settlement_status");
                var apiKey = allFields.GetValueOrDefault("api_key") ?? allFields.GetValueOrDefault("apiKey");
                var mid = allFields.GetValueOrDefault("mid") ?? allFields.GetValueOrDefault("merchant_id");

                _logger.LogInformation(
                    "📊 SETTLEMENT SUMMARY | SettlementId: {SettlementId} | UTR/BankRef: {BankRef} | Amount: {Amount} | Status: {Status} | ApiKey: {ApiKey} | MID: {Mid}",
                    settlementId ?? "N/A",
                    utrOrBankRef ?? "N/A",
                    payoutAmount ?? "N/A",
                    settlementStatus ?? "N/A",
                    apiKey ?? "N/A",
                    mid ?? "N/A"
                );

                // 6. RETURN STANDARD SUCCESS RESPONSE
                return Ok(new
                {
                    success = true,
                    status = "received",
                    correlationId,
                    receivedAt = receivedAt.ToString("o"),
                    settlementId,
                    message = "Settlement webhook received and logged successfully."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ ERROR in SettlementWebhook processing. CorrelationId: {CorrelationId}", correlationId);
                return StatusCode(500, new 
                { 
                    success = false, 
                    message = "An error occurred while logging settlement webhook", 
                    correlationId,
                    error = ex.Message 
                });
            }
        }

        `;

    content = content.substring(0, startIndex) + updatedSettlementCode + content.substring(endIndex);
    fs.writeFileSync(paymentCtrlPath, content, 'utf8');
    console.log('✅ Updated PaymentController.cs with rich Settlement Webhook logging.');
  } else {
    console.error('❌ Could not locate settlement webhook markers in PaymentController.cs');
  }
}
