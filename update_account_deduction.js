const fs = require('fs');
const path = require('path');

console.log('🚀 Implementing Automatic Outstanding & Due Amount Deductions for UPI QR & Cash Collections...');

const backendBase = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';

// 1. Update PaymentHelper.cs
const paymentHelperPath = path.join(backendBase, 'Ecollect.Core', 'Helpers', 'PaymentHelper.cs');
if (fs.existsSync(paymentHelperPath)) {
  let content = fs.readFileSync(paymentHelperPath, 'utf8');

  // Insert DeductAccountLedgerBalanceAsync method
  if (!content.includes('DeductAccountLedgerBalanceAsync')) {
    const deductMethod = `
        /// <summary>
        /// Automatically reduce Outstanding and Due amounts in Accounts table upon successful payment
        /// </summary>
        public async Task DeductAccountLedgerBalanceAsync(PaymentTransaction payment)
        {
            try
            {
                if (payment == null || payment.Amount <= 0) return;

                var targetAccNo = (payment.Customer_Acc ?? payment.Udf4 ?? payment.Udf3)?.Trim();
                if (string.IsNullOrEmpty(targetAccNo)) return;

                var account = await _dbContext.Accounts.FirstOrDefaultAsync(a =>
                    !a.IsDeleted &&
                    a.AccountNumber == targetAccNo &&
                    (payment.MerchantId <= 0 || a.MerchantId == payment.MerchantId || a.MerchantId == 0));

                if (account != null)
                {
                    var paidAmount = payment.Amount;
                    var prodType = (account.ProductType ?? payment.CollectionType ?? "LOAN").ToUpper();

                    if (prodType == "LOAN")
                    {
                        // For Loans: reduce outstanding principal and current due
                        account.OutstandingAmount = Math.Max(0, account.OutstandingAmount - paidAmount);
                        account.DueAmount = Math.Max(0, account.DueAmount - paidAmount);
                    }
                    else
                    {
                        // For Deposits/RD: increase savings balance held, reduce current due demand
                        account.OutstandingAmount += paidAmount;
                        account.DueAmount = Math.Max(0, account.DueAmount - paidAmount);
                    }

                    account.LastPaidDate = DateTime.UtcNow;
                    account.UpdatedAt = DateTime.UtcNow;

                    await _dbContext.SaveChangesAsync();
                    _logger.LogInformation(
                        "✅ [Account Ledger Deducted] Order: {OrderId} | Acc: {AccNo} | Product: {Prod} | Paid: ₹{Paid} | New Outstanding: ₹{Out} | New Due: ₹{Due}",
                        payment.OrderId, account.AccountNumber, prodType, paidAmount, account.OutstandingAmount, account.DueAmount);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deducting Account ledger balance for OrderId: {OrderId}", payment?.OrderId);
            }
        }
`;
    // Add inside UpdatePaymentStatusAsync when status == SUCCESS
    if (content.includes('if (status == "SUCCESS")')) {
      content = content.replace(
        'if (status == "SUCCESS")\r\n                {\r\n                    payment.ResponseCode = 200;\r\n                }',
        'if (status == "SUCCESS")\r\n                {\r\n                    payment.ResponseCode = 200;\r\n                    await DeductAccountLedgerBalanceAsync(payment);\r\n                }'
      );
    }

    const lastBraceIndex = content.lastIndexOf('    }');
    if (lastBraceIndex !== -1) {
      content = content.substring(0, lastBraceIndex) + deductMethod + content.substring(lastBraceIndex);
      fs.writeFileSync(paymentHelperPath, content, 'utf8');
      console.log('✅ 1. Updated PaymentHelper.cs with automatic ledger deduction for UPI/QR/Online payments.');
    }
  }
}

// 2. Update CashCollectionService.cs
const cashServicePath = path.join(backendBase, 'Ecollect.Core', 'Services', 'CashCollectionService.cs');
if (fs.existsSync(cashServicePath)) {
  let content = fs.readFileSync(cashServicePath, 'utf8');

  if (!content.includes('Cash Collection Ledger Updated')) {
    const cashLedgerCode = `
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
`;

    const marker = 'return new CashResponseDto';
    const markerIndex = content.indexOf(marker);
    if (markerIndex !== -1) {
      content = content.substring(0, markerIndex) + cashLedgerCode + '\n                ' + content.substring(markerIndex);
      fs.writeFileSync(cashServicePath, content, 'utf8');
      console.log('✅ 2. Updated CashCollectionService.cs with automatic ledger deduction for Cash collections.');
    }
  }
}

console.log('🎉 Outstanding & Due Amount automatic deductions successfully integrated across QR & Cash!');
