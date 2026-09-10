import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout'; 
import { merchantApi } from '../../services/api'; 
import './MerchantDetails.css';

const MerchantConfigDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const loadMerchant = useCallback(async () => {
    try {
      setLoading(true);
      const res = await merchantApi.getAllMerchantConfigById(id);
      setMerchant(res.data);
    } catch (error) {
      console.error('Error loading merchant:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMerchant();
  }, [loadMerchant]);

  if (loading) {
    return (
      <DashboardLayout role="softwareadmin">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading merchant details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!merchant) {
    return (
      <DashboardLayout role="softwareadmin">
        <div className="not-found">
          <span className="not-found-icon">🔍</span>
          <h2>Merchant Not Found</h2>
          <p>The merchant you're looking for doesn't exist or has been removed.</p>
          <Link to="/merchants" className="btn-primary">Back to Merchants</Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="softwareadmin">
      <div className="merchant-details-page">
        {/* Header */}
        <div className="details-header">
          <div className="header-left">
            <button className="back-btn" onClick={() => navigate('/merchants/merchantconfig')}>
              ← Back
            </button>
            <div className="header-info">
              <h1 className="merchant-name">{merchant.merchantName}</h1>
              <span className="merchant-code">#{merchant.id}</span>
              <span className={`status-badge ${merchant.isActive ? 'active' : 'inactive'}`}>
                {merchant.isActive ? 'Active' : 'Inactive'}
              </span>
              {merchant.isApproved ? (
                <span className="status-badge approved">Approved</span>
              ) : (
                <span className="status-badge pending">Pending Approval</span>
              )}
            </div>
          </div>
          {/*<div className="header-actions">
            <button 
              className={`action-btn ${merchant.isActive ? 'deactivate' : 'activate'}`}
              onClick={handleToggleStatus}
            >
              {merchant.isActive ? '⏸ Deactivate' : '▶ Activate'}
            </button>
            <Link to={`/merchants/edit/${id}`} className="action-btn edit">
              ✏️ Edit
            </Link>
            <button className="action-btn delete" onClick={handleDelete}>
              🗑 Delete
            </button>
          </div>*/}
        </div>

        {/* Tabs */}
        <div className="details-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          {/*<button 
            className={`tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveTab('contact')}
          >
            📞 Contact
          </button>
          <button 
            className={`tab-btn ${activeTab === 'bank' ? 'active' : ''}`}
            onClick={() => setActiveTab('bank')}
          >
            🏦 Bank Details
          </button>
          <button 
            className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            💳 Transactions
          </button>
          <button 
            className={`tab-btn ${activeTab === 'agents' ? 'active' : ''}`}
            onClick={() => setActiveTab('agents')}
          >
            👤 Agents
          </button>*/}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {/* Stats Cards */}
              {/*<div className="stats-grid-mini">
                <div className="stat-mini-card">
                  <span className="stat-mini-icon">💳</span>
                  <div>
                    <span className="stat-mini-label">Total Transactions</span>
                    <span className="stat-mini-value">0</span>
                  </div>
                </div>
                <div className="stat-mini-card">
                  <span className="stat-mini-icon">💰</span>
                  <div>
                    <span className="stat-mini-label">Total Revenue</span>
                    <span className="stat-mini-value">₹0</span>
                  </div>
                </div>
                <div className="stat-mini-card">
                  <span className="stat-mini-icon">👤</span>
                  <div>
                    <span className="stat-mini-label">Total Agents</span>
                    <span className="stat-mini-value">0</span>
                  </div>
                </div>
                <div className="stat-mini-card">
                  <span className="stat-mini-icon">📊</span>
                  <div>
                    <span className="stat-mini-label">Avg. Ticket Size</span>
                    <span className="stat-mini-value">₹{merchant.averageTicketSize || 0}</span>
                  </div>
                </div>
              </div>*/}

              {/* Business Details */}
              <div className="info-card">
                <h3>Merchant Config Details</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Merchant Name</label>
                    <span>{merchant.merchantName || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Branch Name</label>
                    <span>{merchant.branchId || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Product Type</label>
                    <span>{merchant.productType || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Api Code</label>
                    <span>{merchant.apiCode ? <a href={merchant.apiCode} target="_blank" rel="noopener noreferrer">{merchant.apiCode}</a> : 'N/A'}</span>
                  </div>

                  <div className="info-item">
                    <label>Api Name</label>
                    <span>{merchant.apiName ? <a href={merchant.apiName} target="_blank" rel="noopener noreferrer">{merchant.apiName}</a> : 'N/A'}</span>
                  </div>

                  <div className="info-item">
                    <label>Http Method</label>
                    <span>{merchant.httpmethod ? <a href={merchant.httpmethod} target="_blank" rel="noopener noreferrer">{merchant.httpmethod}</a> : 'N/A'}</span>
                  </div>

                  <div className="info-item">
                    <label>Url Template</label>
                    <span>{merchant.urlTemplate ? <a href={merchant.urlTemplate} target="_blank" rel="noopener noreferrer">{merchant.urlTemplate}</a> : 'N/A'}</span>
                  </div>

                  <div className="info-item">
                    <label>Request Headers</label>
                    <span>{merchant.requestHeaders ? <a href={merchant.requestHeaders} target="_blank" rel="noopener noreferrer">{merchant.requestHeaders}</a> : 'N/A'}</span>
                  </div>

                  <div className="info-item">
                    <label>Request Mapping</label>
                    <span>{merchant.requestMapping ? <a href={merchant.requestMapping} target="_blank" rel="noopener noreferrer">{merchant.requestMapping}</a> : 'N/A'}</span>
                  </div>

                  <div className="info-item">
                    <label>Response Mapping</label>
                    <span>{merchant.responseMapping ? <a href={merchant.responseMapping} target="_blank" rel="noopener noreferrer">{merchant.responseMapping}</a> : 'N/A'}</span>
                  </div>

                  <div className="info-item">
                    <label>isActive</label>
                    <span>{merchant.isActive ? "Active" : "Inactive"}</span>
                  </div>

                  <div className="info-item">
                    <label>priority</label>
                    <span>{ merchant.priority }</span>
                  </div>

                  <div className="info-item">
                    <label>created date</label>
                    <span>{ merchant.createdDate }</span>
                  </div>

                  <div className="info-item">
                    <label>integaration status</label>
                    <span>{ merchant.integrationStatus }</span>
                  </div>


                </div>
              </div>

              {/* Tax Details */}
             {/* <div className="info-card">
                <h3>Tax Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>PAN</label>
                    <span>{merchant.entityPAN || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Name on PAN</label>
                    <span>{merchant.nameOnPAN || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>GST Number</label>
                    <span>{merchant.gstNumber || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>GST State</label>
                    <span>{merchant.gstState || 'N/A'}</span>
                  </div>
                </div>
              </div>*/}

              {/* Volume Details */}
              {/*<div className="info-card">
                <h3>Business Volume</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Monthly Expected Volume</label>
                    <span>₹{merchant.monthlyExpectedVolume?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Monthly Transactions</label>
                    <span>{merchant.monthlyExpectedTransactionCount || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Average Ticket Size</label>
                    <span>₹{merchant.averageTicketSize || 'N/A'}</span>
                  </div>
                </div>
              </div>*/}

              {/* Timestamps */}
              {/*<div className="info-card">
                <h3>Timestamps</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Created At</label>
                    <span>{merchant.createdAt ? new Date(merchant.createdAt).toLocaleString() : 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Last Updated</label>
                    <span>{merchant.updatedAt ? new Date(merchant.updatedAt).toLocaleString() : 'N/A'}</span>
                  </div>
                  {merchant.approvedAt && (
                    <div className="info-item">
                      <label>Approved At</label>
                      <span>{new Date(merchant.approvedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>*/}
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="contact-tab">
              <div className="info-card">
                <h3>Contact Person</h3>
                {merchant.contactPerson ? (
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Name</label>
                      <span>{merchant.contactPerson.name || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Email</label>
                      <span>{merchant.contactPerson.emailAddress || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Phone</label>
                      <span>{merchant.contactPerson.phoneNumber || 'N/A'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="no-data">No contact person information available</p>
                )}
              </div>

              <div className="info-card">
                <h3>Authorized Signatory</h3>
                {merchant.authorizedSignatory ? (
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Name</label>
                      <span>{merchant.authorizedSignatory.name || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>PAN</label>
                      <span>{merchant.authorizedSignatory.panNumber || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Phone</label>
                      <span>{merchant.authorizedSignatory.phone || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Email</label>
                      <span>{merchant.authorizedSignatory.email || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Designation</label>
                      <span>{merchant.authorizedSignatory.designation || 'N/A'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="no-data">No authorized signatory information available</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'bank' && (
            <div className="bank-tab">
              {merchant.settlementAccounts && merchant.settlementAccounts.length > 0 ? (
                merchant.settlementAccounts.map((account, index) => (
                  <div key={index} className="info-card">
                    <h3>Settlement Account {index + 1} {account.isPrimary && <span className="primary-badge">Primary</span>}</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Account Holder</label>
                        <span>{account.accountHolderName || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <label>Account Number</label>
                        <span>{account.accountNumber || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <label>Account Type</label>
                        <span>{account.accountType || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <label>Bank Name</label>
                        <span>{account.bankName || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <label>Branch</label>
                        <span>{account.bankBranch || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <label>IFSC Code</label>
                        <span className="ifsc-code">{account.ifscCode || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="info-card">
                  <p className="no-data">No settlement accounts configured</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="transactions-tab">
              <div className="info-card">
                <h3>Recent Transactions</h3>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Amount</th>
                        <th>Payment Mode</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan="5" className="empty-row">No transactions found</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'agents' && (
            <div className="agents-tab">
              <div className="info-card">
                <div className="tab-header-actions">
                  <h3>Associated Agents</h3>
                  <Link to={`/agents/add?merchant=${id}`} className="btn-primary small">
                    ➕ Add Agent
                  </Link>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Agent Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Commission</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan="6" className="empty-row">No agents assigned</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MerchantConfigDetails;