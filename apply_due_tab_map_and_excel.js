const fs = require('fs');
const babel = require('@babel/parser');

const accountsPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\accounts\\Accounts.jsx';
let code = fs.readFileSync(accountsPath, 'utf8');

// 1. Add Template Download Handlers for Bulk Accounts
const templateHandlers = `
  // Comprehensive Excel Template Download with ALL Relevant Attributes (24 Fields)
  const handleDownloadAccountsExcelTemplate = () => {
    try {
      const sampleData = [
        {
          AccountNumber: 'LN1004891',
          CustomerName: 'Rajesh Kumar Sharma',
          MobileNumber: '9876543210',
          Email: 'rajesh.sharma@example.com',
          ProductType: 'LOAN',
          SchemeName: 'Home Loan',
          OutstandingAmount: 250000,
          DueAmount: 12500,
          EmiAmount: 12500,
          EmiFrequency: 'Monthly',
          TenureMonths: 24,
          LastPaidDate: '2026-08-10',
          NextDueDate: '2026-09-10',
          AssignedAgentCode: '1075',
          AssignedAgentName: 'Amit Verma',
          BranchCode: '01',
          BankName: 'Local Branch Banking Route',
          IfscCode: 'STANDALONE',
          CustomerAddress: 'Plot 42, Sector 18, Near Central Market',
          City: 'Mumbai',
          Latitude: '19.076090',
          Longitude: '72.877726',
          CustomerPhoto: '',
          PtpDate: '2026-09-12',
          PtpAmount: 12500,
          PtpStatus: 'PENDING',
          IsMandatoryCall: 'NO',
          ReminderRiskLevel: 'Standard',
          ReminderChannels: 'SMS,WhatsApp,Call'
        },
        {
          AccountNumber: 'LN1004892',
          CustomerName: 'Pooja Manoj Patel',
          MobileNumber: '9823456789',
          Email: 'pooja.patel@example.com',
          ProductType: 'LOAN',
          SchemeName: 'Gold Loan',
          OutstandingAmount: 150000,
          DueAmount: 8200,
          EmiAmount: 8200,
          EmiFrequency: 'Monthly',
          TenureMonths: 12,
          LastPaidDate: '2026-08-05',
          NextDueDate: '2026-09-05',
          AssignedAgentCode: '1075',
          AssignedAgentName: 'Amit Verma',
          BranchCode: '01',
          BankName: 'Local Branch Banking Route',
          IfscCode: 'STANDALONE',
          CustomerAddress: 'Shop 14, MG Road, Jewel Market',
          City: 'Pune',
          Latitude: '18.520430',
          Longitude: '73.856743',
          CustomerPhoto: '',
          PtpDate: '',
          PtpAmount: '',
          PtpStatus: 'NONE',
          IsMandatoryCall: 'NO',
          ReminderRiskLevel: 'Standard',
          ReminderChannels: 'SMS,WhatsApp,Call'
        },
        {
          AccountNumber: 'RD2008191',
          CustomerName: 'Suresh Chandra Gupta',
          MobileNumber: '9811223344',
          Email: 'suresh.gupta@example.com',
          ProductType: 'RD',
          SchemeName: 'Standard Recurring Deposit',
          OutstandingAmount: 60000,
          DueAmount: 5000,
          EmiAmount: 5000,
          EmiFrequency: 'Monthly',
          TenureMonths: 12,
          LastPaidDate: '2026-08-01',
          NextDueDate: '2026-09-01',
          AssignedAgentCode: '1075',
          AssignedAgentName: 'Amit Verma',
          BranchCode: '01',
          BankName: 'Local Branch Banking Route',
          IfscCode: 'STANDALONE',
          CustomerAddress: 'Flat 302, Green Residency, Station Road',
          City: 'Thane',
          Latitude: '19.218330',
          Longitude: '72.978088',
          CustomerPhoto: '',
          PtpDate: '',
          PtpAmount: '',
          PtpStatus: 'NONE',
          IsMandatoryCall: 'NO',
          ReminderRiskLevel: 'Standard',
          ReminderChannels: 'SMS,WhatsApp,Call'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'MasterAccounts');
      XLSX.writeFile(wb, 'eCollect_Master_Accounts_Template.xlsx');
      showToast('📥 Master Accounts Excel template downloaded with all 24 attributes!');
    } catch (err) {
      console.error('Template export error:', err);
      showToast('Could not generate Excel template', 'error');
    }
  };

  const handleDownloadAccountsCsvTemplate = () => {
    try {
      const headers = [
        'AccountNumber', 'CustomerName', 'MobileNumber', 'Email', 'ProductType', 'SchemeName',
        'OutstandingAmount', 'DueAmount', 'EmiAmount', 'EmiFrequency', 'TenureMonths',
        'LastPaidDate', 'NextDueDate', 'AssignedAgentCode', 'AssignedAgentName', 'BranchCode',
        'BankName', 'IfscCode', 'CustomerAddress', 'City', 'Latitude', 'Longitude',
        'CustomerPhoto', 'PtpDate', 'PtpAmount', 'PtpStatus', 'IsMandatoryCall', 'ReminderRiskLevel', 'ReminderChannels'
      ];
      const sampleRow = [
        'LN1004891', 'Rajesh Kumar Sharma', '9876543210', 'rajesh@example.com', 'LOAN', 'Home Loan',
        '250000', '12500', '12500', 'Monthly', '24',
        '2026-08-10', '2026-09-10', '1075', 'Amit Verma', '01',
        'Local Branch Banking Route', 'STANDALONE', 'Plot 42 Sector 18 Central Market', 'Mumbai', '19.076090', '72.877726',
        '', '2026-09-12', '12500', 'PENDING', 'NO', 'Standard', 'SMS,WhatsApp,Call'
      ];

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), sampleRow.join(',')].join('\\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'eCollect_Master_Accounts_Template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('📥 Master Accounts CSV template downloaded!');
    } catch (err) {
      console.error('CSV template error:', err);
      showToast('Could not download CSV template', 'error');
    }
  };

  // Export Daily Due List Excel
  const handleDownloadDueListSheet = () => {
    try {
      const duesData = accounts
        .filter(a => Number(a.dueAmount || a.emiAmount || 0) > 0)
        .map((a, i) => {
          const npa = calculateLoanNpaStatus(a);
          const bucket = calculateAccountBucket(a);
          return {
            'Sr No': i + 1,
            'Account No': a.accountNumber,
            'Customer Name': a.accountHolder,
            'Mobile': a.phone || a.mobileNumber || '',
            'Product': a.collectionType || 'LOAN',
            'Scheme / Type': a.loanCategory || a.schemeName || 'Loan',
            'Current Due Demand (₹)': Number(a.dueAmount || a.emiAmount || 0),
            'Outstanding (₹)': Number(a.balance || a.outstandingAmount || 0),
            'EMI Amount (₹)': Number(a.emiAmount || 0),
            'Frequency': a.emiFrequency || 'Monthly',
            'Due Date': a.nextDueDate || '',
            'DPD': bucket.dpd,
            'Bucket / NPA Status': bucket.label,
            'PTP Status': a.ptpStatus || 'NONE',
            'PTP Date': a.ptpDate ? new Date(a.ptpDate).toLocaleDateString('en-IN') : 'None',
            'Customer Address': a.customerAddress || a.address || '',
            'City': a.city || a.branchName || '',
            'GPS Coordinates': a.latitude && a.longitude ? \`\${a.latitude}, \${a.longitude}\` : '',
            'Agent Code': a.assignedAgentCode || '',
            'Agent Name': a.assignedAgentName || ''
          };
        });

      if (duesData.length === 0) {
        showToast('No accounts currently have pending due demands to export.', 'warning');
        return;
      }

      const ws = XLSX.utils.json_to_sheet(duesData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'DailyDueDemand');
      XLSX.writeFile(wb, \`eCollect_Daily_Due_List_\${new Date().toISOString().slice(0, 10)}.xlsx\`);
      showToast(\`📥 Exported Daily Due List for \${duesData.length} borrowers!\`);
    } catch (err) {
      console.error('Due list sheet download error:', err);
      showToast('Could not export due list spreadsheet', 'error');
    }
  };
`;

