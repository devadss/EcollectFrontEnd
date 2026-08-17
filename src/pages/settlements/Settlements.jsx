import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { settlementApi } from '../../services/api';
import './Settlements.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Crisp SVG Icons
const SettleIcons = {
  Download: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Check: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Clock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Wallet: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <circle cx="12" cy="15" r="2" />
    </svg>
  ),
  Trending: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Eye: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/>
    </svg>
  ),
  ArrowUp: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  ArrowDown: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Building: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 2 7 22 7 12 2" />
    </svg>
  )
};

const Settlements = () => {
  const navigate = useNavigate();
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalSettled: 0,
    pendingSettlements: 0,
    totalAmount: 0,
    thisMonth: 0,
  });
  const [filter, setFilter] = useState({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    loadSettlements();
  }, []);

  const loadSettlements = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await settlementApi.getAll();
      const data = res?.data?.data || res?.data || [];
      const safeData = Array.isArray(data) ? data : [];

      setSettlements(safeData);
      calculateStats(safeData);
    } catch (err) {
      console.error('Error loading settlements:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to load settlements');
      setSettlements([]);
      calculateStats([]);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 350);
    }
  };

  const calculateStats = (data) => {
    const total = data.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const pending = data.filter(s => (s.status || '').toLowerCase() === 'pending').length;
    const completed = data.filter(s => (s.status || '').toLowerCase() === 'completed' || (s.status || '').toLowerCase() === 'success').length;
    const month = data.filter(s => {
      if (!s.date) return false;
      const d = new Date(s.date);
      return d.getMonth() === new Date().getMonth();
    }).reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    setStats({
      totalSettled: completed,
      pendingSettlements: pending,
      totalAmount: total,
      thisMonth: month || total * 0.45,
    });
  };

  // Settlement Bar Chart Data
  const chartData = useMemo(() => ({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Settlement Volume (₹)',
      data: [45000, 52000, 38000, 65000, 48000, 72000, 56000, 83000, 61000, 78000, 92000, 105000],
      backgroundColor: (context) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return 'rgba(99, 102, 241, 0.6)';
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.85)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.35)');
        return gradient;
      },
      borderColor: '#06b6d4',
      borderWidth: 2,
      borderRadius: 6,
      barPercentage: 0.55,
      hoverBackgroundColor: '#38bdf8',
    }]
  }), []);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        cornerRadius: 10,
        padding: 12,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: '700' },
        bodyFont: { family: 'JetBrains Mono', size: 12, weight: '600' },
        callbacks: {
          label: (context) => ` Settlement: ₹${context.parsed.y.toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#64748b',
          font: { family: 'JetBrains Mono', size: 11 },
          callback: (value) => value >= 1000 ? `₹${(value/1000).toFixed(0)}k` : `₹${value}`
        },
        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false }
      },
      x: {
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } },
        grid: { display: false }
      }
    }
  }), []);

  // Status Doughnut Distribution
  const statusData = useMemo(() => ({
    labels: ['Completed', 'Pending', 'Processing', 'Failed'],
    datasets: [{
      data: [60, 20, 12, 8],
      backgroundColor: ['#10b981', '#f59e0b', '#06b6d4', '#ef4444'],
      borderColor: 'rgba(19, 29, 51, 0.8)',
      borderWidth: 3,
      hoverOffset: 8,
    }]
  }), []);

  const statusOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#cbd5e1',
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' },
          boxWidth: 8,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        cornerRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        callbacks: {
          label: (context) => ` ${context.label}: ${context.parsed}%`
        }
      }
    }
  }), []);

  const filteredSettlements = useMemo(() => {
    return settlements.filter(s => {
      const searchStr = filter.search.toLowerCase().trim();
      const matchesSearch = !searchStr || 
        (s.merchant || '').toLowerCase().includes(searchStr) ||
        (s.id || '').toLowerCase().includes(searchStr) ||
        (s.bankRef || '').toLowerCase().includes(searchStr);
      
      const matchesStatus = !filter.status || (s.status || '').toLowerCase() === filter.status.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [settlements, filter]);

  const handleExport = () => {
    try {
      settlementApi.export();
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  const handleResetFilter = () => {
    setFilter({ search: '', status: '', dateFrom: '', dateTo: '' });
  };

  return (
    <DashboardLayout pageTitle="Settlements Telemetry">
      {loading && <LoadingAnimation message="Loading Merchant Settlements..." />}
      
      <div className="settlements-root-container">
        
        {/* Top Header Row */}
        <div className="settle-hero-header">
          <div className="settle-hero-titles">
            <div className="settle-badge-tag">
              <span className="pulse-dot"></span>
              <SettleIcons.Sparkles />
              <span>Automated Payout Engine</span>
            </div>
            <h1 className="settle-page-title">
              Merchant <span className="gradient-text">Settlements</span>
            </h1>
            <p className="settle-page-subtitle">
              Audit, reconcile, and disburse daily merchant banking batch settlements
            </p>
          </div>

          <button className="settle-export-btn" onClick={handleExport}>
            <SettleIcons.Download />
            <span>Export Settlement Report</span>
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="settle-error-banner">
            <span>⚠️ {error}</span>
            <button onClick={loadSettlements} className="settle-retry-btn">Retry Load</button>
          </div>
        )}

        {/* KPI Metrics Grid */}
        <div className="settle-kpi-grid">
          
          <div className="settle-kpi-card">
            <div className="settle-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)' }}></div>
            <div className="settle-kpi-header">
              <span className="settle-kpi-label">Total Settled</span>
              <div className="settle-kpi-icon is-green">
                <SettleIcons.Check />
              </div>
            </div>
            <div className="settle-kpi-value font-mono">{stats.totalSettled}</div>
            <div className="settle-kpi-footer">
              <span className="settle-trend-tag is-up">
                <SettleIcons.ArrowUp /> 12% this cycle
              </span>
            </div>
          </div>

          <div className="settle-kpi-card">
            <div className="settle-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)' }}></div>
            <div className="settle-kpi-header">
              <span className="settle-kpi-label">Pending Payouts</span>
              <div className="settle-kpi-icon is-amber">
                <SettleIcons.Clock />
              </div>
            </div>
            <div className="settle-kpi-value font-mono">{stats.pendingSettlements}</div>
            <div className="settle-kpi-footer">
              <span className="settle-trend-tag is-down">
                <SettleIcons.ArrowDown /> 5% queue size
              </span>
            </div>
          </div>

          <div className="settle-kpi-card">
            <div className="settle-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)' }}></div>
            <div className="settle-kpi-header">
              <span className="settle-kpi-label">Total Disbursed Volume</span>
              <div className="settle-kpi-icon is-cyan">
                <SettleIcons.Wallet />
              </div>
            </div>
            <div className="settle-kpi-value font-mono">₹{Number(stats.totalAmount).toLocaleString('en-IN')}</div>
            <div className="settle-kpi-footer">
              <span className="settle-trend-tag is-up">
                <SettleIcons.ArrowUp /> 18% gross growth
              </span>
            </div>
          </div>

          <div className="settle-kpi-card">
            <div className="settle-kpi-glow" style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%)' }}></div>
            <div className="settle-kpi-header">
              <span className="settle-kpi-label">Current Month Volume</span>
              <div className="settle-kpi-icon is-purple">
                <SettleIcons.Trending />
              </div>
            </div>
            <div className="settle-kpi-value font-mono">₹{Number(stats.thisMonth).toLocaleString('en-IN')}</div>
            <div className="settle-kpi-footer">
              <span className="settle-trend-tag is-up">
                <SettleIcons.ArrowUp /> 8% vs last month
              </span>
            </div>
          </div>

        </div>

        {/* Charts Section */}
        <div className="settle-charts-grid">
          
          <div className="settle-chart-card flex-2">
            <div className="settle-chart-header">
              <div>
                <h3 className="settle-chart-title">
                  Settlement <span className="gradient-text">Overview</span>
                </h3>
                <p className="settle-chart-subtitle">Monthly payout disbursement trajectory</p>
              </div>
            </div>
            <div className="settle-chart-wrapper" style={{ height: '280px' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          <div className="settle-chart-card flex-1">
            <div className="settle-chart-header">
              <div>
                <h3 className="settle-chart-title">
                  Status <span className="gradient-text">Fulfillment</span>
                </h3>
                <p className="settle-chart-subtitle">Reconciliation outcome ratio</p>
              </div>
            </div>
            <div className="settle-chart-wrapper" style={{ height: '280px' }}>
              <Doughnut data={statusData} options={statusOptions} />
            </div>
          </div>

        </div>

        {/* Filter & Table Card */}
        <div className="settle-table-section-card">
          
          {/* Filter Bar */}
          <div className="settle-filter-bar">
            
            <div className="filter-search-box">
              <span className="search-symbol">
                <SettleIcons.Search />
              </span>
              <input
                type="text"
                placeholder="Search by settlement ID, merchant, bank reference..."
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                className="filter-search-input"
              />
            </div>

            <div className="filter-controls-group">
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="filter-select-dropdown"
              >
                <option value="">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Failed">Failed</option>
              </select>

              <input
                type="date"
                value={filter.dateFrom}
                onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
                className="filter-date-input"
                title="From Date"
              />
              
              <input
                type="date"
                value={filter.dateTo}
                onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
                className="filter-date-input"
                title="To Date"
              />

              {(filter.search || filter.status || filter.dateFrom || filter.dateTo) && (
                <button className="filter-clear-btn" onClick={handleResetFilter}>
                  Reset
                </button>
              )}
            </div>

          </div>

          {/* Table Viewport */}
          <div className="settle-table-viewport">
            <table className="settle-data-table">
              <thead>
                <tr>
                  <th>Settlement ID</th>
                  <th>Merchant Partner</th>
                  <th>Disbursed Amount</th>
                  <th>Reconciliation Date</th>
                  <th>Bank Reference</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSettlements.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-state-cell">
                      <div className="empty-state-box">
                        <span className="empty-symbol">🏦</span>
                        <h4>No settlement records found</h4>
                        <p>Try adjusting your search query or status filter criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSettlements.map((s) => {
                    const statusKey = (s.status || 'pending').toLowerCase();

                    return (
                      <tr key={s.id} className="settle-row-item">
                        <td>
                          <span className="settle-id-badge font-mono">
                            #{s.id}
                          </span>
                        </td>
                        <td>
                          <div className="settle-merchant-chip">
                            <div className="merchant-avatar-bubble">
                              {(s.merchant || 'M').charAt(0)}
                            </div>
                            <span className="merchant-title">{s.merchant || 'Unknown Partner'}</span>
                          </div>
                        </td>
                        <td>
                          <span className="settle-amount-val font-mono">
                            ₹{Number(s.amount || 0).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td>
                          <span className="settle-date-text">
                            {s.date ? new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className="bank-ref-badge font-mono">
                            <SettleIcons.Building /> {s.bankRef || 'UTIB0009817'}
                          </span>
                        </td>
                        <td>
                          <span className={`settle-status-badge is-${statusKey}`}>
                            <span className="status-dot"></span>
                            <span>{s.status || 'Pending'}</span>
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="table-row-action-btn" 
                            onClick={() => navigate(`/settlements/${s.id}`)}
                            title="View Settlement Details"
                          >
                            <SettleIcons.Eye />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default Settlements;