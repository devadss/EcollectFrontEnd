// import React, { useState, useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import DashboardLayout from '../../components/layouts/DashboardLayout';
// import LoadingAnimation from '../../components/common/LoadingAnimation';
// import { agentApi, merchantApi, branchApi } from '../../services/api';
// import './AddAgent.css';

// const AddAgent = () => {
//   const navigate = useNavigate();
//   const { id } = useParams();
//   const isEdit = !!id;
//   const [loading, setLoading] = useState(false);
//   const [pageLoading, setPageLoading] = useState(true);
//   const [merchants, setMerchants] = useState([]);
//   const [branches, setBranches] = useState([]);
//   const [integrationStatus, setIntegrationStatus] = useState('No');
//   const [externalAgents, setExternalAgents] = useState([]);
//   const [fetchingAgents, setFetchingAgents] = useState(false);
//   const [formData, setFormData] = useState({
//     agentName: '',
//     email: '',
//     phone: '',
//     agentCode: '',
//     merchantId: '',
//     branchId: '',
//     commissionRate: '',
//     isActive: true,
//     address: '',
//     city: '',
//     state: '',
//     zipCode: '',
//     description: '',
//   });

//   useEffect(() => {
//     const status = localStorage.getItem('integrationStatus') || 'No';
//     console.log('🟢 [DEBUG] Integration Status from localStorage:', status);
//     setIntegrationStatus(status);
//     loadData();
//   }, [id]);

//   const loadData = async () => {
//     try {
//       setPageLoading(true);
//       await loadMerchants();
//       await loadBranches();
      
//       // If integration is active, load external agents
//       const status = localStorage.getItem('integrationStatus') || 'No';
//       if ((status === 'Y' || status === 'Yes') && !isEdit) {
//         console.log('🟢 [DEBUG] Integration is Active. Calling loadExternalAgents...');
//         await loadExternalAgents();
//       } else {
//         console.log('🟡 [DEBUG] Integration is NOT active or is Edit mode. Skipping external agent fetch.');
//       }
      
//       if (isEdit) {
//         await loadAgent();
//       }
//     } catch (error) {
//       console.error('🔴 [ERROR] Error loading page data:', error);
//     } finally {
//       setTimeout(() => {
//         setPageLoading(false);
//       }, 500);
//     }
//   };

//   const loadMerchants = async () => {
//     try {
//       const res = await merchantApi.getAll();
//       setMerchants(res.data.data || []);
//     } catch (error) {
//       console.error('🔴 [ERROR] Error loading merchants:', error);
//       setMerchants([]);
//     }
//   };

//   const loadBranches = async () => {
//     try {
//       const res = await branchApi.getAll();
//       setBranches(res.data.data || []);
//     } catch (error) {
//       console.error('🔴 [ERROR] Error loading branches:', error);
//       setBranches([]);
//     }
//   };

//   const loadAgent = async () => {
//     try {
//       const res = await agentApi.getById(id);
//       const data = res.data;
//       setFormData({
//         agentName: data.name || data.agentName || '',
//         email: data.email || '',
//         phone: data.phone || '',
//         agentCode: data.agentCode || '',
//         merchantId: data.merchantId || '',
//         branchId: data.branchId || '',
//         commissionRate: data.commissionRate || '',
//         isActive: data.isActive !== undefined ? data.isActive : true,
//         address: data.address || '',
//         city: data.city || '',
//         state: data.state || '',
//         zipCode: data.zipCode || '',
//         description: data.description || '',
//       });
//     } catch (error) {
//       console.error('🔴 [ERROR] Error loading agent:', error);
//     }
//   };

//   // --- FINAL FIX: CORRECT PATH TO AGENTS ---
//   const loadExternalAgents = async () => {
//     try {
//       setFetchingAgents(true);
//       console.log('📡 1. STARTED Fetching external agents...');
      
//       const res = await agentApi.fetchAgentList();
      
