const fs = require('fs');
const path = require('path');

console.log('🚀 Connecting Backend Payment Notifications to CashCollectionService.cs...');

const cashServicePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\Ecollect.Core\\Services\\CashCollectionService.cs';

if (fs.existsSync(cashServicePath)) {
  let content = fs.readFileSync(cashServicePath, 'utf8');

  // 1. Add using Ecollect.Core.Helpers;
  if (!content.includes('using Ecollect.Core.Helpers;')) {
    content = 'using Ecollect.Core.Helpers;\n' + content;
  }

  // 2. Inject PaymentHelper
  if (!content.includes('private readonly PaymentHelper _paymentHelper;')) {
    content = content.replace(
      'private readonly HttpClient _httpClient;',
      'private readonly HttpClient _httpClient;\n        private readonly PaymentHelper _paymentHelper;'
    );

    content = content.replace(
      'ApplicationDbContext dbContext,\r\n            ILogger<CashCollectionService> logger,\r\n            HttpClient httpClient)',
      'ApplicationDbContext dbContext,\r\n            ILogger<CashCollectionService> logger,\r\n            HttpClient httpClient,\r\n            PaymentHelper paymentHelper)'
    );

    content = content.replace(
      'ApplicationDbContext dbContext,\n            ILogger<CashCollectionService> logger,\n            HttpClient httpClient)',
      'ApplicationDbContext dbContext,\n            ILogger<CashCollectionService> logger,\n            HttpClient httpClient,\n            PaymentHelper paymentHelper)'
    );

    content = content.replace(
      '_httpClient = httpClient;',
      '_httpClient = httpClient;\n            _paymentHelper = paymentHelper;'
    );
  }

  // 3. Dispatch SendPaymentNotificationAsync after saving Cash Payment
  if (!content.includes('SendPaymentNotificationAsync(paymentTransaction)')) {
    const notifBlock = `
                // ====== 11. DISPATCH PUSH & SOUNDBOX NOTIFICATIONS ======
                try
                {
                    await _paymentHelper.SendPaymentNotificationAsync(paymentTransaction);
                    _logger.LogInformation("🔔 Payment notification dispatched for Cash Transaction: {OrderId}", orderId);
                }
                catch (Exception notifEx)
                {
                    _logger.LogError(notifEx, "Error sending payment notification for Cash Transaction: {OrderId}", orderId);
                }
`;

    const successLogMarker = '_logger.LogInformation(\r\n                    "✅ Cash Payment saved successfully';
    const successLogMarkerLF = '_logger.LogInformation(\n                    "✅ Cash Payment saved successfully';

    if (content.includes(successLogMarker)) {
      content = content.replace(successLogMarker, notifBlock + '\n                ' + successLogMarker);
    } else if (content.includes(successLogMarkerLF)) {
      content = content.replace(successLogMarkerLF, notifBlock + '\n                ' + successLogMarkerLF);
    }
  }

  fs.writeFileSync(cashServicePath, content, 'utf8');
  console.log('✅ Updated CashCollectionService.cs with backend push and soundbox notifications!');
}