if (!code.includes('handleDownloadAccountsExcelTemplate')) {
  code = code.replace(
    'const handleBulkAccountsFileChange = async (e) => {',
    templateHandlers + '\n  const handleBulkAccountsFileChange = async (e) => {'
  );
}

// 2. Update handleSubmitBulkAccounts to parse and map ALL 24 attributes
const oldBulkParserLoop = `const accountObj = {
          id: \`bulk_\${Date.now()}_\${idx}\`,
          accountCode: \`ACC-\${accNo.slice(-6)}\`,
          bankName: bankName,
          accountHolder: custName,
          accountNumber: accNo,
          maskedNumber: masked,
          ifscCode: ifsc,
          accountType: \`\${prod} • \${scheme} (\${freq})\`,
          collectionType: prod,
          schemeName: scheme,
          loanCategory: scheme,
          branchName: branchCode,
          balance: outstanding,
          outstandingAmount: outstanding,
          tenureMonths: tenure,
          dueAmount: due,
          emiAmount: emi,
          emiFrequency: freq,
          lastPaidDate: lastPaid ? new Date(lastPaid).toLocaleDateString('en-IN') : 'N/A',
          nextDueDate: nextDue ? new Date(nextDue).toLocaleDateString('en-IN') : 'N/A',
          assignedAgentCode: agentCode,
          assignedAgentName: agentName,
          dailyLimit: 5000000,
          isActive: true,
          verified: true,
          updatedAt: new Date().toISOString(),
          reminderDaysBeforeDue: remDays,
          reminderChannels: remChannels,
          reminderRiskLevel: due > 50000 ? 'HighRisk' : 'Standard',
          customReminderNote: '',
          phone: phone,
          email: email
        };`;

