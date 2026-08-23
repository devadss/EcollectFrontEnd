import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout'; 
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { useDialog } from '../../context/DialogContext';
import { merchantApi } from '../../services/api'; 
import { getAllStates, fetchStatesList } from '../../services/locationService';
import { 
  lookupIFSC, 
  INDIAN_BANKS_LIST, 
  sanitizeMobileNumber, 
  isValidIndianMobile, 
  sanitizeAccountNumber 
} from '../../services/bankService';
import './AddMerchant.css';

// High-Precision SVG Icons for Visual Excellence
const FormIcons = {
  Building: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="9" y1="6" x2="15" y2="6" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <line x1="9" y1="14" x2="15" y2="14" />
      <line x1="9" y1="18" x2="12" y2="18" />
    </svg>
  ),
  Shield: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Bank: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <polyline points="5 6 12 3 19 6" />
      <line x1="4" y1="10" x2="4" y2="21" />
      <line x1="20" y1="10" x2="20" y2="21" />
      <line x1="8" y1="14" x2="8" y2="17" />
      <line x1="12" y1="14" x2="12" y2="17" />
      <line x1="16" y1="14" x2="16" y2="17" />
    </svg>
  ),
  Zap: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Trash: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  CheckCircle: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" />
    </svg>
  ),
  Search: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Phone: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Percent: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  )
};