//       console.log('📡 2. FULL RAW RESPONSE:', res);
      
//       // Force-stop the loading state immediately after getting data
//       setFetchingAgents(false); 

//       let agents = [];
      
//       // EXACT PATH FINDER BASED ON YOUR SCREENSHOT
//       if (res && typeof res === 'object') {
          
//           // YOUR EXACT BACKEND STRUCTURE: data -> data -> Agentlist -> data
//           if (res.data && res.data.data && res.data.data.Agentlist && Array.isArray(res.data.data.Agentlist.data)) {
//               agents = res.data.data.Agentlist.data; 
//               console.log(`✅ FOUND 1! Using res.data.data.Agentlist.data (${agents.length} agents)`);
//           } 
//           // PATH 2: Axios Wrapper -> C# Wrapper -> Array (Standard)
//           else if (res.data && res.data.data && Array.isArray(res.data.data)) {
//               agents = res.data.data; 
//               console.log(`✅ FOUND 2! Using res.data.data (${agents.length} agents)`);
//           } 
//           // PATH 3: Axios Wrapper -> Array
//           else if (res.data && Array.isArray(res.data)) {
//               agents = res.data;
//               console.log(`✅ FOUND 3! Using res.data (${agents.length} agents)`);
//           }
//           // PATH 4: Raw Array
//           else if (Array.isArray(res)) {
//               agents = res;
//               console.log(`✅ FOUND 4! Using raw res array (${agents.length} agents)`);
//           }
//           else {
//               console.error('❌ FAILED: Could not find array in response.', res);
//           }
//       }
      
//       if (agents && agents.length > 0) {
//         setExternalAgents(agents);
//         console.log('✅ STATE UPDATED: External agents set.');
//       } else {
//         console.warn('⚠️ No agents found in the response.');
//         setExternalAgents([]);
//       }

//     } catch (error) {
//       console.error('🔴 CRITICAL ERROR IN API CALL:', error);
//       setExternalAgents([]);
//       setFetchingAgents(false); // Force stop loading even on error
//     }
//   };

//   // Handle external agent selection
//   const handleExternalAgentSelect = (e) => {
//     const selectedAgentId = e.target.value;
//     console.log('🔍 [SELECT] Selected Agent ID from Dropdown:', selectedAgentId);
    
//     // FIX: Check BOTH PascalCase (C#) and camelCase (JSON)
//     const selectedAgent = externalAgents.find(a => 
//       a.Agent_ID === selectedAgentId || 
//       a.agentId === selectedAgentId || 
//       a.id === selectedAgentId
//     );
    
//     console.log('📦 [SELECT] Full Selected Agent Object:', selectedAgent);
    
//     if (selectedAgent) {
//       setFormData(prev => ({
//         ...prev,
//         // FIX: Check both naming conventions when setting the form
//         agentName: selectedAgent.Agent_NAME || selectedAgent.agentName || selectedAgent.name || '',
//         agentCode: selectedAgent.Agent_ID || selectedAgent.agentId || selectedAgent.id || '',
//         branchId: selectedAgent.BRANCH_CODE || selectedAgent.branchCode || selectedAgent.branchId || '',
//       }));
//       console.log('✅ [FORM] Form data successfully updated from selected external agent.');
//     } else {
//         console.warn('⚠️ [SELECT] Could not find the selected agent in the externalAgents array.');
//     }
//   };

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value
//     }));
//   };

//   const [errors, setErrors] = useState({});
//   const validate = () => {
//     let tempErrors = {};

//     if (!formData.agentName) tempErrors.agentName = "Agent name is required";
//     if (!formData.email) tempErrors.email = "Email is required";
//     if (!formData.phone) tempErrors.phone = "Phone is required";
//     if (!formData.agentCode) tempErrors.agentCode = "Agent Code is required";
//     if (!formData.merchantId) tempErrors.merchantId = "Merchant is required";
//     if (!formData.branchId) tempErrors.branchId = "Branch is required";
//     if (!formData.commissionRate) tempErrors.commissionRate = "Commission rate is required";
//     if (!formData.address) tempErrors.address = "Address is required";
//     if (!formData.city) tempErrors.city = "City is required";
//     if (!formData.state) tempErrors.state = "State is required";
//     if (!formData.zipCode) tempErrors.zipCode = "Zip code is required";
//     if (!formData.description) tempErrors.description = "Description is required";

