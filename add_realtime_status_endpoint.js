const fs = require('fs');

const ctrlPath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\EcollectApi\\Controllers\\PaymentController.cs';

if (fs.existsSync(ctrlPath)) {
  let content = fs.readFileSync(ctrlPath, 'utf8');

  // Replace existing GetRealtimeOrderStatus if present
  const marker = '// ============================================================';
  const getStatusMarker = '// REAL-TIME ORDER STATUS (FOR WEB QR / LINK COMPLETION & POLLING)';
  
  if (content.includes(getStatusMarker)) {
    const startIdx = content.indexOf(getStatusMarker) - 72; // include header comment
    const endIdx = content.indexOf('[HttpPost("status")]');
    content = content.substring(0, startIdx) + content.substring(endIdx);
  }

  const target = '[HttpPost("status")]';
  const idx = content.indexOf(target);
  if (idx !== -1) {
    const getStatusMethod = `// ============================================================
        // REAL-TIME ORDER STATUS (FOR WEB QR / LINK COMPLETION & POLLING)
        // ============================================================

        [HttpGet("status")]
        [HttpGet("order-status")]
        [HttpGet("status/{orderId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRealtimeOrderStatus([FromQuery] string? orderId, [FromRoute] string? orderIdRoute = null)
        {
            var targetOrderId = (!string.IsNullOrWhiteSpace(orderId) ? orderId : orderIdRoute)?.Trim();
            if (string.IsNullOrWhiteSpace(targetOrderId))
                return BadRequest(new { success = false, message = "OrderId is required." });

            try
            {
                var txn = await _dbContext.PaymentTransactions
                    .AsNoTracking()
                    .Include(p => p.Customer)
                    .Include(p => p.Agent)
                    .Include(p => p.Branch)
                    .Include(p => p.Merchant)
                    .FirstOrDefaultAsync(p => p.OrderId == targetOrderId);

                if (txn == null)
                {
                    return Ok(new
                    {
                        success = true,
                        orderId = targetOrderId,
                        status = "PENDING",
                        paymentStatus = "PENDING",
                        message = "Payment initiated. Awaiting customer completion.",
                        isCompleted = false
                    });
                }

                bool isSuccess = txn.Status != null && (
                    txn.Status.Equals("SUCCESS", StringComparison.OrdinalIgnoreCase) ||
                    txn.Status.Equals("COMPLETED", StringComparison.OrdinalIgnoreCase) ||
                    txn.Status.Equals("PAID", StringComparison.OrdinalIgnoreCase)
                );

                bool isFailed = txn.Status != null && (
                    txn.Status.Equals("FAILED", StringComparison.OrdinalIgnoreCase) ||
                    txn.Status.Equals("REJECTED", StringComparison.OrdinalIgnoreCase) ||
                    txn.Status.Equals("CANCELLED", StringComparison.OrdinalIgnoreCase)
                );

                return Ok(new
                {
                    success = true,
                    orderId = txn.OrderId,
                    transactionId = txn.TransactionId ?? txn.Udf1 ?? "NA",
                    cbsTransactionId = txn.VendorPostTransId ?? txn.Udf2 ?? txn.ResponseMessage,
                    amount = txn.Amount,
                    currency = txn.Currency ?? "INR",
                    status = txn.Status ?? "PENDING",
                    paymentStatus = txn.Status ?? "PENDING",
                    isCompleted = isSuccess || isFailed,
                    isSuccess = isSuccess,
                    isFailed = isFailed,
                    paymentMode = txn.PaymentMode ?? txn.PaymentChannel ?? "UPI",
                    paymentChannel = txn.PaymentChannel ?? "UPI",
                    customerName = txn.Customer?.Name ?? txn.CustomerName,
                    customerPhone = txn.Customer?.Phone ?? txn.CustomerPhone,
                    accountNumber = txn.Customer_Acc ?? txn.Udf3,
                    collectionType = txn.CollectionType ?? txn.Udf5 ?? "RD",
                    agentName = txn.AgentName ?? txn.Agent?.Name,
                    agentCode = txn.AgentCode ?? txn.Agent?.AgentCode,
                    branchName = txn.Branch?.Name,
                    responseMessage = txn.ResponseMessage,
                    completedAt = txn.CompletedAt ?? txn.CreatedAt,
                    createdAt = txn.CreatedAt,
                    message = isSuccess ? "Payment verified & CBS posted" : txn.ResponseMessage ?? "Payment in progress"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting realtime order status for {OrderId}", targetOrderId);
                return StatusCode(500, new { success = false, message = "Internal error checking order status", error = ex.Message });
            }
        }

        `;

    content = content.substring(0, idx) + getStatusMethod + content.substring(idx);
    fs.writeFileSync(ctrlPath, content, 'utf8');
    console.log('✅ Updated GetRealtimeOrderStatus endpoint in PaymentController.cs');
  }
}
