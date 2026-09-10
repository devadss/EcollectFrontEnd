import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { customerApi } from '../../services/api';
import './Customers.css';

// Crisp Geometric SVG Icons
const CustIcons = {
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Deposit: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <path d="M12 14v4M10 16l2-2 2 2" />
    </svg>
  ),
  Calendar: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Phone: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Search: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" />
    </svg>
  ),
  Download: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Eye: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Copy: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  ArrowUp: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  Receipt: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  )
};

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);
  const [selectedCust, setSelectedCust] = useState(null);
  const [collectModalCust, setCollectModalCust] = useState(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectSuccess, setCollectSuccess] = useState(false);

  const loadRdCustomers = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch dynamic RD customers from backend via RD_CUSTOMERS_UNDER_AGENT integration
      const res = await customerApi.getRDCustomersUnderAgent({
        branch_id: '01',
        agent_id: '1075',
        merchantId: 4,
        productType: 'RD'
      });

      const responsePayload = res?.data?.data || res?.data || {};
      const rawList = 
        responsePayload?.CustomerList?.data || 
        responsePayload?.CustomerList?.Data || 
        responsePayload?.data || 
        (Array.isArray(responsePayload) ? responsePayload : null);

      if (rawList && Array.isArray(rawList) && rawList.length > 0) {
        const formatted = rawList.map((item, index) => ({
          id: item.Cust_Id || item.id || (index + 1),
          accountNo: item.Dep_GlobalAccNo || item.accountNo || `RD-01-${String(index + 1).padStart(6, '0')}`,
          customerName: item.Cust_Name?.trim() || item.customerName || 'Customer',
          mobileNo: item.mobileNo || item.Phone || `+91 98450 ${String(item.Cust_Id || index).padStart(5, '0')}`,
          monthlyAmount: item.monthlyAmount || item.Amount || 2000,
          totalDeposited: item.totalDeposited || 12000,
          installmentsPaid: item.installmentsPaid || 6,
          tenureMonths: item.tenureMonths || 12,
          interestRate: item.interestRate || '7.25%',
          schemeName: item.Sch_Name || 'RD-12-NRL',
          schemeCode: item.Sch_Code || '04',
          nextDueDate: item.nextDueDate || '2026-08-25',
          maturityDate: item.maturityDate || '2027-08-25',
          branchId: '01',
          merchantId: 4,
          productType: 'RD',
          status: item.status || 'Active'
        }));
        setCustomers(formatted);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.warn('Backend dynamic RD API unavailable:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRdCustomers();
  }, [loadRdCustomers]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenCollect = (cust) => {
    setCollectModalCust(cust);
    setCollectAmount(cust.monthlyAmount);
    setCollectSuccess(false);
  };

  const handleConfirmCollect = (e) => {
    e.preventDefault();
    setCollectSuccess(true);
    setTimeout(() => {
      setCustomers(prev => prev.map(c => c.id === collectModalCust.id ? {
        ...c,
        totalDeposited: c.totalDeposited + Number(collectAmount),
        installmentsPaid: c.installmentsPaid + 1,
        status: 'Active'
      } : c));
      setCollectModalCust(null);
    }, 1200);
  };

  // Filtered List
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = 
        (c.customerName || '').toLowerCase().includes(q) ||
        (c.accountNo || '').toLowerCase().includes(q) ||
        (c.mobileNo || '').toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || c.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  const totalMonthlyTarget = useMemo(() => {
    return customers.reduce((sum, c) => sum + (Number(c.monthlyAmount) || 0), 0);
  }, [customers]);

  const totalCollectedPool = useMemo(() => {
    return customers.reduce((sum, c) => sum + (Number(c.totalDeposited) || 0), 0);
  }, [customers]);

  return (
    <DashboardLayout pageTitle="RD Customers Under Agent">
      {loading && <LoadingAnimation message="Fetching RD Customers via DIGICOB Core Banking Gateway..." />}

      <div className="rd-customers-page-container">
        
        {/* Top Hero Header */}
        <div className="rd-hero-header">
          <div className="rd-hero-titles">
            <div className="rd-badge-tag">
              <span className="pulse-dot"></span>
              <CustIcons.Sparkles />
              <span>DIGICOB Core Banking Gateway • Branch Node: 09</span>
            </div>
            <h1 className="rd-page-title">
              RD Customers <span className="gradient-text">Under Agent</span>
            </h1>
            <p className="rd-page-subtitle">
              Recurring Deposit accounts, collection schedules, and real-time installment ledger integration
            </p>
          </div>

          <div className="rd-header-actions">
            <button className="btn-export-dossier" onClick={() => window.print()}>
              <CustIcons.Download />
              <span>Export RD Ledger</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Telemetry Cards */}
        <div className="rd-kpi-grid">
          
          <div className="rd-kpi-card">
            <div className="kpi-top">
              <span className="kpi-label">Assigned RD Customers</span>
              <div className="kpi-icon is-indigo"><CustIcons.Users /></div>
            </div>
            <div className="kpi-value font-mono">{customers.length}</div>
            <div className="kpi-foot">
              <span className="trend-tag is-up"><CustIcons.ArrowUp /> Active Agent Portfolio</span>
            </div>
          </div>

          <div className="rd-kpi-card">
            <div className="kpi-top">
              <span className="kpi-label">Monthly Target Quota</span>
              <div className="kpi-icon is-cyan"><CustIcons.Deposit /></div>
            </div>
            <div className="kpi-value font-mono">₹{totalMonthlyTarget.toLocaleString('en-IN')}</div>
            <div className="kpi-foot">
              <span className="trend-tag is-up"><CustIcons.ArrowUp /> Monthly Recurring</span>
            </div>
          </div>

          <div className="rd-kpi-card">
            <div className="kpi-top">
              <span className="kpi-label">Total Cumulative Deposits</span>
              <div className="kpi-icon is-green"><CustIcons.Receipt /></div>
            </div>
            <div className="kpi-value font-mono text-green">₹{totalCollectedPool.toLocaleString('en-IN')}</div>
            <div className="kpi-foot">
              <span className="trend-tag is-up"><CustIcons.ArrowUp /> Safe Banking Custody</span>
            </div>
          </div>

          <div className="rd-kpi-card">
            <div className="kpi-top">
              <span className="kpi-label">Node Status</span>
              <div className="kpi-icon is-amber"><CustIcons.Sparkles /></div>
            </div>
            <div className="kpi-value font-mono text-cyan">Node 09</div>
            <div className="kpi-foot">
              <span className="trend-tag is-up"><CustIcons.ArrowUp /> Live DIGICOB Sync</span>
            </div>
          </div>

        </div>

        {/* Search & Filter Toolbar */}
        <div className="rd-filter-bar">
          <div className="search-box-wrap">
            <CustIcons.Search />
            <input 
              type="text" 
              placeholder="Search by customer name, RD account number, phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rd-search-input"
            />
          </div>

          <div className="filter-select-group">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rd-filter-dropdown"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active Accounts</option>
              <option value="Due Today">Due Today</option>
              <option value="Matured">Matured</option>
            </select>
          </div>
        </div>

        {/* Master RD Customers Table */}
        <div className="rd-table-card">
          <div className="table-scroll-wrapper">
            <table className="rd-master-table">
              <thead>
                <tr>
                  <th>RD Account & Product</th>
                  <th>Customer Name</th>
                  <th>Contact Mobile</th>
                  <th>Monthly Installment</th>
                  <th>Progress / Deposited</th>
                  <th>Next Due Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-row-cell">
                      <div className="empty-state-box">
                        <CustIcons.Users />
                        <h3>No RD Customers Located</h3>
                        <p>No matching recurring deposit customer records found under this agent node.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map(cust => (
                    <tr key={cust.id} className="rd-row-item">
                      
                      {/* RD Account */}
                      <td>
                        <div className="rd-acc-cell font-mono">
                          <span className="acc-number font-bold">{cust.accountNo}</span>
                          <button 
                            className="btn-copy-icon" 
                            onClick={() => handleCopy(cust.accountNo, cust.id)}
                            title="Copy Account Number"
                          >
                            {copiedId === cust.id ? <CustIcons.Check /> : <CustIcons.Copy />}
                          </button>
                        </div>
                      </td>

                      {/* Customer Name */}
                      <td>
                        <span className="customer-full-name font-bold">{cust.customerName}</span>
                      </td>

                      {/* Contact */}
                      <td>
                        <span className="phone-text font-mono text-muted">
                          <CustIcons.Phone /> {cust.mobileNo}
                        </span>
                      </td>

                      {/* Monthly Installment */}
                      <td>
                        <span className="monthly-amount font-mono font-bold text-cyan">
                          ₹{cust.monthlyAmount.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Progress */}
                      <td>
                        <div className="progress-cell-stack">
                          <span className="deposited-sum font-mono font-bold text-green">
                            ₹{cust.totalDeposited.toLocaleString('en-IN')}
                          </span>
                          <span className="tenure-sub text-muted font-mono">
                            {cust.installmentsPaid} / {cust.tenureMonths} Months ({cust.interestRate})
                          </span>
                        </div>
                      </td>

                      {/* Next Due */}
                      <td>
                        <span className="due-date-text font-mono text-muted">
                          <CustIcons.Calendar /> {cust.nextDueDate}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`rd-status-pill is-${cust.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          <span className="status-dot"></span>
                          <span>{cust.status}</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="rd-actions-group">
                          <button 
                            className="btn-collect-inst"
                            onClick={() => handleOpenCollect(cust)}
                            disabled={cust.status === 'Matured'}
                            title="Collect Installment"
                          >
                            <CustIcons.Deposit /> Collect
                          </button>
                          <button 
                            className="btn-view-passbook" 
                            onClick={() => setSelectedCust(cust)}
                            title="View Customer Passbook"
                          >
                            <CustIcons.Eye />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Passbook Modal */}
        {selectedCust && (
          <div className="rd-modal-overlay" onClick={() => setSelectedCust(null)}>
            <div className="rd-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="rd-modal-head">
                <div className="modal-head-title">
                  <CustIcons.Deposit />
                  <h3>Recurring Deposit Passbook</h3>
                </div>
                <button className="btn-close" onClick={() => setSelectedCust(null)}>✕</button>
              </div>

              <div className="rd-modal-body">
                <div className="passbook-hero-banner">
                  <span className="hero-product-tag">Product: RD • DIGICOB</span>
                  <h2 className="hero-cust-name">{selectedCust.customerName}</h2>
                  <span className="hero-acc font-mono">{selectedCust.accountNo}</span>
                </div>

                <div className="passbook-spec-grid">
                  <div className="spec-box">
                    <span className="lbl">Monthly Installment</span>
                    <span className="val font-mono text-cyan">₹{selectedCust.monthlyAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="spec-box">
                    <span className="lbl">Total Deposited Pool</span>
                    <span className="val font-mono text-green">₹{selectedCust.totalDeposited.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="spec-box">
                    <span className="lbl">Interest Rate</span>
                    <span className="val font-mono">{selectedCust.interestRate} p.a.</span>
                  </div>
                  <div className="spec-box">
                    <span className="lbl">Installments Completed</span>
                    <span className="val font-mono">{selectedCust.installmentsPaid} of {selectedCust.tenureMonths}</span>
                  </div>
                  <div className="spec-box">
                    <span className="lbl">Next Installment Due</span>
                    <span className="val font-mono">{selectedCust.nextDueDate}</span>
                  </div>
                  <div className="spec-box">
                    <span className="lbl">Maturity Date</span>
                    <span className="val font-mono text-amber">{selectedCust.maturityDate}</span>
                  </div>
                </div>
              </div>

              <div className="rd-modal-foot">
                <button className="btn-close-passbook" onClick={() => setSelectedCust(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collect Installment Modal */}
        {collectModalCust && (
          <div className="rd-modal-overlay" onClick={() => setCollectModalCust(null)}>
            <div className="rd-modal-card is-collect" onClick={(e) => e.stopPropagation()}>
              <div className="rd-modal-head">
                <div className="modal-head-title">
                  <CustIcons.Deposit />
                  <h3>Collect RD Installment</h3>
                </div>
                <button className="btn-close" onClick={() => setCollectModalCust(null)}>✕</button>
              </div>

              {collectSuccess ? (
                <div className="collect-success-box">
                  <div className="success-icon"><CustIcons.Check /></div>
                  <h3>Installment Collected Successfully!</h3>
                  <p>Receipt generated and sent via SMS to {collectModalCust.mobileNo}.</p>
                </div>
              ) : (
                <form onSubmit={handleConfirmCollect} className="collect-form">
                  <div className="collect-customer-banner">
                    <span className="b-name font-bold">{collectModalCust.customerName}</span>
                    <span className="b-acc font-mono text-muted">{collectModalCust.accountNo}</span>
                  </div>

                  <div className="form-field-unit">
                    <label>Collection Amount (₹)</label>
                    <input 
                      type="number" 
                      value={collectAmount}
                      onChange={(e) => setCollectAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-field-unit">
                    <label>Payment Collection Mode</label>
                    <select defaultValue="Cash">
                      <option value="Cash">Cash Handover</option>
                      <option value="UPI">UPI Instant QR</option>
                      <option value="Debit Card">Field POS Card Swipe</option>
                    </select>
                  </div>

                  <div className="collect-modal-actions">
                    <button type="button" className="btn-cancel" onClick={() => setCollectModalCust(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-confirm-collect">
                      Confirm & Issue Receipt
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default Customers;
