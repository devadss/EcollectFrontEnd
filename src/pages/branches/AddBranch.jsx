import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout'; 
import { branchApi } from '../../services/api';  
import './AddBranch.css';

const AddBranch = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    phone: '',
    email: '',
    isActive: true,
    description: '',
  });

  useEffect(() => {
    if (isEdit) {
      loadBranch();
    }
  }, [id]);

  const loadBranch = async () => {
    try {
      const res = await branchApi.getById(id);
      setFormData(res.data);
    } catch (error) {
      console.error('Error loading branch:', error);
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
        await branchApi.update(id, formData);
      } else {
        await branchApi.create(formData);
      }
      navigate('/branches');
    } catch (error) {
      console.error('Error saving branch:', error);
      alert('Failed to save branch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="softwareadmin">
      <div className="add-branch">
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <span className="gradient-text">{isEdit ? 'Edit' : 'Add'} Branch</span>
            </h1>
            <p className="page-subtitle">
              {isEdit ? 'Update branch information' : 'Register a new branch location'}
            </p>
          </div>
          <button className="btn-outline" onClick={() => navigate('/branches')}>← Back</button>
        </div>

        <form onSubmit={handleSubmit} className="branch-form">
          <div className="form-section">
            <h3>Branch Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Branch Name *</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter branch name"
                />
              </div>
              <div className="form-group">
                <label>Branch Code *</label>
                <input
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="Enter branch code"
                />
              </div>
              <div className="form-group full-width">
                <label>Address *</label>
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="Enter address"
                />
              </div>
              <div className="form-group">
                <label>City *</label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  placeholder="Enter city"
                />
              </div>
              <div className="form-group">
                <label>State *</label>
                <input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  placeholder="Enter State"
                />
              </div>
              <div className="form-group">
                <label>Zip Code *</label>
                <input
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="Enter ZIP code"
                />
              </div>
              <div className="form-group">
                <label>Country *</label>
                <input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Enter Country"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Contact Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter Phone Number"
                />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter Adress"
                />
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
                  placeholder="Additional notes about this branch..."
                />
              </div>
              {/*<div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '8px' }}>
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

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
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