import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import StateDistrictSelect from '../../components/common/StateDistrictSelect';
import { lookupLocationByPincode } from '../../services/locationService';
import { agentApi, merchantApi, branchApi } from '../../services/api';
import './AddAgent.css';

const AddAgent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
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

  const rawRole = localStorage.getItem('user_role') || localStorage.getItem('role') || 'softwareadmin';
  const normRole = rawRole.toLowerCase().replace(/[^a-z0-9]/g, '');
  const isBranchUser = normRole.includes('branch') || normRole.includes('bank');
  const isMerchantUser = normRole.includes('merchant');
  const isSoftwareAdmin = normRole.includes('softwareadmin') || normRole.includes('admin') || normRole.includes('superadmin');

  const authUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  })();

  const currentMerchantId = authUser?.merchantId || localStorage.getItem('merchantId') || (isMerchantUser ? authUser?.id : null);

  const [formData, setFormData] = useState({
    agentName: '',
    email: '',
    phone: '',
    agentCode: '',
    merchantId: currentMerchantId ? String(currentMerchantId) : '',
    branchId: '',
    commissionRate: '',
    isActive: isSoftwareAdmin ? true : false,
    isVerified: isSoftwareAdmin ? true : false,
    address: '',
    city: '',
    state: '',
    zipCode: '',
    description: '',
  });

  const [errors, setErrors] = useState({});

  // Single-flight fetch external agents with deduplication
  const loadExternalAgents = useCallback(async (mid = null, force = false) => {
    if (isFetchingAgentsRef.current) {
      console.log('⏳ Agent fetch already in-flight. Skipping duplicate call.');
      return;
    }

    const targetMid = mid !== null ? String(mid) : (formData.merchantId ? String(formData.merchantId) : '');
    if (!force && fetchedAgentMerchantIdRef.current === targetMid && externalAgents.length > 0) {
      console.log(`📦 Agents already loaded for merchant ${targetMid}. Skipping redundant call.`);
      return;
    }

    try {
      isFetchingAgentsRef.current = true;
      setFetchingAgents(true);
      console.log(`📡 Fetching external agents for merchant: ${targetMid || 'all'}...`);
      
      const res = await agentApi.fetchAgentList(targetMid ? { merchantId: targetMid } : undefined);
      let agents = [];
      
      if (res && typeof res === 'object') {
        if (res.data && res.data.data && res.data.data.Agentlist && Array.isArray(res.data.data.Agentlist.data)) {
          agents = res.data.data.Agentlist.data; 
        } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
          agents = res.data.data; 
        } else if (res.data && Array.isArray(res.data)) {
          agents = res.data; 
        } else if (Array.isArray(res)) {
          agents = res;
        }
      }
      
      if (agents && agents.length > 0) {
        setExternalAgents(agents);
        fetchedAgentMerchantIdRef.current = targetMid;
      } else {
        setExternalAgents([]);
        fetchedAgentMerchantIdRef.current = targetMid;
      }
    } catch (error) {
      console.error('🔴 Error in external agent API call:', error);
      setExternalAgents([]);
    } finally {
      isFetchingAgentsRef.current = false;
      setFetchingAgents(false);
    }
  }, [formData.merchantId, externalAgents.length]);

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
        alert('Field Agent registration is managed by Merchant and Software Admin portals. Branch users do not have permission to register agents.');
        navigate('/agents');
        return;
      }
      if (isEdit && !isSoftwareAdmin) {
        alert('Modification of Field Agent credentials is restricted to the Software Admin portal.');
        navigate('/agents');
        return;
      }

      try {
        setPageLoading(true);

        // 1. Load merchants and branches concurrently
        const [mRes, bRes] = await Promise.all([
          merchantApi.getAll(),
          branchApi.getAll()
        ]);

        const mList = mRes?.data?.data || mRes?.data || [];
        const safeMerchants = Array.isArray(mList) ? mList : [];
        if (isMounted) setMerchants(safeMerchants);

        const bList = bRes?.data?.data || bRes?.data || [];
        const safeBranches = Array.isArray(bList) ? bList : [];
        if (isMounted) setBranches(safeBranches);

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

            const finalMid = aData.merchantId ? String(aData.merchantId) : initialMid;
            const selectedMerchant = safeMerchants.find(m => String(m.id) === String(finalMid));
            if (selectedMerchant) {
              setIntegrationStatus(selectedMerchant.integrationStatus || selectedMerchant.IntegrationStatus || 'No');
            }
          }
        } else if (initialMid && safeMerchants.length > 0) {
          // 3. New agent with pre-selected merchant
          const selectedMerchant = safeMerchants.find(m => String(m.id) === String(initialMid));
          if (selectedMerchant && isMounted) {
            const status = selectedMerchant.integrationStatus || selectedMerchant.IntegrationStatus || 'No';
            setIntegrationStatus(status);
            if (status === 'Y' || status === 'Yes') {
              loadExternalAgents(initialMid, false);
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
  }, [id, isEdit, isSoftwareAdmin, isBranchUser, navigate, currentMerchantId, loadExternalAgents]);

  // Handle Merchant Selection & Sync Integration Status Dynamically
  const handleMerchantChange = (e) => {
    const selectedMid = e.target.value;
    
    // Find selected merchant in list
    const selectedMerchant = merchants.find(m => String(m.id) === String(selectedMid));
    const mStatus = selectedMerchant ? (selectedMerchant.integrationStatus || selectedMerchant.IntegrationStatus || 'No') : 'No';
    
    setFormData(prev => ({
      ...prev,
      merchantId: selectedMid,
      agentName: '',
      agentCode: '',
      branchId: '',
      email: '',
      phone: ''
    }));
    setSelectedAgentId('');

    if (errors.merchantId) {
      setErrors(prev => ({ ...prev, merchantId: null }));
    }

    setIntegrationStatus(mStatus);

    if ((mStatus === 'Y' || mStatus === 'Yes') && !isEdit) {
      // Force fetch for the newly selected merchant
      loadExternalAgents(selectedMid, true);
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
      const bCode = String(selectedAgent.BRANCH_CODE || selectedAgent.branchCode || selectedAgent.branchId || '').trim();

      // Match branch by external_branch_id, code, ID, or name
      const matchedBranch = branches.find(b => 
        (b.external_branch_id && String(b.external_branch_id).trim() === bCode) ||
        (b.code && String(b.code).trim() === bCode) ||
        String(b.id) === bCode ||
        (b.name && String(b.name).trim().toLowerCase() === bCode.toLowerCase())
      ) || (filteredBranches.length === 1 ? filteredBranches[0] : null);

      setFormData(prev => ({
        ...prev,
        agentName: aName,
        agentCode: aCode,
        branchId: matchedBranch ? String(matchedBranch.id) : (prev.branchId || (filteredBranches.length === 1 ? String(filteredBranches[0].id) : '')),
        phone: selectedAgent.phone || selectedAgent.Phone || prev.phone,
        email: selectedAgent.email || selectedAgent.Email || prev.email,
      }));

      if (errors.agentName) setErrors(prev => ({ ...prev, agentName: null }));
      if (errors.agentCode) setErrors(prev => ({ ...prev, agentCode: null }));
      if (matchedBranch && errors.branchId) setErrors(prev => ({ ...prev, branchId: null }));
    }
  };

  const handleChange = async (e) => {
    const { name, value, type, checked } = e.target;
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
    if (!formData.agentName) tempErrors.agentName = "Agent name is required";
    if (!formData.email) tempErrors.email = "Email is required";
    if (!formData.phone) tempErrors.phone = "Phone is required";
    if (!formData.agentCode) tempErrors.agentCode = "Agent Code is required";
    if (!formData.branchId) tempErrors.branchId = "Branch assignment is required";
    if (!formData.commissionRate) tempErrors.commissionRate = "Commission rate is required";
    if (!formData.address) tempErrors.address = "Address is required";
    if (!formData.city) tempErrors.city = "City is required";
    if (!formData.state) tempErrors.state = "State is required";
    if (!formData.zipCode) tempErrors.zipCode = "Zip code is required";
    if (!formData.description) tempErrors.description = "Description is required";

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
      } else {
        await agentApi.create(submitData);
      }
      if (!isSoftwareAdmin) {
        alert('✅ Agent registered successfully! Submitted for Software Admin review & approval.');
      }
      navigate('/agents');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save agent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isIntegrationActive = integrationStatus === 'Y' || integrationStatus === 'Yes';
  const showExternalDropdown = isIntegrationActive && !isEdit && externalAgents.length > 0;
  const selectedMerchantObj = merchants.find(m => String(m.id) === String(formData.merchantId));

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
              {isEdit ? 'Update agent information' : 'Register a new field agent for selected merchant partner'}
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
          
          {/* STEP 1: MERCHANT SELECTION (FIRST STEP AT THE TOP) */}
          <div className="form-section" style={{ borderLeft: '4px solid #06b6d4' }}>
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
                    <option value="">-- Choose Merchant to Load Configuration & Agents --</option>
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
                '👉 Please select a Merchant above to determine API integration and load agent roster.'
              ) : isIntegrationActive ? (
                `Dynamic Integration Active for ${selectedMerchantObj?.merchantName || 'Merchant'}. ${externalAgents.length > 0 ? `✅ Loaded ${externalAgents.length} agents from external API!` : 'Loading agents from external CBS API...'}`
              ) : (
                `Standard Mode (Integration: N) for ${selectedMerchantObj?.merchantName || 'Merchant'}. Please enter Agent Name and Agent Code manually in text boxes.`
              )}
            </span>
            <span className="banner-status">
              Status: {isIntegrationActive ? '✅ Active API (Y)' : '❌ Standard Mode (N)'}
            </span>
            {fetchingAgents && <span className="banner-loader">⏳ Loading...</span>}
          </div>

          {/* STEP 3: AGENT PERSONAL INFORMATION (DROPDOWN IF 'Y', TEXT BOX IF 'N') */}
          <div className="form-section">
            <h3>Step 2: Agent Identification & Personal Details</h3>
            <div className="form-grid">
              
              {/* Agent Name Input / Dropdown */}
              <div className="form-group">
                <label>Agent Name <span style={{ color: '#ef4444' }}>*</span></label>
                {showExternalDropdown ? (
                  <select
                    name="agentName"
                    value={selectedAgentId}
                    onChange={handleExternalAgentSelect}
                    className={`branch-select-dropdown ${errors.agentName ? 'input-error' : ''}`}
                  >
                    <option value="">-- Select Agent from External API --</option>
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
                ) : isIntegrationActive && fetchingAgents ? (
                  <div className="loading-input">
                    <span className="spinner-small"></span> Loading external agents...
                  </div>
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
                    placeholder={fetchingAgents ? "Fetching agent code..." : "Auto-filled from agent selection"}
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
            </div>
          </div>

          {/* STEP 4: ASSIGNMENT & COMMISSION */}
          <div className="form-section">
            <h3>Step 3: Branch Assignment & Commission</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Assign to Branch <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  name="branchId"
                  value={formData.branchId || ''}
                  onChange={handleChange}
                  className={errors.branchId ? 'input-error' : ''}
                >
                  <option value="">-- Choose Branch for this Merchant --</option>
                  {Array.isArray(filteredBranches) && filteredBranches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.code || `ID: #${branch.id}`})
                    </option>
                  ))}
                </select>
                {errors.branchId && <p className="error-text">{errors.branchId}</p>}
              </div>

              <div className="form-group">
                <label>Commission Rate (%) <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="number"
                  name="commissionRate"
                  value={formData.commissionRate || ''}
                  onChange={handleChange}
                  placeholder="e.g. 2.5"
                  step="0.1"
                  min="0"
                  max="100"
                  className={`font-mono ${errors.commissionRate ? 'input-error' : ''}`}
                />
                {errors.commissionRate && <p className="error-text">{errors.commissionRate}</p>}
              </div>
            </div>
          </div>

          {/* STEP 5: ADDRESS & LOCATION */}
          <div className="form-section">
            <h3>Step 4: Agent Residential / Operating Address</h3>
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

          {/* STEP 6: ADDITIONAL INFORMATION */}
          <div className="form-section">
            <h3>Additional Information</h3>
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