import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { agentApi, merchantApi } from '../../services/api';
import './AddAgent.css';

const AddAgent = () => {
  // const agentName = "test-name";
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [merchants, setMerchants] = useState([]);
  const [showProductionUrl, setShowProductionUrl] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    agentCode: '',
    merchantId: '',
    branchId: '02',
    commissionRate: '',
    isActive: true,
    address: '',
    city: '',
    state: '',
    zipCode: '',
    description: '',
    IntegrationStatus:'',
    urlTemplate:''
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setPageLoading(true);
      await loadMerchants();
      if (isEdit) {
        await loadAgent();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setTimeout(() => {
        setPageLoading(false);
      }, 500);
    }
  };

  const loadMerchants = async () => {
    try {
      const res = await merchantApi.getAll();
      //console.log(res.data.data);
      
      setMerchants(res.data.data || []);
    } catch (error) {
      console.error('Error loading merchants:', error);
    }
  };

  const loadAgent = async () => {
    try {
      const res = await agentApi.getById(id);
      setFormData(res.data);
    } catch (error) {
      console.error('Error loading agent:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked,IntegrationStatus } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

     if(name === "IntegrationStatus" && value === "Y") {
        //console.log("Integration Status changed to Y");
        setShowProductionUrl(true);
      } else if (name === "IntegrationStatus" && value === "N") {
        setShowProductionUrl(false);
        setFormData(prev => ({
          ...prev,
          urlTemplate: ""
        }));
      } else if (name === "IntegrationStatus" && value === ""){
        setShowProductionUrl(false);
        setFormData(prev => ({
          ...prev,
          urlTemplate: ""
        }));
      }
  };

  // const handleIntegrationStatusChange = (e) => {
  //   const value = e.target.value;

  //   console.log("Integration Status:", value);
  // };

  const [errors, setErrors] = useState({});
      const validate = () => {
      let tempErrors = {};

      if (!formData.name) {
        tempErrors.name = "Full name is required";
      }

      if (!formData.email) {
        tempErrors.email = "Email is required";
      }

      if (!formData.phone) {
        tempErrors.phone = "Phone is required";
      }

      if (!formData.agentCode) {
        tempErrors.agentCode = "Agent Code is required";
      }

      if (!formData.merchantId) {
        tempErrors.merchantId = "Merchant is required";
      }

      if (!formData.branchId) {
        tempErrors.branchId = "Branch is required";
      }

      if (!formData.commissionRate) {
        tempErrors.commissionRate = "Commission rate is required";
      }

      if (!formData.address) {
        tempErrors.address = "Address is required";
      }

      if (!formData.city) {
        tempErrors.city = "City is required";
      }

      if (!formData.state) {
        tempErrors.state = "State is required";
      }

      if(!formData.zipCode) {
        tempErrors.zipCode = "Zip code is required";
      }

      if(!formData.description) {
        tempErrors.description = "Description is required";
      }

      if(!formData.IntegrationStatus) {
        tempErrors.IntegrationStatus = "Integaration status is required";
      }

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

    try {
      if (isEdit) {
        console.log(formData);

        await agentApi.update(id, formData);
      } else {
        // console.log("test-data-123");
        // console.log(formData);
        // console.log(formData);
        // console.log("test-here");
        await agentApi.create(formData);
      }
      navigate('/agents');
    } catch (error) {
      alert(error.response.data.message+'- Failed to save agent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                />
                {errors.name && (
                  <p style={{ color: "red" }}>{errors.name}</p>
                )}
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
                {errors.email && (
                  <p style={{ color: "red" }}>{errors.email}</p>
                )}
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  
                  placeholder="Enter your mobile number"
                />
                {errors.phone && (
                  <p style={{ color: "red" }}>{errors.phone}</p>
                )}
              </div>
              <div className="form-group">
                <label>Agent Code *</label>
                <input
                  name="agentCode"
                  value={formData.agentCode}
                  onChange={handleChange}
                  placeholder="Enter your agent code"
                />
                {errors.agentCode && (
                  <p style={{ color: "red" }}>{errors.agentCode}</p>
                )}
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
                  {Array.isArray(merchants) &&
  merchants.map((merchant) => (
                    <option key={merchant.id} value={merchant.id}>
                      {merchant.merchantName}
                    </option>
                  ))}
                </select>
                {errors.merchantId && (
                  <p style={{ color: "red" }}>{errors.merchantId}</p>
                )}
              </div>
              <div className="form-group">
                <label>Assign to Branch *</label>
                <select
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleChange}
                  
                >
                  <option value="">Select Branch...</option>
                  {/*{Array.isArray(merchants) &&
  merchants.map((merchant) => (
                    <option key={merchant.id} value={merchant.id}>
                      {merchant.merchantName}
                    </option>
                  ))}



                   { merchants.map((merchant) => (
                        <option key={merchant.id} value={merchant.id}>
                            {merchant.merchantName}
                        </option>
                    ))}*/}
                </select>

                {errors.branchId && (
                  <p style={{ color: "red" }}>{errors.branchId}</p>
                )}

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
                {errors.commissionRate && (
                  <p style={{ color: "red" }}>{errors.commissionRate}</p>
                )}
              </div>
              {/*<div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '24px' }}>
                <label style={{ marginBottom: 0 }}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  {' '}Active
                </label>
              </div>*/}
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
                {errors.address && (
                  <p style={{ color: "red" }}>{errors.address}</p>
                )}
              </div>
              <div className="form-group">
                <label>City *</label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                />
                {errors.address && (
                  <p style={{ color: "red" }}>{errors.city}</p>
                )}
              </div>
              <div className="form-group">
                <label>State *</label>
                <input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                />
                {errors.address && (
                  <p style={{ color: "red" }}>{errors.state}</p>
                )}
              </div>
              <div className="form-group">
                <label>Zip Code *</label>
                <input
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="Enter ZIP/Postal Code"
                />
                {errors.zipCode && (
                  <p style={{ color: "red" }}>{errors.zipCode}</p>
                )}
              </div>
            </div>
          </div>
          <div className="form-section">
            <h3>Additional Information & Status</h3>
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
                {errors.description && (
                  <p style={{ color: "red" }}>{errors.description}</p>
                )}
              </div>
              <div className="form-group">
                <label>Integration Status *</label>
                <select name="IntegrationStatus" value={formData.IntegrationStatus} onChange={handleChange}>
                  <option value="">Select Status</option>
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </select>
                {errors.IntegrationStatus && (
                  <p style={{ color: "red" }}>{errors.IntegrationStatus}</p>
                )}
              </div>
              {showProductionUrl  && (<div className="form-group">
                <label>URL Template</label>
                <select name="urlTemplate" value={formData.urlTemplate} onChange={handleChange}>
                 {/* <option value="">Select Status</option>
                  <option value="Y">Yes</option>
                  <option value="N">No</option>*/}
                </select>
               {/* {errors.IntegrationStatus && (
                  <p style={{ color: "red" }}>{errors.IntegrationStatus}</p>
                )}*/}
              </div>
              )}
            </div>
          </div>
          {/*<div className="form-grid">
            <label>Agent Integration Status</label>
            <div className="form-grid">
              <select>
                <option value="">Select Status</option>
                <option value="integrated">Yes</option>
                <option value="pending">No</option>
              </select>
            </div>  
          </div>*/}  
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