//     setErrors(tempErrors);
//     return Object.keys(tempErrors).length === 0;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     if (!validate()) {
//       setLoading(false);
//       return;
//     }

//     const submitData = {
//       ...formData,
//       name: formData.agentName,
//     };
//     delete submitData.agentName;

//     try {
//       if (isEdit) {
//         await agentApi.update(id, submitData);
//       } else {
//         await agentApi.create(submitData);
//       }
//       navigate('/agents');
//     } catch (error) {
//       alert(error.response?.data?.message || 'Failed to save agent. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Check if integration is active
//   const isIntegrationActive = integrationStatus === 'Y' || integrationStatus === 'Yes';
//   const showExternalDropdown = isIntegrationActive && !isEdit && externalAgents.length > 0;

//   console.log('🟢 [UI RENDER DEBUG]', {
//     integrationStatus,
//     isIntegrationActive,
//     externalAgentsCount: externalAgents.length,
//     showExternalDropdown, // If this is FALSE, dropdown won't show.
//     isEdit,
//     fetchingAgents
//   });

//   // Show loading animation while page is loading
//   if (pageLoading) {
//     return <LoadingAnimation message={isEdit ? 'Loading Agent' : 'Loading Form'} />;
//   }

//   return (
//     <DashboardLayout role="softwareadmin">
//       <div className="add-agent">
//         <div className="page-header">
//           <div>
//             <h1 className="page-title">
//               <span className="gradient-text">{isEdit ? 'Edit' : 'Add'} Agent</span>
//             </h1>
//             <p className="page-subtitle">
//               {isEdit ? 'Update agent information' : 'Register a new agent'}
//             </p>
//           </div>
//           <button className="btn-outline" onClick={() => navigate('/agents')}>← Back</button>
//         </div>

//         <form onSubmit={handleSubmit} className="agent-form">
          
//           {/* Integration Banner */}
//           <div className={`integration-banner ${isIntegrationActive ? 'active' : 'inactive'}`}>
//             <span className="banner-icon">{isIntegrationActive ? '🔗' : '📝'}</span>
//             <span className="banner-text">
//               {isIntegrationActive 
//                 ? `Integration is active. ${externalAgents.length > 0 ? '✅ Loaded!' : 'Loading agents from external API...'}` 
//                 : 'Integration is not active. Please enter agent details manually.'}
//             </span>
//             <span className="banner-status">
//               Status: {isIntegrationActive ? '✅ Active' : '❌ Inactive'}
//             </span>
//             {fetchingAgents && <span className="banner-loader">⏳ Loading...</span>}
//           </div>

//           <div className="form-section">
//             <h3>Personal Information</h3>
//             <div className="form-grid">
              
//               {/* Agent Name */}
//               <div className="form-group">
//                 <label>Agent Name *</label>
//                 {showExternalDropdown ? (
//                   <select
//                     name="agentName"
//                     value={formData.agentName}
//                     onChange={handleExternalAgentSelect}
//                     className="branch-select-dropdown"
//                   >
//                     <option value="">-- Select Agent --</option>
//                     {externalAgents.map((agent, index) => (
//                       <option 
//                         key={index} 
//                         value={agent.Agent_ID || agent.agentId || agent.id}
//                       >
//                         {agent.Agent_NAME || agent.agentName || agent.name}
//                       </option>
//                     ))}
//                   </select>
//                 ) : isIntegrationActive && fetchingAgents ? (
//                   <div className="loading-input">
//                     <span className="spinner-small"></span> Loading agents...
//                   </div>
//                 ) : (
//                   <input
//                     name="agentName"
//                     value={formData.agentName}
//                     onChange={handleChange}
//                     placeholder={isIntegrationActive ? 'Waiting for agents...' : 'Enter agent name'}
//                     disabled={isEdit || isIntegrationActive}
//                   />
//                 )}
//                 {errors.agentName && <p className="error-text">{errors.agentName}</p>}
//               </div>