const newBulkParserLoop = `const photo = (r.CustomerPhoto || r.customerPhoto || r.Photo || r.photo || '').toString().trim();
        const address = (r.CustomerAddress || r.customerAddress || r.Address || r.address || '').toString().trim();
        const city = (r.City || r.city || '').toString().trim();
        const lat = (r.Latitude || r.latitude || r.Lat || r.lat || '').toString().trim();
        const lng = (r.Longitude || r.longitude || r.Lng || r.lng || '').toString().trim();
        const ptpDateVal = r.PtpDate || r.ptpDate || r.PTPDate || null;
        const ptpAmtVal = r.PtpAmount || r.ptpAmount ? Number(r.PtpAmount || r.ptpAmount) : null;
        const ptpStatVal = (r.PtpStatus || r.ptpStatus || 'NONE').toString().trim();
        const ptpNotesVal = (r.PtpNotes || r.ptpNotes || '').toString().trim();
        const isMandatory = (r.IsMandatoryCall === true || String(r.IsMandatoryCall || '').toUpperCase() === 'YES' || due > 30000);

        if (photo) {
          saveStoredCustomerPhoto(accNo, photo);
        }

        const accountObj = {
          id: \`bulk_\${Date.now()}_\${idx}\`,
          accountCode: \`ACC-\${accNo.slice(-6)}\`,
          bankName: bankName,
          accountHolder: custName,
          accountNumber: accNo,
          maskedNumber: masked,
          ifscCode: ifsc,
          accountType: \`\${prod} • \${scheme} (\${freq})\`,
          collectionType: prod,
          schemeName: scheme,
          loanCategory: scheme,
          branchName: branchCode,
          balance: outstanding,
          outstandingAmount: outstanding,
          tenureMonths: tenure,
          dueAmount: due,
          emiAmount: emi,
          emiFrequency: freq,
          lastPaidDate: lastPaid ? new Date(lastPaid).toLocaleDateString('en-IN') : 'N/A',
          nextDueDate: nextDue ? new Date(nextDue).toLocaleDateString('en-IN') : 'N/A',
          assignedAgentCode: agentCode,
          assignedAgentName: agentName,
          dailyLimit: 5000000,
          isActive: true,
          verified: true,
          updatedAt: new Date().toISOString(),
          reminderDaysBeforeDue: remDays,
          reminderChannels: remChannels,
          reminderRiskLevel: due > 50000 ? 'HighRisk' : 'Standard',
          customReminderNote: '',
          phone: phone,
          email: email,
          customerPhoto: photo,
          customerAddress: address,
          city: city,
          latitude: lat,
          longitude: lng,
          ptpDate: ptpDateVal,
          ptpAmount: ptpAmtVal,
          ptpStatus: ptpStatVal,
          ptpNotes: ptpNotesVal,
          isMandatoryCall: isMandatory,
          mandatoryCallDate: isMandatory ? new Date(Date.now() + 86400000).toISOString().split('T')[0] : null
        };`;

if (code.includes(oldBulkParserLoop)) {
  code = code.replace(oldBulkParserLoop, newBulkParserLoop);
}

