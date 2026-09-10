const fs = require('fs');

// 1. Update BranchDashboard.jsx
const branchPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\dashboards\\BranchDashboard.jsx';
let branchCode = fs.readFileSync(branchPath, 'utf8');

const branchOldActions = `          <div className="branch-header-actions">
            <button className="branch-export-btn" onClick={fetchBranchTelemetry} title="Refresh Telemetry">
              <BranchIcons.Refresh />
              <span>Refresh</span>
            </button>
            <button className="branch-export-btn" onClick={() => window.print()}>
              <BranchIcons.Download />
              <span>Export Dossier</span>
            </button>
            <button className="branch-add-btn" onClick={() => navigate('/accounts')}>
              <BranchIcons.Building />
              <span>Branch Accounts</span>
            </button>
          </div>`;

const branchNewActions = `          <div className="branch-header-actions">
            <button className="branch-export-btn" onClick={() => navigate('/due-list')} title="View Daily Due List & Demand Ledger" style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.35)', color: '#818cf8', fontWeight: 800 }}>
              <span>📋 Daily Due List</span>
            </button>
            <button className="branch-export-btn" onClick={() => navigate('/buckets')} title="View Delinquency Aging & Recovery Buckets" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.35)', color: '#f87171', fontWeight: 800 }}>
              <span>🗂️ Delinquency Buckets</span>
            </button>
            <button className="branch-export-btn" onClick={fetchBranchTelemetry} title="Refresh Telemetry">
              <BranchIcons.Refresh />
              <span>Refresh</span>
            </button>
            <button className="branch-export-btn" onClick={() => window.print()}>
              <BranchIcons.Download />
              <span>Export Dossier</span>
            </button>
            <button className="branch-add-btn" onClick={() => navigate('/accounts')}>
              <BranchIcons.Building />
              <span>Branch Accounts</span>
            </button>
          </div>`;

if (branchCode.includes(branchOldActions)) {
  branchCode = branchCode.replace(branchOldActions, branchNewActions);
  fs.writeFileSync(branchPath, branchCode, 'utf8');
  console.log('✅ BranchDashboard.jsx updated with Due List and Delinquency Buckets quick launch buttons!');
}

// 2. Update MerchantDashboard.jsx
const merchantPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\dashboards\\MerchantDashboard.jsx';
let merchantCode = fs.readFileSync(merchantPath, 'utf8');

const merchantOldActions = `            <button className={\`merchant-export-btn \${refreshing ? 'is-spinning' : ''}\`} onClick={handleManualRefresh} title="Refresh Merchant Telemetry">
              <MerchantIcons.Refresh />
              <span>Refresh</span>
            </button>`;

const merchantNewActions = `            <button className="merchant-export-btn" onClick={() => navigate('/due-list')} title="View Daily Due List & Demand Ledger" style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.35)', color: '#818cf8', fontWeight: 800 }}>
              <span>📋 Daily Due List</span>
            </button>
            <button className="merchant-export-btn" onClick={() => navigate('/buckets')} title="View Delinquency Aging & Recovery Buckets" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.35)', color: '#f87171', fontWeight: 800 }}>
              <span>🗂️ Delinquency Buckets</span>
            </button>
            <button className={\`merchant-export-btn \${refreshing ? 'is-spinning' : ''}\`} onClick={handleManualRefresh} title="Refresh Merchant Telemetry">
              <MerchantIcons.Refresh />
              <span>Refresh</span>
            </button>`;

if (merchantCode.includes(merchantOldActions)) {
  merchantCode = merchantCode.replace(merchantOldActions, merchantNewActions);
  fs.writeFileSync(merchantPath, merchantCode, 'utf8');
  console.log('✅ MerchantDashboard.jsx updated with Due List and Delinquency Buckets quick launch buttons!');
}