const AddMerchant = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);

  const [formData, setFormData] = useState({
    merchantName: '', 
    merchantLegalName: '',
    registeredEmail: '',
    registeredPhone: '',
    password: 'Merchant@2026',
    businessCategory: '',
    entityType: 'Pvt Ltd',
    websiteUrl: '',
    registeredAddress: '',
    entityPAN: '',
    nameOnPAN: '',
    gstNumber: '',
    gstState: '',
    monthlyExpectedVolume: '',
    monthlyExpectedTransactionCount: '',
    averageTicketSize: '',
    IntegrationStatus: 'Y',
    pgVendorPercentage: 0.15,
    platformPercentage: 0.50,
    settlementPercentage: 0.65,
    contactPerson: { name: '', emailAddress: '', phoneNumber: '' },
    authorizedSignatory: { name: '', panNumber: '', phone: '', email: '', designation: '' },
    settlementAccounts: [
      { accountHolderName: '', accountNumber: '', accountType: 'Current', bankName: '', bankBranch: '', IFSC_Code: '' }
    ]
  });

  const [errors, setErrors] = useState({});
  const [statesList, setStatesList] = useState(getAllStates());
  const [verifyingIfscIndex, setVerifyingIfscIndex] = useState(null);
  const [ifscVerifiedInfo, setIfscVerifiedInfo] = useState({});
  const [ifscLookupErrors, setIfscLookupErrors] = useState({});

  const loadMerchant = useCallback(async () => {
    try {
      setInitialLoading(true);
      const res = await merchantApi.getById(id);
      const data = res?.data?.data || res?.data;
      if (data) {
        const rawAccounts = Array.isArray(data.settlementAccounts) && data.settlementAccounts.length > 0
          ? data.settlementAccounts
          : [{ 
              accountHolderName: data.accountHolder || '', 
              accountNumber: data.accountNumber || '', 
              accountType: data.accountType || 'Current', 
              bankName: data.bankName || '', 
              bankBranch: data.branchName || data.bankBranch || '', 
              IFSC_Code: data.ifsc || data.IFSC_Code || '' 
            }];

        setFormData({
          ...data,
          registeredPhone: sanitizeMobileNumber(data.registeredPhone || data.phone || ''),
          entityType: data.entityType || 'Pvt Ltd',
          IntegrationStatus: data.integrationStatus || data.IntegrationStatus || 'Y',
          pgVendorPercentage: data.pgVendorPercentage !== undefined ? data.pgVendorPercentage : 0.15,
          platformPercentage: data.platformPercentage !== undefined ? data.platformPercentage : 0.50,
          settlementPercentage: data.settlementPercentage !== undefined ? data.settlementPercentage : 0.65,
          settlementAccounts: rawAccounts
        });

        // Perform initial IFSC lookup for existing accounts to hydrate badges if IFSC exists
        rawAccounts.forEach((acc, idx) => {
          if (acc.IFSC_Code && acc.IFSC_Code.length === 11) {
            lookupIFSC(acc.IFSC_Code).then(r => {
              if (r.success && r.data) {
                setIfscVerifiedInfo(prev => ({ ...prev, [idx]: r.data }));
              }
            });
          }
        });
      }
    } catch (err) {
      console.error('Error fetching merchant details:', err);
    } finally {
      setInitialLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const initStates = async () => {
      try {
        const list = await fetchStatesList();
        if (list && list.length > 0) {
          setStatesList(list);
        }
      } catch (e) {
        console.warn('Error loading states:', e);
      }
    };
    initStates();

    if (isEdit) {
      loadMerchant();
    }
  }, [isEdit, loadMerchant]);

  // Handle standard top-level text changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Strict numeric restriction for phone numbers
    if (name === 'registeredPhone') {
      const cleanDigits = sanitizeMobileNumber(value);
      setFormData(prev => ({ ...prev, registeredPhone: cleanDigits }));
      if (errors.registeredPhone) {
        setErrors(prev => ({ ...prev, registeredPhone: null }));
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle UPI Settlement & Commission Percentage changes
  const handlePercentageChange = (field, val) => {
    const rawVal = val === '' ? '' : Math.max(0, parseFloat(val) || 0);
    setFormData(prev => {
      const nextVendor = field === 'pgVendorPercentage' ? (val === '' ? 0 : rawVal) : (parseFloat(prev.pgVendorPercentage) || 0);
      const nextPlatform = field === 'platformPercentage' ? (val === '' ? 0 : rawVal) : (parseFloat(prev.platformPercentage) || 0);
      const nextSettlement = Number((nextVendor + nextPlatform).toFixed(2));
      return {
        ...prev,
        [field]: val,
        settlementPercentage: nextSettlement
      };
    });
  };

  // Trigger IFSC API Lookup
  const triggerIfscLookup = async (index, codeToLookup) => {
    const ifsc = (codeToLookup || formData.settlementAccounts[index]?.IFSC_Code || '').trim().toUpperCase();

    if (!ifsc || ifsc.length !== 11) {
      setIfscLookupErrors(prev => ({
        ...prev,
        [index]: 'Please enter a valid 11-character IFSC code (e.g. HDFC0001892).'
      }));
      return;
    }

    setVerifyingIfscIndex(index);
    setIfscLookupErrors(prev => ({ ...prev, [index]: null }));

    try {
      const result = await lookupIFSC(ifsc);

      if (result.success && result.data) {
        const bankData = result.data;

        // Auto-fill bank name, branch, and verified IFSC
        setFormData(prev => {
          const updated = [...prev.settlementAccounts];
          updated[index] = {
            ...updated[index],
            bankName: bankData.bankName || updated[index].bankName,
            bankBranch: bankData.branch || updated[index].bankBranch,
            IFSC_Code: bankData.ifsc || ifsc
          };
          return { ...prev, settlementAccounts: updated };
        });

        // Store verification details
        setIfscVerifiedInfo(prev => ({
          ...prev,
          [index]: bankData
        }));

        // Clear field errors
        setErrors(prev => ({
          ...prev,
          [`IFSC_Code_${index}`]: null,
          [`bankName_${index}`]: null,
          [`bankBranch_${index}`]: null
        }));
      } else {
        setIfscLookupErrors(prev => ({
          ...prev,
          [index]: result.message || 'IFSC code not found in banking directory.'
        }));
      }
    } catch (err) {
      console.error('IFSC API Lookup exception:', err);
      setIfscLookupErrors(prev => ({
        ...prev,
        [index]: 'Unable to verify IFSC automatically. You can enter details manually.'
      }));
    } finally {
      setVerifyingIfscIndex(null);
    }
  };

  // Handle settlement account field changes
  const handleAccountChange = (index, e) => {
    const { name, value } = e.target;
    const updatedAccounts = [...formData.settlementAccounts];

    // Strictly numeric for Account Number
    if (name === 'accountNumber') {
      const cleanAcc = sanitizeAccountNumber(value);
      updatedAccounts[index] = { ...updatedAccounts[index], accountNumber: cleanAcc };
      setFormData(prev => ({ ...prev, settlementAccounts: updatedAccounts }));
      const errKey = `accountNumber_${index}`;
      if (errors[errKey]) setErrors(prev => ({ ...prev, [errKey]: null }));
      return;
    }

    // Auto-formatting and auto-lookup for IFSC
    if (name === 'IFSC_Code') {
      const cleanIfsc = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
      updatedAccounts[index] = { ...updatedAccounts[index], IFSC_Code: cleanIfsc };
      setFormData(prev => ({ ...prev, settlementAccounts: updatedAccounts }));

      const errKey = `IFSC_Code_${index}`;
      if (errors[errKey]) setErrors(prev => ({ ...prev, [errKey]: null }));

      if (cleanIfsc.length === 11) {
        triggerIfscLookup(index, cleanIfsc);
      } else {
        // Reset verification state if IFSC is modified
        setIfscVerifiedInfo(prev => {
          const next = { ...prev };
          delete next[index];
          return next;
        });
        setIfscLookupErrors(prev => {
          const next = { ...prev };
          delete next[index];
          return next;
        });
      }
      return;
    }

    updatedAccounts[index] = { ...updatedAccounts[index], [name]: value };
    setFormData(prev => ({ ...prev, settlementAccounts: updatedAccounts }));

    const errKey = `${name}_${index}`;
    if (errors[errKey]) {
      setErrors(prev => ({ ...prev, [errKey]: null }));
    }
  };

  const addAccount = () => {
    setFormData(prev => ({
      ...prev,
      settlementAccounts: [
        ...prev.settlementAccounts,
        { accountHolderName: '', accountNumber: '', accountType: 'Current', bankName: '', bankBranch: '', IFSC_Code: '' }
      ]
    }));
  };

  const removeAccount = (index) => {
    if (formData.settlementAccounts.length > 1) {
      const updatedAccounts = formData.settlementAccounts.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, settlementAccounts: updatedAccounts }));
      
      // Cleanup verified state
      setIfscVerifiedInfo(prev => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      setIfscLookupErrors(prev => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const validate = () => {
    const tempErrors = {};

    if (!formData.merchantName?.trim()) tempErrors.merchantName = "Merchant Display Name is required";
    if (!formData.merchantLegalName?.trim()) tempErrors.merchantLegalName = "Legal Corporate Name is required";
    
    // Strict Mobile Number Validation (Numeric 10 digits starting with 6, 7, 8, or 9)
    if (!formData.registeredPhone?.trim()) {
      tempErrors.registeredPhone = "Registered Mobile Number is required";
    } else if (formData.registeredPhone.length !== 10) {
      tempErrors.registeredPhone = "Mobile number must be exactly 10 numeric digits";
    } else if (!isValidIndianMobile(formData.registeredPhone)) {
      tempErrors.registeredPhone = "Invalid mobile number. Must start with 6, 7, 8, or 9";
    }

    if (!formData.registeredEmail?.trim()) {
      tempErrors.registeredEmail = "Registered Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.registeredEmail)) {
      tempErrors.registeredEmail = "Enter a valid email address";
    }

    if (!formData.businessCategory) tempErrors.businessCategory = "Please select a business category";
    if (!formData.entityType) tempErrors.entityType = "Entity Type is required";
    if (!formData.registeredAddress?.trim()) tempErrors.registeredAddress = "Registered Operating Address is required";
    
    if (!formData.entityPAN?.trim()) {
      tempErrors.entityPAN = "Corporate PAN is required";
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(formData.entityPAN.trim())) {
      tempErrors.entityPAN = "Invalid PAN format (e.g. ABCDE1234F)";
    }
    
    if (!formData.nameOnPAN?.trim()) tempErrors.nameOnPAN = "Name on PAN card is required";
    
    if (!formData.gstNumber?.trim()) {
      tempErrors.gstNumber = "GSTIN is required";
    } else if (formData.gstNumber.trim().length !== 15) {
      tempErrors.gstNumber = "GSTIN must be exactly 15 characters";
    }
    
    if (!formData.gstState?.trim()) tempErrors.gstState = "GST State jurisdiction is required";

    // Validate Settlement Accounts
    formData.settlementAccounts.forEach((account, index) => {
      if (!account.accountHolderName?.trim()) {
        tempErrors[`accountHolderName_${index}`] = "Account holder name is required";
      }
      
      if (!account.accountNumber?.trim()) {
        tempErrors[`accountNumber_${index}`] = "Account number is required";
      } else if (account.accountNumber.length < 9) {
        tempErrors[`accountNumber_${index}`] = "Account number must have at least 9 numeric digits";
      }
      
      if (!account.bankName?.trim()) {
        tempErrors[`bankName_${index}`] = "Bank name is required";
      }
      
      if (!account.IFSC_Code?.trim()) {
        tempErrors[`IFSC_Code_${index}`] = "IFSC code is required";
      } else if (account.IFSC_Code.length !== 11) {
        tempErrors[`IFSC_Code_${index}`] = "IFSC code must be exactly 11 characters (e.g. HDFC0001892)";
      }
    });

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const { showSuccess, showError } = useDialog();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await merchantApi.update(id, formData);
        showSuccess("Merchant corporate records and gateway parameters updated successfully.", "Merchant Updated");
      } else {
        await merchantApi.create(formData);
        showSuccess("Enterprise Merchant registered and gateway provisioned successfully.", "Merchant Registered");
      }
      navigate('/merchants');
    } catch (error) {
      console.error('Error saving merchant:', error);
      showError(
        error.response?.data?.message || error.message || 'Failed to save merchant. Please check and verify all required entries.', 
        "Merchant Creation Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <DashboardLayout role="softwareadmin">
        <LoadingAnimation message="Loading Merchant Onboarding Protocol..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="softwareadmin">
      <div className="add-merchant-container">
        
        {/* Top Header Zone */}
        <div className="merchant-page-header">
          <div className="header-text-stack">
            <div className="onboard-badge">
              <FormIcons.Sparkles />
              <span>{isEdit ? 'Corporate Modification' : 'Enterprise Provisioning Console'}</span>
            </div>
            <h1 className="header-main-title">
              {isEdit ? 'Modify ' : 'Register '}
              <span className="gradient-text">Merchant Account</span>
            </h1>
            <p className="header-subtitle">
              Configure corporate entity credentials, statutory tax profiles, and verified nodal settlement bank accounts
            </p>
          </div>

          <div className="header-actions-wrap">
            <button type="button" className="btn-back-nav" onClick={() => navigate('/merchants')}>
              <FormIcons.ArrowLeft />
              <span>Back to Directory</span>
            </button>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="merchant-onboarding-form" noValidate>

          {/* Section 1: Business Identity */}
          <div className="onboard-section-card">
            <div className="section-card-glow"></div>
            <div className="section-card-header">
              <div className="section-icon-box is-indigo">
                <FormIcons.Building />
              </div>
              <div>
                <h3 className="section-title">Corporate Business Identity</h3>
                <p className="section-desc">Primary merchant operational profile and communication credentials</p>
              </div>
            </div>

            <div className="onboard-grid">
              <div className="onboard-field">
                <label>Merchant Display Name <span className="req-star">*</span></label>
                <input
                  type="text"
                  name="merchantName"
                  placeholder="e.g. Apex Retail Services"
                  value={formData.merchantName || ''}
                  onChange={handleChange}
                  className={errors.merchantName ? 'input-error' : ''}
                />
                {errors.merchantName && <span className="field-error-hint">{errors.merchantName}</span>}
              </div>

              <div className="onboard-field">
                <label>Corporate Legal Name <span className="req-star">*</span></label>
                <input
                  type="text"
                  name="merchantLegalName"
                  placeholder="e.g. Apex Retail Private Limited"
                  value={formData.merchantLegalName || ''}
                  onChange={handleChange}
                  className={errors.merchantLegalName ? 'input-error' : ''}
                />
                {errors.merchantLegalName && <span className="field-error-hint">{errors.merchantLegalName}</span>}
              </div>

              <div className="onboard-field">
                <label>Official Registered Email <span className="req-star">*</span></label>
                <input
                  type="email"
                  name="registeredEmail"
                  placeholder="finance@apexretail.in"
                  value={formData.registeredEmail || ''}
                  onChange={handleChange}
                  className={errors.registeredEmail ? 'input-error' : ''}
                />
                {errors.registeredEmail && <span className="field-error-hint">{errors.registeredEmail}</span>}
              </div>

              {/* Registered Mobile / Phone (Strictly Numeric Limit) */}
              <div className="onboard-field">
                <label>Registered Mobile Number <span className="req-star">*</span></label>
                <div className="phone-input-affix-group">
                  <span className="phone-country-badge">
                    <span className="flag-icon">🇮🇳</span>
                    <span>+91</span>
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    name="registeredPhone"
                    placeholder="9876543210"
                    value={formData.registeredPhone || ''}
                    onChange={handleChange}
                    className={`font-mono ${errors.registeredPhone ? 'input-error' : ''}`}
                  />
                </div>
                <div className="field-hint-row">
                  <span className="field-char-count">
                    {formData.registeredPhone ? formData.registeredPhone.length : 0}/10 numeric digits
                  </span>
                  {errors.registeredPhone && (
                    <span className="field-error-hint">{errors.registeredPhone}</span>
                  )}
                </div>
              </div>

              <div className="onboard-field">
                <label>Merchant Portal Access Password <span className="req-star">*</span></label>
                <input
                  type="text"
                  name="password"
                  placeholder="e.g. Merchant@2026"
                  value={formData.password || ''}
                  onChange={handleChange}
                  className={errors.password ? 'input-error font-mono' : 'font-mono'}
                />
                <span className="field-char-count">Security credential for merchant dashboard login</span>
              </div>

              <div className="onboard-field">
                <label>Business Category <span className="req-star">*</span></label>
                <select
                  name="businessCategory"
                  value={formData.businessCategory || ''}
                  onChange={handleChange}
                  className={errors.businessCategory ? 'input-error' : ''}
                >
                  <option value="">-- Select Industry Sector --</option>
                  <option value="Retail & E-Commerce">Retail & E-Commerce</option>
                  <option value="Fintech & Financial Services">Fintech & Financial Services</option>
                  <option value="Agriculture & Supply Chain">Agriculture & Supply Chain</option>
                  <option value="Healthcare & Pharmaceuticals">Healthcare & Pharmaceuticals</option>
                  <option value="SaaS & Digital Technology">SaaS & Digital Technology</option>
                  <option value="Education & EdTech">Education & EdTech</option>
                  <option value="Electronics & Hardware">Electronics & Hardware</option>
                  <option value="Automotive & Logistics">Automotive & Logistics</option>
                  <option value="Hospitality & Services">Hospitality & Services</option>
                  <option value="General Commercial Enterprise">General Commercial Enterprise</option>
                </select>
                {errors.businessCategory && <span className="field-error-hint">{errors.businessCategory}</span>}
              </div>

              <div className="onboard-field">
                <label>Entity Structure Type <span className="req-star">*</span></label>
                <select
                  name="entityType"
                  value={formData.entityType || ''}
                  onChange={handleChange}
                  className={errors.entityType ? 'input-error' : ''}
                >
                  <option value="Pvt Ltd">Private Limited Company (Pvt Ltd)</option>
                  <option value="Public Ltd">Public Limited Company</option>
                  <option value="LLP">Limited Liability Partnership (LLP)</option>
                  <option value="Partnership">Partnership Firm</option>
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                  <option value="Trust">Trust</option>
                  <option value="Society">Society</option>
                  <option value="Section 8 / NGO">Section 8 / Non-Profit</option>
                </select>
                {errors.entityType && <span className="field-error-hint">{errors.entityType}</span>}
              </div>

              <div className="onboard-field full-row">
                <label>Registered Corporate Address <span className="req-star">*</span></label>
                <textarea
                  rows="2"
                  name="registeredAddress"
                  placeholder="Enter complete official physical and billing address..."
                  value={formData.registeredAddress || ''}
                  onChange={handleChange}
                  className={errors.registeredAddress ? 'input-error' : ''}
                />
                {errors.registeredAddress && <span className="field-error-hint">{errors.registeredAddress}</span>}
              </div>
            </div>
          </div>

          {/* Section 2: Statutory & Tax Credentials */}
          <div className="onboard-section-card">
            <div className="section-card-glow" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)' }}></div>
            <div className="section-card-header">
              <div className="section-icon-box is-green">
                <FormIcons.Shield />
              </div>
              <div>
                <h3 className="section-title">Compliance & Tax Credentials</h3>
                <p className="section-desc">Statutory PAN, GSTIN identification and legal signatory verification</p>
              </div>
            </div>

            <div className="onboard-grid">
              <div className="onboard-field">
                <label>Corporate / Entity PAN <span className="req-star">*</span></label>
                <input
                  type="text"
                  name="entityPAN"
                  maxLength={10}
                  placeholder="AAAAA1234A"
                  value={formData.entityPAN || ''}
                  onChange={(e) => handleChange({ target: { name: 'entityPAN', value: e.target.value.toUpperCase().slice(0, 10) } })}
                  className={errors.entityPAN ? 'input-error font-mono' : 'font-mono'}
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.entityPAN && <span className="field-error-hint">{errors.entityPAN}</span>}
              </div>

              <div className="onboard-field">
                <label>Name as on PAN Card <span className="req-star">*</span></label>
                <input
                  type="text"
                  name="nameOnPAN"
                  placeholder="e.g. Apex Retail Services Pvt Ltd"
                  value={formData.nameOnPAN || ''}
                  onChange={handleChange}
                  className={errors.nameOnPAN ? 'input-error' : ''}
                />
                {errors.nameOnPAN && <span className="field-error-hint">{errors.nameOnPAN}</span>}
              </div>

              <div className="onboard-field">
                <label>GSTIN Number <span className="req-star">*</span></label>
                <input
                  type="text"
                  name="gstNumber"
                  maxLength={15}
                  placeholder="07AAAAA1234A1Z5"
                  value={formData.gstNumber || ''}
                  onChange={(e) => handleChange({ target: { name: 'gstNumber', value: e.target.value.toUpperCase().slice(0, 15) } })}
                  className={errors.gstNumber ? 'input-error font-mono' : 'font-mono'}
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.gstNumber && <span className="field-error-hint">{errors.gstNumber}</span>}
              </div>

              <div className="onboard-field">
                <label>GST Jurisdiction State <span className="req-star">*</span></label>
                <select
                  name="gstState"
                  value={formData.gstState || ''}
                  onChange={handleChange}
                  className={errors.gstState ? 'input-error' : ''}
                >
                  <option value="">-- Select GST State --</option>
                  {statesList.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                {errors.gstState && <span className="field-error-hint">{errors.gstState}</span>}
              </div>
            </div>
          </div>

          {/* Section 3: API Gateway & Integration Status */}
          <div className="onboard-section-card">
            <div className="section-card-glow" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)' }}></div>
            <div className="section-card-header">
              <div className="section-icon-box is-amber">
                <FormIcons.Zap />
              </div>
              <div>
                <h3 className="section-title">Integration & Gateway Provisioning</h3>
                <p className="section-desc">Configure whether this merchant has live API backend routing enabled</p>
              </div>
            </div>

            <div className="onboard-grid">
              <div className="onboard-field full-row">
                <label>Live API Gateway Routing Status <span className="req-star">*</span></label>
                <div className="integration-switch-group">
                  <div 
                    className={`switch-option-card ${formData.IntegrationStatus === 'Y' ? 'is-active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, IntegrationStatus: 'Y' }))}
                  >
                    <div className="switch-radio-indicator">
                      {formData.IntegrationStatus === 'Y' && <span className="radio-dot"></span>}
                    </div>
                    <div className="switch-card-info">
                      <strong className="switch-card-title">Live Dynamic Gateway (Y)</strong>
                      <span className="switch-card-sub">Enables dynamic third-party API integration (Branch auto-fetch, RD accounts, CBS synchronization)</span>
                    </div>
                  </div>

                  <div 
                    className={`switch-option-card ${formData.IntegrationStatus === 'N' ? 'is-active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, IntegrationStatus: 'N' }))}
                  >
                    <div className="switch-radio-indicator">
                      {formData.IntegrationStatus === 'N' && <span className="radio-dot"></span>}
                    </div>
                    <div className="switch-card-info">
                      <strong className="switch-card-title">Standard Manual Mode (N)</strong>
                      <span className="switch-card-sub">Merchant operates in localized standalone mode without external gateway sync</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: UPI Settlement & Commission Percentages (TDR Rates) */}
          <div className="onboard-section-card">
            <div className="section-card-glow" style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)' }}></div>
            <div className="section-card-header">
              <div className="section-icon-box is-indigo" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                <FormIcons.Percent />
              </div>
              <div>
                <h3 className="section-title">UPI Settlement & Commission Rates (TDR Configuration)</h3>
                <p className="section-desc">Customizable settlement deduction rates per merchant (Only applies to UPI transactions)</p>
              </div>
            </div>

            <div className="onboard-grid">
              <div className="onboard-field">
                <label>PG Vendor Cut / Rate (%) <span className="req-star">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  name="pgVendorPercentage"
                  placeholder="e.g. 0.15"
                  value={formData.pgVendorPercentage !== undefined ? formData.pgVendorPercentage : ''}
                  onChange={(e) => handlePercentageChange('pgVendorPercentage', e.target.value)}
                  className="font-mono"
                />
                <span className="field-char-count" style={{ marginTop: '4px', display: 'block', color: '#94a3b8' }}>
                  Gateway vendor processing surcharge (e.g., 0.15%)
                </span>
              </div>

              <div className="onboard-field">
                <label>Our Platform Commission Margin (%) <span className="req-star">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  name="platformPercentage"
                  placeholder="e.g. 0.50"
                  value={formData.platformPercentage !== undefined ? formData.platformPercentage : ''}
                  onChange={(e) => handlePercentageChange('platformPercentage', e.target.value)}
                  className="font-mono"
                />
                <span className="field-char-count" style={{ marginTop: '4px', display: 'block', color: '#94a3b8' }}>
                  Platform net profit retained from collection (e.g., 0.50%)
                </span>
              </div>

              <div className="onboard-field">
                <label>Total Merchant Settlement TDR (%)</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={`${formData.settlementPercentage || '0.65'}%`}
                  className="font-mono"
                  style={{ background: 'rgba(255, 255, 255, 0.04)', color: '#10b981', fontWeight: '700', cursor: 'not-allowed' }}
                />
                <span className="field-char-count" style={{ marginTop: '4px', display: 'block', color: '#10b981' }}>
                  Auto-calculated total deduction (Vendor + Platform)
                </span>
              </div>

              {/* Real-time TDR Calculation Simulator */}
              <div className="onboard-field full-row" style={{ marginTop: '4px' }}>
                <div style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      ⚡ Live UPI Settlement Breakdown Simulator (Sample ₹10,000 Collection)
                    </span>
                    <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: '700', background: 'rgba(99, 102, 241, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                      UPI Rail Only
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>PG Vendor Fee ({formData.pgVendorPercentage || 0}%)</span>
                      <strong style={{ fontSize: '14px', color: '#a855f7', fontFamily: 'monospace' }}>
                        ₹{((10000 * (parseFloat(formData.pgVendorPercentage) || 0)) / 100).toFixed(2)}
                      </strong>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Our Platform Margin ({formData.platformPercentage || 0}%)</span>
                      <strong style={{ fontSize: '14px', color: '#818cf8', fontFamily: 'monospace' }}>
                        ₹{((10000 * (parseFloat(formData.platformPercentage) || 0)) / 100).toFixed(2)}
                      </strong>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Total TDR Deducted ({formData.settlementPercentage || 0}%)</span>
                      <strong style={{ fontSize: '14px', color: '#ef4444', fontFamily: 'monospace' }}>
                        -₹{((10000 * (parseFloat(formData.settlementPercentage) || 0)) / 100).toFixed(2)}
                      </strong>
                    </div>

                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                      <span style={{ fontSize: '11px', color: '#6ee7b7', display: 'block' }}>Net Merchant Settlement Payout</span>
                      <strong style={{ fontSize: '15px', color: '#10b981', fontFamily: 'monospace' }}>
                        ₹{(10000 - ((10000 * (parseFloat(formData.settlementPercentage) || 0)) / 100)).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Settlement Banking & Escrow Accounts with Common IFSC API */}
          <div className="onboard-section-card">
            <div className="section-card-glow" style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)' }}></div>
            <div className="section-card-header" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="section-icon-box is-cyan">
                  <FormIcons.Bank />
                </div>
                <div>
                  <h3 className="section-title">Settlement & Nodal Bank Accounts</h3>
                  <p className="section-desc">Live Indian Banking API enabled • Auto-detect Bank & Branch via standard IFSC lookup</p>
                </div>
              </div>

              <button type="button" className="btn-add-account" onClick={addAccount}>
                <FormIcons.Plus />
                <span>Add Account</span>
              </button>
            </div>

            <div className="accounts-stack-list">
              {formData.settlementAccounts?.map((account, index) => {
                const isVerifying = verifyingIfscIndex === index;
                const verifiedData = ifscVerifiedInfo[index];
                const lookupError = ifscLookupErrors[index];

                return (
                  <div key={index} className="settle-account-card">
                    <div className="account-card-top-bar">
                      <div className="account-badge-indicator">
                        <span className="acc-num-tag font-mono">NODE #{index + 1}</span>
                        <span className="acc-type-pill">{account.accountType || 'Current'}</span>
                        {verifiedData && (
                          <span className="verified-success-pill">
                            <FormIcons.CheckCircle /> Verified IFSC
                          </span>
                        )}
                      </div>

                      {formData.settlementAccounts.length > 1 && (
                        <button 
                          type="button" 
                          className="btn-remove-account" 
                          onClick={() => removeAccount(index)}
                          title="Remove Account"
                        >
                          <FormIcons.Trash />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="onboard-grid">
                      <div className="onboard-field">
                        <label>Account Holder Name <span className="req-star">*</span></label>
                        <input
                          type="text"
                          name="accountHolderName"
                          placeholder="e.g. Apex Retail Services Payouts"
                          value={account.accountHolderName || ''}
                          onChange={(e) => handleAccountChange(index, e)}
                          className={errors[`accountHolderName_${index}`] ? 'input-error' : ''}
                        />
                        {errors[`accountHolderName_${index}`] && (
                          <span className="field-error-hint">{errors[`accountHolderName_${index}`]}</span>
                        )}
                      </div>

                      {/* Numeric Account Number (Restricted to Digits Only) */}
                      <div className="onboard-field">
                        <label>Account Number <span className="req-star">*</span></label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={18}
                          name="accountNumber"
                          placeholder="e.g. 50200098421442"
                          value={account.accountNumber || ''}
                          onChange={(e) => handleAccountChange(index, e)}
                          className={errors[`accountNumber_${index}`] ? 'input-error font-mono' : 'font-mono'}
                        />
                        <div className="field-hint-row">
                          <span className="field-char-count">{account.accountNumber ? account.accountNumber.length : 0}/18 digits</span>
                          {errors[`accountNumber_${index}`] && (
                            <span className="field-error-hint">{errors[`accountNumber_${index}`]}</span>
                          )}
                        </div>
                      </div>

                      <div className="onboard-field">
                        <label>Account Type <span className="req-star">*</span></label>
                        <select
                          name="accountType"
                          value={account.accountType || 'Current'}
                          onChange={(e) => handleAccountChange(index, e)}
                        >
                          <option value="Current">Current Account</option>
                          <option value="Savings">Savings Account</option>
                          <option value="Escrow">Escrow / Nodal Account</option>
                          <option value="Overdraft">Overdraft (OD) Account</option>
                        </select>
                      </div>

                      {/* IFSC Code with Integrated Common API Lookup */}
                      <div className="onboard-field">
                        <label>
                          IFSC Code <span className="req-star">*</span>
                          <span className="field-sub-badge">11 chars</span>
                        </label>
                        <div className="ifsc-input-action-group">
                          <input
                            type="text"
                            name="IFSC_Code"
                            maxLength={11}
                            placeholder="e.g. HDFC0001892"
                            value={account.IFSC_Code || ''}
                            onChange={(e) => handleAccountChange(index, e)}
                            className={`font-mono ${errors[`IFSC_Code_${index}`] || lookupError ? 'input-error' : ''}`}
                            style={{ textTransform: 'uppercase' }}
                          />
                          <button
                            type="button"
                            className={`btn-verify-ifsc ${isVerifying ? 'is-loading' : ''}`}
                            disabled={isVerifying || !account.IFSC_Code || account.IFSC_Code.length < 5}
                            onClick={() => triggerIfscLookup(index, account.IFSC_Code)}
                            title="Auto-Detect Bank and Branch from IFSC API"
                          >
                            {isVerifying ? (
                              <>
                                <span className="btn-spinner-mini"></span>
                                <span>Detecting...</span>
                              </>
                            ) : (
                              <>
                                <FormIcons.Sparkles />
                                <span>Auto-Fetch</span>
                              </>
                            )}
                          </button>
                        </div>
                        {lookupError && (
                          <span className="field-error-hint ifsc-lookup-warn">{lookupError}</span>
                        )}
                        {errors[`IFSC_Code_${index}`] && (
                          <span className="field-error-hint">{errors[`IFSC_Code_${index}`]}</span>
                        )}
                      </div>

                      {/* Bank Selection (Searchable Dropdown / Datalist + Custom Entry) */}
                      <div className="onboard-field">
                        <label>Bank Selection <span className="req-star">*</span></label>
                        <div className="bank-select-wrap">
                          <input
                            type="text"
                            name="bankName"
                            list={`indian-banks-${index}`}
                            placeholder="Select bank or auto-fill via IFSC..."
                            value={account.bankName || ''}
                            onChange={(e) => handleAccountChange(index, e)}
                            className={errors[`bankName_${index}`] ? 'input-error' : ''}
                          />
                          <datalist id={`indian-banks-${index}`}>
                            {INDIAN_BANKS_LIST.map((b) => (
                              <option key={b.code} value={b.name}>
                                {b.name} ({b.type} Bank)
                              </option>
                            ))}
                          </datalist>
                        </div>
                        {errors[`bankName_${index}`] && (
                          <span className="field-error-hint">{errors[`bankName_${index}`]}</span>
                        )}
                      </div>

                      {/* Bank Branch Name (Auto-populated from IFSC or custom) */}
                      <div className="onboard-field">
                        <label>Bank Branch Name</label>
                        <input
                          type="text"
                          name="bankBranch"
                          placeholder="Auto-populated or enter branch..."
                          value={account.bankBranch || ''}
                          onChange={(e) => handleAccountChange(index, e)}
                        />
                      </div>
                    </div>

                    {/* Verified Bank Details Showcase Card */}
                    {verifiedData && (
                      <div className="ifsc-verified-card">
                        <div className="verified-card-header">
                          <div className="verified-badge-pill">
                            <FormIcons.CheckCircle />
                            <span>RBI Registered Branch</span>
                          </div>
                          <span className="verified-ifsc-code font-mono">{verifiedData.ifsc}</span>
                        </div>
                        <div className="verified-card-body">
                          <div className="verified-top-row">
                            <strong className="verified-bank-name">{verifiedData.bankName}</strong>
                            <span className="verified-branch-tag">{verifiedData.branch || 'Main Branch'}</span>
                          </div>
                          {(verifiedData.city || verifiedData.state) && (
                            <div className="verified-loc-text">
                              📍 {[verifiedData.city, verifiedData.district, verifiedData.state].filter(Boolean).join(', ')}
                            </div>
                          )}
                          {verifiedData.address && (
                            <div className="verified-address-text">{verifiedData.address}</div>
                          )}
                          <div className="payment-rails-row">
                            <span className="rail-label">Supported Rails:</span>
                            {verifiedData.upi && <span className="rail-tag upi">UPI</span>}
                            {verifiedData.imps && <span className="rail-tag imps">IMPS</span>}
                            {verifiedData.neft && <span className="rail-tag neft">NEFT</span>}
                            {verifiedData.rtgs && <span className="rail-tag rtgs">RTGS</span>}
                            {verifiedData.micr && <span className="rail-tag micr">MICR: {verifiedData.micr}</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Actions Footer Bar */}
          <div className="merchant-form-footer">
            <button type="button" className="btn-cancel-action" onClick={() => navigate('/merchants')}>
              Cancel
            </button>
            <button type="submit" className="btn-submit-action" disabled={loading}>
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  <span>Provisioning Merchant...</span>
                </>
              ) : (
                <>
                  <FormIcons.Check />
                  <span>{isEdit ? 'Update Merchant Profile' : 'Complete Merchant Provisioning'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </DashboardLayout>
  );
};

export default AddMerchant;