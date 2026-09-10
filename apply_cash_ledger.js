const fs = require('fs');
const path = require('path');

const cashServicePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\Ecollect.Core\\Services\\CashCollectionService.cs';

if (fs.existsSync(cashServicePath)) {
  let content = fs.readFileSync(cashServicePath, 'utf8');

  const targetPoint = 'await _dbContext.SaveChangesAsync();\r\n\r\n                _logger.LogInformation(';
  const targetPointLF = 'await _dbContext.SaveChangesAsync();\n\n                _logger.LogInformation(';

  const ledgerBlock = `await _dbContext.SaveChangesAsync();

                // ====== 10. UPDATE ACCOUNT LEDGER (REDUCE OUTSTANDING & DUE AMOUNT) ======
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
                                "✅ [Cash Collection Ledger Updated] Acc: {AccNo} | Product: {Prod} | Paid: ₹{Paid} | New Outstanding: ₹{Out} | New Due: ₹{Due}",
                                account.AccountNumber, prodType, paidAmount, account.OutstandingAmount, account.DueAmount);
                        }
                    }
                }
                catch (Exception ledgerEx)
                {
                    _logger.LogError(ledgerEx, "Error updating Account ledger balance during cash collection for Acc: {Acc}", request.customer_details?.customer_accno);
                }

                _logger.LogInformation(`;

  if (content.includes(targetPoint)) {
    content = content.replace(targetPoint, ledgerBlock);
    fs.writeFileSync(cashServicePath, content, 'utf8');
    console.log('✅ Replaced CRLF target in CashCollectionService.cs');
  } else if (content.includes(targetPointLF)) {
    content = content.replace(targetPointLF, ledgerBlock);
    fs.writeFileSync(cashServicePath, content, 'utf8');
    console.log('✅ Replaced LF target in CashCollectionService.cs');
  } else {
    // Fallback: search for SaveChangesAsync followed by return new CashResponseDto
    const idx = content.lastIndexOf('await _dbContext.SaveChangesAsync();');
    if (idx !== -1) {
      content = content.substring(0, idx) + ledgerBlock + content.substring(idx + 'await _dbContext.SaveChangesAsync();\r\n\r\n                _logger.LogInformation('.length);
      fs.writeFileSync(cashServicePath, content, 'utf8');
      console.log('✅ Inserted ledger block using index in CashCollectionService.cs');
    }
  }
}
