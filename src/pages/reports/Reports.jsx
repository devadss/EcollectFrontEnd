import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';

import DashboardLayout from '../../components/layouts/DashboardLayout'; 
import { reportsApi } from '../../services/api'; 
import './Reports.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const Reports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [data, setData] = useState({
    revenue: [],
    transactions: [],
    merchants: [],
    paymentMethods: [],
    statusDistribution: [],
  });

  // Accent color
  const accent = '#6366f1';
  const accentLight = '#818cf8';
  const accentDark = '#4f46e5';

  useEffect(() => {
    loadReportData();
  }, [reportType, dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getOverview(dateRange);
      setData(res.data || getDefaultData());
    } catch (error) {
      console.error('Error loading reports:', error);
      setData(getDefaultData());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultData = () => ({
    revenue: [12000, 19000, 15000, 25000, 22000, 30000, 28000, 35000, 32000, 40000, 38000, 45000],
    transactions: [45, 52, 38, 65, 58, 72, 68, 85, 78, 92, 88, 105],
    merchants: [10, 12, 15, 18, 22, 25, 28, 32, 36, 40, 44, 48],
    paymentMethods: { labels: ['UPI', 'Credit Card', 'Net Banking', 'Wallet', 'Debit Card'], data: [35, 25, 20, 12, 8] },
    statusDistribution: { labels: ['Success', 'Failed', 'Pending', 'Refunded'], data: [65, 15, 12, 8] },
  });

  // Revenue Chart - Single Color
  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Revenue (₹)',
      data: data.revenue,
      backgroundColor: [
        accent + 'CC', accent + '88', accent + 'CC', accent + '88',
        accent + 'CC', accent + '88', accent + 'CC', accent + '88',
        accent + 'CC', accent + '88', accent + 'CC', accent + 'E6'
      ],
      borderColor: accent,
      borderWidth: 2,
      borderRadius: 8,
      barPercentage: 0.6,
      hoverBackgroundColor: accent,
    }]
  };

  const revenueOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#1a1a2e',
        bodyColor: '#666666',
        cornerRadius: 12,
        padding: 14,
        borderColor: accent + '30',
        borderWidth: 1,
        callbacks: {
          label: (context) => `₹ ${context.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#94a3b8',
          font: { size: 11, weight: '500' },
          callback: (value) => value >= 1000 ? `₹${value/1000}k` : `₹${value}`
        },
        grid: { color: 'rgba(148, 163, 184, 0.12)' }
      },
      x: {
        ticks: { color: '#94a3b8', font: { size: 11, weight: '500' } },
        grid: { display: false }
      }
    }
  };

  // Transaction Growth Chart - Single Color
  const growthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Transactions',
      data: data.transactions,
      borderColor: accent,
      backgroundColor: (context) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return 'rgba(0, 0, 0, 0)';
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, accent + '40');
        gradient.addColorStop(0.5, accent + '15');
        gradient.addColorStop(1, accent + '00');
        return gradient;
      },
      tension: 0.4,
      fill: true,
      pointBackgroundColor: accent,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 3,
      pointRadius: 6,
      pointHoverRadius: 10,
      borderWidth: 3,
    }]
  };

  const growthOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#64748b', font: { size: 12, weight: '500' } }
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#1a1a2e',
        bodyColor: '#666666',
        cornerRadius: 12,
        padding: 14,
        borderColor: accent + '30',
        borderWidth: 1,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#94a3b8', font: { size: 11, weight: '500' } },
        grid: { color: 'rgba(148, 163, 184, 0.12)' }
      },
      x: {
        ticks: { color: '#94a3b8', font: { size: 11, weight: '500' } },
        grid: { display: false }
      }
    }
  };

  // Merchant Growth - Single Color
  const merchantData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Merchants',
      data: data.merchants,
      backgroundColor: [
        accent + 'CC', accent + '88', accent + 'CC', accent + '88',
        accent + 'CC', accent + '88', accent + 'CC', accent + '88',
        accent + 'CC', accent + '88', accent + 'CC', accent + 'E6'
      ],
      borderColor: accent,
      borderWidth: 2,
      borderRadius: 8,
      barPercentage: 0.5,
      hoverBackgroundColor: accent,
    }]
  };

  const merchantOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#1a1a2e',
        bodyColor: '#666666',
        cornerRadius: 12,
        padding: 14,
        borderColor: accent + '30',
        borderWidth: 1,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#94a3b8', font: { size: 11, weight: '500' } },
        grid: { color: 'rgba(148, 163, 184, 0.12)' }
      },
      x: {
        ticks: { color: '#94a3b8', font: { size: 11, weight: '500' } },
        grid: { display: false }
      }
    }
  };

  // Payment Methods - Single Color
  const paymentData = {
    labels: data.paymentMethods.labels || ['UPI', 'Credit Card', 'Net Banking', 'Wallet', 'Debit Card'],
    datasets: [{
      data: data.paymentMethods.data || [35, 25, 20, 12, 8],
      backgroundColor: [
        accent,
        accent + 'CC',
        accent + '99',
        accent + '66',
        accent + '33'
      ],
      borderColor: '#ffffff',
      borderWidth: 4,
      hoverOffset: 15,
    }]
  };

  const paymentOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#64748b',
          padding: 18,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, weight: '500' }
        }
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#1a1a2e',
        bodyColor: '#666666',
        cornerRadius: 12,
        padding: 14,
        borderColor: accent + '30',
        borderWidth: 1,
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed}%`
        }
      }
    }
  };

  // Status Distribution - Single Color
  const statusData = {
    labels: data.statusDistribution.labels || ['Success', 'Failed', 'Pending', 'Refunded'],
    datasets: [{
      data: data.statusDistribution.data || [65, 15, 12, 8],
      backgroundColor: [
        accent,
        accent + 'CC',
        accent + '88',
        accent + '44'
      ],
      borderColor: '#ffffff',
      borderWidth: 4,
      hoverOffset: 15,
    }]
  };

  const statusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#64748b',
          padding: 18,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, weight: '500' }
        }
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#1a1a2e',
        bodyColor: '#666666',
        cornerRadius: 12,
        padding: 14,
        borderColor: accent + '30',
        borderWidth: 1,
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed}%`
        }
      }
    }
  };

  return (
    <DashboardLayout role="softwareadmin">
      <div className="reports-page">
        {/* Header */}
        <div className="page-header">
          <div>
            <div className="header-badge">
              <span className="header-badge-icon">✦</span>
              <span>Analytics Dashboard</span>
            </div>
            <h1 className="page-title">
              <span className="gradient-text">Reports & Analytics</span>
            </h1>
            <p className="page-subtitle">Comprehensive insights and analytics</p>
          </div>
          <div className="header-actions">
            <button className="btn-outline" onClick={() => navigate('/reports/export')}>
              <span className="btn-icon">📥</span> Export Report
            </button>
            <button className="btn-primary" onClick={() => window.print()}>
              <span className="btn-icon">🖨️</span> Print
            </button>
          </div>
        </div>

        {/* Report Type Tabs */}
        <div className="report-tabs">
          <button 
            className={`tab-btn ${reportType === 'overview' ? 'active' : ''}`}
            onClick={() => setReportType('overview')}
          >
            <span className="tab-icon">📊</span> Overview
          </button>
          <button 
            className={`tab-btn ${reportType === 'revenue' ? 'active' : ''}`}
            onClick={() => setReportType('revenue')}
          >
            <span className="tab-icon">💰</span> Revenue
          </button>
          <button 
            className={`tab-btn ${reportType === 'merchants' ? 'active' : ''}`}
            onClick={() => setReportType('merchants')}
          >
            <span className="tab-icon">🏪</span> Merchants
          </button>
          <button 
            className={`tab-btn ${reportType === 'payments' ? 'active' : ''}`}
            onClick={() => setReportType('payments')}
          >
            <span className="tab-icon">💳</span> Payments
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="date-filter">
          <div className="filter-icon">📅</div>
          <label>Date Range</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="date-input"
          />
          <span className="date-separator">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="date-input"
          />
          <button className="btn-primary apply-btn" onClick={loadReportData}>
            Apply Filter
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span>Loading reports...</span>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-card-glow"></div>
                <div className="kpi-icon">💰</div>
                <div className="kpi-info">
                  <span className="kpi-label">Total Revenue</span>
                  <span className="kpi-value">₹{data.revenue.reduce((a, b) => a + b, 0).toLocaleString()}</span>
                  <span className="kpi-change up">↑ 18.5% from last period</span>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-card-glow"></div>
                <div className="kpi-icon">💳</div>
                <div className="kpi-info">
                  <span className="kpi-label">Total Transactions</span>
                  <span className="kpi-value">{data.transactions.reduce((a, b) => a + b, 0)}</span>
                  <span className="kpi-change up">↑ 12.3% from last period</span>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-card-glow"></div>
                <div className="kpi-icon">🏪</div>
                <div className="kpi-info">
                  <span className="kpi-label">Active Merchants</span>
                  <span className="kpi-value">{data.merchants[data.merchants.length - 1] || 0}</span>
                  <span className="kpi-change up">↑ 8.7% from last period</span>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-card-glow"></div>
                <div className="kpi-icon">✅</div>
                <div className="kpi-info">
                  <span className="kpi-label">Success Rate</span>
                  <span className="kpi-value">{(data.statusDistribution.data[0] || 65)}%</span>
                  <span className="kpi-change up">↑ 2.5% from last period</span>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="charts-grid">
              <div className="chart-card large">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">
                      <span className="gradient-text">Revenue</span> Overview
                    </div>
                    <div className="chart-subtitle">Monthly revenue trend</div>
                  </div>
                  <div className="chart-badge">📈 +23%</div>
                </div>
                <div className="chart-wrapper">
                  <Bar data={revenueData} options={revenueOptions} />
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">
                      <span className="gradient-text">Transaction</span> Growth
                    </div>
                    <div className="chart-subtitle">Monthly transaction volume</div>
                  </div>
                </div>
                <div className="chart-wrapper">
                  <Line data={growthData} options={growthOptions} />
                </div>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">
                      <span className="gradient-text">Merchant</span> Growth
                    </div>
                    <div className="chart-subtitle">New merchants per month</div>
                  </div>
                </div>
                <div className="chart-wrapper">
                  <Bar data={merchantData} options={merchantOptions} />
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">
                      <span className="gradient-text">Payment</span> Methods
                    </div>
                    <div className="chart-subtitle">Distribution by method</div>
                  </div>
                </div>
                <div className="chart-wrapper">
                  <Doughnut data={paymentData} options={paymentOptions} />
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">
                      <span className="gradient-text">Status</span> Distribution
                    </div>
                    <div className="chart-subtitle">Transaction status breakdown</div>
                  </div>
                </div>
                <div className="chart-wrapper">
                  <Pie data={statusData} options={statusOptions} />
                </div>
              </div>
            </div>

            {/* Summary Table */}
            <div className="summary-card">
              <div className="summary-header">
                <div>
                  <h3>📊 Monthly Summary</h3>
                  <span className="summary-subtitle">Detailed breakdown by month</span>
                </div>
                <button className="btn-outline small">View All →</button>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Revenue</th>
                      <th>Transactions</th>
                      <th>Merchants</th>
                      <th>Growth %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.revenue.map((rev, i) => (
                      <tr key={i}>
                        <td>
                          <span className="month-name">
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                          </span>
                        </td>
                        <td>
                          <span className="tx-amount">₹{rev.toLocaleString()}</span>
                        </td>
                        <td>{data.transactions[i] || 0}</td>
                        <td>{data.merchants[i] || 0}</td>
                        <td>
                          <span className={`growth-badge ${i > 0 && rev > data.revenue[i-1] ? 'positive' : 'negative'}`}>
                            {i > 0 ? `${((rev - data.revenue[i-1]) / data.revenue[i-1] * 100).toFixed(1)}%` : '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Reports;