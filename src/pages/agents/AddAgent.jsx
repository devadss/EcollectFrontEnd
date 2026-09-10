import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import StateDistrictSelect from '../../components/common/StateDistrictSelect';
import { lookupLocationByPincode } from '../../services/locationService';
import { agentApi, merchantApi, branchApi } from '../../services/api';
import { useDialog } from '../../context/DialogContext';
import './AddAgent.css';

const AddAgent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { showSuccess, showError, showWarning } = useDialog();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [merchants, setMerchants] = useState([]);
  const [branches, setBranches] = useState([]);
  const [integrationStatus, setIntegrationStatus] = useState('No');
  const [externalAgents, setExternalAgents] = useState([]);
  const [fetchingAgents, setFetchingAgents] = useState(false);
  
  // Guard refs to prevent duplicate/concurrent API requests
  const isFetchingAgentsRef = useRef(false);
  const fetchedAgentMerchantIdRef = useRef(null);

  // Selected ID for external dropdown
  const [selectedAgentId, setSelectedAgentId] = useState('');

  const authUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  })();

  const rawRole = (localStorage.getItem('user_role') || localStorage.getItem('role') || authUser?.role || '').toLowerCase().trim();
  const normRole = rawRole.replace(/[^a-z0-9]/g, '');
  const isBranchUser = normRole.includes('branch') && !normRole.includes('merchant');
  const isMerchantUser = normRole.includes('merchant');
  const isSoftwareAdmin = (normRole.includes('software') || normRole.includes('superadmin') || normRole === 'admin') && !normRole.includes('merchant') && !normRole.includes('branch') && !normRole.includes('agent');

  const currentMerchantId = authUser?.merchantId || authUser?.MerchantId || localStorage.getItem('merchantId') || (isMerchantUser ? (authUser?.merchantId || authUser?.MerchantId || authUser?.id) : null);

  const [formData, setFormData] = useState({
    agentName: '',
    email: '',
    phone: '',
    agentCode: '',
    merchantId: currentMerchantId ? String(currentMerchantId) : '',
    branchId: '',
    commissionRate: '0',
    isActive: isSoftwareAdmin ? true : false,
    isVerified: isSoftwareAdmin ? true : false,
    address: '',
    city: '',
    state: '',
    zipCode: '',
    description: '',
  });

  const [errors, setErrors] = useState({});

  // Refs to prevent infinite render loops in useCallback / useEffect
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  const branchesRef = useRef(branches);
  branchesRef.current = branches;

  const externalAgentsRef = useRef(externalAgents);
  externalAgentsRef.current = externalAgents;

  // Single-flight fetch external agents with deduplication and branch code support
  const loadExternalAgents = useCallback(async (mid = null, force = false, bCode = null) => {
    if (isFetchingAgentsRef.current) {
      console.log('⏳ Agent fetch already in-flight. Skipping duplicate call.');
      return;
    }

    const currentForm = formDataRef.current;
    const currentBranches = branchesRef.current;
    const currentExternalAgents = externalAgentsRef.current;

    const targetMid = mid !== null ? String(mid) : (currentForm.merchantId ? String(currentForm.merchantId) : '');
    const currentBranch = currentBranches.find(b => String(b.id) === String(currentForm.branchId));
    const targetBranchCode = bCode || currentBranch?.code || currentBranch?.external_branch_id || '01';

    const cacheKey = `${targetMid}_${targetBranchCode}`;
    if (!force && fetchedAgentMerchantIdRef.current === cacheKey && currentExternalAgents.length > 0) {
      console.log(`📦 Agents already loaded for ${cacheKey}. Skipping redundant call.`);
      return;
    }

    try {
      isFetchingAgentsRef.current = true;
      setFetchingAgents(true);
      console.log(`📡 Fetching external agents for merchant: ${targetMid || 'all'}, branchCode: ${targetBranchCode}...`);
      
      const queryParams = {
        brcode: targetBranchCode,
        branch_code: targetBranchCode,
        branchCode: targetBranchCode,
        ...(targetMid ? { merchantId: targetMid } : {})
      };

      const res = await agentApi.fetchAgentList(queryParams);
      let agents = [];
      
      if (res && typeof res === 'object') {
        if (res.data && res.data.data && res.data.data.Agentlist && Array.isArray(res.data.data.Agentlist.data)) {
          agents = res.data.data.Agentlist.data; 
        } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
          agents = res.data.data; 
        } else if (res.data && res.data.Agentlist && Array.isArray(res.data.Agentlist.data)) {
          agents = res.data.Agentlist.data;
        } else if (res.data && Array.isArray(res.data)) {
          agents = res.data; 
        } else if (Array.isArray(res)) {
          agents = res;
        }
      }
      
      if (agents && agents.length > 0) {
        setExternalAgents(agents);
        fetchedAgentMerchantIdRef.current = cacheKey;
      } else {
        setExternalAgents([]);
        fetchedAgentMerchantIdRef.current = cacheKey;
      }
    } catch (error) {
      console.error('🔴 Error in external agent API call:', error);
      setExternalAgents([]);
    } finally {
      isFetchingAgentsRef.current = false;
      setFetchingAgents(false);
    }
  }, []);

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

      if (isBranchUser) {
        showWarning('Field Agent registration is managed by Merchant and Software Admin portals. Branch users do not have permission to register agents.', 'Permission Denied');
        navigate('/agents');
        return;
      }
      if (isEdit && !isSoftwareAdmin) {
        showWarning('Modification of Field Agent credentials is restricted to the Software Admin portal.', 'Access Restricted');
        navigate('/agents');
        return;
      }

      try {
        setPageLoading(true);

        const targetMid = initialMid;
        let safeMerchants = [];
        let safeBranches = [];

        if (isSoftwareAdmin) {
          // Software admin loads all merchants and all branches
          const [mRes, bRes] = await Promise.all([
            merchantApi.getAll().catch(() => ({ data: [] })),
            branchApi.getAll().catch(() => ({ data: [] }))
          ]);
          const mList = mRes?.data?.data || mRes?.data || [];
          safeMerchants = Array.isArray(mList) ? mList : [];
          const bList = bRes?.data?.data || bRes?.data || [];
          safeBranches = Array.isArray(bList) ? bList : [];
        } else if (targetMid) {
          // Merchant user loads only their own merchant & branches
          const [mRes, bRes] = await Promise.all([
            merchantApi.getById(targetMid).catch(() => ({ data: null })),
            branchApi.getAll({ merchantId: targetMid }).catch(() => ({ data: [] }))
          ]);
          const mData = mRes?.data?.data || mRes?.data;
          if (mData) safeMerchants = [mData];
          const bList = bRes?.data?.data || bRes?.data || [];
          const allB = Array.isArray(bList) ? bList : [];
          safeBranches = allB.filter(b => {
            const mId = b.merchantId ?? b.MerchantId;
            return mId == null || String(mId) === String(targetMid);
          });
        }

        if (isMounted) {
          setMerchants(safeMerchants);
          setBranches(safeBranches);
        }

        // 2. If editing, load agent
        if (isEdit) {
          const aRes = await agentApi.getById(id);
          const aData = aRes?.data || {};
          if (isMounted) {
            setFormData({
              agentName: aData.name || aData.agentName || '',
              email: aData.email || '',
              phone: aData.phone || '',
              agentCode: aData.agentCode || '',
              merchantId: aData.merchantId ? String(aData.merchantId) : '',
              branchId: aData.branchId ? String(aData.branchId) : '',
              commissionRate: aData.commissionRate || '',
              isActive: aData.isActive !== undefined ? aData.isActive : true,
              address: aData.address || '',
              city: aData.city || '',
              state: aData.state || '',
              zipCode: aData.zipCode || '',
              description: aData.description || '',
            });

            const finalMid = aData.merchantId ? String(aData.merchantId) : targetMid;
            const selectedMerchant = safeMerchants.find(m => String(m.id) === String(finalMid));
            if (selectedMerchant) {
              setIntegrationStatus(selectedMerchant.integrationStatus || selectedMerchant.IntegrationStatus || 'No');
            }
          }
        } else if (targetMid && isMounted) {
          // 3. New agent with pre-selected merchant
          let selectedMerchant = safeMerchants.find(m => String(m.id) === String(targetMid));
          if (!selectedMerchant && targetMid) {
            try {
              const sRes = await merchantApi.getById(targetMid);
              selectedMerchant = sRes?.data?.data || sRes?.data;
            } catch (e) {
              console.warn('Could not load merchant:', e);
            }
          }
          if (selectedMerchant && isMounted) {
            const status = selectedMerchant.integrationStatus || selectedMerchant.IntegrationStatus || 'No';
            setIntegrationStatus(status);
            const isLive = String(status).toUpperCase() === 'Y' || String(status).toUpperCase() === 'YES' || status === true;
            if (isLive) {
              loadExternalAgents(targetMid, true);
            }
          }
        }
      } catch (err) {
        console.warn('Initialization error in AddAgent:', err);
      } finally {
        if (isMounted) setPageLoading(false);
      }
    };

    initPage();

    return () => {
      isMounted = false;
    };
  }, [id, isEdit, isSoftwareAdmin, isBranchUser, currentMerchantId]);

  // Handle Merchant Selection & Sync Integration Status Dynamically
  const handleMerchantChange = (e) => {
    const selectedMid = e.target.value;
    
    // Find selected merchant in list
    const selectedMerchant = merchants.find(m => String(m.id) === String(selectedMid));
    const mStatus = selectedMerchant ? (selectedMerchant.integrationStatus || selectedMerchant.IntegrationStatus || 'No') : 'No';
    
    setFormData(prev => ({
      ...prev,
      merchantId: selectedMid,
      branchId: '',
      agentName: '',
      agentCode: '',
      email: '',
      phone: ''
    }));
    setSelectedAgentId('');
    setExternalAgents([]);
    fetchedAgentMerchantIdRef.current = null;

    if (errors.merchantId) {
      setErrors(prev => ({ ...prev, merchantId: null }));
    }

    setIntegrationStatus(mStatus);
  };

  // Handle Branch Selection & Trigger External Agent Fetch for this specific branch
  const handleBranchChange = (e) => {
    const selectedBid = e.target.value;
    
    setFormData(prev => ({
      ...prev,
      branchId: selectedBid,
      agentName: '',
      agentCode: '',
      selectedAgentId: '',
      email: '',
      phone: ''
    }));
    setSelectedAgentId('');

    if (errors.branchId) {
      setErrors(prev => ({ ...prev, branchId: null }));
    }

    if (selectedBid && (integrationStatus === 'Y' || integrationStatus === 'Yes') && !isEdit) {
      const selectedB = branches.find(b => String(b.id) === String(selectedBid));
      const bCode = selectedB?.code || selectedB?.external_branch_id || '01';
      loadExternalAgents(formData.merchantId, true, bCode);
    } else {
      setExternalAgents([]);
      fetchedAgentMerchantIdRef.current = null;
    }
  };

  // Handle Selection of an External Agent from Dropdown
  const handleExternalAgentSelect = (e) => {
    const selectedId = e.target.value;
    setSelectedAgentId(selectedId);

    const selectedAgent = externalAgents.find(a => 
      String(a.Agent_ID || a.agentId || a.id) === String(selectedId)
    );
    
    if (selectedAgent) {
      const aName = selectedAgent.Agent_NAME || selectedAgent.agentName || selectedAgent.name || '';
      const aCode = selectedAgent.Agent_ID || selectedAgent.agentId || selectedAgent.id || '';

      setFormData(prev => ({
        ...prev,
        agentName: aName,
        agentCode: aCode,
        phone: selectedAgent.phone || selectedAgent.Phone || prev.phone,
        email: selectedAgent.email || selectedAgent.Email || prev.email,
      }));

      if (errors.agentName) setErrors(prev => ({ ...prev, agentName: null }));
      if (errors.agentCode) setErrors(prev => ({ ...prev, agentCode: null }));
    }
  };

  const handleChange = async (e) => {
    let { name, value, type, checked } = e.target;

    // Strict sanitization for mobile phone: numeric only, max 10 digits
    if (name === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }

    // Strict sanitization for zipCode: numeric only, max 6 digits
    if (name === 'zipCode') {
      value = value.replace(/\D/g, '').slice(0, 6);
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

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
        console.warn('Pincode auto-lookup error in AddAgent:', err);
      }
    }
  };

  const validate = () => {
    let tempErrors = {};
    if (isSoftwareAdmin && !formData.merchantId) tempErrors.merchantId = "Please select the respective merchant partner first";
    if (!formData.branchId) tempErrors.branchId = "Branch assignment is required";
    if (!formData.agentName?.trim()) tempErrors.agentName = "Agent Full Name is required";
    
    // Strict Email Validation
    if (!formData.email?.trim()) {
      tempErrors.email = "Official Email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email.trim())) {
      tempErrors.email = "Enter a valid email address (e.g. agent@partner.in)";
    }

    // Strict Phone Number Validation (10 numeric digits starting with 6, 7, 8, or 9)
    if (!formData.phone?.trim()) {
      tempErrors.phone = "Registered Mobile Number is required";
    } else if (formData.phone.trim().length !== 10) {
      tempErrors.phone = "Mobile number must be exactly 10 numeric digits";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      tempErrors.phone = "Invalid Indian mobile number. Must start with 6, 7, 8, or 9";
    }

    if (!formData.agentCode?.trim()) tempErrors.agentCode = "Agent Identification Code is required";
    if (!formData.address?.trim()) tempErrors.address = "Residential / Operational Address is required";
    if (!formData.city?.trim()) tempErrors.city = "City / District is required";
    if (!formData.state?.trim()) tempErrors.state = "State jurisdiction is required";
    
    // Strict Zipcode Validation (6 numeric digits)
    if (!formData.zipCode?.trim()) {
      tempErrors.zipCode = "Postal PIN code is required";
    } else if (formData.zipCode.trim().length !== 6 || !/^\d{6}$/.test(formData.zipCode.trim())) {
      tempErrors.zipCode = "PIN Code must be exactly 6 numeric digits";
    }

    if (!formData.description?.trim()) tempErrors.description = "KYC & operational description is required";

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
    const resolvedBid = formData.branchId ? Number(formData.branchId) : null;

    const submitData = {
      ...formData,
      name: formData.agentName,
      merchantId: resolvedMid,
      branchId: resolvedBid,
      external_agent_id: (formData.agentCode || '').trim(),
      source_system: 'EXTERNAL',
      isVerified: isSoftwareAdmin ? true : false,
      isApproved: isSoftwareAdmin ? true : false,
    };
    delete submitData.agentName;

    try {
      if (isEdit) {
        await agentApi.update(id, submitData);
        showSuccess("Agent credentials and operational parameters updated successfully.", "Agent Updated");
      } else {
        await agentApi.create(submitData);
        if (!isSoftwareAdmin) {
          showSuccess('Field Representative registered successfully! Submitted for Software Admin review & approval.', 'Agent Registered');
        } else {
          showSuccess('Field Representative registered and provisioned successfully.', 'Agent Registered');
        }
      }
      navigate('/agents');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save agent. Please verify all required entries.', 'Agent Save Failed');
    } finally {
      setLoading(false);
    }
  };

  const isIntegrationActive = integrationStatus === 'Y' || integrationStatus === 'Yes';
  const showExternalDropdown = isIntegrationActive && !isEdit && formData.branchId && externalAgents.length > 0;
  const selectedMerchantObj = merchants.find(m => String(m.id) === String(formData.merchantId));
  const selectedBranchObj = branches.find(b => String(b.id) === String(formData.branchId));

  // Filter branches belonging to the chosen merchant
  const filteredBranches = formData.merchantId
    ? branches.filter(b => !b.merchantId || String(b.merchantId) === String(formData.merchantId))
    : branches;

  if (pageLoading) {
    return (
      <DashboardLayout role={rawRole}>
        <LoadingAnimation message={isEdit ? 'Loading Field Agent Data...' : 'Initializing Registration Form...'} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={rawRole}>
      <div className="add-agent">
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <span className="gradient-text">{isEdit ? 'Edit' : 'Add'} Agent</span>
            </h1>
            <p className="page-subtitle">
              {isEdit ? 'Update agent information' : 'Register a new field agent for selected partner and branch'}
            </p>
          </div>
          <button className="btn-outline" onClick={() => navigate('/agents')}>← Back</button>
        </div>

        {/* Approval Workflow Notice for Branch/Merchant */}
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
                Agents created from the {isBranchUser ? 'Branch' : 'Merchant'} Portal will be submitted in <strong>Pending</strong> state and activated once verified by Software Admin.
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="agent-form">
          
          {/* STEP 1: MERCHANT & BRANCH SELECTION (SELECT BRANCH FIRST) */}
          <div className="form-section" style={{ borderLeft: '4px solid #06b6d4' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ margin: 0 }}>Step 1: Partner & Branch Assignment <span style={{ color: '#ef4444' }}>*</span></h3>
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
              {/* Merchant Partner Selection */}
              {isSoftwareAdmin ? (
                <div className="form-group">
                  <label>Merchant Partner <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    name="merchantId"
                    value={formData.merchantId || ''}
                    onChange={handleMerchantChange}
                    className={`branch-select-dropdown ${errors.merchantId ? 'input-error' : ''}`}
                    style={errors.merchantId ? { borderColor: '#ef4444' } : {}}
                    disabled={isEdit}
                  >
                    <option value="">-- Choose Merchant Partner --</option>
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
                <div className="form-group">
                  <label>Merchant Partner</label>
                  <input
                    type="text"
                    value={selectedMerchantObj?.merchantName || `Merchant #${formData.merchantId}`}
                    disabled
                    style={{ background: 'rgba(0,0,0,0.3)', color: '#94a3b8' }}
                  />
                </div>
              )}

              {/* Branch Selection (Right next to Merchant) */}
              <div className="form-group">
                <label>Assign to Branch <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  name="branchId"
                  value={formData.branchId || ''}
                  onChange={handleBranchChange}
                  className={`branch-select-dropdown ${errors.branchId ? 'input-error' : ''}`}
                  disabled={isEdit || (isSoftwareAdmin && !formData.merchantId)}
                >
                  <option value="">
                    {isSoftwareAdmin && !formData.merchantId 
                      ? '-- Select Merchant First --' 
                      : '-- Choose Branch --'}
                  </option>
                  {Array.isArray(filteredBranches) && filteredBranches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.code || `ID: #${branch.id}`})
                    </option>
                  ))}
                </select>
                {errors.branchId && <p className="error-text">{errors.branchId}</p>}
              </div>
            </div>
          </div>

          {/* STEP 2: DYNAMIC INTEGRATION BANNER */}
          <div className={`integration-banner ${isIntegrationActive ? 'active' : 'inactive'}`}>
            <span className="banner-icon">{isIntegrationActive ? '🔗' : '📝'}</span>
            <span className="banner-text">
              {!formData.merchantId ? (
                '👉 Please select a Merchant Partner above.'
              ) : !formData.branchId ? (
                '👉 Please select a Branch above to load external agent roster from Core Banking API.'
              ) : isIntegrationActive ? (
                fetchingAgents ? (
                  `⏳ Fetching agent list from CBS for branch "${selectedBranchObj?.name || formData.branchId}"...`
                ) : externalAgents.length > 0 ? (
                  `✅ Live API Active: Loaded ${externalAgents.length} agents for branch "${selectedBranchObj?.name || formData.branchId}" (Code: ${selectedBranchObj?.code || '01'})`
                ) : (
                  `ℹ️ No external agents returned from CBS for branch "${selectedBranchObj?.name || formData.branchId}". You may enter agent details manually below.`
                )
              ) : (
                `Standard Mode (Integration: N) for ${selectedMerchantObj?.merchantName || 'Merchant'}. Please enter Agent Name and Agent Code manually.`
              )}
            </span>
            <span className="banner-status">
              Status: {isIntegrationActive ? '✅ Active API (Y)' : '❌ Standard Mode (N)'}
            </span>
            {fetchingAgents && <span className="banner-loader">⏳ Loading...</span>}
          </div>

          {/* STEP 3: AGENT PERSONAL INFORMATION (DROPDOWN SHOWN ONLY AFTER BRANCH IS CHOSEN) */}
          <div className="form-section">
            <h3>Step 2: Agent Identification & Personal Details</h3>
            <div className="form-grid">
              
              {/* Agent Name Input / Dropdown */}
              <div className="form-group">
                <label>Agent Name <span style={{ color: '#ef4444' }}>*</span></label>
                {isIntegrationActive && !isEdit ? (
                  !formData.branchId ? (
                    <select disabled className="branch-select-dropdown" style={{ background: 'rgba(255,255,255,0.03)', color: '#64748b' }}>
                      <option>-- Select a Branch in Step 1 first to view agents --</option>
                    </select>
                  ) : fetchingAgents ? (
                    <div className="loading-input">
                      <span className="spinner-small"></span> Loading agents for selected branch...
                    </div>
                  ) : externalAgents.length > 0 ? (
                    <select
                      name="agentName"
                      value={selectedAgentId}
                      onChange={handleExternalAgentSelect}
                      className={`branch-select-dropdown ${errors.agentName ? 'input-error' : ''}`}
                    >
                      <option value="">-- Select Agent from External API ({externalAgents.length} available) --</option>
                      {externalAgents.map((agent, index) => {
                        const idVal = agent.Agent_ID || agent.agentId || agent.id;
                        const nameVal = agent.Agent_NAME || agent.agentName || agent.name;
                        return (
                          <option key={index} value={idVal}>
                            {nameVal} (Code: {idVal})
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="agentName"
                      value={formData.agentName || ''}
                      onChange={handleChange}
                      placeholder="Enter agent name manually (e.g. Rahul Sharma)"
                      className={errors.agentName ? 'input-error' : ''}
                    />
                  )
                ) : (
                  <input
                    type="text"
                    name="agentName"
                    value={formData.agentName || ''}
                    onChange={handleChange}
                    placeholder="e.g. Rahul Sharma"
                    disabled={isEdit}
                    className={errors.agentName ? 'input-error' : ''}
                  />
                )}
                {errors.agentName && <p className="error-text">{errors.agentName}</p>}
              </div>

              {/* Agent Code Input / Auto-filled */}
              <div className="form-group">
                <label>Agent Code <span style={{ color: '#ef4444' }}>*</span></label>
                {isIntegrationActive && !isEdit ? (
                  <input
                    type="text"
                    name="agentCode"
                    value={formData.agentCode || ''}
                    onChange={handleChange}
                    placeholder={fetchingAgents ? "Fetching agent code..." : (!formData.branchId ? "Select branch first" : "Auto-filled from agent selection")}
                    readOnly={showExternalDropdown && !!formData.agentCode}
                    className={errors.agentCode ? 'input-error font-mono' : 'font-mono'}
                  />
                ) : (
                  <input
                    type="text"
                    name="agentCode"
                    value={formData.agentCode || ''}
                    onChange={handleChange}
                    placeholder="e.g. AG-2041"
                    disabled={isEdit}
                    className={errors.agentCode ? 'input-error font-mono' : 'font-mono'}
                  />
                )}
                {errors.agentCode && <p className="error-text">{errors.agentCode}</p>}
              </div>
                
              <div className="form-group">
                <label>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  placeholder="agent@partner.in"
                  className={errors.email ? 'input-error' : ''}
                />
                {errors.email && <p className="error-text">{errors.email}</p>}
              </div>

              <div className="form-group">
                <label>Mobile Number <span style={{ color: '#ef4444' }}>*</span></label>
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

              {/* Commission Rate */}
              <div className="form-group full-width">
                <label>Commission Rate (%)</label>
                <input
                  type="text"
                  name="commissionRate"
                  value="0"
                  readOnly
                  disabled
                  className="font-mono"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: '#94a3b8',
                    cursor: 'not-allowed',
                    borderColor: 'rgba(255, 255, 255, 0.08)'
                  }}
                />
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  🔒 Default fixed at 0.00% (Read-Only)
                </span>
              </div>
            </div>
          </div>

          {/* STEP 4: ADDRESS & LOCATION */}
          <div className="form-section">
            <h3>Step 3: Agent Residential / Operating Address</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Street Address <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  placeholder="Enter full street address"
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
                disabled={isEdit && !isSoftwareAdmin}
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
            </div>
          </div>

          {/* STEP 5: ADDITIONAL INFORMATION */}
          <div className="form-section">
            <h3>Step 4: Additional Information & KYC Notes</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Description & KYC Notes <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Agent background, assigned territory, or operational notes..."
                  className={errors.description ? 'input-error' : ''}
                />
                {errors.description && <p className="error-text">{errors.description}</p>}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  {isEdit ? 'Updating Agent...' : 'Creating Agent...'}
                </>
              ) : (
                isEdit ? 'Update Agent' : 'Create Agent'
              )}
            </button>
            <button 
              type="button" 
              className="btn-outline" 
              onClick={() => navigate('/agents')}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AddAgent;