//               {/* Agent Code */}
//               <div className="form-group">
//                 <label>Agent Code *</label>
//                 {showExternalDropdown ? (
//                   <select
//                     name="agentCode"
//                     value={formData.agentCode}
//                     onChange={handleExternalAgentSelect}
//                     className="branch-select-dropdown"
//                   >
//                     <option value="">-- Select Agent --</option>
//                     {externalAgents.map((agent, index) => (
//                       <option 
//                         key={index} 
//                         value={agent.Agent_ID || agent.agentId || agent.id}
//                       >
//                         {agent.Agent_ID || agent.agentId || agent.id}
//                       </option>
//                     ))}
//                   </select>
//                 ) : isIntegrationActive && fetchingAgents ? (
//                   <div className="loading-input">
//                     <span className="spinner-small"></span> Loading agents...
//                   </div>
//                 ) : (
//                   <input
//                     name="agentCode"
//                     value={formData.agentCode}
//                     onChange={handleChange}
//                     placeholder={isIntegrationActive ? 'Waiting for agents...' : 'Enter agent code'}
//                     disabled={isEdit || isIntegrationActive}
//                   />
//                 )}
//                 {errors.agentCode && <p className="error-text">{errors.agentCode}</p>}
//               </div>
                
//               <div className="form-group">
//                 <label>Email *</label>
//                 <input
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleChange}
//                   placeholder="Enter your email address"
//                 />
//                 {errors.email && <p className="error-text">{errors.email}</p>}
//               </div>

//               <div className="form-group">
//                 <label>Phone *</label>
//                 <input
//                   name="phone"
//                   value={formData.phone}
//                   onChange={handleChange}
//                   placeholder="Enter your mobile number"
//                 />
//                 {errors.phone && <p className="error-text">{errors.phone}</p>}
//               </div>
//             </div>
//           </div>

//           <div className="form-section">
//             <h3>Assignment & Commission</h3>
//             <div className="form-grid">
//               <div className="form-group">
//                 <label>Assign to Merchant *</label>
//                 <select
//                   name="merchantId"
//                   value={formData.merchantId}
//                   onChange={handleChange}
//                 >
//                   <option value="">Select Merchant...</option>
//                   {Array.isArray(merchants) && merchants.map((merchant) => (
//                     <option key={merchant.id} value={merchant.id}>
//                       {merchant.merchantName}
//                     </option>
//                   ))}
//                 </select>
//                 {errors.merchantId && <p className="error-text">{errors.merchantId}</p>}
//               </div>

//               <div className="form-group">
//                 <label>Assign to Branch *</label>
//                 <select
//                   name="branchId"
//                   value={formData.branchId}
//                   onChange={handleChange}
//                 >
//                   <option value="">Select Branch...</option>
//                   {Array.isArray(branches) && branches.map((branch) => (
//                     <option key={branch.id} value={branch.id}>
//                       {branch.name} ({branch.code})
//                     </option>
//                   ))}
//                 </select>
//                 {errors.branchId && <p className="error-text">{errors.branchId}</p>}
//               </div>

//               <div className="form-group">
//                 <label>Commission Rate (%)*</label>
//                 <input
//                   type="number"
//                   name="commissionRate"
//                   value={formData.commissionRate}
//                   onChange={handleChange}
//                   placeholder="Enter commission rate"
//                   step="0.1"
//                   min="0"
//                   max="100"
//                 />
//                 {errors.commissionRate && <p className="error-text">{errors.commissionRate}</p>}
//               </div>
//             </div>
//           </div>

