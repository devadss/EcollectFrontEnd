const fs = require('fs');
const path = require('path');

const cashServicePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\Ecollect.Core\\Services\\CashCollectionService.cs';

if (fs.existsSync(cashServicePath)) {
  let content = fs.readFileSync(cashServicePath, 'utf8');

  // 1. Clean the top validation block
  const corruptedValidation = `// ====== 1. VALIDATE REQUEST ======
                if (request == null || request.agent_details == null || request.customer_details == null)
                {
                    
                // ====== 10. UPDATE ACCOUNT LEDGER (REDUCE OUTSTANDING & DUE AMOUNT) ======`;

  const validValidation = `// ====== 1. VALIDATE REQUEST ======
                if (request == null || request.agent_details == null || request.customer_details == null)
                {
                    return new CashResponseDto
                    {
                        status = "N",
                        message = "Invalid request payload"
                    };
                }`;

  const corruptStart = content.indexOf('// ====== 1. VALIDATE REQUEST ======');
  const corruptEnd = content.indexOf('return new CashResponseDto\r\n                    {\r\n                        status = "N",\r\n                        message = "Invalid request payload"');
  
  if (corruptStart !== -1 && corruptEnd !== -1) {
    const afterCorrupt = corruptEnd + 'return new CashResponseDto\r\n                    {\r\n                        status = "N",\r\n                        message = "Invalid request payload"\r\n                    };\r\n                }'.length;
    content = content.substring(0, corruptStart) + validValidation + content.substring(afterCorrupt);
  }

  // 2. Put ledger update right before the final success return
  const finalSuccessMarker = `_logger.LogInformation(
                    "✅ Payment saved successfully | OrderId: {OrderId}, TransactionId: {TransactionId}, Amount: {Amount}",
                    orderId, vendorTxnId, request.Amount);`;

  const ledgerUpdateCode = `
                // ====== 10. UPDATE ACCOUNT LEDGER (REDUCE OUTSTANDING & DUE AMOUNT) ======
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
                            // Loans: reduce outstanding principal and current due
                            account.OutstandingAmount = Math.Max(0, account.OutstandingAmount - paidAmount);
                            account.DueAmount = Math.Max(0, account.DueAmount - paidAmount);
                        }
                        else
                        {
                            // Deposits/RD: increase savings balance held, reduce current due demand
                            account.OutstandingAmount += paidAmount;
                            account.DueAmount = Math.Max(0, account.DueAmount - paidAmount);
                        }

                        account.LastPaidDate = DateTime.UtcNow;
                        account.UpdatedAt = DateTime.UtcNow;

                        await _dbContext.SaveChangesAsync();
                        _logger.LogInformation(
                            "✅ [Cash Collection Ledger Updated] Acc: {AccNo} | Product: {Prod} | Paid: ₹{Paid} | New Outstanding: ₹{Out} | New Due: ₹{Due}",
                            account.AccountNumber, prodType, paidAmount, account.OutstandingAmount, account.DueAmount);
                    }
                }
`;

  if (!content.includes('Cash Collection Ledger Updated')) {
    const successIdx = content.indexOf(finalSuccessMarker);
    if (successIdx !== -1) {
      content = content.substring(0, successIdx) + ledgerUpdateCode + '\n                ' + content.substring(successIdx);
    }
  }

  fs.writeFileSync(cashServicePath, content, 'utf8');
  console.log('✅ Cleaned and properly placed ledger deduction in CashCollectionService.cs');
}
