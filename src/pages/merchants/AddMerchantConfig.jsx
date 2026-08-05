import React, { useState,useEffect  } from 'react';
import { useNavigate,useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout'; 
import { merchantApi } from '../../services/api'; 
import './AddMerchantConfig.css';

const AddMerchantConfig = () => {
  const [merchants, setMerchants] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [formData, setFormData] = useState({
    merchantId: '',
    productType: '',
    apiCode: '',
    apiName: '',
    httpMethod: '',
    urlTemplate: '',
    requestHeaders: '',
    requestMapping: '',
    responseMapping: '',
    priority: '',
    branchId:'02'
    //isActive: ''
    // gstState: '',
    // monthlyExpectedVolume: '',
    // monthlyExpectedTransactionCount: '',
    // averageTicketSize: '',
    // contactPerson: { name: '', emailAddress: '', phoneNumber: '' },
    // authorizedSignatory: { name: '', panNumber: '', phone: '', email: '', designation: '' },
    // settlementAccounts: [{ accountHolderName: '', accountNumber: '', accountType: '', bankName: '', bankBranch: '', ifscCode: '' }]
  });

  useEffect(() => {
    loadMerchants();
    if (isEdit) {
      loadAgent();
    }
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

  const loadAgent = async () => {
    try {
      const res = await merchantApi.getAllMerchantConfigById(id);
      console.log(res.data);
      setFormData(res.data);
    } catch (error) {
      console.error('Error loading agent:', error);
    }
  };

  const loadMerchants = async () => {
    try {
      const response = await merchantApi.getAllMerchant();
      // console.log("response:",response);
      // console.log("response Data:", response.data.data);
      setMerchants(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const [errors, setErrors] = useState({});

  const validate = () => {
    let tempErrors = {};

    if (!formData.merchantId) {
      tempErrors.merchantId = "Merchant is required";
    }

    if (!formData.productType) {
      tempErrors.productType = "Product Type is required";
    }

    if (!formData.apiCode) {
      tempErrors.apiCode = "API Code is required";
    }

    if (!formData.apiName) {
      tempErrors.apiName = "API Name is required";
    }

    if (!formData.httpMethod) {
      tempErrors.httpMethod = "Http Method is required";
    }

    if (!formData.urlTemplate) {
      tempErrors.urlTemplate = "Url Template is required";
    }

    if (!formData.requestHeaders) {
      tempErrors.requestHeaders = "Request header is required";
    }

    if (!formData.requestMapping) {
      tempErrors.requestMapping = "Request mapping is required";
    }

    if (!formData.responseMapping) {
      tempErrors.responseMapping = "Response mapping is required";
    }

    if (!formData.priority) {
      tempErrors.priority = "Priority is required";
    }

    setErrors(tempErrors);

    return Object.keys(tempErrors).length === 0;
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      contactPerson: { ...prev.contactPerson, [name]: value }
    }));
  };

  const handleSignatoryChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      authorizedSignatory: { ...prev.authorizedSignatory, [name]: value }
    }));
  };

  const handleAccountChange = (index, e) => {
    const { name, value } = e.target;
    const updatedAccounts = [...formData.settlementAccounts];
    updatedAccounts[index] = { ...updatedAccounts[index], [name]: value };
    setFormData(prev => ({ ...prev, settlementAccounts: updatedAccounts }));
  };

  const addAccount = () => {
    setFormData(prev => ({
      ...prev,
      settlementAccounts: [...prev.settlementAccounts, { accountHolderName: '', accountNumber: '', accountType: '', bankName: '', bankBranch: '', ifscCode: '' }]
    }));
  };

  const removeAccount = (index) => {
    if (formData.settlementAccounts.length > 1) {
      const updatedAccounts = formData.settlementAccounts.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, settlementAccounts: updatedAccounts }));
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validate()) {
      return;
    }

    try {
      let response;
      console.log(formData);
      if(isEdit){
        //Update API
        response = await merchantApi.updateMerchantConfig(id, formData);
      } else {
        //Create API
        response = await merchantApi.configMerchant(formData);
      }
      if(response.data.success === true) {
        alert(response.data.message);
      } else {
        alert("Failed to save");
      }
      navigate('/merchants/merchantconfig');

      // if (isEdit) {
      //   await agentApi.update(id, formData);
      // } else {
      //   await agentApi.create(formData);
      // }
      // navigate('/agents');
      

    } catch (error) {
      console.error('Error creating merchant:', error);
      alert('Failed to create merchant. Please try again.');

      // console.log("Status:", error.response?.status);
      // console.log("Response:", error.response?.data);
      // console.log("Headers:", error.response?.headers);

      alert(JSON.stringify(error.response?.data));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="softwareadmin">
      <div className="add-merchant">
        <div className="page-header">
          <div>
            <h1 className="page-title"><span className="gradient-text">Add Merchant Config</span></h1>
            <p className="page-subtitle">Configure merchant details and settlement settings.</p>
          </div>
          <button className="btn-outline" onClick={() => navigate('/merchants/merchantconfig')}>← Back</button>
        </div>

        <form onSubmit={handleSubmit} className="merchant-form">
          {/* Business Details */}
          <div className="form-section">
            <h3>Merchant Config Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Merchant Name *</label>
                {/*<input name="merchantName" value={formData.merchantName} onChange={handleChange} required />*/}
                <select name="merchantId" value={formData.merchantId} onChange={handleChange}



                >
                  {/*<option value="">Select...</option>
                  <option value="1">Fresh Mart</option>
                  <option value="2">City Electronics</option>
                  <option value="3">Royal Fashion</option>
                  <option value="4">Green grocers</option>*/}

                  <option value="">Select Merchant</option>

   { merchants.map((merchant) => (
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
                <label>Product Type *</label>
                {/*<input name="merchantLegalName" value={formData.merchantLegalName} onChange={handleChange} required />*/}
                <select name="productType" value={formData.productType} onChange={handleChange}>
                  <option value="">Select...</option>
                  <option value="rd">RD</option>
                  <option value="fd">FD</option>
                  <option value="rdcl">RDCL</option>
                  <option value="rd&loan">RD&Loan</option>
                </select>
                {errors.productType && (
                  <p style={{ color: "red" }}>{errors.productType}</p>
                )}
              </div>
              <div className="form-group">
                <label>API Code *</label>
                <input type="text" name="apiCode" value={formData.apiCode} onChange={handleChange}/>
                {errors.apiCode && (
                  <p style={{ color: "red" }}>{errors.apiCode}</p>
                )}
              </div>
              <div className="form-group">
                <label>API Name *</label>
                <input name="apiName" value={formData.apiName} onChange={handleChange}/>
                {errors.apiName && (
                  <p style={{ color: "red" }}>{errors.apiName}</p>
                )}
              </div>
              <div className="form-group">
                <label>Http Method *</label>
                <input name="httpMethod" value={formData.httpMethod} onChange={handleChange} />
                {errors.httpMethod && (
                  <p style={{ color: "red" }}>{errors.httpMethod}</p>
                )}
              </div>
              <div className="form-group">
                <label>URL Template *</label>
               {/* <select name="entityType" value={formData.entityType} onChange={handleChange}>
                  <option value="">Select...</option>
                  <option value="Pvt Ltd">Pvt Ltd</option>
                  <option value="Individual">Individual</option>
                  <option value="Trust">Trust</option>
                  <option value="Society">Society</option>
                  <option value="LLP">LLP</option>
                </select>*/}
                <input name="urlTemplate" value={formData.urlTemplate} onChange={handleChange} />
                {errors.urlTemplate && (
                  <p style={{ color: "red" }}>{errors.urlTemplate}</p>
                )}
              </div>
             {/* <div className="form-group full-width">
                <label>Website URL</label>
                <input name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} />
              </div>*/}

              <div className="form-group full-width">
                <label>Request Headers *</label>
                <input name="requestHeaders" value={formData.requestHeaders} onChange={handleChange} />
                {errors.requestHeaders && (
                  <p style={{ color: "red" }}>{errors.requestHeaders}</p>
                )}
              </div>

              <div className="form-group full-width">
                <label>Request Mapping *</label>
                <input name="requestMapping" value={formData.requestMapping} onChange={handleChange} />
                 {errors.requestMapping && (
                  <p style={{ color: "red" }}>{errors.requestMapping}</p>
                )}
              </div>
              <div className="form-group full-width">
                <label>Response Mapping *</label>
                <input name="responseMapping" value={formData.responseMapping} onChange={handleChange} />
                {errors.responseMapping && (
                  <p style={{ color: "red" }}>{errors.responseMapping}</p>
                )}
              </div>
              {/*<div className="form-group">
                <label>PAN *</label>
                <input name="entityPAN" value={formData.entityPAN} onChange={handleChange} required />
              </div>*/}
              <div className="form-group">
                <label>Priortity *</label>
                {/*<input name="merchantLegalName" value={formData.merchantLegalName} onChange={handleChange} required />*/}

                <select name="priority" value={formData.priority} onChange={handleChange}>
                  <option value="">Select...</option>
                  <option value="1">Yes</option>
                  <option value="0">No</option>
                  {/*<option value="green_grocers">Green grocers</option>*/}
                </select>
                {errors.priority && (
                  <p style={{ color: "red" }}>{errors.priority}</p>
                )}
              </div>
             {/* <div className="form-group">
                <input type="hidden" name="branchId" value="02"/>
              </div> */} 
             {/* <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '24px' }}>
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
              {/*{loading ? 'Registering...' : 'Add Merchant Config '}*/}
              {loading ? (
                <>
                  <span className="spinner"></span>
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEdit ? 'Update Merchant Config' : 'Create Merchant Config'
              )}

            </button>
            <button type="button" className="btn-outline" onClick={() => navigate('/merchants/merchantconfig')}>Cancel</button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AddMerchantConfig;