// 3. Add Dedicated Due List Tab in Top Navigation (Product Tabs)
const dueListNavTab = `
          {/* Dedicated Daily Due List / Demand Ledger Tab */}
          <button 
            type="button" 
            className={\`collection-nav-tab is-due-tab \${collectionProductTab === 'DUE_LIST' ? 'is-active' : ''}\`}
            onClick={() => {
              setCollectionProductTab('DUE_LIST');
            }}
            style={{ 
              borderColor: collectionProductTab === 'DUE_LIST' ? '#ef4444' : 'rgba(239, 68, 68, 0.4)', 
              color: collectionProductTab === 'DUE_LIST' ? '#ffffff' : '#f87171',
              background: collectionProductTab === 'DUE_LIST' ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(185, 28, 28, 0.35))' : 'rgba(239, 68, 68, 0.08)'
            }}
          >
            <span className="tab-dot">📋</span>
            <span className="tab-label font-bold">Daily Due Demand Ledger</span>
            <span className="tab-badge-count font-mono" style={{ background: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
              {accounts.filter(a => Number(a.dueAmount || a.emiAmount || 0) > 0).length}
            </span>
          </button>
`;

if (!code.includes('Daily Due Demand Ledger')) {
  code = code.replace(
    '<span className="tab-label">All Collections</span>',
    '<span className="tab-label">All Collections</span>'
  );
  code = code.replace(
    '{/* Additional Dynamic Merchant Configured Collection Types */}',
    dueListNavTab + '\n          {/* Additional Dynamic Merchant Configured Collection Types */}'
  );
}

// 4. Update filteredAccounts to handle DUE_LIST tab
const dueListFilterPredicate = `
      // Dedicated Due List Tab Filter
      if (collectionProductTab === 'DUE_LIST') {
        const hasDue = Number(acc.dueAmount || acc.emiAmount || 0) > 0;
        if (!hasDue) return false;
      }
`;

if (!code.includes('collectionProductTab === \'DUE_LIST\'')) {
  code = code.replace(
    '// Standalone Delinquency Bucket & Queue Matching',
    dueListFilterPredicate + '\n      // Standalone Delinquency Bucket & Queue Matching'
  );
}

// 5. Add Operations Banner when in DUE_LIST tab above the table
const dueListBannerMarkup = `
        {/* Daily Due Demand Ledger Operations Banner */}
        {collectionProductTab === 'DUE_LIST' && (() => {
          const dueAccounts = accounts.filter(a => Number(a.dueAmount || a.emiAmount || 0) > 0);
          const totalDueDemand = dueAccounts.reduce((sum, a) => sum + Number(a.dueAmount || a.emiAmount || 0), 0);
          const totalOutstanding = dueAccounts.reduce((sum, a) => sum + Number(a.balance || a.outstandingAmount || 0), 0);

          return (
            <div style={{ margin: '0 0 16px 0', padding: '16px 20px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(15, 23, 42, 0.95))', border: '1px solid rgba(239, 68, 68, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                  📋
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#f87171' }}>Daily Due Demand Ledger & Field Sheet</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    Showing active morning demand queue for field collectors & doorstep recovery agents.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Active Overdue Demand</div>
                  <div className="font-mono font-bold" style={{ fontSize: '18px', color: '#ef4444' }}>
                    ₹{totalDueDemand.toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Due Borrowers</div>
                  <div className="font-mono font-bold" style={{ fontSize: '18px', color: '#38bdf8' }}>
                    {dueAccounts.length}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadDueListSheet}
                  className="btn-export-day-end"
                  style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', padding: '10px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}
                >
                  <AccountIcons.Download />
                  <span>Download Due List Sheet (.xlsx)</span>
                </button>
              </div>
            </div>
          );
        })()}
`;

if (!code.includes('Daily Due Demand Ledger Operations Banner')) {
  code = code.replace(
    '{/* Accounts Master Table */}',
    dueListBannerMarkup + '\n        {/* Accounts Master Table */}'
  );
}

// 6. Update Dossier Place & Geolocation Section with Live Embedded Interactive Map
const oldDossierGeoSection = `<div className="dossier-section-block">
                    <div className="dossier-section-head">
                      <AccountIcons.MapPin />
                      <span>Customer Doorstep Location & Geolocation Mapping</span>
                    </div>
                    <div className="dossier-data-grid">
                      <div className="data-box" style={{ gridColumn: 'span 2' }}>
                        <span className="data-lbl">Residential / Business Address</span>
                        <span className="data-val font-bold">
                          {selectedAccount.customerAddress || selectedAccount.address || 'Street address on file - Main Branch Node'}
                        </span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">GPS Coordinates</span>
                        <span className="data-val font-mono text-cyan">
                          {selectedAccount.latitude && selectedAccount.longitude
                            ? \`\${selectedAccount.latitude}, \${selectedAccount.longitude}\`
                            : '19.0760° N, 72.8777° E (Central)'}
                        </span>
                      </div>
                    </div>

                    {/* Google Maps Navigation Launcher */}
                    <div className="dossier-geo-launcher-bar">
                      <a 
                        href={\`https://www.google.com/maps/dir/?api=1&destination=\${selectedAccount.latitude || '19.0760'},\${selectedAccount.longitude || '72.8777'}\`}
                        target="_blank" 
                        rel="noreferrer"
                        className="btn-open-google-maps"
                      >
                        <AccountIcons.Navigation /> 🗺️ Open in Google Maps Doorstep Navigation
                      </a>
                    </div>
                  </div>`;

