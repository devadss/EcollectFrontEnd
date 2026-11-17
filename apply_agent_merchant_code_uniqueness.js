const fs = require('fs');
const path = require('path');

const basePath = 'C:/SOLUTIONS/ECOLLECT/EcollectApi/EcollectApi/EcollectApi';

console.log('🚀 Updating Backend for Per-Merchant Agent Code Uniqueness...');

// 1. Update ApplicationDbContext.cs
const dbContextPath = path.join(basePath, 'Ecollect.Data/Context/ApplicationDbContext.cs');
if (fs.existsSync(dbContextPath)) {
  let content = fs.readFileSync(dbContextPath, 'utf8');
  if (content.includes('entity.HasIndex(a => a.AgentCode).IsUnique();')) {
    content = content.replace(
      'entity.HasIndex(a => a.AgentCode).IsUnique();',
      'entity.HasIndex(a => new { a.MerchantId, a.AgentCode }).IsUnique();'
    );
    fs.writeFileSync(dbContextPath, content, 'utf8');
    console.log('✅ Updated ApplicationDbContext.cs: entity.HasIndex(a => new { a.MerchantId, a.AgentCode }).IsUnique()');
  } else {
    console.log('ℹ️ ApplicationDbContext.cs already updated or pattern not found.');
  }
} else {
  console.error('❌ ApplicationDbContext.cs not found at', dbContextPath);
}

// 2. Update DbInitializer.cs
const dbInitPath = path.join(basePath, 'Ecollect.Data/DbInitializer.cs');
if (fs.existsSync(dbInitPath)) {
  let content = fs.readFileSync(dbInitPath, 'utf8');
  if (!content.includes('IX_Agents_MerchantId_AgentCode')) {
    const branchIndexSnippet = `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Branches_MerchantId_Code' AND object_id = OBJECT_ID('Branches'))
                    BEGIN
                        CREATE UNIQUE NONCLUSTERED INDEX [IX_Branches_MerchantId_Code] ON [dbo].[Branches] ([MerchantId], [Code]);
                    END`;

    const agentIndexSnippet = `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Branches_MerchantId_Code' AND object_id = OBJECT_ID('Branches'))
                    BEGIN
                        CREATE UNIQUE NONCLUSTERED INDEX [IX_Branches_MerchantId_Code] ON [dbo].[Branches] ([MerchantId], [Code]);
                    END

                    // Drop global unique index on Agent Code if it exists and replace with per-merchant index
                    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Agents_AgentCode' AND object_id = OBJECT_ID('Agents'))
                    BEGIN
                        DROP INDEX [IX_Agents_AgentCode] ON [dbo].[Agents];
                    END

                    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Agents_MerchantId_AgentCode' AND object_id = OBJECT_ID('Agents'))
                    BEGIN
                        CREATE UNIQUE NONCLUSTERED INDEX [IX_Agents_MerchantId_AgentCode] ON [dbo].[Agents] ([MerchantId], [AgentCode]);
                    END`;

    if (content.includes(branchIndexSnippet)) {
      content = content.replace(branchIndexSnippet, agentIndexSnippet);
      fs.writeFileSync(dbInitPath, content, 'utf8');
      console.log('✅ Updated DbInitializer.cs: Added Agent Code index migration script.');
    } else {
      console.warn('⚠️ branchIndexSnippet not found in DbInitializer.cs');
    }
  } else {
    console.log('ℹ️ DbInitializer.cs already contains IX_Agents_MerchantId_AgentCode.');
  }
}

// 3. Update AgentService.cs
const agentServicePath = path.join(basePath, 'Ecollect.Core/Services/AgentService.cs');
if (fs.existsSync(agentServicePath)) {
  let content = fs.readFileSync(agentServicePath, 'utf8');

  // 3a. In CreateAgentAsync
  const createTarget = `int? resolvedMerchantId = dto.MerchantId;
                if (!resolvedMerchantId.HasValue && userId > 0)
                {
                    var currentUser = await _context.Users.FindAsync(userId);
                    if (currentUser?.MerchantId.HasValue == true)
                    {
                        resolvedMerchantId = currentUser.MerchantId.Value;
                    }
                }`;

  const createReplacement = `int? resolvedMerchantId = dto.MerchantId;
                if (!resolvedMerchantId.HasValue && userId > 0)
                {
                    var currentUser = await _context.Users.FindAsync(userId);
                    if (currentUser?.MerchantId.HasValue == true)
                    {
                        resolvedMerchantId = currentUser.MerchantId.Value;
                    }
                }

                // Check if agent code already exists within this merchant
                if (!string.IsNullOrWhiteSpace(agentCode))
                {
                    var codeExists = await _context.Agents
                        .AnyAsync(a => a.MerchantId == resolvedMerchantId && a.AgentCode.ToLower() == agentCode.Trim().ToLower());

                    if (codeExists)
                    {
                        throw new Exception($"Agent code '{agentCode}' is already registered for this merchant.");
                    }
                }`;

  if (!content.includes('Agent code \'') && content.includes(createTarget)) {
    content = content.replace(createTarget, createReplacement);
    console.log('✅ Updated AgentService.cs: CreateAgentAsync per-merchant check added.');
  }

  // 3b. In UpdateAgentAsync
  const updateTarget = `if (!string.IsNullOrEmpty(dto.AgentCode) && dto.AgentCode != agent.AgentCode)
                {
                    changes.Add("AgentCode", (agent.AgentCode, dto.AgentCode));
                    agent.AgentCode = dto.AgentCode;
                }`;

  const updateReplacement = `var targetMerchantId = dto.MerchantId.HasValue ? dto.MerchantId : agent.MerchantId;
                var targetAgentCode = !string.IsNullOrEmpty(dto.AgentCode) ? dto.AgentCode.Trim() : agent.AgentCode?.Trim();

                if (!string.IsNullOrEmpty(targetAgentCode) && ((!string.IsNullOrEmpty(dto.AgentCode) && dto.AgentCode != agent.AgentCode) || (dto.MerchantId.HasValue && dto.MerchantId != agent.MerchantId)))
                {
                    var codeExists = await _context.Agents
                        .AnyAsync(a => a.Id != id && a.MerchantId == targetMerchantId && a.AgentCode.ToLower() == targetAgentCode.ToLower());

                    if (codeExists)
                    {
                        throw new Exception($"Agent code '{targetAgentCode}' is already registered for this merchant.");
                    }
                }

                if (!string.IsNullOrEmpty(dto.AgentCode) && dto.AgentCode != agent.AgentCode)
                {
                    changes.Add("AgentCode", (agent.AgentCode, dto.AgentCode));
                    agent.AgentCode = dto.AgentCode;
                }`;

  if (!content.includes('a.Id != id && a.MerchantId == targetMerchantId') && content.includes(updateTarget)) {
    content = content.replace(updateTarget, updateReplacement);
    console.log('✅ Updated AgentService.cs: UpdateAgentAsync per-merchant check added.');
  }

  fs.writeFileSync(agentServicePath, content, 'utf8');
}

console.log('🎉 Backend updates completed.');
