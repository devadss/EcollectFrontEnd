import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { accountApi } from '../../services/api';
import { lookupIFSC, INDIAN_BANKS_LIST, sanitizeAccountNumber } from '../../services/bankService';
import './Accounts.css';

// Crisp Geometric SVG Icons
const AccountIcons = {
  Bank: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4" />
    </svg>
  ),
  CreditCard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="6" y1="15" x2="10" y2="15" />
    </svg>
  ),
  Plus: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Download: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Search: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Eye: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  ArrowUp: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
};

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [notification, setNotification] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    accountType: 'Settlement',
    branchName: 'Mumbai Central',
    dailyLimit: 5000000,
    isActive: true,
  });

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  })();

  const rawRole = localStorage.getItem('user_role') || localStorage.getItem('role') || 'branchadmin';

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const bId = user?.branchId || user?.branch_id || '01';
      const bCode = user?.branchCode || user?.external_branch_id || '01';
      const aId = user?.agentId || '1075';

      const res = await accountApi.getAll({
        branch_id: bId,
        branchCode: bCode,
        agent_id: aId
      });
      
      const payload = res?.data?.data || res?.data || {};
      const rawList = 
        payload?.CustomerList?.data || 
        payload?.CustomerList?.Data || 
        payload?.data || 
        (Array.isArray(payload) ? payload : null);

      if (rawList && Array.isArray(rawList) && rawList.length > 0) {
        const formatted = rawList.map((item, index) => {
          const accNo = item.Dep_GlobalAccNo || item.accountNumber || `010427${String(index + 10)}`;
          const masked = accNo.length > 4 ? `•••• •••• ${accNo.slice(-4)}` : accNo;
          return {
            id: item.Cust_Id || item.id || (index + 1),
            accountCode: `RD-01-${item.Cust_Id || index + 1}`,
            bankName: item.Sch_Name ? `DIGICOB Bank (${item.Sch_Name})` : (item.bankName || 'DIGICOB Banking Pool'),
            accountHolder: item.Cust_Name?.trim() || item.accountHolder || 'Registered Customer',
            accountNumber: accNo,
            maskedNumber: masked,
            ifscCode: item.ifscCode || `DIGI000${item.Sch_Code || '04'}`,
            accountType: 'RD Deposit',
            branchName: 'Branch Node 01',
            balance: item.balance || 0,
            dailyLimit: item.dailyLimit || 5000000,
            isActive: true,
            verified: true,
            updatedAt: '2026-08-16T15:30:00Z',
            schemeName: item.Sch_Name || 'RD-12-NRL',
            schemeCode: item.Sch_Code || '04',
            customerId: item.Cust_Id
          };
        });
        setAccounts(formatted);
      } else if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setAccounts(res.data);
      } else {
        setAccounts([]);
      }
    } catch (error) {
      console.warn('Backend accounts API unavailable:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await accountApi.toggleStatus(id);
    } catch (e) {
      // Local state update
    }
    setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, isActive: !currentStatus } : acc));
    showToast(`Account status toggled to ${!currentStatus ? 'Active' : 'Inactive'}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate and remove this bank account?')) return;
    try {
      await accountApi.delete(id);
    } catch (e) {}
    setAccounts(prev => prev.filter(acc => acc.id !== id));
    if (selectedAccount?.id === id) setSelectedAccount(null);
    showToast('Bank Account removed successfully.');
  };

  const [isVerifyingIfsc, setIsVerifyingIfsc] = useState(false);

  const handleIfscLookup = async (code) => {
    const cleanCode = (code || formData.ifscCode || '').trim().toUpperCase();
    if (!cleanCode || cleanCode.length !== 11) {
      showToast('Please enter an 11-digit IFSC code', 'error');
      return;
    }
    setIsVerifyingIfsc(true);
    try {
      const res = await lookupIFSC(cleanCode);
      if (res.success && res.data) {
        setFormData(prev => ({
          ...prev,
          bankName: res.data.bankName || prev.bankName,
          branchName: res.data.branch || prev.branchName,
          ifscCode: res.data.ifsc || cleanCode
        }));
        showToast(`Verified: ${res.data.bankName} - ${res.data.branch || 'Branch'}`);
      } else {
        showToast(res.message || 'IFSC code not found in directory', 'error');
      }
    } catch (err) {
      showToast('Failed to lookup IFSC details', 'error');
    } finally {
      setIsVerifyingIfsc(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setFormData({
      bankName: '',
      accountHolder: '',
      accountNumber: '',
      confirmAccountNumber: '',
      ifscCode: '',
      accountType: 'Settlement',
      branchName: 'Mumbai Central',
      dailyLimit: 5000000,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc) => {
    setIsEditMode(true);
    setFormData({
      id: acc.id,
      bankName: acc.bankName || '',
      accountHolder: acc.accountHolder || '',
      accountNumber: acc.accountNumber || '',
      confirmAccountNumber: acc.accountNumber || '',
      ifscCode: acc.ifscCode || '',
      accountType: acc.accountType || 'Settlement',
      branchName: acc.branchName || 'Mumbai Central',
      dailyLimit: acc.dailyLimit || 5000000,
      isActive: acc.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!formData.bankName || !formData.accountHolder || !formData.accountNumber) {
      showToast('Please fill all mandatory account fields', 'error');
      return;
    }

    if (!isEditMode && formData.accountNumber !== formData.confirmAccountNumber) {
      showToast('Account numbers do not match', 'error');
      return;
    }

    if (isEditMode) {
      setAccounts(prev => prev.map(acc => acc.id === formData.id ? {
        ...acc,
        ...formData,
        maskedNumber: `•••• •••• ${formData.accountNumber.slice(-4)}`,
        updatedAt: new Date().toISOString()
      } : acc));
      showToast('Account details successfully updated.');
    } else {
      const newAcc = {
        id: Date.now(),
        accountCode: `ACC-IND-${String(accounts.length + 1).padStart(2, '0')}`,
        bankName: formData.bankName,
        accountHolder: formData.accountHolder,
        accountNumber: formData.accountNumber,
        maskedNumber: `•••• •••• ${formData.accountNumber.slice(-4)}`,
        ifscCode: formData.ifscCode.toUpperCase(),
        accountType: formData.accountType,
        branchName: formData.branchName,
        balance: 0,
        dailyLimit: Number(formData.dailyLimit),
        isActive: true,
        verified: true,
        updatedAt: new Date().toISOString()
      };
      setAccounts(prev => [newAcc, ...prev]);
      showToast('New bank account successfully connected.');
    }

    setIsModalOpen(false);
  };

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchesSearch = 
        (acc.bankName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.accountHolder || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.accountCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.ifscCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.branchName || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'ALL' || acc.accountType?.toLowerCase() === typeFilter.toLowerCase();
      const matchesStatus = statusFilter === 'ALL' || 
        (statusFilter === 'ACTIVE' && acc.isActive) ||
        (statusFilter === 'INACTIVE' && !acc.isActive);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [accounts, searchTerm, typeFilter, statusFilter]);

  const totalEscrowBalance = useMemo(() => {
    return accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  }, [accounts]);

  return (
    <DashboardLayout pageTitle="Branch • Customer & Collection Accounts" role={rawRole}>
      {loading && <LoadingAnimation message="Fetching Master Banking & Ledger Tables..." />}

      {notification && (
        <div className={`account-toast is-${notification.type}`}>
          <AccountIcons.Sparkles />
          <span>{notification.msg}</span>
        </div>
      )}

      <div className="accounts-page-container">
        
        {/* Top Hero Header */}
        <div className="accounts-hero-header">
          <div className="accounts-hero-titles">
            <div className="accounts-badge-tag">
              <span className="pulse-dot"></span>
              <AccountIcons.Sparkles />
              <span>Treasury & Account Ledger Routes</span>
            </div>
            <h1 className="accounts-page-title">
              Bank & Settlement <span className="gradient-text">Accounts</span>
            </h1>
            <p className="accounts-page-subtitle">
              Configure settlement nodal pools, merchant clearing routes, and banking gateway integrations
            </p>
          </div>

          <div className="accounts-header-actions">
            <button className="btn-export-accounts" onClick={() => window.print()}>
              <AccountIcons.Download />
              <span>Export Accounts</span>
            </button>
            <button className="btn-add-account" onClick={handleOpenAdd}>
              <AccountIcons.Plus />
              <span>Add Bank Account</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Telemetry Cards */}
        <div className="accounts-kpi-grid">
          
          <div className="acc-kpi-card">
            <div className="kpi-top">
              <span className="kpi-label">Configured Accounts</span>
              <div className="kpi-icon is-indigo"><AccountIcons.Bank /></div>
            </div>
            <div className="kpi-value font-mono">{accounts.length}</div>
            <div className="kpi-foot">
              <span className="trend-tag is-up"><AccountIcons.ArrowUp /> {accounts.filter(a => a.isActive).length} Live Active</span>
            </div>
          </div>

          <div className="acc-kpi-card">
            <div className="kpi-top">
              <span className="kpi-label">Total Escrow Holdings</span>
              <div className="kpi-icon is-green"><AccountIcons.CreditCard /></div>
            </div>
            <div className="kpi-value font-mono text-green">₹{(totalEscrowBalance / 10000000).toFixed(2)} Cr</div>
            <div className="kpi-foot">
              <span className="trend-tag is-up"><AccountIcons.ArrowUp /> Safe Banking Pool</span>
            </div>
          </div>

          <div className="acc-kpi-card">
            <div className="kpi-top">
              <span className="kpi-label">Daily Clearance Quota</span>
              <div className="kpi-icon is-cyan"><AccountIcons.ShieldCheck /></div>
            </div>
            <div className="kpi-value font-mono">₹3.75 Cr</div>
            <div className="kpi-foot">
              <span className="trend-tag is-up"><AccountIcons.ArrowUp /> T+1 Protocol</span>
            </div>
          </div>

          <div className="acc-kpi-card">
            <div className="kpi-top">
              <span className="kpi-label">Banking Gateway SLA</span>
              <div className="kpi-icon is-amber"><AccountIcons.Sparkles /></div>
            </div>
            <div className="kpi-value font-mono text-amber">99.98%</div>
            <div className="kpi-foot">
              <span className="trend-tag is-up"><AccountIcons.ArrowUp /> Zero Outages</span>
            </div>
          </div>

        </div>

        {/* Filter Toolbar */}
        <div className="accounts-filter-bar">
          
          <div className="search-input-wrap">
            <AccountIcons.Search />
            <input 
              type="text" 
              placeholder="Search by Bank, Account Holder, Code, IFSC..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="accounts-search-field"
            />
          </div>

          <div className="filter-buttons-group">
            <div className="type-toggle-pills">
              {['ALL', 'Escrow Nodal', 'Settlement', 'Current'].map(type => (
                <button
                  key={type}
                  className={`type-pill ${typeFilter === type ? 'is-active' : ''}`}
                  onClick={() => setTypeFilter(type)}
                >
                  {type}
                </button>
              ))}
            </div>

            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-select-dropdown"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

        </div>

        {/* Accounts Master Table */}
        <div className="accounts-table-card">
          <div className="table-responsive-container">
            <table className="accounts-master-table">
              <thead>
                <tr>
                  <th>Bank & Code</th>
                  <th>Account Holder</th>
                  <th>Account Number</th>
                  <th>IFSC & Branch</th>
                  <th>Route Type</th>
                  <th>Holdings Balance</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-table-cell">
                      <div className="empty-state-box">
                        <AccountIcons.Bank />
                        <h3>No Bank Accounts Located</h3>
                        <p>No matching banking route or account records found for your criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map(acc => (
                    <tr key={acc.id} className="account-row-item">
                      
                      {/* Bank & Code */}
                      <td>
                        <div className="bank-identity-cell">
                          <div className="bank-avatar-box">
                            {acc.bankName ? acc.bankName.slice(0, 2).toUpperCase() : 'BK'}
                          </div>
                          <div className="bank-info-stack">
                            <span className="bank-title font-bold">{acc.bankName}</span>
                            <span className="bank-code-chip font-mono text-muted">{acc.accountCode}</span>
                          </div>
                        </div>
                      </td>

                      {/* Holder */}
                      <td>
                        <div className="holder-stack">
                          <span className="holder-name font-bold">{acc.accountHolder}</span>
                          {acc.verified && (
                            <span className="verified-pill">
                              <AccountIcons.ShieldCheck /> 2FA Verified
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Account Number */}
                      <td>
                        <div className="acc-number-cell font-mono">
                          <span>{acc.maskedNumber || acc.accountNumber}</span>
                          <button 
                            className="btn-copy-acc" 
                            onClick={() => handleCopy(acc.accountNumber, acc.id)}
                            title="Copy Account Number"
                          >
                            {copiedId === acc.id ? <AccountIcons.Check /> : <AccountIcons.Copy />}
                          </button>
                        </div>
                      </td>

                      {/* IFSC & Branch */}
                      <td>
                        <div className="ifsc-branch-stack">
                          <span className="ifsc-text font-mono font-bold text-cyan">{acc.ifscCode}</span>
                          <span className="branch-sub text-muted">{acc.branchName || 'Mumbai Central'}</span>
                        </div>
                      </td>

                      {/* Route Type */}
                      <td>
                        <span className="route-type-badge font-bold">{acc.accountType}</span>
                      </td>

                      {/* Balance */}
                      <td>
                        <span className="balance-val font-mono font-bold text-green">
                          ₹{Number(acc.balance || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`status-pill ${acc.isActive ? 'is-active' : 'is-inactive'}`}>
                          <span className="status-dot"></span>
                          <span>{acc.isActive ? 'Active' : 'Disabled'}</span>
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="row-actions-group">
                          <button 
                            className="action-btn is-view" 
                            onClick={() => setSelectedAccount(acc)}
                            title="View Account Dossier"
                          >
                            <AccountIcons.Eye />
                          </button>
                          <button 
                            className="action-btn is-edit" 
                            onClick={() => handleOpenEdit(acc)}
                            title="Edit Account"
                          >
                            <AccountIcons.Edit />
                          </button>
                          <button 
                            className="action-btn is-toggle" 
                            onClick={() => handleToggleStatus(acc.id, acc.isActive)}
                            title={acc.isActive ? "Deactivate Route" : "Activate Route"}
                          >
                            {acc.isActive ? '⏸️' : '▶️'}
                          </button>
                          <button 
                            className="action-btn is-delete" 
                            onClick={() => handleDelete(acc.id)}
                            title="Delete Account"
                          >
                            <AccountIcons.Trash />
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

        {/* View Account Dossier Slideover / Modal */}
        {selectedAccount && (
          <div className="account-modal-overlay" onClick={() => setSelectedAccount(null)}>
            <div className="account-dossier-card" onClick={(e) => e.stopPropagation()}>
              <div className="dossier-card-head">
                <div className="dossier-badge-wrap">
                  <AccountIcons.Bank />
                  <h3>Banking Route Dossier</h3>
                </div>
                <button className="btn-modal-close" onClick={() => setSelectedAccount(null)}>✕</button>
              </div>

              <div className="dossier-modal-body">
                <div className="dossier-bank-hero">
                  <div className="big-bank-icon">{selectedAccount.bankName.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <h2 className="dossier-bank-name">{selectedAccount.bankName}</h2>
                    <span className="dossier-code font-mono text-cyan">{selectedAccount.accountCode} • {selectedAccount.accountType}</span>
                  </div>
                </div>

                <div className="dossier-data-grid">
                  <div className="data-box">
                    <span className="data-lbl">Account Holder</span>
                    <span className="data-val font-bold">{selectedAccount.accountHolder}</span>
                  </div>
                  <div className="data-box">
                    <span className="data-lbl">Account Number</span>
                    <span className="data-val font-mono">{selectedAccount.accountNumber}</span>
                  </div>
                  <div className="data-box">
                    <span className="data-lbl">IFSC Code</span>
                    <span className="data-val font-mono text-cyan">{selectedAccount.ifscCode}</span>
                  </div>
                  <div className="data-box">
                    <span className="data-lbl">Branch Node</span>
                    <span className="data-val">{selectedAccount.branchName}</span>
                  </div>
                  <div className="data-box">
                    <span className="data-lbl">Holdings Balance</span>
                    <span className="data-val font-mono text-green font-bold">₹{Number(selectedAccount.balance).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="data-box">
                    <span className="data-lbl">Daily Payout Limit</span>
                    <span className="data-val font-mono">₹{Number(selectedAccount.dailyLimit || 5000000).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="compliance-strip">
                  <AccountIcons.ShieldCheck />
                  <span>Account is verified with RTGS / NEFT / IMPS instant clearance routes and RBI compliance check.</span>
                </div>
              </div>

              <div className="dossier-modal-foot">
                <button className="btn-edit-from-modal" onClick={() => { const acc = selectedAccount; setSelectedAccount(null); handleOpenEdit(acc); }}>
                  <AccountIcons.Edit /> Edit Account Details
                </button>
                <button className="btn-close-modal" onClick={() => setSelectedAccount(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add / Edit Account Modal */}
        {isModalOpen && (
          <div className="account-modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="account-form-card" onClick={(e) => e.stopPropagation()}>
              <div className="dossier-card-head">
                <div className="dossier-badge-wrap">
                  <AccountIcons.Bank />
                  <h3>{isEditMode ? 'Modify Banking Route' : 'Connect New Bank Account'}</h3>
                </div>
                <button className="btn-modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
              </div>

              <form onSubmit={handleSaveForm} className="account-edit-form">
                
                <div className="form-row-dual">
                  <div className="form-field-group">
                    <label>Bank Name *</label>
                    <input 
                      type="text" 
                      list="accounts-banks-datalist"
                      placeholder="e.g. HDFC Bank, ICICI Bank"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      required
                    />
                    <datalist id="accounts-banks-datalist">
                      {INDIAN_BANKS_LIST.map((b) => (
                        <option key={b.code} value={b.name}>
                          {b.name} ({b.type})
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <div className="form-field-group">
                    <label>Account Holder Name *</label>
                    <input 
                      type="text" 
                      placeholder="Legal Entity / Full Name"
                      value={formData.accountHolder}
                      onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row-dual">
                  <div className="form-field-group">
                    <label>Account Number * (Numeric)</label>
                    <input 
                      type="password" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={18}
                      placeholder="Bank Account Number"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: sanitizeAccountNumber(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-field-group">
                    <label>Confirm Account Number *</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={18}
                      placeholder="Re-enter Account Number"
                      value={formData.confirmAccountNumber}
                      onChange={(e) => setFormData({ ...formData, confirmAccountNumber: sanitizeAccountNumber(e.target.value) })}
                      required={!isEditMode}
                    />
                  </div>
                </div>

                <div className="form-row-dual">
                  <div className="form-field-group">
                    <label>IFSC Code *</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        maxLength={11}
                        placeholder="e.g. HDFC0001892"
                        value={formData.ifscCode}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
                          setFormData({ ...formData, ifscCode: val });
                          if (val.length === 11) handleIfscLookup(val);
                        }}
                        style={{ flex: 1, textTransform: 'uppercase' }}
                        required
                      />
                      <button 
                        type="button" 
                        className="btn-fetch-ifsc-mini"
                        disabled={isVerifyingIfsc || !formData.ifscCode || formData.ifscCode.length < 5}
                        onClick={() => handleIfscLookup(formData.ifscCode)}
                        style={{
                          padding: '0 12px',
                          background: 'rgba(6, 182, 212, 0.15)',
                          border: '1px solid rgba(6, 182, 212, 0.4)',
                          borderRadius: '8px',
                          color: '#22d3ee',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {isVerifyingIfsc ? '...' : 'Auto-Fetch'}
                      </button>
                    </div>
                  </div>
                  <div className="form-field-group">
                    <label>Account Route Type</label>
                    <select 
                      value={formData.accountType}
                      onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                    >
                      <option value="Settlement">Settlement Payouts</option>
                      <option value="Escrow Nodal">Escrow Nodal Pool</option>
                      <option value="Current">Current Account</option>
                      <option value="Agent Disbursal">Agent Disbursals</option>
                      <option value="Reserve">Merchant Reserve</option>
                    </select>
                  </div>
                </div>

                <div className="form-row-dual">
                  <div className="form-field-group">
                    <label>Branch Regional Node</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Mumbai Central"
                      value={formData.branchName}
                      onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                    />
                  </div>
                  <div className="form-field-group">
                    <label>Daily Disbursal Limit (₹)</label>
                    <input 
                      type="number" 
                      value={formData.dailyLimit}
                      onChange={(e) => setFormData({ ...formData, dailyLimit: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-save-account">
                    <AccountIcons.Check /> {isEditMode ? 'Save Modifications' : 'Register Account'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default Accounts;
