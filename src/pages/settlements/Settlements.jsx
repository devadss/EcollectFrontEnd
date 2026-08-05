import React, { useState, useEffect } from 'react';
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
      const data = res.data || [];
      setSettlements(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error loading settlements:', error);
      setError(error.message || 'Failed to load settlements');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  const calculateStats = (data) => {
    const total = data.reduce((sum, s) => sum + (s.amount || 0), 0);
    const pending = data.filter(s => s.status === 'Pending').length;
    const month = data.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === new Date().getMonth();
    }).reduce((sum, s) => sum + (s.amount || 0), 0);

    setStats({
      totalSettled: data.filter(s => s.status === 'Completed').length,
      pendingSettlements: pending,
      totalAmount: total,
      thisMonth: month,
    });
  };

  // Settlement Chart Data
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Settlement Amount (₹)',
      data: [45000, 52000, 38000, 65000, 48000, 72000, 56000, 83000, 61000, 78000, 92000, 105000],
      backgroundColor: [
        'rgba(0, 0, 0, 0.75)',
        'rgba(0, 0, 0, 0.65)',
        'rgba(0, 0, 0, 0.75)',
        'rgba(0, 0, 0, 0.65)',
        'rgba(0, 0, 0, 0.75)',
        'rgba(0, 0, 0, 0.65)',
        'rgba(0, 0, 0, 0.75)',
        'rgba(0, 0, 0, 0.65)',
        'rgba(0, 0, 0, 0.75)',
        'rgba(0, 0, 0, 0.65)',
        'rgba(0, 0, 0, 0.75)',
        'rgba(0, 0, 0, 0.85)'
      ],
      borderColor: '#000000',
      borderWidth: 2,
      borderRadius: 6,
      barPercentage: 0.6,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        cornerRadius: 12,
        padding: 12,
        callbacks: {
          label: (context) => `₹ ${context.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#888888',
          font: { size: 11 },
          callback: (value) => value >= 1000 ? `₹${value/1000}k` : `₹${value}`
        },
        grid: { color: 'rgba(0, 0, 0, 0.06)' }
      },
      x: {
        ticks: { color: '#888888', font: { size: 11 } },
        grid: { display: false }
      }
    }
  };

  // Status Distribution
  const statusData = {
    labels: ['Completed', 'Pending', 'Processing', 'Failed'],
    datasets: [{
      data: [45, 25, 20, 10],
      backgroundColor: ['#000000', '#444444', '#777777', '#bbbbbb'],
      borderColor: '#ffffff',
      borderWidth: 3,
    }]
  };

  const statusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#666666',
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 11 }
        }
      }
    }
  };

  const filteredSettlements = settlements.filter(s => {
    const matchesSearch = 
      s.merchant?.toLowerCase().includes(filter.search.toLowerCase()) ||
      s.id?.toLowerCase().includes(filter.search.toLowerCase());
    const matchesStatus = filter.status ? s.status === filter.status : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      {/* Loading overlay with blur - shown when loading */}
      {loading && <LoadingAnimation message="Loading Settlements" />}
      
      {/* Main content */}
      <DashboardLayout role="softwareadmin">
        <div className={`settlements-page ${loading ? 'content-blurred' : ''}`}>
          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title"><span className="gradient-text">Settlements</span></h1>
              <p className="page-subtitle">Manage and track all settlements</p>
            </div>
            <button className="btn-primary" onClick={() => navigate('/settlements/export')}>
              📥 Export Report
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
              <button onClick={loadSettlements} className="retry-btn">Retry</button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-content">
                <div>
                  <div className="stat-label">Total Settled</div>
                  <div className="stat-value">{stats.totalSettled}</div>
                  <div className="stat-change up">↑ 12% this month</div>
                </div>
                <div className="stat-icon">✅</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-content">
                <div>
                  <div className="stat-label">Pending Settlements</div>
                  <div className="stat-value">{stats.pendingSettlements}</div>
                  <div className="stat-change down">↓ 5% this month</div>
                </div>
                <div className="stat-icon">⏳</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-content">
                <div>
                  <div className="stat-label">Total Amount</div>
                  <div className="stat-value">₹{stats.totalAmount.toLocaleString()}</div>
                  <div className="stat-change up">↑ 18% this month</div>
                </div>
                <div className="stat-icon">💰</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-content">
                <div>
                  <div className="stat-label">This Month</div>
                  <div className="stat-value">₹{stats.thisMonth.toLocaleString()}</div>
                  <div className="stat-change up">↑ 8% from last month</div>
                </div>
                <div className="stat-icon">📊</div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-row">
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <div className="chart-title"><span className="gradient-text">Settlement</span> Overview</div>
                  <div className="chart-subtitle">Monthly trend</div>
                </div>
              </div>
              <div className="chart-wrapper">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <div className="chart-title"><span className="gradient-text">Status</span> Distribution</div>
                  <div className="chart-subtitle">Settlement status breakdown</div>
                </div>
              </div>
              <div className="chart-wrapper">
                <Doughnut data={statusData} options={statusOptions} />
              </div>
            </div>
          </div>

          {/* Filter & Table */}
          <div className="table-section">
            <div className="filter-bar">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search settlements..."
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  className="search-input"
                />
              </div>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="filter-select"
              >
                <option value="">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Failed">Failed</option>
              </select>
              <input
                type="date"
                value={filter.dateFrom}
                onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
                className="date-input"
              />
              <input
                type="date"
                value={filter.dateTo}
                onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
                className="date-input"
              />
            </div>

            <div className="table-card">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Settlement ID</th>
                      <th>Merchant</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Bank Ref</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSettlements.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="empty-row">No settlements found</td>
                      </tr>
                    ) : (
                      filteredSettlements.map((s) => (
                        <tr key={s.id}>
                          <td>#{s.id}</td>
                          <td>{s.merchant}</td>
                          <td>₹{s.amount?.toLocaleString()}</td>
                          <td>{new Date(s.date).toLocaleDateString()}</td>
                          <td>{s.bankRef || 'N/A'}</td>
                          <td>
                            <span className={`status-badge ${s.status?.toLowerCase()}`}>
                              {s.status}
                            </span>
                          </td>
                          <td>
                            <button className="action-btn view" onClick={() => navigate(`/settlements/${s.id}`)}>👁️</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Settlements;