//           <div className="form-section">
//             <h3>Address</h3>
//             <div className="form-grid">
//               <div className="form-group full-width">
//                 <label>Address *</label>
//                 <input
//                   name="address"
//                   value={formData.address}
//                   onChange={handleChange}
//                   placeholder="Street address"
//                 />
//                 {errors.address && <p className="error-text">{errors.address}</p>}
//               </div>

//               <div className="form-group">
//                 <label>City *</label>
//                 <input
//                   name="city"
//                   value={formData.city}
//                   onChange={handleChange}
//                   placeholder="City"
//                 />
//                 {errors.city && <p className="error-text">{errors.city}</p>}
//               </div>

//               <div className="form-group">
//                 <label>State *</label>
//                 <input
//                   name="state"
//                   value={formData.state}
//                   onChange={handleChange}
//                   placeholder="State"
//                 />
//                 {errors.state && <p className="error-text">{errors.state}</p>}
//               </div>

//               <div className="form-group">
//                 <label>Zip Code *</label>
//                 <input
//                   name="zipCode"
//                   value={formData.zipCode}
//                   onChange={handleChange}
//                   placeholder="Enter ZIP/Postal Code"
//                 />
//                 {errors.zipCode && <p className="error-text">{errors.zipCode}</p>}
//               </div>
//             </div>
//           </div>

//           <div className="form-section">
//             <h3>Additional Information</h3>
//             <div className="form-grid">
//               <div className="form-group full-width">
//                 <label>Description *</label>
//                 <textarea
//                   name="description"
//                   value={formData.description}
//                   onChange={handleChange}
//                   rows="3"
//                   placeholder="Additional notes about the agent..."
//                 />
//                 {errors.description && <p className="error-text">{errors.description}</p>}
//               </div>
//             </div>
//           </div>

//           <div className="form-actions">
//             <button 
//               type="submit" 
//               className="btn-primary" 
//               disabled={loading}
//             >
//               {loading ? (
//                 <>
//                   <span className="spinner"></span>
//                   {isEdit ? 'Updating...' : 'Creating...'}
//                 </>
//               ) : (
//                 isEdit ? 'Update Agent' : 'Create Agent'
//               )}
//             </button>
//             <button 
//               type="button" 
//               className="btn-outline" 
//               onClick={() => navigate('/agents')}
//               disabled={loading}
//             >
//               Cancel
//             </button>
//           </div>
//         </form>
//       </div>
//     </DashboardLayout>
//   );
// };

