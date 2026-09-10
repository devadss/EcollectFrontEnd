const fs = require('fs');

const p = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\Ecollect.Core\\Services\\CashCollectionService.cs';

if (fs.existsSync(p)) {
  let content = fs.readFileSync(p, 'utf8');

  content = content.replace(
    'dbAgent = await _dbContext.Agents\r\n                        .FirstOrDefaultAsync(a => (a.AgentCode == agentCode || a.AgentId == agentCode) && (a.MerchantId == merchant.Id || a.MerchantId == null));',
    'dbAgent = await _dbContext.Agents\r\n                        .FirstOrDefaultAsync(a => (a.AgentCode == agentCode || a.Id.ToString() == agentCode || a.external_agent_id == agentCode) && (a.MerchantId == merchant.Id || a.MerchantId == null));'
  );

  content = content.replace(
    'dbAgent = await _dbContext.Agents\n                        .FirstOrDefaultAsync(a => (a.AgentCode == agentCode || a.AgentId == agentCode) && (a.MerchantId == merchant.Id || a.MerchantId == null));',
    'dbAgent = await _dbContext.Agents\n                        .FirstOrDefaultAsync(a => (a.AgentCode == agentCode || a.Id.ToString() == agentCode || a.external_agent_id == agentCode) && (a.MerchantId == merchant.Id || a.MerchantId == null));'
  );

  content = content.replace(
    'dbAgent = await _dbContext.Agents\r\n                        .FirstOrDefaultAsync(a => a.PhoneNumber == agentPhone && (a.MerchantId == merchant.Id || a.MerchantId == null));',
    'dbAgent = await _dbContext.Agents\r\n                        .FirstOrDefaultAsync(a => a.Phone == agentPhone && (a.MerchantId == merchant.Id || a.MerchantId == null));'
  );

  content = content.replace(
    'dbAgent = await _dbContext.Agents\n                        .FirstOrDefaultAsync(a => a.PhoneNumber == agentPhone && (a.MerchantId == merchant.Id || a.MerchantId == null));',
    'dbAgent = await _dbContext.Agents\n                        .FirstOrDefaultAsync(a => a.Phone == agentPhone && (a.MerchantId == merchant.Id || a.MerchantId == null));'
  );

  fs.writeFileSync(p, content, 'utf8');
  console.log('✅ Fixed Agent property names in CashCollectionService.cs');
}
