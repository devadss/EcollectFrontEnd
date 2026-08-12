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

  useEffect(() => {
    loadReportData();
  }, [reportType, dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getOverview(dateRange);
      setData(res?.data || getDefaultData());
    } catch (error) {
      console.error('Error loading reports:', error);
      setData(getDefaultData());
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 450);
    }
  };

  const getDefaultData = () => ({
    revenue: [12000, 19000, 15000, 25000, 22000, 30000, 28000, 35000, 32000, 40000, 38000, 45000],
    transactions: [45, 52, 38, 65, 58, 72, 68, 85, 78, 92, 88, 105],
    merchants: [10, 12, 15, 18, 22, 25, 28, 32, 36, 40, 44, 48],
    paymentMethods: { labels: ['UPI', 'Credit Card', 'Net Banking', 'Wallet', 'Debit Card'], data: [35, 25, 20, 12, 8] },
    statusDistribution: { labels: ['Success', 'Failed', 'Pending', 'Refunded'], data: [65, 15, 12, 8] },
  });

  // Revenue Chart - Vibrant Palette
  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Revenue (₹)',
      data: data.revenue,
      backgroundColor: [
        '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
        '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
        '#06b6d4', '#3b82f6', '#6366f1', '#10b981'
      ],
      borderColor: '#06b6d4',
      borderWidth: 1.5,
      borderRadius: 8,
      barPercentage: 0.55,
      hoverBackgroundColor: '#06b6d4',
    }]
  };

  const revenueOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        titleColor: '#ffffff',
        bodyColor: '#cbd5e1',
        cornerRadius: 12,
        padding: 12,
        borderColor: 'rgba(6, 182, 212, 0.3)',
        borderWidth: 1,
        callbacks: {
          label: (context) => ` Revenue: ₹ ${context.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#64748b',
          font: { size: 11, weight: '600' },
          callback: (value) => value >= 1000 ? `₹${value/1000}k` : `₹${value}`
        },
        grid: { color: 'rgba(255, 255, 255, 0.06)' }
      },
      x: {
        ticks: { color: '#64748b', font: { size: 11, weight: '600' } },
        grid: { display: false }
      }
    }
  };

  // Transaction Growth Chart
  const growthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Transactions',
      data: data.transactions,
      borderColor: '#6366f1',
      backgroundColor: (context) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return 'rgba(0,0,0,0)';
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
        return gradient;
      },
      tension: 0.38,
      fill: true,
      pointBackgroundColor: '#6366f1',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 3,
      pointRadius: 5,
      borderWidth: 3,
    }]
  };

  const growthOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#cbd5e1', font: { size: 12, weight: '600' } }
      },
      tooltip: {
        backgroundColor: '#111827',
        titleColor: '#ffffff',
        bodyColor: '#cbd5e1',
        cornerRadius: 12,
        padding: 12,
        borderColor: 'rgba(99, 102, 241, 0.3)',
        borderWidth: 1,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#64748b', font: { size: 11, weight: '600' } },
        grid: { color: 'rgba(255, 255, 255, 0.06)' }
      },
      x: {
        ticks: { color: '#64748b', font: { size: 11, weight: '600' } },
        grid: { display: false }
      }
    }
  };

  // Merchant Growth Chart
  const merchantData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Merchants',
      data: data.merchants,
      backgroundColor: '#3b82f6',
      borderRadius: 6,
      barPercentage: 0.5,
    }]
  };

  const merchantOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        titleColor: '#ffffff',
        bodyColor: '#cbd5e1',
        cornerRadius: 12,
        padding: 12,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#64748b', font: { size: 11, weight: '600' } },
        grid: { color: 'rgba(255, 255, 255, 0.06)' }
      },
      x: {
        ticks: { color: '#64748b', font: { size: 11, weight: '600' } },
        grid: { display: false }
      }
    }
  };

  // Payment Methods Doughnut
  const paymentData = {
    labels: data.paymentMethods?.labels || ['UPI', 'Credit Card', 'Net Banking', 'Wallet', 'Debit Card'],
    datasets: [{
      data: data.paymentMethods?.data || [35, 25, 20, 12, 8],
      backgroundColor: ['#06b6d4', '#6366f1', '#3b82f6', '#8b5cf6', '#ec4899'],
      borderColor: '#111827',
      borderWidth: 4,
    }]
  };

  const paymentOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#cbd5e1',
          padding: 14,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, weight: '600' }
        }
      }
    }
  };

  // Status Distribution Pie
  const statusData = {
    labels: data.statusDistribution?.labels || ['Success', 'Failed', 'Pending', 'Refunded'],
    datasets: [{
      data: data.statusDistribution?.data || [65, 15, 12, 8],
      backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6'],
      borderColor: '#111827',
      borderWidth: 4,
    }]
  };

  const statusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#cbd5e1',
          padding: 14,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, weight: '600' }
        }
      }
    }
  };

  return (
    <DashboardLayout role="softwareadmin" pageTitle="Reports Telemetry">
      <div className="reports-page">
        
        {/* Header */}
        <div className="page-header">
          <div>
            <div className="header-badge">
              <span className="pulse-dot"></span> System Telemetry & Insights
            </div>
            <h1 className="page-title">
              Reports & <span className="gradient-text">Analytics</span>
            </h1>
            <p className="page-subtitle">Comprehensive performance metrics and financial breakdown</p>
          </div>
          <div className="header-actions">
            <button className="btn-outline-action" onClick={() => navigate('/reports/export')}>
              <span>📥 Export CSV</span>
            </button>
            <button className="btn-primary-gradient" onClick={() => window.print()}>
              <span>🖨️ Print Report</span>
            </button>
          </div>
        </div>

        {/* Report Type Tabs */}
        <div className="report-tabs">
          <button 
            className={`tab-btn ${reportType === 'overview' ? 'active' : ''}`}
            onClick={() => setReportType('overview')}
          >
            <span>📊 Overview</span>
          </button>
          <button 
            className={`tab-btn ${reportType === 'revenue' ? 'active' : ''}`}
            onClick={() => setReportType('revenue')}
          >
            <span>💰 Revenue</span>
          </button>
          <button 
            className={`tab-btn ${reportType === 'merchants' ? 'active' : ''}`}
            onClick={() => setReportType('merchants')}
          >
            <span>🏪 Merchants</span>
          </button>
          <button 
            className={`tab-btn ${reportType === 'payments' ? 'active' : ''}`}
            onClick={() => setReportType('payments')}
          >
            <span>💳 Payments</span>
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="date-filter-bar">
          <div className="filter-label-group">
            <span className="filter-icon">📅</span>
            <span>Date Range Filter:</span>
          </div>
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
          <button className="btn-primary-gradient small" onClick={loadReportData}>
            Apply Filter
          </button>
        </div>

        {loading ? (
          <div className="reports-loading-box">
            <div className="spinner"></div>
            <span>Generating Analytics Telemetry...</span>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon-box cyan">💰</div>
                <div className="kpi-info">
                  <span className="kpi-label">Total Revenue</span>
                  <span className="kpi-value text-cyan">₹{(data.revenue || []).reduce((a, b) => a + b, 0).toLocaleString()}</span>
                  <span className="kpi-change up">↑ 18.5% from last period</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-box purple">💳</div>
                <div className="kpi-info">
                  <span className="kpi-label">Total Transactions</span>
                  <span className="kpi-value text-purple">{(data.transactions || []).reduce((a, b) => a + b, 0)}</span>
                  <span className="kpi-change up">↑ 12.3% from last period</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-box blue">🏪</div>
                <div className="kpi-info">
                  <span className="kpi-label">Active Merchants</span>
                  <span className="kpi-value text-blue">{data.merchants[data.merchants.length - 1] || 0}</span>
                  <span className="kpi-change up">↑ 8.7% from last period</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-box green">✅</div>
                <div className="kpi-info">
                  <span className="kpi-label">Success Rate</span>
                  <span className="kpi-value text-green">{(data.statusDistribution?.data?.[0] || 65)}%</span>
                  <span className="kpi-change up">↑ 2.5% from last period</span>
                </div>
              </div>
            </div>

            {/* Row 1 Charts */}
            <div className="charts-grid-two">
              <div className="chart-card large">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">Revenue <span className="gradient-text">Overview</span></div>
                    <div className="chart-subtitle">Monthly revenue trend</div>
                  </div>
                  <div className="chart-badge-pill">📈 +23%</div>
                </div>
                <div className="chart-wrapper">
                  <Bar data={revenueData} options={revenueOptions} />
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">Transaction <span className="gradient-text">Growth</span></div>
                    <div className="chart-subtitle">Monthly transaction volume trajectory</div>
                  </div>
                </div>
                <div className="chart-wrapper">
                  <Line data={growthData} options={growthOptions} />
                </div>
              </div>
            </div>

            {/* Row 2 Charts */}
            <div className="charts-grid-three">
              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">Merchant <span className="gradient-text">Growth</span></div>
                    <div className="chart-subtitle">New merchants onboarded</div>
                  </div>
                </div>
                <div className="chart-wrapper">
                  <Bar data={merchantData} options={merchantOptions} />
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">Payment <span className="gradient-text">Methods</span></div>
                    <div className="chart-subtitle">Channel share</div>
                  </div>
                </div>
                <div className="chart-wrapper">
                  <Doughnut data={paymentData} options={paymentOptions} />
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">Status <span className="gradient-text">Distribution</span></div>
                    <div className="chart-subtitle">Transaction status ratio</div>
                  </div>
                </div>
                <div className="chart-wrapper">
                  <Pie data={statusData} options={statusOptions} />
                </div>
              </div>
            </div>

            {/* Summary Table */}
            <div className="table-card">
              <div className="table-header">
                <div>
                  <div className="table-title-text">📊 Monthly Financial Audit</div>
                  <div className="table-subtitle">Detailed telemetry breakdown by month</div>
                </div>
              </div>
              
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Revenue (₹)</th>
                      <th>Transactions</th>
                      <th>Active Merchants</th>
                      <th>Growth Trajectory</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.revenue || []).map((rev, i) => (
                      <tr key={i} className="table-row-hover">
                        <td>
                          <span className="month-name-badge">
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                          </span>
                        </td>
                        <td>
                          <span className="revenue-val">₹{rev.toLocaleString()}</span>
                        </td>
                        <td>{data.transactions[i] || 0}</td>
                        <td>{data.merchants[i] || 0}</td>
                        <td>
                          <span className={`growth-pill ${i > 0 && rev > data.revenue[i-1] ? 'positive' : 'negative'}`}>
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