// export default AddAgent;
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
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
  
  // New state to track the selected ID specifically for the dropdown
  const [selectedAgentId, setSelectedAgentId] = useState('');

  const [formData, setFormData] = useState({
    agentName: '',
    email: '',
    phone: '',
    agentCode: '',
    merchantId: '',
    branchId: '',
    commissionRate: '',
    isActive: true,
    address: '',
    city: '',
    state: '',
    zipCode: '',
    description: '',
  });

  useEffect(() => {
    const status = localStorage.getItem('integrationStatus') || 'No';
    console.log('🟢 [DEBUG] Integration Status from localStorage:', status);
    setIntegrationStatus(status);
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setPageLoading(true);
      await loadMerchants();
      await loadBranches();
      
      // If integration is active, load external agents
      const status = localStorage.getItem('integrationStatus') || 'No';
      if ((status === 'Y' || status === 'Yes') && !isEdit) {
        console.log('🟢 [DEBUG] Integration is Active. Calling loadExternalAgents...');
        await loadExternalAgents();
      } else {
        console.log('🟡 [DEBUG] Integration is NOT active or is Edit mode. Skipping external agent fetch.');
      }
      
      if (isEdit) {
        await loadAgent();
      }
    } catch (error) {
      console.error('🔴 [ERROR] Error loading page data:', error);
    } finally {
      setTimeout(() => {
        setPageLoading(false);
      }, 500);
    }
  };

  const loadMerchants = async () => {
    try {
      const res = await merchantApi.getAll();
      setMerchants(res.data.data || []);
    } catch (error) {
      console.error('🔴 [ERROR] Error loading merchants:', error);
      setMerchants([]);
    }
  };

  const loadBranches = async () => {
    try {
      const res = await branchApi.getAll();
      setBranches(res.data.data || []);
    } catch (error) {
      console.error('🔴 [ERROR] Error loading branches:', error);
      setBranches([]);
    }
  };

  const loadAgent = async () => {
    try {
      const res = await agentApi.getById(id);
      const data = res.data;
      setFormData({
        agentName: data.name || data.agentName || '',
        email: data.email || '',
        phone: data.phone || '',
        agentCode: data.agentCode || '',
        merchantId: data.merchantId || '',
        branchId: data.branchId || '',
        commissionRate: data.commissionRate || '',
        isActive: data.isActive !== undefined ? data.isActive : true,
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || '',
        description: data.description || '',
      });
    } catch (error) {
      console.error('🔴 [ERROR] Error loading agent:', error);
    }
  };

  // --- FINAL FIX: CORRECT PATH TO AGENTS ---
  const loadExternalAgents = async () => {
    try {
      setFetchingAgents(true);
      console.log('📡 1. STARTED Fetching external agents...');
      
      const res = await agentApi.fetchAgentList();
      
      console.log('📡 2. FULL RAW RESPONSE:', res);
      
      // Force-stop the loading state immediately after getting data
      setFetchingAgents(false); 

      let agents = [];
      
      // EXACT PATH FINDER BASED ON YOUR SCREENSHOT
      if (res && typeof res === 'object') {
          
          // YOUR EXACT BACKEND STRUCTURE: data -> data -> Agentlist -> data
          if (res.data && res.data.data && res.data.data.Agentlist && Array.isArray(res.data.data.Agentlist.data)) {
              agents = res.data.data.Agentlist.data; 
              console.log(`✅ FOUND 1! Using res.data.data.Agentlist.data (${agents.length} agents)`);
          } 
          // PATH 2: Axios Wrapper -> C# Wrapper -> Array (Standard)
          else if (res.data && res.data.data && Array.isArray(res.data.data)) {
              agents = res.data.data; 
              console.log(`✅ FOUND 2! Using res.data.data (${agents.length} agents)`);
          } 
          // PATH 3: Axios Wrapper -> Array
          else if (res.data && Array.isArray(res.data)) {
              agents = res.data;
              console.log(`✅ FOUND 3! Using res.data (${agents.length} agents)`);
          }
          // PATH 4: Raw Array
          else if (Array.isArray(res)) {
              agents = res;
              console.log(`✅ FOUND 4! Using raw res array (${agents.length} agents)`);
          }
          else {
              console.error('❌ FAILED: Could not find array in response.', res);
          }
      }
      
      if (agents && agents.length > 0) {
        setExternalAgents(agents);
        console.log('✅ STATE UPDATED: External agents set.');
      } else {
        console.warn('⚠️ No agents found in the response.');
        setExternalAgents([]);
      }

    } catch (error) {
      console.error('🔴 CRITICAL ERROR IN API CALL:', error);
      setExternalAgents([]);
      setFetchingAgents(false); // Force stop loading even on error
    }
  };

  // --- FIXED: Handle external agent selection ---
  const handleExternalAgentSelect = (e) => {
    const selectedId = e.target.value;
    console.log('🔍 [SELECT] Selected Agent ID from Dropdown:', selectedId);
    
    // Update the dropdown selection state so the <select> highlights correctly
    setSelectedAgentId(selectedId);

    // Find the agent
    const selectedAgent = externalAgents.find(a => 
      a.Agent_ID === selectedId || 
      a.agentId === selectedId || 
      a.id === selectedId
    );
    
    console.log('📦 [SELECT] Full Selected Agent Object:', selectedAgent);
    
    if (selectedAgent) {
      setFormData(prev => ({
        ...prev,
        // Check both naming conventions when setting the form
        agentName: selectedAgent.Agent_NAME || selectedAgent.agentName || selectedAgent.name || '',
        agentCode: selectedAgent.Agent_ID || selectedAgent.agentId || selectedAgent.id || '',
        branchId: selectedAgent.BRANCH_CODE || selectedAgent.branchCode || selectedAgent.branchId || '',
      }));
      console.log('✅ [FORM] Form data successfully updated from selected external agent.');
    } else {
        console.warn('⚠️ [SELECT] Could not find the selected agent in the externalAgents array.');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const [errors, setErrors] = useState({});
  const validate = () => {
    let tempErrors = {};

    if (!formData.agentName) tempErrors.agentName = "Agent name is required";
    if (!formData.email) tempErrors.email = "Email is required";
    if (!formData.phone) tempErrors.phone = "Phone is required";
    if (!formData.agentCode) tempErrors.agentCode = "Agent Code is required";
    if (!formData.merchantId) tempErrors.merchantId = "Merchant is required";
    if (!formData.branchId) tempErrors.branchId = "Branch is required";
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

    const submitData = {
      ...formData,
      name: formData.agentName,
    };
    delete submitData.agentName;

    try {
      if (isEdit) {
        await agentApi.update(id, submitData);
      } else {
        await agentApi.create(submitData);
      }
      navigate('/agents');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save agent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check if integration is active
  const isIntegrationActive = integrationStatus === 'Y' || integrationStatus === 'Yes';
  const showExternalDropdown = isIntegrationActive && !isEdit && externalAgents.length > 0;

  console.log('🟢 [UI RENDER DEBUG]', {
    integrationStatus,
    isIntegrationActive,
    externalAgentsCount: externalAgents.length,
    showExternalDropdown,
    isEdit,
    fetchingAgents
  });

  // Show loading animation while page is loading
  if (pageLoading) {
    return <LoadingAnimation message={isEdit ? 'Loading Agent' : 'Loading Form'} />;
  }

  return (
    <DashboardLayout role="softwareadmin">
      <div className="add-agent">
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <span className="gradient-text">{isEdit ? 'Edit' : 'Add'} Agent</span>
            </h1>
            <p className="page-subtitle">
              {isEdit ? 'Update agent information' : 'Register a new agent'}
            </p>
          </div>
          <button className="btn-outline" onClick={() => navigate('/agents')}>← Back</button>
        </div>

        <form onSubmit={handleSubmit} className="agent-form">
          
          {/* Integration Banner */}
          <div className={`integration-banner ${isIntegrationActive ? 'active' : 'inactive'}`}>
            <span className="banner-icon">{isIntegrationActive ? '🔗' : '📝'}</span>
            <span className="banner-text">
              {isIntegrationActive 
                ? `Integration is active. ${externalAgents.length > 0 ? '✅ Loaded!' : 'Loading agents from external API...'}` 
                : 'Integration is not active. Please enter agent details manually.'}
            </span>
            <span className="banner-status">
              Status: {isIntegrationActive ? '✅ Active' : '❌ Inactive'}
            </span>
            {fetchingAgents && <span className="banner-loader">⏳ Loading...</span>}
          </div>

          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="form-grid">
              
              {/* Agent Name */}
              <div className="form-group">
                <label>Agent Name *</label>
                {showExternalDropdown ? (
                  <select
                    name="agentName"
                    value={selectedAgentId} // FIXED: uses the dedicated ID state
                    onChange={handleExternalAgentSelect}
                    className="branch-select-dropdown"
                  >
                    <option value="">-- Select Agent --</option>
                    {externalAgents.map((agent, index) => (
                      <option 
                        key={index} 
                        value={agent.Agent_ID || agent.agentId || agent.id}
                      >
                        {agent.Agent_NAME || agent.agentName || agent.name}
                      </option>
                    ))}
                  </select>
                ) : isIntegrationActive && fetchingAgents ? (
                  <div className="loading-input">
                    <span className="spinner-small"></span> Loading agents...
                  </div>
                ) : (
                  <input
                    name="agentName"
                    value={formData.agentName}
                    onChange={handleChange}
                    placeholder={isIntegrationActive ? 'Waiting for agents...' : 'Enter agent name'}
                    disabled={isEdit || isIntegrationActive}
                  />
                )}
                {errors.agentName && <p className="error-text">{errors.agentName}</p>}
              </div>

              {/* Agent Code */}
              <div className="form-group">
                <label>Agent Code *</label>
                {showExternalDropdown ? (
                  <select
                    name="agentCode"
                    value={selectedAgentId} // FIXED: uses the dedicated ID state
                    onChange={handleExternalAgentSelect}
                    className="branch-select-dropdown"
                  >
                    <option value="">-- Select Agent --</option>
                    {externalAgents.map((agent, index) => (
                      <option 
                        key={index} 
                        value={agent.Agent_ID || agent.agentId || agent.id}
                      >
                        {agent.Agent_ID || agent.agentId || agent.id}
                      </option>
                    ))}
                  </select>
                ) : isIntegrationActive && fetchingAgents ? (
                  <div className="loading-input">
                    <span className="spinner-small"></span> Loading agents...
                  </div>
                ) : (
                  <input
                    name="agentCode"
                    value={formData.agentCode}
                    onChange={handleChange}
                    placeholder={isIntegrationActive ? 'Waiting for agents...' : 'Enter agent code'}
                    disabled={isEdit || isIntegrationActive}
                  />
                )}
                {errors.agentCode && <p className="error-text">{errors.agentCode}</p>}
              </div>
                
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                />
                {errors.email && <p className="error-text">{errors.email}</p>}
              </div>

              <div className="form-group">
                <label>Phone *</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your mobile number"
                />
                {errors.phone && <p className="error-text">{errors.phone}</p>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Assignment & Commission</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Assign to Merchant *</label>
                <select
                  name="merchantId"
                  value={formData.merchantId}
                  onChange={handleChange}
                >
                  <option value="">Select Merchant...</option>
                  {Array.isArray(merchants) && merchants.map((merchant) => (
                    <option key={merchant.id} value={merchant.id}>
                      {merchant.merchantName}
                    </option>
                  ))}
                </select>
                {errors.merchantId && <p className="error-text">{errors.merchantId}</p>}
              </div>

              <div className="form-group">
                <label>Assign to Branch *</label>
                <select
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleChange}
                >
                  <option value="">Select Branch...</option>
                  {Array.isArray(branches) && branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.code})
                    </option>
                  ))}
                </select>
                {errors.branchId && <p className="error-text">{errors.branchId}</p>}
              </div>

              <div className="form-group">
                <label>Commission Rate (%)*</label>
                <input
                  type="number"
                  name="commissionRate"
                  value={formData.commissionRate}
                  onChange={handleChange}
                  placeholder="Enter commission rate"
                  step="0.1"
                  min="0"
                  max="100"
                />
                {errors.commissionRate && <p className="error-text">{errors.commissionRate}</p>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Address</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Address *</label>
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street address"
                />
                {errors.address && <p className="error-text">{errors.address}</p>}
              </div>

              <div className="form-group">
                <label>City *</label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                />
                {errors.city && <p className="error-text">{errors.city}</p>}
              </div>

              <div className="form-group">
                <label>State *</label>
                <input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                />
                {errors.state && <p className="error-text">{errors.state}</p>}
              </div>

              <div className="form-group">
                <label>Zip Code *</label>
                <input
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="Enter ZIP/Postal Code"
                />
                {errors.zipCode && <p className="error-text">{errors.zipCode}</p>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Additional Information</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Additional notes about the agent..."
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
                  {isEdit ? 'Updating...' : 'Creating...'}
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