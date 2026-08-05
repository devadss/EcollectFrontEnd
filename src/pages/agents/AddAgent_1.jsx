import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { agentApi, merchantApi } from '../../services/api';
import './AddAgent.css';

const AddAgent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [merchants, setMerchants] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    agentCode: '',
    merchantId: '',
    commissionRate: '',
    isActive: true,
    address: '',
    city: '',
    state: '',
    zipCode: '',
    description: '',
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
      setMerchants(res.data || []);
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
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await agentApi.update(id, formData);
      } else {
        await agentApi.create(formData);
      }
      navigate('/agents');
    } catch (error) {
      console.error('Error saving agent:', error);
      alert('Failed to save agent. Please try again.');
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
                  required
                  placeholder="Enter full name"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="agent@email.com"
                />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="9876543210"
                />
              </div>
              <div className="form-group">
                <label>Agent Code</label>
                <input
                  name="agentCode"
                  value={formData.agentCode}
                  onChange={handleChange}
                  placeholder="AG-001"
                />
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
                  required
                >
                  <option value="">Select Merchant...</option>
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.merchantName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Commission Rate (%)</label>
                <input
                  type="number"
                  name="commissionRate"
                  value={formData.commissionRate}
                  onChange={handleChange}
                  placeholder="2.5"
                  step="0.1"
                  min="0"
                  max="100"
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '24px' }}>
                <label style={{ marginBottom: 0 }}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  {' '}Active
                </label>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Address</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Address</label>
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street address"
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                />
              </div>
              <div className="form-group">
                <label>Zip Code</label>
                <input
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="560001"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Additional Information</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Additional notes about the agent..."
                />
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