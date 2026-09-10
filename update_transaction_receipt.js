const fs = require('fs');

console.log('🚀 Updating Backend Transaction DTO & Service with VendorPostTransId as ReceiptNumber...');

// 1. Update TransactionDto.cs
const dtoPath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\Ecollect.Shared\\DTOs\\TransactionDto.cs';
if (fs.existsSync(dtoPath)) {
  let content = fs.readFileSync(dtoPath, 'utf8');

  if (!content.includes('public string? VendorPostTransId')) {
    content = content.replace(
      'public string? Rrn { get; set; }',
      'public string? Rrn { get; set; }\n        public string? VendorPostTransId { get; set; }\n        public string? VendorPostStatus { get; set; }\n        public string? ReceiptNumber { get; set; }'
    );
    fs.writeFileSync(dtoPath, content, 'utf8');
    console.log('✅ Updated TransactionDto.cs with VendorPostTransId, VendorPostStatus, and ReceiptNumber.');
  }
}

// 2. Update TransactionService.cs
const svcPath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\Ecollect.Core\\Services\\TransactionService.cs';
if (fs.existsSync(svcPath)) {
  let content = fs.readFileSync(svcPath, 'utf8');

  if (!content.includes('VendorPostTransId = transaction.VendorPostTransId,')) {
    content = content.replace(
      'Rrn = transaction.PaymentGatewayTransactionId ?? transaction.TransactionId,',
      'Rrn = transaction.PaymentGatewayTransactionId ?? transaction.TransactionId,\n                VendorPostTransId = transaction.VendorPostTransId,\n                VendorPostStatus = transaction.VendorPostStatus,\n                ReceiptNumber = transaction.VendorPostTransId ?? transaction.PaymentGatewayTransactionId ?? transaction.TransactionId ?? transaction.OrderId,'
    );
    fs.writeFileSync(svcPath, content, 'utf8');
    console.log('✅ Updated TransactionService.cs MapToDto with VendorPostTransId and ReceiptNumber.');
  }
}