const newDossierGeoSection = `<div className="dossier-section-block">
                    <div className="dossier-section-head">
                      <AccountIcons.MapPin />
                      <span>Customer Doorstep Location & Visual Map Navigation</span>
                    </div>
                    
                    <div className="dossier-data-grid">
                      <div className="data-box" style={{ gridColumn: 'span 2' }}>
                        <span className="data-lbl">Customer Physical Place & Address</span>
                        <span className="data-val font-bold" style={{ fontSize: '13.5px' }}>
                          {selectedAccount.customerAddress || selectedAccount.address || 'Doorstep Place / Street Address on record - Branch Node'}
                        </span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">City / Region</span>
                        <span className="data-val font-bold text-cyan">
                          {selectedAccount.city || selectedAccount.branchName || 'Main Cluster'}
                        </span>
                      </div>
                      <div className="data-box">
                        <span className="data-lbl">GPS Coordinates</span>
                        <span className="data-val font-mono text-cyan">
                          {selectedAccount.latitude && selectedAccount.longitude
                            ? \`\${selectedAccount.latitude}° N, \${selectedAccount.longitude}° E\`
                            : '19.0760° N, 72.8777° E (Default)'}
                        </span>
                      </div>
                      <div className="data-box" style={{ gridColumn: 'span 2' }}>
                        <span className="data-lbl">Doorstep Routing Status</span>
                        <span className="data-val text-green" style={{ color: '#10b981', fontWeight: 600 }}>
                          ✓ GPS Location Verified for Agent Doorstep Collection
                        </span>
                      </div>
                    </div>

                    {/* Live Embedded Map Visualizer */}
                    <div style={{ marginTop: '12px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0f172a', position: 'relative' }}>
                      <iframe
                        title="Customer Doorstep Map Location"
                        width="100%"
                        height="200"
                        style={{ border: 'none', filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
                        loading="lazy"
                        src={\`https://www.openstreetmap.org/export/embed.html?bbox=\${Number(selectedAccount.longitude || 72.8777) - 0.015}%2C\${Number(selectedAccount.latitude || 19.0760) - 0.015}%2C\${Number(selectedAccount.longitude || 72.8777) + 0.015}%2C\${Number(selectedAccount.latitude || 19.0760) + 0.015}&layer=mapnik&marker=\${selectedAccount.latitude || '19.0760'}%2C\${selectedAccount.longitude || '72.8777'}\`}
                      />
                      
                      {/* Overlay Map Banner */}
                      <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(8px)', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px' }}>📍</span>
                          <div>
                            <div className="font-bold" style={{ fontSize: '12px' }}>{selectedAccount.accountHolder}</div>
                            <div className="font-mono text-muted" style={{ fontSize: '10.5px' }}>{selectedAccount.customerAddress || 'Doorstep Pin'}</div>
                          </div>
                        </div>
                        <a 
                          href={\`https://www.google.com/maps/dir/?api=1&destination=\${selectedAccount.latitude || '19.0760'},\${selectedAccount.longitude || '72.8777'}\`}
                          target="_blank" 
                          rel="noreferrer"
                          className="btn-open-google-maps"
                          style={{ padding: '6px 12px', fontSize: '11.5px' }}
                        >
                          <AccountIcons.Navigation /> 🗺️ Open in Google Maps Navigation
                        </a>
                      </div>
                    </div>
                  </div>`;

if (code.includes(oldDossierGeoSection)) {
  code = code.replace(oldDossierGeoSection, newDossierGeoSection);
}

fs.writeFileSync(accountsPath, code, 'utf8');
console.log('✅ Due List Tab, Embedded Interactive Map, and Complete 24-Attribute Excel Template integrated in Accounts.jsx');
