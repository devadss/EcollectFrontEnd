import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout'; 
import { branchApi, merchantApi } from '../../services/api';  
import StateDistrictSelect from '../../components/common/StateDistrictSelect';
import { lookupLocationByPincode } from '../../services/locationService';
import { useDialog } from '../../context/DialogContext';
import './AddBranch.css';

const AddBranch = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { showSuccess, showError, showWarning } = useDialog();
  const [loading, setLoading] = useState(false);
  const [fetchingBranches, setFetchingBranches] = useState(false);
  const [branchOptions, setBranchOptions] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [integrationStatus, setIntegrationStatus] = useState('No');

  // Guard refs to prevent duplicate/concurrent API requests
  const isFetchingRef = useRef(false);
  const fetchedMerchantIdRef = useRef(null);

  const authUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  })();

  const rawRole = (localStorage.getItem('user_role') || localStorage.getItem('role') || authUser?.role || '').toLowerCase().trim();
  const normRole = rawRole.replace(/[^a-z0-9]/g, '');
  const isMerchantUser = normRole.includes('merchant');
  const isSoftwareAdmin = (normRole.includes('software') || normRole.includes('superadmin') || normRole === 'admin') && !normRole.includes('merchant') && !normRole.includes('branch') && !normRole.includes('agent');

  const currentMerchantId = authUser?.merchantId || authUser?.MerchantId || localStorage.getItem('merchantId') || (isMerchantUser ? (authUser?.merchantId || authUser?.MerchantId || authUser?.id) : null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    merchantId: currentMerchantId ? String(currentMerchantId) : '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    phone: '',
    email: '',
    isActive: isSoftwareAdmin ? true : false,
    description: '',
    external_branch_id: '',
    source_system: 'EXTERNAL',
  });

  const [errors, setErrors] = useState({});

  // Single-flight fetch external branch list with deduplication
  const fetchBranchList = useCallback(async (mid = null, force = false) => {
    // If already in flight, do not start another request
    if (isFetchingRef.current) {
      console.log('⏳ Branch fetch already in-flight. Skipping duplicate call.');
      return;
    }

    // If already fetched for this merchant and not forced, reuse existing list
    const targetMid = mid !== null ? String(mid) : (formData.merchantId ? String(formData.merchantId) : '');
    if (!force && fetchedMerchantIdRef.current === targetMid && branchOptions.length > 0) {
      console.log(`📦 Branches already loaded for merchant ${targetMid}. Skipping redundant call.`);
      return;
    }

    try {
      isFetchingRef.current = true;
      setFetchingBranches(true);
      console.log(`📡 Fetching branch list from external API for merchant: ${targetMid || 'all'}...`);
      
      const res = await branchApi.fetchBranchList(targetMid ? { merchantId: targetMid } : undefined);
      let branches = [];
      
      if (res?.data?.data && Array.isArray(res.data.data)) {
        branches = res.data.data;
      } else if (res?.data && Array.isArray(res.data)) {
        branches = res.data;
      }
      
      if (branches && branches.length > 0) {
        const mappedBranches = branches.map(b => ({
          Branch_Code: b.branch_Code || b.Branch_Code || b.code || '',
          Branch_Name: b.branch_Name || b.Branch_Name || b.name || '',
          Address: b.address || b.Address || '',
        }));
        setBranchOptions(mappedBranches);
        fetchedMerchantIdRef.current = targetMid;
      } else {
        setBranchOptions([]);
        fetchedMerchantIdRef.current = targetMid;
      }
    } catch (error) {
      console.error('❌ Error fetching branch list:', error);
      setBranchOptions([]);
    } finally {
      isFetchingRef.current = false;
      setFetchingBranches(false);
    }
  }, [formData.merchantId, branchOptions.length]);

  // Initial page initialization (runs once on mount)
  useEffect(() => {
    let isMounted = true;

    const initPage = async () => {
      const params = new URLSearchParams(window.location.search);
      const qMid = params.get('merchantId') || currentMerchantId;
      const initialMid = qMid ? String(qMid) : '';

      if (initialMid) {
        setFormData(prev => ({ ...prev, merchantId: initialMid }));
      }

      if (isEdit && !isSoftwareAdmin) {
        showWarning('Modification of Branch records is restricted to the Software Admin portal.', 'Access Restricted');
        navigate('/branches');
        return;
      }

      try {
        // 1. Load merchants
        let safeList = [];
        try {
          const mRes = await merchantApi.getAll();
          const mList = mRes?.data?.data || mRes?.data || [];
          safeList = Array.isArray(mList) ? mList : [];
        } catch (e) {
          console.warn('Could not load all merchants list:', e);
        }

        // If pre-selected merchant ID exists (merchant login or query param)
        const targetMid = initialMid;
        let selectedMerchant = safeList.find(m => String(m.id) === String(targetMid));

        // Fallback: If not in safeList, fetch single merchant directly
        if (!selectedMerchant && targetMid) {
          try {
            const singleMRes = await merchantApi.getById(targetMid);
            const singleM = singleMRes?.data?.data || singleMRes?.data;
            if (singleM && (singleM.id || singleM.merchantName)) {
              selectedMerchant = singleM;
              safeList = [singleM, ...safeList.filter(m => String(m.id) !== String(targetMid))];
            }
          } catch (e) {
            console.warn('Could not load single merchant details:', e);
          }
        }

        if (isMounted) setMerchants(safeList);

        // 2. If editing, load branch
        if (isEdit) {
          const bRes = await branchApi.getById(id);
          const bData = bRes?.data?.data || bRes?.data || {};
          if (isMounted) {
            setFormData(prev => ({
              ...prev,
              ...bData,
              merchantId: bData.merchantId ? String(bData.merchantId) : prev.merchantId
            }));

            const finalMid = bData.merchantId || targetMid;
            let mObj = safeList.find(m => String(m.id) === String(finalMid)) || selectedMerchant;
            if (mObj) {
              const status = mObj.integrationStatus || mObj.IntegrationStatus || 'No';
              setIntegrationStatus(status);
            }
          }
        } else if (targetMid && isMounted) {
          // 3. New branch with pre-selected merchant
          if (selectedMerchant) {
            const status = selectedMerchant.integrationStatus || selectedMerchant.IntegrationStatus || 'No';
            setIntegrationStatus(status);
            const isLive = String(status).toUpperCase() === 'Y' || String(status).toUpperCase() === 'YES' || status === true;
            if (isLive) {
              fetchBranchList(targetMid, true);
            }
          }
        }
      } catch (err) {
        console.warn('Initialization error in AddBranch:', err);
      }
    };

    initPage();

    return () => {
      isMounted = false;
    };
  }, [id, isEdit, isSoftwareAdmin, navigate, currentMerchantId, fetchBranchList]);

  // Handle Merchant Selection & Sync Integration Mode Dynamically
  const handleMerchantChange = (e) => {
    const selectedMid = e.target.value;
    
    // Find selected merchant
    const selectedMerchant = merchants.find(m => String(m.id) === String(selectedMid));
    const mStatus = selectedMerchant ? (selectedMerchant.integrationStatus || selectedMerchant.IntegrationStatus || 'No') : 'No';
    
    setFormData(prev => ({
      ...prev,
      merchantId: selectedMid,
      name: '',
      code: '',
      external_branch_id: '',
      address: ''
    }));

    if (errors.merchantId) {
      setErrors(prev => ({ ...prev, merchantId: null }));
    }

    setIntegrationStatus(mStatus);

    if ((mStatus === 'Y' || mStatus === 'Yes') && !isEdit) {
      // Force fetch for the newly selected merchant
      fetchBranchList(selectedMid, true);
    } else {
      setBranchOptions([]);
      fetchedMerchantIdRef.current = null;
    }
  };

  // Handle Branch Selection from External Dropdown
  const handleBranchSelect = (e) => {
    const selectedBranchCode = e.target.value;
    const selectedBranch = branchOptions.find(b => b.Branch_Code === selectedBranchCode);
    
    if (selectedBranch) {
      setFormData(prev => ({
        ...prev,
        code: selectedBranch.Branch_Code || '',
        external_branch_id: selectedBranch.Branch_Code || '',
        name: selectedBranch.Branch_Name || '',
        address: selectedBranch.Address || '',
        source_system: 'EXTERNAL'
      }));
      if (errors.name) setErrors(prev => ({ ...prev, name: null }));
      if (errors.code) setErrors(prev => ({ ...prev, code: null }));
    }
  };

  const handleChange = async (e) => {
    let { name, value, type, checked } = e.target;

    // Strict sanitization for mobile phone: numeric only, max 10 digits
    if (name === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }

    // Strict sanitization for zipCode / pincode: numeric only, max 6 digits
    if (name === 'zipCode') {
      value = value.replace(/\D/g, '').slice(0, 6);
    }

    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      if (name === 'code') {
        updated.external_branch_id = value;
      }
      return updated;
    });

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }

    // Auto-detect State and District when a 6-digit Pincode is entered
    if (name === 'zipCode' && value && value.trim().length === 6 && /^\d{6}$/.test(value.trim())) {
      try {
        const loc = await lookupLocationByPincode(value.trim());
        if (loc && loc.state) {
          setFormData(prev => ({
            ...prev,
            state: loc.state,
            city: loc.district || loc.city || prev.city
          }));
        }
      } catch (err) {
        console.warn('Pincode auto-lookup error in AddBranch:', err);
      }
    }
  };

  const validate = () => {
    let tempErrors = {};
    if (isSoftwareAdmin && !formData.merchantId) {
      tempErrors.merchantId = "Please select the respective merchant partner first";
    }
    if (!formData.name?.trim()) tempErrors.name = "Branch Name is required";
    if (!formData.code?.trim()) tempErrors.code = "Branch Code is required";
    if (!formData.address?.trim()) tempErrors.address = "Operating Street Address is required";
    if (!formData.city?.trim()) tempErrors.city = "City / District is required";
    if (!formData.state?.trim()) tempErrors.state = "State jurisdiction is required";
    
    // Strict Zipcode validation (6 numeric digits)
    if (!formData.zipCode?.trim()) {
      tempErrors.zipCode = "Postal PIN code is required";
    } else if (formData.zipCode.trim().length !== 6 || !/^\d{6}$/.test(formData.zipCode.trim())) {
      tempErrors.zipCode = "PIN Code must be exactly 6 numeric digits";
    }

    if (!formData.country?.trim()) tempErrors.country = "Country is required";
    
    // Strict Phone Number validation (10 numeric digits starting with 6, 7, 8, or 9)
    if (!formData.phone?.trim()) {
      tempErrors.phone = "Official Phone Number is required";
    } else if (formData.phone.trim().length !== 10) {
      tempErrors.phone = "Phone number must be exactly 10 numeric digits";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      tempErrors.phone = "Invalid Indian mobile number. Must start with 6, 7, 8, or 9";
    }

    // Strict Email validation
    if (!formData.email?.trim()) {
      tempErrors.email = "Official Branch Email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email.trim())) {
      tempErrors.email = "Enter a valid email address (e.g. branch@partner.in)";
    }

    if (!formData.description?.trim()) tempErrors.description = "Operational description is required";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validate()) {
      setLoading(false);
      return;
    }

    const resolvedMid = formData.merchantId ? Number(formData.merchantId) : (currentMerchantId ? Number(currentMerchantId) : null);
    const branchCode = (formData.code || '').trim();

    const submitPayload = {
      ...formData,
      code: branchCode,
      merchantId: resolvedMid,
      external_branch_id: branchCode,
      source_system: 'EXTERNAL',
      isActive: isSoftwareAdmin ? true : false,
      isApproved: isSoftwareAdmin ? true : false,
    };

    try {
      if (isEdit) {
        await branchApi.update(id, submitPayload);
        showSuccess("Branch operational parameters updated successfully.", "Branch Updated");
      } else {
        await branchApi.create(submitPayload);
        if (!isSoftwareAdmin) {
          showSuccess('Branch registered successfully! Submitted for Software Admin review & approval.', 'Branch Registered');
        } else {
          showSuccess('Enterprise Branch provisioned and registered successfully.', 'Branch Registered');
        }
      }
      navigate('/branches');
    } catch (error) {
      console.error('Error saving branch:', error);
      showError(error?.response?.data?.message || 'Failed to save branch. Please check and verify all entries.', 'Branch Save Failed');
    } finally {
      setLoading(false);
    }
  };

  const isIntegrationActive = String(integrationStatus).toUpperCase() === 'Y' || String(integrationStatus).toUpperCase() === 'YES' || integrationStatus === true;
  const selectedMerchantObj = merchants.find(m => String(m.id) === String(formData.merchantId));

  return (
    <DashboardLayout role={rawRole}>
      <div className="add-branch">
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <span className="gradient-text">{isEdit ? 'Edit' : 'Add'} Branch</span>
            </h1>
            <p className="page-subtitle">
              {isEdit ? 'Update branch information' : 'Register a new branch location for selected merchant partner'}
            </p>
          </div>
          <button className="btn-outline" onClick={() => navigate('/branches')}>← Back</button>
        </div>

        {/* Approval Workflow Notice for Merchant */}
        {!isSoftwareAdmin && (
          <div style={{
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#facc15'
          }}>
            <span style={{ fontSize: '20px' }}>🛡️</span>
            <div>
              <strong style={{ display: 'block', fontSize: '13px', color: '#ffffff' }}>
                Software Admin Approval Required
              </strong>
              <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
                Branches created from the Merchant Portal will be submitted in <strong>Pending</strong> state and activated once approved by Software Admin.
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="branch-form">
          
          {/* STEP 1: MERCHANT SELECTION (FIRST STEP AT THE TOP) */}
          <div className="form-section" style={{ borderLeft: '4px solid #6366f1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ margin: 0 }}>Step 1: Select Merchant Partner <span style={{ color: '#ef4444' }}>*</span></h3>
              {formData.merchantId && (
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: '700',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  background: isIntegrationActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: isIntegrationActive ? '#34d399' : '#fbbf24',
                  border: isIntegrationActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  {isIntegrationActive ? '⚡ Live API Integration (Y)' : '📝 Standard Mode (N)'}
                </span>
              )}
            </div>

            <div className="form-grid">
              {isSoftwareAdmin ? (
                <div className="form-group full-width">
                  <label>Assign to Merchant Partner <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    name="merchantId"
                    value={formData.merchantId || ''}
                    onChange={handleMerchantChange}
                    className={`branch-select-dropdown ${errors.merchantId ? 'input-error' : ''}`}
                    style={errors.merchantId ? { borderColor: '#ef4444' } : {}}
                    disabled={isEdit}
                  >
                    <option value="">-- Choose Merchant to Load Configuration & Branches --</option>
                    {merchants.map((m) => {
                      const isLive = m.integrationStatus === 'Y' || m.IntegrationStatus === 'Y';
                      return (
                        <option key={m.id} value={m.id}>
                          {m.merchantName} ({m.registeredEmail || `ID: #${m.id}`}) — {isLive ? '[Dynamic API (Y)]' : '[Standard (N)]'}
                        </option>
                      );
                    })}
                  </select>
                  {errors.merchantId && (
                    <p className="error-text" style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>
                      {errors.merchantId}
                    </p>
                  )}
                </div>
              ) : (
                <div className="form-group full-width">
                  <label>Merchant Partner</label>
                  <input
                    type="text"
                    value={selectedMerchantObj?.merchantName || `Merchant #${formData.merchantId}`}
                    disabled
                    style={{ background: 'rgba(0,0,0,0.3)', color: '#94a3b8' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: DYNAMIC INTEGRATION BANNER */}
          <div className={`integration-banner ${isIntegrationActive ? 'active' : 'inactive'}`}>
            <span className="banner-icon">{isIntegrationActive ? '🔗' : '📝'}</span>
            <span className="banner-text">
              {!formData.merchantId ? (
                '👉 Please select a Merchant above to determine API integration and load branch parameters.'
              ) : isIntegrationActive ? (
                `Dynamic Integration Active for ${selectedMerchantObj?.merchantName || 'Merchant'}. Branches are automatically fetched from the external CBS API dropdown.`
              ) : (
                `Standard Mode (Integration: N) for ${selectedMerchantObj?.merchantName || 'Merchant'}. Please enter Branch Name and Branch Code manually in the text boxes.`
              )}
            </span>
            <span className="banner-status">
              Status: {isIntegrationActive ? '✅ Active API (Y)' : '❌ Standard Mode (N)'}
            </span>
            {fetchingBranches && <span className="banner-loader" style={{ marginLeft: '10px' }}>⏳ Loading branches...</span>}
          </div>

          {/* STEP 3: BRANCH DETAILS (DROPDOWN IF 'Y', TEXT BOX IF 'N') */}
          <div className="form-section">
            <h3>Step 2: Branch Information</h3>
            <div className="form-grid">
              
              {/* Branch Name Input / Dropdown */}
              <div className="form-group">
                <label>Branch Name <span style={{ color: '#ef4444' }}>*</span></label>
                {isIntegrationActive && !isEdit ? (
                  <>
                    {fetchingBranches ? (
                      <div className="loading-input">
                        <span className="spinner-small"></span> Loading branches from API...
                      </div>
                    ) : branchOptions.length > 0 ? (
                      <select
                        value={formData.code}
                        onChange={handleBranchSelect}
                        className={`branch-select-dropdown ${errors.name ? 'input-error' : ''}`}
                      >
                        <option value="">-- Select Branch from External API --</option>
                        {branchOptions.map((branch, index) => (
                          <option key={index} value={branch.Branch_Code}>
                            {branch.Branch_Name} ({branch.Branch_Code})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="no-branches-warning">
                        ⚠️ No branches returned by the external API for this merchant. You can enter branch details manually below.
                      </div>
                    )}
                  </>
                ) : (
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    placeholder="e.g. Cyber City Branch"
                    disabled={isEdit}
                    className={errors.name ? 'input-error' : ''}
                  />
                )}
                {errors.name && <p className="error-text">{errors.name}</p>}
              </div>

              {/* Branch Code Input / Auto-filled */}
              <div className="form-group">
                <label>Branch Code <span style={{ color: '#ef4444' }}>*</span></label>
                {isIntegrationActive && !isEdit ? (
                  <input
                    type="text"
                    name="code"
                    value={formData.code || ''}
                    onChange={handleChange}
                    placeholder={fetchingBranches ? "Fetching code..." : "Auto-filled from branch selection"}
                    readOnly={branchOptions.length > 0 && !!formData.code}
                    className={errors.code ? 'input-error font-mono' : 'font-mono'}
                  />
                ) : (
                  <input
                    type="text"
                    name="code"
                    value={formData.code || ''}
                    onChange={handleChange}
                    placeholder="e.g. BR-1049"
                    disabled={isEdit}
                    className={errors.code ? 'input-error font-mono' : 'font-mono'}
                  />
                )}
                {errors.code && <p className="error-text">{errors.code}</p>}
              </div>

              <div className="form-group full-width">
                <label>Operating Address <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  placeholder="Enter branch street address"
                  className={errors.address ? 'input-error' : ''}
                />
                {errors.address && <p className="error-text">{errors.address}</p>}
              </div>

              <StateDistrictSelect
                stateValue={formData.state}
                districtValue={formData.city}
                onStateChange={handleChange}
                onDistrictChange={handleChange}
                stateName="state"
                districtName="city"
                stateLabel="State *"
                districtLabel="District / City *"
                stateError={errors.state}
                districtError={errors.city}
                disabled={isEdit}
              />

              <div className="form-group">
                <label>Zip Code <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode || ''}
                  onChange={handleChange}
                  placeholder="e.g. 110001"
                  maxLength={6}
                  className={`font-mono ${errors.zipCode ? 'input-error' : ''}`}
                />
                {errors.zipCode && <p className="error-text">{errors.zipCode}</p>}
              </div>

              <div className="form-group">
                <label>Country <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  name="country"
                  value={formData.country || 'India'}
                  onChange={handleChange}
                  placeholder="Enter Country"
                  className={errors.country ? 'input-error' : ''}
                />
                {errors.country && <p className="error-text">{errors.country}</p>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Step 3: Contact Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Official Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className={`font-mono ${errors.phone ? 'input-error' : ''}`}
                />
                {errors.phone && <p className="error-text">{errors.phone}</p>}
              </div>
              <div className="form-group">
                <label>Official Branch Email <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  placeholder="branch@partner.in"
                  className={errors.email ? 'input-error' : ''}
                />
                {errors.email && <p className="error-text">{errors.email}</p>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Additional Operational Notes</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Description & Scope <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Key operating scope, terminal coverage, or special branch notes..."
                  className={errors.description ? 'input-error' : ''}
                />
                {errors.description && <p className="error-text">{errors.description}</p>}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary-gradient" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Branch' : 'Create Branch'}
            </button>
            <button type="button" className="btn-outline" onClick={() => navigate('/branches')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AddBranch;