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
  const [fetchingBranches, setFetchingBranches] = useState(false);
  const [branchOptions, setBranchOptions] = useState([]);
  const [integrationStatus, setIntegrationStatus] = useState('No');
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
    const status = localStorage.getItem('integrationStatus') || 'No';
    setIntegrationStatus(status);
    
    if ((status === 'Y' || status === 'Yes') && !isEdit) {
      fetchBranchList();
    }
  }, [isEdit]);

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

  const fetchBranchList = async () => {
    try {
      setFetchingBranches(true);
      console.log('📡 Auto-fetching branch list from API...');
      
      const res = await branchApi.fetchBranchList();
      
      console.log('📡 Full API Response:', JSON.stringify(res.data, null, 2));
      
      let branches = [];
      
      if (res?.data?.data && Array.isArray(res.data.data)) {
        branches = res.data.data;
        console.log('✅ Branches extracted from res.data.data');
      } else if (res?.data && Array.isArray(res.data)) {
        branches = res.data;
        console.log('✅ Branches extracted from res.data');
      }
      
      console.log('📦 Extracted branches:', branches);
      
      if (branches && branches.length > 0) {
        const mappedBranches = branches.map(b => ({
          Branch_Code: b.branch_Code || b.Branch_Code || b.code || '',
          Branch_Name: b.branch_Name || b.Branch_Name || b.name || '',
          Address: b.address || b.Address || '',
        }));
        
        console.log('✅ Mapped branches:', mappedBranches);
        setBranchOptions(mappedBranches);
      } else {
        console.warn('ℹ️ No branches found from the external API');
        setBranchOptions([]);
      }
    } catch (error) {
      console.error('❌ Error fetching branch list:', error);
      setBranchOptions([]);
    } finally {
      setFetchingBranches(false);
    }
  };

  // ✅ FIX: Handle branch selection - this sets BOTH name and code
  const handleBranchSelect = (e) => {
    const selectedBranchCode = e.target.value;
    console.log('🔍 Selected branch code:', selectedBranchCode);
    
    // Find the branch by code
    const selectedBranch = branchOptions.find(b => b.Branch_Code === selectedBranchCode);
    
    console.log('📦 Selected branch object:', selectedBranch);
    
    if (selectedBranch) {
      // ✅ Set both name and code from the selected branch
      setFormData(prev => ({
        ...prev,
        code: selectedBranch.Branch_Code || '',
        name: selectedBranch.Branch_Name || '',
        address: selectedBranch.Address || '',
      }));
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

    if (!formData.name) tempErrors.name = "Branch name is required";
    if (!formData.code) tempErrors.code = "Code is required";
    if (!formData.address) tempErrors.address = "Address is required";
    if (!formData.city) tempErrors.city = "City is required";
    if (!formData.state) tempErrors.state = "State is required";
    if (!formData.zipCode) tempErrors.zipCode = "Zip code is required";
    if (!formData.country) tempErrors.country = "Country is required";
    if (!formData.phone) tempErrors.phone = "Phone is required";
    if (!formData.email) tempErrors.email = "Email is required";
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

  const isIntegrationActive = integrationStatus === 'Y' || integrationStatus === 'Yes';

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
          
          <div className={`integration-banner ${isIntegrationActive ? 'active' : 'inactive'}`}>
            <span className="banner-icon">{isIntegrationActive ? '🔗' : '📝'}</span>
            <span className="banner-text">
              {isIntegrationActive 
                ? 'Integration is active. Branch Name and Code will be selected from dropdown.' 
                : 'Integration is not active. Please enter Branch Name and Code manually.'}
            </span>
            <span className="banner-status">
              Status: {isIntegrationActive ? '✅ Active' : '❌ Inactive'}
            </span>
          </div>

          <div className="form-section">
            <h3>Branch Information</h3>
            <div className="form-grid">
              
              {/* ✅ FIX: Branch Name Dropdown - value uses code */}
              <div className="form-group">
                <label>Branch Name *</label>
                {isIntegrationActive && !isEdit ? (
                  <>
                    {fetchingBranches ? (
                      <div className="loading-input">
                        <span className="spinner-small"></span> Loading branches...
                      </div>
                    ) : branchOptions.length > 0 ? (
                      <select
                        value={formData.code}  // ✅ Use code as value
                        onChange={handleBranchSelect}
                        className="branch-select-dropdown"
                      >
                        <option value="">-- Select a branch --</option>
                        {branchOptions.map((branch, index) => (
                          <option key={index} value={branch.Branch_Code}>
                            {branch.Branch_Name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="no-branches-warning">
                        ⚠️ No branches found from API. Please check integration.
                      </div>
                    )}
                  </>
                ) : (
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter branch name"
                    disabled={isEdit}
                  />
                )}
                {errors.name && <p className="error-text">{errors.name}</p>}
              </div>

              {/* ✅ FIX: Branch Code Dropdown - value uses code */}
              <div className="form-group">
                <label>Branch Code *</label>
                {isIntegrationActive && !isEdit ? (
                  <>
                    {fetchingBranches ? (
                      <div className="loading-input">
                        <span className="spinner-small"></span> Loading branches...
                      </div>
                    ) : branchOptions.length > 0 ? (
                      <select
                        value={formData.code}  // ✅ Use code as value
                        onChange={handleBranchSelect}
                        className="branch-select-dropdown"
                      >
                        <option value="">-- Select a branch --</option>
                        {branchOptions.map((branch, index) => (
                          <option key={index} value={branch.Branch_Code}>
                            {branch.Branch_Code}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="no-branches-warning">
                        ⚠️ No branches found from API. Please check integration.
                      </div>
                    )}
                  </>
                ) : (
                  <input
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="Enter branch code"
                    disabled={isEdit}
                  />
                )}
                {errors.code && <p className="error-text">{errors.code}</p>}
              </div>

              <div className="form-group full-width">
                <label>Address *</label>
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter address"
                />
                {errors.address && <p className="error-text">{errors.address}</p>}
              </div>

              <div className="form-group">
                <label>City *</label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Enter city"
                />
                {errors.city && <p className="error-text">{errors.city}</p>}
              </div>

              <div className="form-group">
                <label>State *</label>
                <input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Enter State"
                />
                {errors.state && <p className="error-text">{errors.state}</p>}
              </div>

              <div className="form-group">
                <label>Zip Code *</label>
                <input
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="Enter ZIP code"
                />
                {errors.zipCode && <p className="error-text">{errors.zipCode}</p>}
              </div>

              <div className="form-group">
                <label>Country *</label>
                <input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Enter Country"
                />
                {errors.country && <p className="error-text">{errors.country}</p>}
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
                {errors.phone && <p className="error-text">{errors.phone}</p>}
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter Email Address"
                />
                {errors.email && <p className="error-text">{errors.email}</p>}
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
                {errors.description && <p className="error-text">{errors.description}</p>}
              </div>
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