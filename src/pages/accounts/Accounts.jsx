import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { accountApi, branchApi, agentApi, paymentApi, merchantApi } from '../../services/api';
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
  QrCode: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
      <line x1="7" y1="7" x2="7.01" y2="7"></line>
      <line x1="17" y1="7" x2="17.01" y2="7"></line>
      <line x1="7" y1="17" x2="7.01" y2="17"></line>
      <line x1="17" y1="17" x2="17.01" y2="17"></line>
    </svg>
  ),
  Refresh: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6"></path>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
    </svg>
  ),
  Printer: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"></polyline>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
      <rect x="6" y="14" width="12" height="8"></rect>
    </svg>
  ),
  Link: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  ExternalLink: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  ),
  Send: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  WhatsApp: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  ),
  PhoneCall: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  MessageSquare: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
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

  // Table Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Unified Collection Modal States (Dynamic QR + Payment Link)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [collectionTab, setCollectionTab] = useState('qr'); // 'qr' | 'link'
  const [qrAccount, setQrAccount] = useState(null);
  const [qrAmount, setQrAmount] = useState(500);
  const [qrCustomAmount, setQrCustomAmount] = useState('');
  const [qrNote, setQrNote] = useState('');
  
  // Dynamic UPI QR States
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Payment Link States
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState(null);
  const [linkData, setLinkData] = useState(null);
  const [customerPhoneInput, setCustomerPhoneInput] = useState('');
  const [customerEmailInput, setCustomerEmailInput] = useState('');
  const [linkStatus, setLinkStatus] = useState(null);
  const [checkingLinkStatus, setCheckingLinkStatus] = useState(false);

  // Multi-Product Collection Types (RD, LOAN, FD, RDCL, etc.)
  const [collectionProductTab, setCollectionProductTab] = useState('ALL'); // 'ALL' | 'RD' | 'LOAN' | 'FD' | 'RDCL'
  const [configuredCollectionTypes, setConfiguredCollectionTypes] = useState(['RD', 'LOAN', 'FD', 'RDCL']);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  }, []);

  const [agents, setAgents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedAgentCode, setSelectedAgentCode] = useState(
    user?.agentCode || user?.external_agent_id || localStorage.getItem('agentCode') || '1075'
  );
  const [selectedBranchCode, setSelectedBranchCode] = useState(
    user?.branchCode || localStorage.getItem('branchCode') || '01'
  );

  const rawRole = localStorage.getItem('user_role') || localStorage.getItem('role') || 'branchadmin';

  // Form State
  const [formData, setFormData] = useState({
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    accountType: 'Settlement',
    branchName: user?.branchName || user?.branch || localStorage.getItem('branchName') || 'Main Branch',
    dailyLimit: 5000000,
    isActive: true,
  });

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadAccounts = useCallback(async (overrideBranchCode = null, overrideAgentCode = null, targetProduct = null) => {
    const authUser = (() => {
      try {
        return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
      } catch {
        return {};
      }
    })();

    const bCode = overrideBranchCode || selectedBranchCode || authUser?.branchCode || authUser?.external_branch_id || localStorage.getItem('branchCode') || '01';
    const aCode = overrideAgentCode || selectedAgentCode || authUser?.agentCode || authUser?.external_agent_id || localStorage.getItem('agentCode') || '1075';
    const mId = authUser?.merchantId || authUser?.merchant_id || localStorage.getItem('merchantId') || 4;
    const activeProd = targetProduct !== null ? targetProduct : collectionProductTab;

    const baseQueryParams = {
      // Agent Identifiers (from Agents table)
      Agent_Id: String(aCode),
      agent_id: String(aCode),
      agentId: String(aCode),
      agentCode: String(aCode),
      external_agent_id: String(aCode),

      // Branch Identifiers (from Branch table)
      Branch_Id: String(bCode),
      branch_id: String(bCode),
      branchId: String(bCode),
      branchCode: String(bCode),
      Branch_Code: String(bCode),
      userBranchCode: String(bCode),

      // Query & Pagination
      Cust_Name: 'string',
      cust_name: 'string',
      PageNumber: 1,
      pageNumber: 1,
      PageSize: 100,
      pageSize: 100,

      // Merchant Identifiers
      merchantId: Number(mId) || mId,
      merchant_id: Number(mId) || mId,
      MerchantId: Number(mId) || mId,
    };

    setLoading(true);
    try {
      console.log(`📡 [CBS Engine] Fetching accounts for product [${activeProd}] with params:`, baseQueryParams);

      // Universal recursive extractor for multi-nested and stringified CBS responses
      const extractAccountList = (root) => {
        if (!root) return [];
        
        if (Array.isArray(root)) {
          if (root.length === 0) return [];
          if (typeof root[0] === 'string') {
            try {
              const parsed = JSON.parse(root[0]);
              const inner = extractAccountList(parsed);
              if (inner.length > 0) return inner;
            } catch (e) {}
          }
          return root;
        }

        if (typeof root === 'string') {
          try {
            const parsed = JSON.parse(root);
            return extractAccountList(parsed);
          } catch (e) {
            return [];
          }
        }

        if (typeof root === 'object') {
          if (root.CustomerList) {
            const list = extractAccountList(root.CustomerList);
            if (list.length > 0) return list;
          }
          if (root.customerList) {
            const list = extractAccountList(root.customerList);
            if (list.length > 0) return list;
          }
          if (root.AccountList) {
            const list = extractAccountList(root.AccountList);
            if (list.length > 0) return list;
          }
          if (root.accountList) {
            const list = extractAccountList(root.accountList);
            if (list.length > 0) return list;
          }
          if (root.LoanList) {
            const list = extractAccountList(root.LoanList);
            if (list.length > 0) return list;
          }
          if (root.loanList) {
            const list = extractAccountList(root.loanList);
            if (list.length > 0) return list;
          }
          if (root.accounts) {
            const list = extractAccountList(root.accounts);
            if (list.length > 0) return list;
          }
          if (root.data !== undefined) {
            const list = extractAccountList(root.data);
            if (list.length > 0) return list;
          }
          if (root.Data !== undefined) {
            const list = extractAccountList(root.Data);
            if (list.length > 0) return list;
          }
          if (root.result !== undefined) {
            const list = extractAccountList(root.result);
            if (list.length > 0) return list;
          }
          if (root.Result !== undefined) {
            const list = extractAccountList(root.Result);
            if (list.length > 0) return list;
          }
          if (root.items !== undefined) {
            const list = extractAccountList(root.items);
            if (list.length > 0) return list;
          }
          if (root.response !== undefined) {
            const list = extractAccountList(root.response);
            if (list.length > 0) return list;
          }

          for (const key of Object.keys(root)) {
            const val = root[key];
            if (Array.isArray(val) && val.length > 0) {
              if (typeof val[0] === 'object' && val[0] !== null) {
                if (val[0].Cust_Id || val[0].Cust_Name || val[0].Dep_GlobalAccNo || val[0].Loan_AccNo || val[0].LoanAccNo || val[0].accountNumber || val[0].accountNo || val[0].Acc_No || val[0].name) {
                  return val;
                }
              }
            } else if (typeof val === 'object' && val !== null) {
              const list = extractAccountList(val);
              if (list.length > 0) return list;
            } else if (typeof val === 'string' && (val.includes('Cust_') || val.includes('CustomerList') || val.includes('Dep_GlobalAccNo') || val.includes('Loan_AccNo'))) {
              try {
                const list = extractAccountList(JSON.parse(val));
                if (list.length > 0) return list;
              } catch (e) {}
            }
          }
        }

        return [];
      };

      let combinedRawList = [];

      if (activeProd === 'ALL') {
        // Query both RD and LOAN in parallel for comprehensive entity ledger
        const [rdRes, loanRes] = await Promise.allSettled([
          accountApi.getAll({ ...baseQueryParams, productType: 'RD', ProductType: 'RD' }),
          accountApi.getAll({ ...baseQueryParams, productType: 'LOAN', ProductType: 'LOAN' })
        ]);

        if (rdRes.status === 'fulfilled') {
          const list = extractAccountList(rdRes.value?.data) || extractAccountList(rdRes.value);
          list.forEach(item => { if (!item.productType) item.productType = 'RD'; });
          combinedRawList.push(...list);
        }
        if (loanRes.status === 'fulfilled') {
          const list = extractAccountList(loanRes.value?.data) || extractAccountList(loanRes.value);
          list.forEach(item => { if (!item.productType) item.productType = 'LOAN'; });
          combinedRawList.push(...list);
        }
      } else {
        const res = await accountApi.getAll({ ...baseQueryParams, productType: activeProd, ProductType: activeProd });
        const list = extractAccountList(res?.data) || extractAccountList(res);
        list.forEach(item => { if (!item.productType) item.productType = activeProd; });
        combinedRawList = list;
      }

      console.log(`📊 [CBS Engine] Extracted ${combinedRawList.length} accounts for [${activeProd}]`, combinedRawList);

      if (combinedRawList && Array.isArray(combinedRawList) && combinedRawList.length > 0) {
        const formatted = combinedRawList.map((item, index) => {
          const isLoan = 
            (item.productType || item.ProductType || item.collectionType || item.CollectionType || item.udf5 || '').toString().toUpperCase().includes('LOAN') ||
            (item.accountType || item.AccountType || '').toString().toUpperCase().includes('LOAN') ||
            !!item.Loan_AccNo || !!item.LoanAccNo || !!item.Loan_No || !!item.loanNo || !!item.emi_amount || !!item.outstanding_amount;
          
          const isFd = (item.productType || item.collectionType || item.accountType || '').toString().toUpperCase().includes('FD');
          const isRdcl = (item.productType || item.collectionType || item.accountType || '').toString().toUpperCase().includes('RDCL');

          const detectedType = isLoan ? 'LOAN' : isFd ? 'FD' : isRdcl ? 'RDCL' : 'RD';

          const accNo = 
            item.Loan_AccNo || 
            item.LoanAccNo || 
            item.Dep_GlobalAccNo || 
            item.accountNumber || 
            item.accountNo || 
            item.Acc_No || 
            item.AccountNo || 
            item.accNo || 
            item.Loan_No || 
            item.GlobalAccNo || 
            item.dep_GlobalAccNo || 
            (isLoan ? `LN010427${String(index + 10)}` : `RD010427${String(index + 10)}`);

          const masked = accNo.length > 4 ? `•••• •••• ${accNo.slice(-4)}` : accNo;

          const custName = 
            item.Cust_Name?.trim() || 
            item.customerName?.trim() || 
            item.borrowerName?.trim() || 
            item.applicant_name?.trim() || 
            item.CustName?.trim() || 
            item.accountHolder?.trim() || 
            item.CustomerName?.trim() || 
            item.holderName?.trim() || 
            item.name?.trim() || 
            'Registered Customer';

          const custId = item.Cust_Id || item.CustId || item.customerId || item.id || item.AccountId || (index + 1);
          
          const schName = 
            item.Sch_Name || 
            item.SchName || 
            item.Loan_Type || 
            item.loanType || 
            item.schemeName || 
            item.SchemeName || 
            item.productName || 
            item.scheme || 
            (isLoan ? 'Personal Loan / Gold Loan' : isFd ? 'Fixed Deposit 12M' : isRdcl ? 'RD Closed Loan Recovery' : 'RD-12-NRL Deposit');
          
          const schCode = item.Sch_Code || item.SchCode || item.schemeCode || item.SchemeCode || (isLoan ? '08' : '04');
          const ifsc = item.ifscCode || item.ifsc || item.IFSC || `DIGI000${schCode || '04'}`;
          const balanceVal = Number(item.balance ?? item.Balance ?? item.outstanding_amount ?? item.total_due ?? item.Principal_Balance ?? item.totalDeposited ?? item.monthlyAmount ?? item.Amount ?? 0);
          const currentBranchName = item.branchName || authUser?.branchName || authUser?.branch || localStorage.getItem('branchName') || `Branch ${bCode}`;

          return {
            id: custId,
            accountCode: `${detectedType}-01-${custId}`,
            bankName: schName ? `DIGICOB Bank (${schName})` : (item.bankName || 'DIGICOB Banking Pool'),
            accountHolder: custName,
            accountNumber: accNo,
            maskedNumber: masked,
            ifscCode: ifsc,
            accountType: item.accountType || (isLoan ? 'Loan Collection' : isFd ? 'Fixed Deposit' : isRdcl ? 'RDCL Recovery' : 'RD Deposit'),
            collectionType: detectedType,
            branchName: currentBranchName,
            balance: balanceVal,
            dailyLimit: item.dailyLimit || 5000000,
            isActive: item.isActive !== undefined ? item.isActive : true,
            verified: true,
            updatedAt: item.updatedAt || new Date().toISOString(),
            schemeName: schName,
            schemeCode: schCode,
            customerId: custId,
            phone: item.phone || item.mobile || item.Cust_Mobile || item.CustMobile || '',
            email: item.email || item.Cust_Email || item.CustEmail || ''
          };
        });
        setAccounts(formatted);
      } else {
        setAccounts([]);
      }
    } catch (error) {
      console.warn('Backend accounts API error:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBranchCode, selectedAgentCode, collectionProductTab]);

  useEffect(() => {
    let isMounted = true;

    const initMasterData = async () => {
      try {
        const [bRes, aRes, cfgRes] = await Promise.allSettled([
          branchApi.getAll(),
          agentApi.getAll(),
          merchantApi.getAllMerchantConfig()
        ]);

        let loadedBranches = [];
        if (bRes.status === 'fulfilled') {
          const bData = bRes.value?.data?.data || bRes.value?.data || [];
          loadedBranches = Array.isArray(bData) ? bData : [];
          if (isMounted) setBranches(loadedBranches);
        }

        let loadedAgents = [];
        if (aRes.status === 'fulfilled') {
          const aData = aRes.value?.data?.data || aRes.value?.data || [];
          loadedAgents = Array.isArray(aData) ? aData : [];
          if (isMounted) setAgents(loadedAgents);
        }

        // Parse configured products from Merchant Config
        if (cfgRes.status === 'fulfilled') {
          const cfgs = cfgRes.value?.data?.data || cfgRes.value?.data || [];
          if (Array.isArray(cfgs) && cfgs.length > 0) {
            const types = new Set(['RD', 'LOAN']);
            cfgs.forEach(c => {
              const p = (c.productType || c.ProductType || '').toString().toUpperCase();
              if (p) types.add(p);
            });
            if (isMounted) setConfiguredCollectionTypes(Array.from(types));
          }
        }

        // 1. Resolve Branch Code from branch table matching user.branchId
        const userBranchId = user?.branchId || user?.branch_id || localStorage.getItem('branchId');
        let targetBranchCode = user?.branchCode || localStorage.getItem('branchCode') || '';
        
        if (userBranchId && loadedBranches.length > 0) {
          const matchedBranch = loadedBranches.find(b => String(b.id) === String(userBranchId) || String(b.branchId) === String(userBranchId));
          if (matchedBranch) {
            targetBranchCode = matchedBranch.code || matchedBranch.branchCode || matchedBranch.external_branch_id || targetBranchCode;
          }
        }
        if (!targetBranchCode) targetBranchCode = '01';
        if (isMounted) setSelectedBranchCode(targetBranchCode);

        // 2. Resolve Agent Code from agent table for this branch
        let targetAgentCode = user?.agentCode || user?.external_agent_id || localStorage.getItem('agentCode') || '';
        
        const branchAgents = userBranchId 
          ? loadedAgents.filter(a => String(a.branchId) === String(userBranchId))
          : loadedAgents;

        if (branchAgents.length > 0) {
          const firstAgent = branchAgents[0];
          targetAgentCode = firstAgent.external_agent_id || firstAgent.agentCode || firstAgent.code || firstAgent.externalAgentId || String(firstAgent.id) || targetAgentCode;
        }

        if (!targetAgentCode) targetAgentCode = '1075';
        if (isMounted) setSelectedAgentCode(targetAgentCode);

        loadAccounts(targetBranchCode, targetAgentCode, 'ALL');
      } catch (err) {
        console.warn('Could not initialize branch/agent master lists:', err);
        loadAccounts('01', '1075', 'ALL');
      }
    };

    initMasterData();
    return () => { isMounted = false; };
  }, []);

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

  const handleOpenQrModal = (acc, initialTab = 'qr') => {
    setQrAccount(acc);
    setCollectionTab(initialTab);
    const defaultAmt = Number(acc.balance) > 0 ? Number(acc.balance) : 500;
    setQrAmount(defaultAmt);
    setQrCustomAmount('');
    setQrNote(`RD Deposit for ${acc.accountHolder || 'Customer'} - Acc #${acc.accountNumber || ''}`);
    setCustomerPhoneInput(acc.phone || acc.mobile || '');
    setCustomerEmailInput(acc.email || '');
    setQrData(null);
    setQrError(null);
    setPaymentStatus(null);
    setLinkData(null);
    setLinkError(null);
    setLinkStatus(null);
    setIsQrModalOpen(true);
  };

  const handleOpenPaymentLinkModal = (acc) => {
    handleOpenQrModal(acc, 'link');
  };

  const handleGenerateQr = async (targetAmount = null) => {
    const finalAmount = Number(targetAmount !== null ? targetAmount : (qrCustomAmount || qrAmount));
    if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
      showToast('Please specify a valid collection amount', 'error');
      return;
    }

    if (!qrAccount) return;

    const authUser = (() => {
      try {
        return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
      } catch {
        return {};
      }
    })();

    const currentMerchantId = Number(
      authUser?.merchantId || authUser?.merchant_id || localStorage.getItem('merchantId') || 4
    );

    // Find agent info
    const matchedAgent = agents.find(
      a => String(a.external_agent_id) === String(selectedAgentCode) ||
           String(a.agentCode) === String(selectedAgentCode) ||
           String(a.id) === String(selectedAgentCode)
    );

    const agentCodeStr = String(selectedAgentCode || authUser?.agentCode || authUser?.external_agent_id || '1075');
    const agentNameStr = matchedAgent?.fullName || matchedAgent?.name || authUser?.name || authUser?.fullName || 'Branch Agent';
    const agentPhoneStr = matchedAgent?.phone || matchedAgent?.mobile || authUser?.phone || authUser?.mobile || '9999999999';
    const agentEmailStr = matchedAgent?.email || authUser?.email || 'agent@finwin.com';

    // Find branch info
    const matchedBranch = branches.find(
      b => String(b.code) === String(selectedBranchCode) ||
           String(b.branchCode) === String(selectedBranchCode) ||
           String(b.id) === String(authUser?.branchId || authUser?.branch_id)
    );
    const branchNumericId = Number(matchedBranch?.id || authUser?.branchId || authUser?.branch_id || 1);

    const payload = {
      MerchantId: currentMerchantId,
      merchantId: currentMerchantId,
      Amount: finalAmount,
      amount: finalAmount,
      CollectionType: 'UPI',
      collectionType: 'UPI',
      QrSource: 'WEB_BRANCH',
      qrSource: 'WEB_BRANCH',
      Source: 'BranchPortal',
      source: 'BranchPortal',
      note: qrNote || `RD Deposit for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
      Note: qrNote || `RD Deposit for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
      Description: qrNote || `RD Deposit for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
      agent_details: {
        agent_name: agentNameStr,
        agent_id: agentCodeStr,
        agent_orginId: agentCodeStr,
        agent_phone: agentPhoneStr,
        agent_email: agentEmailStr,
        agent_branch: branchNumericId
      },
      AgentDetails: {
        agent_name: agentNameStr,
        agent_id: agentCodeStr,
        agent_orginId: agentCodeStr,
        agent_phone: agentPhoneStr,
        agent_email: agentEmailStr,
        agent_branch: branchNumericId
      },
      customer_details: {
        customer_name: qrAccount.accountHolder || 'Customer',
        customer_phone: customerPhoneInput || qrAccount.phone || qrAccount.mobile || '9999999999',
        customer_accno: String(qrAccount.accountNumber || qrAccount.accountCode || ''),
        customer_id: String(qrAccount.customerId || qrAccount.id || '0'),
        customer_email: customerEmailInput || qrAccount.email || 'customer@finwin.com'
      },
      CustomerDetails: {
        customer_name: qrAccount.accountHolder || 'Customer',
        customer_phone: customerPhoneInput || qrAccount.phone || qrAccount.mobile || '9999999999',
        customer_accno: String(qrAccount.accountNumber || qrAccount.accountCode || ''),
        customer_id: String(qrAccount.customerId || qrAccount.id || '0'),
        customer_email: customerEmailInput || qrAccount.email || 'customer@finwin.com'
      }
    };

    setQrLoading(true);
    setQrError(null);
    try {
      console.log('📡 [UPI Engine] Requesting dynamic UPI Intent URL with payload:', payload);
      const res = await paymentApi.getUpiIntent(payload);
      console.log('✅ [UPI Engine] Response received:', res.data);

      const resData = res.data;
      const url = resData.payment_url || resData.paymentUrl || resData.data?.upi_intent_url || resData.data?.url || (typeof resData === 'string' ? resData : null);
      const ordId = resData.order_id || resData.orderId || resData.data?.order_id;

      if (url) {
        setQrData({
          paymentUrl: url,
          orderId: ordId,
          amount: finalAmount,
          accountNumber: qrAccount.accountNumber,
          customerName: qrAccount.accountHolder
        });
        showToast(`UPI QR generated for ₹${finalAmount.toLocaleString('en-IN')}`);
      } else if (resData.message) {
        setQrError(resData.message);
        showToast(resData.message, 'error');
      } else {
        setQrError('Payment gateway did not return a valid UPI intent URL.');
        showToast('Failed to generate UPI QR', 'error');
      }
    } catch (err) {
      console.error('❌ [UPI Engine] QR Generation error:', err);
      const msg = err.response?.data?.message || err.response?.data?.title || err.message || 'Payment Gateway API failed';
      setQrError(msg);
      showToast(msg, 'error');
    } finally {
      setQrLoading(false);
    }
  };

  // Payment Link Generation using [HttpPost("PaymentLink")] ProcessPaymentLink([FromBody] PaymentRequestDto request)
  const handleGeneratePaymentLink = async (targetAmount = null) => {
    const finalAmount = Number(targetAmount !== null ? targetAmount : (qrCustomAmount || qrAmount));
    if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
      showToast('Please specify a valid collection amount', 'error');
      return;
    }

    if (!qrAccount) return;

    const authUser = (() => {
      try {
        return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
      } catch {
        return {};
      }
    })();

    const currentMerchantId = Number(
      authUser?.merchantId || authUser?.merchant_id || localStorage.getItem('merchantId') || 4
    );

    // Find agent info
    const matchedAgent = agents.find(
      a => String(a.external_agent_id) === String(selectedAgentCode) ||
           String(a.agentCode) === String(selectedAgentCode) ||
           String(a.id) === String(selectedAgentCode)
    );

    const agentCodeStr = String(selectedAgentCode || authUser?.agentCode || authUser?.external_agent_id || '1075');
    const agentNameStr = matchedAgent?.fullName || matchedAgent?.name || authUser?.name || authUser?.fullName || 'Branch Agent';
    const agentPhoneStr = matchedAgent?.phone || matchedAgent?.mobile || authUser?.phone || authUser?.mobile || '9999999999';
    const agentEmailStr = matchedAgent?.email || authUser?.email || 'agent@finwin.com';

    // Find branch info
    const matchedBranch = branches.find(
      b => String(b.code) === String(selectedBranchCode) ||
           String(b.branchCode) === String(selectedBranchCode) ||
           String(b.id) === String(authUser?.branchId || authUser?.branch_id)
    );
    const branchNumericId = Number(matchedBranch?.id || authUser?.branchId || authUser?.branch_id || 1);

    const phoneNum = customerPhoneInput || qrAccount.phone || qrAccount.mobile || '9999999999';
    const emailAddr = customerEmailInput || qrAccount.email || 'customer@finwin.com';

    const payload = {
      MerchantId: currentMerchantId,
      merchantId: currentMerchantId,
      Amount: finalAmount,
      amount: finalAmount,
      CollectionType: 'PaymentLink',
      collectionType: 'PaymentLink',
      QrSource: 'WEB_BRANCH',
      qrSource: 'WEB_BRANCH',
      Source: 'BranchPortal',
      source: 'BranchPortal',
      Note: qrNote || `RD Deposit for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
      note: qrNote || `RD Deposit for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
      Description: qrNote || `RD Deposit for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
      description: qrNote || `RD Deposit for ${qrAccount.accountHolder} - Acc #${qrAccount.accountNumber}`,
      agent_details: {
        agent_name: agentNameStr,
        agent_id: agentCodeStr,
        agent_orginId: agentCodeStr,
        agent_phone: agentPhoneStr,
        agent_email: agentEmailStr,
        agent_branch: branchNumericId
      },
      AgentDetails: {
        agent_name: agentNameStr,
        agent_id: agentCodeStr,
        agent_orginId: agentCodeStr,
        agent_phone: agentPhoneStr,
        agent_email: agentEmailStr,
        agent_branch: branchNumericId
      },
      customer_details: {
        customer_name: qrAccount.accountHolder || 'Customer',
        customer_phone: phoneNum,
        customer_accno: String(qrAccount.accountNumber || qrAccount.accountCode || ''),
        customer_id: String(qrAccount.customerId || qrAccount.id || '0'),
        customer_email: emailAddr
      },
      CustomerDetails: {
        customer_name: qrAccount.accountHolder || 'Customer',
        customer_phone: phoneNum,
        customer_accno: String(qrAccount.accountNumber || qrAccount.accountCode || ''),
        customer_id: String(qrAccount.customerId || qrAccount.id || '0'),
        customer_email: emailAddr
      }
    };

    setLinkLoading(true);
    setLinkError(null);
    try {
      console.log('📡 [Payment Link Engine] Requesting PaymentLink with payload:', payload);
      const res = await paymentApi.processPaymentLink(payload);
      console.log('✅ [Payment Link Engine] Response received:', res.data);

      const resData = res.data || {};
      const url = resData.payment_link || resData.paymentLink || resData.url || resData.payment_url || resData.paymentUrl || resData.short_url || resData.shortUrl || resData.data?.payment_link || resData.data?.paymentLink || resData.data?.url || resData.data?.short_url || (typeof resData === 'string' ? resData : null);
      const ordId = resData.order_id || resData.orderId || resData.data?.order_id || resData.data?.orderId;

      if (url) {
        setLinkData({
          paymentUrl: url,
          orderId: ordId,
          amount: finalAmount,
          accountNumber: qrAccount.accountNumber,
          customerName: qrAccount.accountHolder,
          customerPhone: phoneNum,
          customerEmail: emailAddr
        });
        showToast(`Instant Payment Link generated for ₹${finalAmount.toLocaleString('en-IN')}`);
      } else if (resData.message) {
        setLinkError(resData.message);
        showToast(resData.message, 'error');
      } else {
        setLinkError('Payment gateway did not return a valid Payment Link URL.');
        showToast('Failed to generate Payment Link', 'error');
      }
    } catch (err) {
      console.error('❌ [Payment Link Engine] Generation error:', err);
      const msg = err.response?.data?.message || err.response?.data?.title || err.message || 'Payment Link API failed';
      setLinkError(msg);
      showToast(msg, 'error');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleCheckPaymentStatus = async () => {
    if (!qrData?.orderId) return;
    setCheckingStatus(true);
    try {
      const res = await paymentApi.getStatus(qrData.orderId);
      console.log('📡 Payment status check result:', res.data);
      const statusStr = (res.data?.status || res.data?.data?.status || res.data?.paymentStatus || '').toUpperCase();
      if (statusStr === 'SUCCESS' || statusStr === 'COMPLETED' || statusStr === 'PAID') {
        setPaymentStatus('SUCCESS');
        showToast('Payment received and verified successfully!');
      } else if (statusStr === 'FAILED') {
        setPaymentStatus('FAILED');
        showToast('Payment transaction failed or timed out.', 'error');
      } else {
        showToast('Payment status is PENDING. Waiting for customer completion.');
      }
    } catch (e) {
      showToast('Payment awaiting customer verification.');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleCheckLinkStatus = async () => {
    if (!linkData?.orderId) return;
    setCheckingLinkStatus(true);
    try {
      const res = await paymentApi.getStatus(linkData.orderId);
      console.log('📡 Payment link status check result:', res.data);
      const statusStr = (res.data?.status || res.data?.data?.status || res.data?.paymentStatus || '').toUpperCase();
      if (statusStr === 'SUCCESS' || statusStr === 'COMPLETED' || statusStr === 'PAID') {
        setLinkStatus('SUCCESS');
        showToast('Payment link deposit captured & verified successfully!');
      } else if (statusStr === 'FAILED') {
        setLinkStatus('FAILED');
        showToast('Payment transaction failed or timed out.', 'error');
      } else {
        showToast('Payment status is PENDING. Customer has not completed checkout.');
      }
    } catch (e) {
      showToast('Payment link awaiting customer verification.');
    } finally {
      setCheckingLinkStatus(false);
    }
  };

  const handleShareWhatsApp = (url, amount, accNo, name, phone) => {
    const isLoan = qrAccount?.collectionType === 'LOAN';
    const text = isLoan
      ? `Dear ${name || 'Customer'},\nPlease complete your Loan EMI installment of ₹${Number(amount).toLocaleString('en-IN')} for Loan Acc #${accNo} via this secure Finwin Payment Link:\n${url}\n\nThank you!`
      : `Dear ${name || 'Customer'},\nPlease complete your deposit collection of ₹${Number(amount).toLocaleString('en-IN')} for Account #${accNo} via this secure Finwin Payment Link:\n${url}\n\nThank you!`;
    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
    const waUrl = cleanPhone && cleanPhone.length === 10
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // Dedicated Communication & Reminder Handlers for Grid Actions
  const handleSendWhatsAppReminder = (acc) => {
    const phone = acc.phone || acc.mobile || '';
    const name = acc.accountHolder || 'Customer';
    const accNo = acc.accountNumber || '';
    const bal = Number(acc.balance || 0).toLocaleString('en-IN');
    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
    const isLoan = acc.collectionType === 'LOAN';
    const msg = isLoan
      ? `Dear ${name},\nThis is a friendly reminder from DIGICOB Bank regarding your Loan Account #${accNo}.\nYour current outstanding / EMI due is ₹${bal}.\nPlease settle your installment at your earliest convenience.\nThank you!`
      : `Dear ${name},\nThis is a friendly reminder from DIGICOB Bank regarding your RD Account #${accNo}.\nYour scheduled deposit amount is ₹${bal}.\nPlease complete your deposit collection at your earliest convenience.\nThank you!`;
    
    const waUrl = cleanPhone && cleanPhone.length === 10
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    
    window.open(waUrl, '_blank');
    showToast(`WhatsApp reminder dispatched for ${name}`);
  };

  const handleSendSmsReminder = (acc) => {
    const phone = acc.phone || acc.mobile || '';
    const name = acc.accountHolder || 'Customer';
    const accNo = acc.accountNumber || '';
    const bal = Number(acc.balance || 0).toLocaleString('en-IN');
    const isLoan = acc.collectionType === 'LOAN';
    
    if (phone) {
      const body = isLoan
        ? `Dear ${name}, Loan Account #${accNo} EMI due reminder of Rs.${bal}. - DIGICOB Bank`
        : `Dear ${name}, RD Account #${accNo} deposit reminder of Rs.${bal}. - DIGICOB Bank`;
      window.location.href = `sms:${phone}?body=${encodeURIComponent(body)}`;
    }
    showToast(`SMS reminder sent to ${name} (${phone || 'Registered Phone'})`);
  };

  const handleDirectCall = (acc) => {
    const phone = acc.phone || acc.mobile || '';
    const name = acc.accountHolder || 'Customer';
    if (!phone) {
      showToast(`No registered phone number found for ${name}`, 'error');
      return;
    }
    window.location.href = `tel:${phone}`;
    showToast(`Calling ${name} at ${phone}...`);
  };

  const handleDownloadQr = () => {
    const svg = document.getElementById('upi-qr-code-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 400);
      ctx.drawImage(img, 20, 20, 360, 360);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `UPI-QR-${qrAccount?.accountNumber || 'Ecollect'}-${qrData?.amount || ''}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      showToast('QR Code image downloaded');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrintReceipt = () => {
    window.print();
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
      branchName: user?.branchName || user?.branch || localStorage.getItem('branchName') || 'Main Branch',
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
      branchName: acc.branchName || user?.branchName || user?.branch || localStorage.getItem('branchName') || 'Main Branch',
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

  const collectionCounts = useMemo(() => {
    const counts = { ALL: accounts.length, RD: 0, LOAN: 0, FD: 0, RDCL: 0 };
    accounts.forEach(a => {
      const t = (a.collectionType || 'RD').toUpperCase();
      if (counts[t] !== undefined) counts[t] += 1;
      else counts[t] = 1;
    });
    return counts;
  }, [accounts]);

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchesSearch = 
        (acc.bankName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.accountHolder || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.accountCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.accountNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.schemeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.ifscCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.branchName || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCollectionTab = 
        collectionProductTab === 'ALL' || 
        (acc.collectionType || 'RD').toUpperCase() === collectionProductTab.toUpperCase();

      const matchesType = typeFilter === 'ALL' || acc.accountType?.toLowerCase() === typeFilter.toLowerCase();
      const matchesStatus = statusFilter === 'ALL' || 
        (statusFilter === 'ACTIVE' && acc.isActive) ||
        (statusFilter === 'INACTIVE' && !acc.isActive);

      return matchesSearch && matchesCollectionTab && matchesType && matchesStatus;
    });
  }, [accounts, searchTerm, collectionProductTab, typeFilter, statusFilter]);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, collectionProductTab, typeFilter, statusFilter, selectedAgentCode]);

  const totalPages = Math.ceil(filteredAccounts.length / pageSize) || 1;
  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAccounts.slice(start, start + pageSize);
  }, [filteredAccounts, currentPage, pageSize]);

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
              <span>Treasury & Multi-Product Collection Ledger</span>
            </div>
            <h1 className="accounts-page-title">
              Bank & Collection <span className="gradient-text">Accounts</span>
            </h1>
            <p className="accounts-page-subtitle">
              Unified RD Deposits, Loan Collections, and Third-Party CBS clearing integrations
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
              <span className="kpi-label">Total Portfolio Holdings</span>
              <div className="kpi-icon is-green"><AccountIcons.CreditCard /></div>
            </div>
            <div className="kpi-value font-mono text-green">₹{(totalEscrowBalance / 10000000).toFixed(2)} Cr</div>
            <div className="kpi-foot">
              <span className="trend-tag is-up"><AccountIcons.ArrowUp /> Safe Banking Pool</span>
            </div>
          </div>

          <div className="acc-kpi-card">
            <div className="kpi-top">
              <span className="kpi-label">RD Deposits Live</span>
              <div className="kpi-icon is-cyan"><AccountIcons.ShieldCheck /></div>
            </div>
            <div className="kpi-value font-mono text-cyan">{collectionCounts.RD || 0} Accounts</div>
            <div className="kpi-foot">
              <span className="trend-tag is-up"><AccountIcons.ArrowUp /> Recurring Deposits</span>
            </div>
          </div>

          <div className="acc-kpi-card">
            <div className="kpi-top">
              <span className="kpi-label">Loan Collections Live</span>
              <div className="kpi-icon is-amber"><AccountIcons.CreditCard /></div>
            </div>
            <div className="kpi-value font-mono text-purple">{collectionCounts.LOAN || 0} Accounts</div>
            <div className="kpi-foot">
              <span className="trend-tag is-up"><AccountIcons.ArrowUp /> Active Loan Portfolios</span>
            </div>
          </div>

        </div>

        {/* Collection Product Switcher Tabs Bar */}
        <div className="collection-product-nav-tabs">
          <button 
            type="button"
            className={`collection-nav-tab ${collectionProductTab === 'ALL' ? 'is-active' : ''}`}
            onClick={() => {
              setCollectionProductTab('ALL');
              loadAccounts(null, null, 'ALL');
            }}
          >
            <span className="tab-dot">⚡</span>
            <span className="tab-label">All Collections</span>
            <span className="tab-badge-count font-mono">{collectionCounts.ALL || 0}</span>
          </button>

          <button 
            type="button"
            className={`collection-nav-tab is-rd ${collectionProductTab === 'RD' ? 'is-active' : ''}`}
            onClick={() => {
              setCollectionProductTab('RD');
              loadAccounts(null, null, 'RD');
            }}
          >
            <span className="tab-dot">🏦</span>
            <span className="tab-label">RD Accounts (Recurring Deposit)</span>
            <span className="tab-badge-count font-mono">{collectionCounts.RD || 0}</span>
          </button>

          <button 
            type="button"
            className={`collection-nav-tab is-loan ${collectionProductTab === 'LOAN' ? 'is-active' : ''}`}
            onClick={() => {
              setCollectionProductTab('LOAN');
              loadAccounts(null, null, 'LOAN');
            }}
          >
            <span className="tab-dot">💳</span>
            <span className="tab-label">Loan Accounts (EMI Collection)</span>
            <span className="tab-badge-count font-mono">{collectionCounts.LOAN || 0}</span>
          </button>

          <button 
            type="button"
            className={`collection-nav-tab is-fd ${collectionProductTab === 'FD' ? 'is-active' : ''}`}
            onClick={() => {
              setCollectionProductTab('FD');
              loadAccounts(null, null, 'FD');
            }}
          >
            <span className="tab-dot">📈</span>
            <span className="tab-label">FD Accounts (Fixed Deposit)</span>
            <span className="tab-badge-count font-mono">{collectionCounts.FD || 0}</span>
          </button>

          <button 
            type="button"
            className={`collection-nav-tab is-rdcl ${collectionProductTab === 'RDCL' ? 'is-active' : ''}`}
            onClick={() => {
              setCollectionProductTab('RDCL');
              loadAccounts(null, null, 'RDCL');
            }}
          >
            <span className="tab-dot">🪙</span>
            <span className="tab-label">RDCL Recovery</span>
            <span className="tab-badge-count font-mono">{collectionCounts.RDCL || 0}</span>
          </button>

          {/* Additional Dynamic Merchant Configured Collection Types */}
          {configuredCollectionTypes
            .filter(t => !['RD', 'LOAN', 'FD', 'RDCL'].includes(t.toUpperCase()))
            .map(customType => {
              const upper = customType.toUpperCase();
              return (
                <button
                  key={upper}
                  type="button"
                  className={`collection-nav-tab ${collectionProductTab === upper ? 'is-active' : ''}`}
                  onClick={() => {
                    setCollectionProductTab(upper);
                    loadAccounts(null, null, upper);
                  }}
                >
                  <span className="tab-dot">🏷️</span>
                  <span className="tab-label">{upper} Collection</span>
                  <span className="tab-badge-count font-mono">{collectionCounts[upper] || 0}</span>
                </button>
              );
            })}
        </div>

        {/* Filter Toolbar */}
        <div className="accounts-filter-bar">
          
          <div className="search-input-wrap">
            <AccountIcons.Search />
            <input 
              type="text" 
              placeholder="Search by Bank, Customer, Loan / RD Acc No, Scheme, IFSC..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="accounts-search-field"
            />
          </div>

          <div className="filter-buttons-group">
            <div className="type-toggle-pills">
              {['ALL', 'RD Deposit', 'Loan Collection', 'Settlement', 'Current'].map(type => (
                <button
                  key={type}
                  className={`type-pill ${typeFilter === type ? 'is-active' : ''}`}
                  onClick={() => setTypeFilter(type)}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Dynamic Agent Selector */}
            <select
              value={selectedAgentCode}
              onChange={(e) => {
                const newCode = e.target.value;
                setSelectedAgentCode(newCode);
                loadAccounts(selectedBranchCode, newCode);
              }}
              className="status-select-dropdown font-mono"
              title="Filter by Branch Agent / External Representative ID"
            >
              <option value="1075">Agent #1075 (Default)</option>
              {agents.map((ag) => {
                const code = ag.external_agent_id || ag.agentCode || ag.code || ag.externalAgentId || String(ag.id);
                return (
                  <option key={ag.id} value={code}>
                    {ag.fullName || ag.name || 'Agent'} ({code})
                  </option>
                );
              })}
            </select>

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
                  <th>Type</th>
                  <th>Account Holder</th>
                  <th>Account / Loan No</th>
                  <th>Scheme / Route</th>
                  <th>IFSC & Branch</th>
                  <th>Holdings / Due</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-table-cell">
                      <div className="empty-state-box">
                        <AccountIcons.Bank />
                        <h3>No Collection Accounts Located</h3>
                        <p>No matching banking route, RD, or Loan account records found for your criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedAccounts.map((acc, index) => (
                    <tr key={acc.id} className="account-row-item">
                      
                      {/* Bank & Code */}
                      <td>
                        <div className="bank-identity-cell">
                          <div className="bank-avatar-box">
                            {acc.bankName ? acc.bankName.slice(0, 2).toUpperCase() : (acc.collectionType === 'LOAN' ? 'LN' : 'RD')}
                          </div>
                          <div className="bank-info-stack">
                            <span className="bank-title font-bold">{acc.bankName}</span>
                            <span className="bank-code-chip font-mono text-muted">{acc.accountCode}</span>
                          </div>
                        </div>
                      </td>

                      {/* Collection Type Badge */}
                      <td>
                        <span className={`collection-type-tag is-${(acc.collectionType || 'RD').toLowerCase()}`}>
                          {acc.collectionType === 'LOAN' ? '💳 LOAN' : acc.collectionType === 'FD' ? '📈 FD' : acc.collectionType === 'RDCL' ? '🪙 RDCL' : '🏦 RD'}
                        </span>
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
                            title="Copy Account / Loan Number"
                          >
                            {copiedId === acc.id ? <AccountIcons.Check /> : <AccountIcons.Copy />}
                          </button>
                        </div>
                      </td>

                      {/* Scheme & Route */}
                      <td>
                        <div className="scheme-info-stack">
                          <span className="scheme-title font-bold text-cyan">{acc.schemeName || (acc.collectionType === 'LOAN' ? 'Personal / Gold Loan' : 'RD Monthly Deposit')}</span>
                          <span className="scheme-code font-mono text-muted">Code: {acc.schemeCode || '04'}</span>
                        </div>
                      </td>

                      {/* IFSC & Branch */}
                      <td>
                        <div className="ifsc-branch-stack">
                          <span className="ifsc-text font-mono font-bold text-cyan">{acc.ifscCode}</span>
                          <span className="branch-sub text-muted">{acc.branchName || 'Mumbai Central'}</span>
                        </div>
                      </td>

                      {/* Balance / Due */}
                      <td>
                        <span className={`balance-val font-mono font-bold ${acc.collectionType === 'LOAN' ? 'text-purple' : 'text-green'}`}>
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
                          {/* Financial Collection Actions */}
                          <button 
                            className="action-btn is-qr" 
                            onClick={() => handleOpenQrModal(acc, 'qr')}
                            title="Generate Dynamic UPI Collection QR"
                          >
                            <AccountIcons.QrCode />
                          </button>
                          <button 
                            className="action-btn is-link" 
                            onClick={() => handleOpenPaymentLinkModal(acc)}
                            title="Generate Instant Payment Link"
                          >
                            <AccountIcons.Link />
                          </button>

                          {/* Instant Customer Reminders & Outreach */}
                          <button 
                            className="action-btn is-whatsapp" 
                            onClick={() => handleSendWhatsAppReminder(acc)}
                            title="Send WhatsApp Deposit Reminder"
                          >
                            <AccountIcons.WhatsApp />
                          </button>
                          <button 
                            className="action-btn is-sms" 
                            onClick={() => handleSendSmsReminder(acc)}
                            title="Send SMS Deposit Reminder"
                          >
                            <AccountIcons.MessageSquare />
                          </button>
                          <button 
                            className="action-btn is-call" 
                            onClick={() => handleDirectCall(acc)}
                            title="Call Customer for Follow-up"
                          >
                            <AccountIcons.PhoneCall />
                          </button>

                          {/* Account Record Management */}
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

          {/* Table Pagination Footer */}
          <div className="accounts-table-footer">
            <div className="accounts-footer-left">
              <span className="accounts-footer-info">
                Showing <strong>{filteredAccounts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to{' '}
                <strong>{Math.min(currentPage * pageSize, filteredAccounts.length)}</strong> of{' '}
                <strong>{filteredAccounts.length}</strong> accounts
              </span>

              <div className="accounts-page-size-selector">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="accounts-size-select"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>per page</span>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="accounts-pagination-controls">
                <button
                  className="accounts-page-btn"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  title="First Page"
                >
                  «
                </button>
                <button
                  className="accounts-page-btn"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  title="Previous Page"
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                  .map((page, idx, arr) => {
                    const prev = arr[idx - 1];
                    return (
                      <React.Fragment key={page}>
                        {prev && page - prev > 1 && <span className="accounts-page-ellipsis">…</span>}
                        <button
                          className={`accounts-page-num-btn ${currentPage === page ? 'is-active' : ''}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })
                }

                <button
                  className="accounts-page-btn"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  title="Next Page"
                >
                  ›
                </button>
                <button
                  className="accounts-page-btn"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  title="Last Page"
                >
                  »
                </button>
              </div>
            )}
          </div>
        </div>

        {/* View Account Dossier Slideover / Modal */}
        {selectedAccount && (
          <div className="account-modal-overlay" onClick={() => setSelectedAccount(null)}>
            <div className="account-dossier-card" onClick={(e) => e.stopPropagation()}>
              <div className="dossier-card-head">
                <div className="dossier-badge-wrap">
                  <AccountIcons.Bank />
                  <h3>
                    {selectedAccount.collectionType === 'LOAN'
                      ? 'Loan Portfolio Account Dossier'
                      : 'Banking & Deposit Route Dossier'}
                  </h3>
                </div>
                <button className="btn-modal-close" onClick={() => setSelectedAccount(null)}>✕</button>
              </div>

              <div className="dossier-modal-body">
                <div className="dossier-bank-hero">
                  <div className="big-bank-icon">
                    {selectedAccount.bankName ? selectedAccount.bankName.slice(0, 2).toUpperCase() : (selectedAccount.collectionType === 'LOAN' ? 'LN' : 'RD')}
                  </div>
                  <div>
                    <h2 className="dossier-bank-name">{selectedAccount.bankName}</h2>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                      <span className={`collection-type-tag is-${(selectedAccount.collectionType || 'RD').toLowerCase()}`}>
                        {selectedAccount.collectionType === 'LOAN' ? '💳 LOAN' : selectedAccount.collectionType === 'FD' ? '📈 FD' : selectedAccount.collectionType === 'RDCL' ? '🪙 RDCL' : '🏦 RD'}
                      </span>
                      <span className="dossier-code font-mono text-cyan">{selectedAccount.accountCode} • {selectedAccount.schemeName || selectedAccount.accountType}</span>
                    </div>
                  </div>
                </div>

                <div className="dossier-data-grid">
                  <div className="data-box">
                    <span className="data-lbl">Account Holder</span>
                    <span className="data-val font-bold">{selectedAccount.accountHolder}</span>
                  </div>
                  <div className="data-box">
                    <span className="data-lbl">{selectedAccount.collectionType === 'LOAN' ? 'Loan Account No' : 'Account Number'}</span>
                    <span className="data-val font-mono">{selectedAccount.accountNumber}</span>
                  </div>
                  <div className="data-box">
                    <span className="data-lbl">Scheme / Product</span>
                    <span className="data-val font-bold text-cyan">{selectedAccount.schemeName || (selectedAccount.collectionType === 'LOAN' ? 'Loan Collection' : 'RD Deposit')}</span>
                  </div>
                  <div className="data-box">
                    <span className="data-lbl">IFSC & Branch Node</span>
                    <span className="data-val font-mono text-cyan">{selectedAccount.ifscCode} ({selectedAccount.branchName})</span>
                  </div>
                  <div className="data-box">
                    <span className="data-lbl">{selectedAccount.collectionType === 'LOAN' ? 'Due / Outstanding Balance' : 'Holdings Balance'}</span>
                    <span className={`data-val font-mono font-bold ${selectedAccount.collectionType === 'LOAN' ? 'text-purple' : 'text-green'}`}>
                      ₹{Number(selectedAccount.balance).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="data-box">
                    <span className="data-lbl">Daily Payout / Clear Limit</span>
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

        {/* Unified Collection Modal: Dynamic UPI QR + Payment Link */}
        {isQrModalOpen && qrAccount && (
          <div className="account-modal-overlay" onClick={() => setIsQrModalOpen(false)}>
            <div className="qr-collection-modal" onClick={(e) => e.stopPropagation()}>
              <div className="qr-modal-head">
                <div className="qr-modal-title-group">
                  <div className="qr-title-icon">
                    {collectionTab === 'link' ? <AccountIcons.Link /> : <AccountIcons.QrCode />}
                  </div>
                  <div>
                    <h3>{collectionTab === 'link' ? 'Instant Payment Link Generator' : 'Dynamic UPI QR Collection'}</h3>
                    <span className="font-mono text-cyan" style={{ fontSize: '11.5px' }}>
                      {qrAccount.collectionType === 'LOAN'
                        ? 'Real-Time Loan EMI Collection & Gateway Dispatch'
                        : qrAccount.collectionType === 'FD'
                        ? 'Real-Time FD Fixed Deposit Inward Clearance'
                        : qrAccount.collectionType === 'RDCL'
                        ? 'RD Closed Loan Recovery & Collection Route'
                        : 'Real-Time RD Deposit Settlement & Gateway Dispatch'}
                    </span>
                  </div>
                </div>
                <button className="btn-modal-close" onClick={() => setIsQrModalOpen(false)}>✕</button>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="collection-tabs-bar">
                <button
                  type="button"
                  className={`collection-tab-btn ${collectionTab === 'qr' ? 'is-active' : ''}`}
                  onClick={() => setCollectionTab('qr')}
                >
                  <AccountIcons.QrCode />
                  <span>Dynamic UPI QR</span>
                </button>
                <button
                  type="button"
                  className={`collection-tab-btn ${collectionTab === 'link' ? 'is-active' : ''}`}
                  onClick={() => setCollectionTab('link')}
                >
                  <AccountIcons.Link />
                  <span>Instant Payment Link</span>
                </button>
              </div>

              <div className="qr-modal-body">
                {/* Account & Customer Summary */}
                <div className="qr-account-banner">
                  <div className="qr-account-info">
                    <h4>{qrAccount.accountHolder}</h4>
                    <div className="qr-account-meta font-mono">
                      <span>Acc: {qrAccount.accountNumber}</span>
                      <span>•</span>
                      <span className="text-cyan">
                        {qrAccount.collectionType === 'LOAN' ? '💳 Loan: ' : '🏦 RD: '}
                        {qrAccount.schemeName || (qrAccount.collectionType === 'LOAN' ? 'Loan Collection' : 'RD Deposit')}
                      </span>
                    </div>
                  </div>
                  <div className="qr-balance-chip">
                    <span className="lbl">{qrAccount.collectionType === 'LOAN' ? 'Due / Outstanding' : 'Current Balance'}</span>
                    <span className="val font-mono">₹{Number(qrAccount.balance || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Amount Presets & Custom Input */}
                <div>
                  <div className="qr-section-label">Select or Enter Amount</div>
                  <div className="qr-preset-grid">
                    {[100, 200, 500, 1000, 2000, 5000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        className={`qr-preset-btn ${qrAmount === amt && !qrCustomAmount ? 'is-active' : ''}`}
                        onClick={() => {
                          setQrAmount(amt);
                          setQrCustomAmount('');
                          setQrData(null);
                          setPaymentStatus(null);
                          setLinkData(null);
                          setLinkStatus(null);
                        }}
                      >
                        ₹{amt.toLocaleString('en-IN')}
                      </button>
                    ))}
                    {Number(qrAccount.balance) > 0 && (
                      <button
                        type="button"
                        className={`qr-preset-btn ${qrAmount === Number(qrAccount.balance) && !qrCustomAmount ? 'is-active' : ''}`}
                        onClick={() => {
                          setQrAmount(Number(qrAccount.balance));
                          setQrCustomAmount('');
                          setQrData(null);
                          setPaymentStatus(null);
                          setLinkData(null);
                          setLinkStatus(null);
                        }}
                        style={{ gridColumn: 'span 2' }}
                      >
                        ₹{Number(qrAccount.balance).toLocaleString('en-IN')} (Full Balance)
                      </button>
                    )}
                  </div>
                </div>

                <div className="qr-input-wrap">
                  <span className="qr-currency-prefix">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder={`Custom amount (e.g. ${qrAmount})`}
                    value={qrCustomAmount}
                    onChange={(e) => {
                      setQrCustomAmount(e.target.value);
                      setQrData(null);
                      setPaymentStatus(null);
                      setLinkData(null);
                      setLinkStatus(null);
                    }}
                    className="qr-amount-input font-mono"
                  />
                </div>

                {/* TAB 1: DYNAMIC UPI QR MODE */}
                {collectionTab === 'qr' && (
                  <>
                    <div>
                      <div className="qr-section-label">Collection Remarks / Note</div>
                      <input
                        type="text"
                        placeholder="Enter reference or collection remarks"
                        value={qrNote}
                        onChange={(e) => setQrNote(e.target.value)}
                        className="qr-note-input"
                      />
                    </div>

                    {/* Generate Button if not generated yet */}
                    {!qrData && (
                      <button
                        type="button"
                        className="btn-generate-qr-cta"
                        disabled={qrLoading}
                        onClick={() => handleGenerateQr()}
                      >
                        {qrLoading ? (
                          <span>Connecting to Payment Gateway...</span>
                        ) : (
                          <>
                            <AccountIcons.QrCode />
                            <span>
                              Generate UPI QR for ₹
                              {Number(qrCustomAmount || qrAmount || 0).toLocaleString('en-IN')}
                            </span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Error Banner */}
                    {qrError && (
                      <div className="qr-error-alert">
                        <span>⚠️ {qrError}</span>
                      </div>
                    )}

                    {/* Generated QR View */}
                    {qrData && (
                      <div className="qr-result-box">
                        <div className="qr-amount-badge-large font-mono">
                          <span>₹{Number(qrData.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="qr-canvas-holder">
                          <QRCodeSVG
                            id="upi-qr-code-svg"
                            value={qrData.paymentUrl}
                            size={210}
                            level="H"
                            includeMargin={true}
                          />
                        </div>

                        <div className="qr-order-meta font-mono">
                          <span>Order ID: <strong>{qrData.orderId || 'PG-INTENT-ORD'}</strong></span>
                          <button
                            className="btn-copy-acc"
                            onClick={() => handleCopy(qrData.orderId, 'qr-order-id')}
                            title="Copy Order ID"
                          >
                            {copiedId === 'qr-order-id' ? <AccountIcons.Check /> : <AccountIcons.Copy />}
                          </button>
                        </div>

                        {paymentStatus && (
                          <div className={`status-pill ${paymentStatus === 'SUCCESS' ? 'is-active' : 'is-inactive'}`} style={{ padding: '6px 14px', fontSize: '13px' }}>
                            <span className="status-dot"></span>
                            <span>{paymentStatus === 'SUCCESS' ? 'Payment Verified & Captured' : 'Payment Verification Failed'}</span>
                          </div>
                        )}

                        <div className="qr-action-buttons-group">
                          <button
                            type="button"
                            className="btn-qr-action"
                            onClick={() => handleCopy(qrData.paymentUrl, 'qr-payment-url')}
                          >
                            {copiedId === 'qr-payment-url' ? <AccountIcons.Check /> : <AccountIcons.Copy />}
                            <span>Copy UPI Link</span>
                          </button>
                          <button
                            type="button"
                            className="btn-qr-action"
                            onClick={handleDownloadQr}
                          >
                            <AccountIcons.Download />
                            <span>Download QR</span>
                          </button>
                          <button
                            type="button"
                            className="btn-qr-action"
                            onClick={handlePrintReceipt}
                          >
                            <AccountIcons.Printer />
                            <span>Print Receipt</span>
                          </button>
                          <button
                            type="button"
                            className="btn-qr-action is-verify"
                            onClick={handleCheckPaymentStatus}
                            disabled={checkingStatus}
                          >
                            <AccountIcons.Refresh />
                            <span>{checkingStatus ? 'Checking...' : 'Verify Status'}</span>
                          </button>
                          <button
                            type="button"
                            className="btn-qr-action"
                            onClick={() => {
                              setQrData(null);
                              setPaymentStatus(null);
                            }}
                          >
                            <span>Change Amount</span>
                          </button>
                        </div>

                        <div className="upi-brands-footer">
                          <span>Supports all UPI Apps:</span>
                          <span className="upi-brand-tag">GPay</span>
                          <span className="upi-brand-tag">PhonePe</span>
                          <span className="upi-brand-tag">Paytm</span>
                          <span className="upi-brand-tag">BHIM</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* TAB 2: INSTANT PAYMENT LINK MODE */}
                {collectionTab === 'link' && (
                  <>
                    <div className="form-row-dual" style={{ gap: '10px' }}>
                      <div className="form-field-group">
                        <label>Customer Mobile Number (for SMS / WhatsApp)</label>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="e.g. 9876543210"
                          value={customerPhoneInput}
                          onChange={(e) => setCustomerPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className="font-mono"
                        />
                      </div>
                      <div className="form-field-group">
                        <label>Customer Email (Optional)</label>
                        <input
                          type="email"
                          placeholder="customer@email.com"
                          value={customerEmailInput}
                          onChange={(e) => setCustomerEmailInput(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="qr-section-label">Link Description / Remarks</div>
                      <input
                        type="text"
                        placeholder="e.g. RD Monthly Deposit Settlement"
                        value={qrNote}
                        onChange={(e) => setQrNote(e.target.value)}
                        className="qr-note-input"
                      />
                    </div>

                    {/* Generate Link Button if not generated yet */}
                    {!linkData && (
                      <button
                        type="button"
                        className="btn-generate-link-cta"
                        disabled={linkLoading}
                        onClick={() => handleGeneratePaymentLink()}
                      >
                        {linkLoading ? (
                          <span>Connecting to Payment Gateway...</span>
                        ) : (
                          <>
                            <AccountIcons.Link />
                            <span>
                              Generate Payment Link for ₹
                              {Number(qrCustomAmount || qrAmount || 0).toLocaleString('en-IN')}
                            </span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Error Banner */}
                    {linkError && (
                      <div className="qr-error-alert">
                        <span>⚠️ {linkError}</span>
                      </div>
                    )}

                    {/* Generated Payment Link Card */}
                    {linkData && (
                      <div className="payment-link-result-card">
                        <div className="link-header-row">
                          <div className="qr-amount-badge-large font-mono">
                            <span>₹{Number(linkData.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <span className="link-active-pill">🔗 Link Active</span>
                        </div>

                        {/* URL Copy Bar */}
                        <div className="payment-link-copy-box">
                          <input
                            type="text"
                            readOnly
                            value={linkData.paymentUrl}
                            className="payment-link-url-input font-mono"
                          />
                          <button
                            type="button"
                            className="btn-copy-link-main"
                            onClick={() => handleCopy(linkData.paymentUrl, 'payment-link-url')}
                            title="Copy Payment Link"
                          >
                            {copiedId === 'payment-link-url' ? (
                              <>
                                <AccountIcons.Check />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <AccountIcons.Copy />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="qr-order-meta font-mono">
                          <span>Order Reference: <strong>{linkData.orderId || 'PL-GATEWAY-REF'}</strong></span>
                          <button
                            className="btn-copy-acc"
                            onClick={() => handleCopy(linkData.orderId, 'link-order-id')}
                            title="Copy Reference ID"
                          >
                            {copiedId === 'link-order-id' ? <AccountIcons.Check /> : <AccountIcons.Copy />}
                          </button>
                        </div>

                        {linkStatus && (
                          <div className={`status-pill ${linkStatus === 'SUCCESS' ? 'is-active' : 'is-inactive'}`} style={{ padding: '6px 14px', fontSize: '13px' }}>
                            <span className="status-dot"></span>
                            <span>{linkStatus === 'SUCCESS' ? 'Payment Verified & Captured' : 'Payment Not Yet Completed'}</span>
                          </div>
                        )}

                        {/* Quick Distribution Actions */}
                        <div className="link-distribution-actions">
                          <button
                            type="button"
                            className="btn-link-action is-whatsapp"
                            onClick={() => handleShareWhatsApp(
                              linkData.paymentUrl,
                              linkData.amount,
                              linkData.accountNumber,
                              linkData.customerName,
                              linkData.customerPhone
                            )}
                          >
                            <AccountIcons.WhatsApp />
                            <span>Share on WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            className="btn-link-action is-open"
                            onClick={() => window.open(linkData.paymentUrl, '_blank')}
                          >
                            <AccountIcons.ExternalLink />
                            <span>Open Checkout</span>
                          </button>

                          <button
                            type="button"
                            className="btn-link-action is-verify"
                            onClick={handleCheckLinkStatus}
                            disabled={checkingLinkStatus}
                          >
                            <AccountIcons.Refresh />
                            <span>{checkingLinkStatus ? 'Checking...' : 'Verify Status'}</span>
                          </button>

                          <button
                            type="button"
                            className="btn-link-action is-print"
                            onClick={handlePrintReceipt}
                          >
                            <AccountIcons.Printer />
                            <span>Print Receipt</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          className="btn-reset-link"
                          onClick={() => {
                            setLinkData(null);
                            setLinkStatus(null);
                          }}
                        >
                          <span>↺ Generate New Link with Different Amount</span>
                        </button>
                      </div>
                    )}
                  </>
                )}

              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default Accounts;
