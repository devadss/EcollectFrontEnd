import React, { useEffect, useState } from 'react';
import { useNavigate,useParams  } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout'; 
import { merchantApi } from '../../services/api'; 
import './AddMerchant.css';

 const AddMerchant =    () => {
 
const navigate = useNavigate();
   const { id } = useParams(); 
    const [loading, setLoading] = useState(false);
     // const res =   merchantApi.getMerchantById(id);

  const [formData, setFormData] = useState({
     
    merchantLegalName: '',
    registeredEmail: '',
    registeredPhone: '',
    businessCategory: '',
    entityType: '',
    websiteUrl: '',
    registeredAddress: '',
    entityPAN: '',
    nameOnPAN: '',
    gstNumber: '',
    gstState: '',
    monthlyExpectedVolume: '',
    monthlyExpectedTransactionCount: '',
    averageTicketSize: '',
    IntegrationStatus :'Y',
    contactPerson: { name: '', emailAddress: '', phoneNumber: '' },
    authorizedSignatory: { name: '', panNumber: '', phone: '', email: '', designation: '' },
    settlementAccounts: [{ accountHolderName: '', accountNumber: '', accountType: '', bankName: '', bankBranch: '', IFSC_Code: '' }]
  });



    useEffect(() => {
    const loadMerchant = async () => {
      try {
        
        const res = await merchantApi.getById(id);
        setFormData(res.data);

           

      } catch (err) {
        console.error(err);
      }
    };

    loadMerchant();
  }, []);





  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      settlementAccounts: [...prev.settlementAccounts, { accountHolderName: '', accountNumber: '', accountType: '', bankName: '', bankBranch: '', IFSC_Code: '' }]
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
    try {
       
          //alert(formData.merchantName);
       if (id) {
            //alert('hi');
            await merchantApi.update(id, formData);   // Update
            alert("Merchant updated successfully");
        } else {

          //alert(formData.merchantName)
            await merchantApi.create(formData);       // Create
             alert("Merchant created successfully");

        }

          navigate('/merchants');




    } catch (error) {
      console.error('Error creating merchant:', error); 
       alert(JSON.stringify(error.response?.data, null, 2));

    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="softwareadmin">
      <div className="add-merchant">
        <div className="page-header">
          <div>
            <h1 className="page-title"><span className="gradient-text">Add Merchant</span></h1>
            <p className="page-subtitle">Register a new merchant</p>
          </div>
          <button className="btn-outline" onClick={() => navigate('/merchants')}>← Back</button>
        </div>

        <form onSubmit={handleSubmit} className="merchant-form">
          {/* Business Details */}
          <div className="form-section">
            <h3>Business Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Merchant Name *</label>
                <input name="merchantName" value={formData.merchantName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Legal Name *</label>
                <input name="merchantLegalName" value={formData.merchantLegalName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" name="registeredEmail" value={formData.registeredEmail} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input name="registeredPhone" value={formData.registeredPhone} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Business Category</label>
                <input name="businessCategory" value={formData.businessCategory} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Entity Type</label>
                <select name="entityType" value={formData.entityType} onChange={handleChange}>
                  <option value="">Select...</option>
                  <option value="Pvt Ltd">Pvt Ltd</option>
                  <option value="Individual">Individual</option>
                  <option value="Trust">Trust</option>
                  <option value="Society">Society</option>
                  <option value="LLP">LLP</option>
                </select>
              </div>
              <div className="form-group full-width">
                <label>Website URL</label>
                <input name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} />
              </div>
              <div className="form-group full-width">
                <label>Registered Address *</label>
                <input name="registeredAddress" value={formData.registeredAddress} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>PAN *</label>
                <input name="entityPAN" value={formData.entityPAN} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Name on PAN</label>
                <input name="nameOnPAN" value={formData.nameOnPAN} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>GST Number</label>
                <input name="gstNumber" value={formData.gstNumber} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>GST State</label>
                <input name="gstState" value={formData.gstState} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Monthly Expected Volume</label>
                <input type="number" name="monthlyExpectedVolume" value={formData.monthlyExpectedVolume} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Monthly Transactions</label>
                <input type="number" name="monthlyExpectedTransactionCount" value={formData.monthlyExpectedTransactionCount} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Average Ticket Size</label>
                <input type="number" name="averageTicketSize" value={formData.averageTicketSize} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Is Integrated  </label>
                <select name="IntegrationStatus" value={formData.IntegrationStatus} onChange={handleChange}>
                   
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                   
                </select>
              </div>
              
            </div>
          </div>

          {/* Contact Person */}
          <div className="form-section">
            <h3>Contact Person</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Name *</label>
                <input name="name" value={formData.contactPerson?.name} onChange={handleContactChange} required />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" name="emailAddress" value={formData.contactPerson?.emailAddress} onChange={handleContactChange} required />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input name="phoneNumber" value={formData.contactPerson?.phoneNumber} onChange={handleContactChange} required />
              </div>
            </div>
          </div>

          {/* Authorized Signatory */}
          <div className="form-section">
            <h3>Authorized Signatory</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Name *</label>
                <input name="name" value={formData.authorizedSignatory?.name} onChange={handleSignatoryChange} required />
              </div>
              <div className="form-group">
                <label>PAN *</label>
                <input name="panNumber" value={formData.authorizedSignatory?.panNumber} onChange={handleSignatoryChange} required />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input name="phone" value={formData.authorizedSignatory?.phone} onChange={handleSignatoryChange} required />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" name="email" value={formData.authorizedSignatory?.email} onChange={handleSignatoryChange} required />
              </div>
              <div className="form-group">
                <label>Designation</label>
                <input name="designation" value={formData.authorizedSignatory?.designation} onChange={handleSignatoryChange} />
              </div>
            </div>
          </div>

          {/* Settlement Accounts */}
          <div className="form-section">
            <h3>Settlement Accounts</h3>
            {formData.settlementAccounts?.map((account, index) => (
              <div key={index} className="account-card">
                <div className="account-header">
                  <span>Account {index + 1}</span>
                  {index > 0 && (
                    <button type="button" className="btn-danger" onClick={() => removeAccount(index)}>Remove</button>
                  )}
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Account Holder Name *</label>
                    <input name="accountHolderName" value={account.accountHolderName} onChange={(e) => handleAccountChange(index, e)} required />
                  </div>
                  <div className="form-group">
                    <label>Account Number *</label>
                    <input name="accountNumber" value={account.accountNumber} onChange={(e) => handleAccountChange(index, e)} required />
                  </div>
                  <div className="form-group">
                    <label>Account Type</label>
                    <select name="accountType" value={account.accountType} onChange={(e) => handleAccountChange(index, e)}>
                      <option value="">Select...</option>
                      <option value="Current">Current</option>
                      <option value="Savings">Savings</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Bank Name *</label>
                    <input name="bankName" value={account.bankName} onChange={(e) => handleAccountChange(index, e)} required />
                  </div>
                  <div className="form-group">
                    <label>Bank Branch</label>
                    <input name="bankBranch" value={account.bankBranch} onChange={(e) => handleAccountChange(index, e)} />
                  </div>
                  <div className="form-group">
                    <label>IFSC Code *</label>
                    <input name="IFSC_Code" value={account.IFSC_Code} onChange={(e) => handleAccountChange(index, e)} required />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="btn-secondary" onClick={addAccount}>➕ Add Another Account</button>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Registering...' : 'Register Merchant'}
            </button>
            <button type="button" className="btn-outline" onClick={() => navigate('/merchants')}>Cancel</button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AddMerchant;