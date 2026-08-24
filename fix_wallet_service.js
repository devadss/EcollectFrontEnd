const fs = require('fs');
const path = 'C:/SOLUTIONS/ECOLLECT/EcollectApi/EcollectApi/EcollectApi/Ecollect.Core/Services/WalletService.cs';

let content = fs.readFileSync(path, 'utf8');
content = content.replace(
    'BranchCode = b.BranchCode,\r\n                        BranchName = b.BranchName,',
    'BranchCode = b.Code ?? b.external_branch_id ?? b.Id.ToString(),\r\n                        BranchName = b.Name,'
);
if (!content.includes('b.Code')) {
    content = content.replace(
        'BranchCode = b.BranchCode,\n                        BranchName = b.BranchName,',
        'BranchCode = b.Code ?? b.external_branch_id ?? b.Id.ToString(),\n                        BranchName = b.Name,'
    );
}

fs.writeFileSync(path, content, 'utf8');
console.log('✅ Fixed WalletService.cs Branch property mappings.');
