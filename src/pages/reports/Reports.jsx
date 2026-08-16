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
import LoadingAnimation from '../../components/common/LoadingAnimation';
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

// SVG Icons
const Icons = {
  Revenue: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Transactions: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Merchants: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Success: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" />
    </svg>
  ),
  TrendingUp: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Download: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Printer: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M18 9H6" />
      <path d="M18 9H6" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" rx="1" />
    </svg>
  ),
};

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
      }, 500);
    }
  };

  const getDefaultData = () => ({
    revenue: [12000, 19000, 15000, 25000, 22000, 30000, 28000, 35000, 32000, 40000, 38000, 45000],
    transactions: [45, 52, 38, 65, 58, 72, 68, 85, 78, 92, 88, 105],
    merchants: [10, 12, 15, 18, 22, 25, 28, 32, 36, 40, 44, 48],
    paymentMethods: { labels: ['UPI', 'Credit Card', 'Net Banking', 'Wallet', 'Debit Card'], data: [35, 25, 20, 12, 8] },
    statusDistribution: { labels: ['Success', 'Failed', 'Pending', 'Refunded'], data: [65, 15, 12, 8] },
  });

  // Revenue Chart
  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Revenue (₹)',
      data: data.revenue,
      backgroundColor: data.revenue.map((_, i) => {
        const colors = ['#8b5cf6', '#06b6d4', '#6366f1', '#10b981'];
        return colors[i % 4] + 'E6';
      }),
      borderColor: data.revenue.map((_, i) => {
        const colors = ['#8b5cf6', '#06b6d4', '#6366f1', '#10b981'];
        return colors[i % 4];
      }),
      borderWidth: 2,
      borderRadius: 8,
      barPercentage: 0.55,
      hoverBackgroundColor: data.revenue.map((_, i) => {
        const colors = ['#8b5cf6', '#06b6d4', '#6366f1', '#10b981'];
        return colors[i % 4];
      }),
    }]
  };

  const revenueOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a2e',
        titleColor: '#ffffff',
        bodyColor: 'rgba(255,255,255,0.7)',
        cornerRadius: 12,
        padding: 14,
        borderColor: 'rgba(139, 92, 246, 0.2)',
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
          color: 'rgba(255,255,255,0.3)',
          font: { size: 11, weight: '600' },
          callback: (value) => value >= 1000 ? `₹${value/1000}k` : `₹${value}`
        },
        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }
      },
      x: {
        ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 11, weight: '600' } },
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
      borderColor: '#8b5cf6',
      backgroundColor: (context) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return 'rgba(0,0,0,0)';
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.35)');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
        return gradient;
      },
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#8b5cf6',
      pointBorderColor: '#0a0a14',
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
        labels: { 
          color: 'rgba(255,255,255,0.5)',
          font: { size: 12, weight: '600' },
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      tooltip: {
        backgroundColor: '#1a1a2e',
        titleColor: '#ffffff',
        bodyColor: 'rgba(255,255,255,0.7)',
        cornerRadius: 12,
        padding: 14,
        borderColor: 'rgba(139, 92, 246, 0.2)',
        borderWidth: 1,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 11, weight: '600' } },
        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }
      },
      x: {
        ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 11, weight: '600' } },
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
      backgroundColor: data.merchants.map((_, i) => {
        const colors = ['#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6'];
        return colors[i % 4] + 'CC';
      }),
      borderColor: data.merchants.map((_, i) => {
        const colors = ['#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6'];
        return colors[i % 4];
      }),
      borderWidth: 2,
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
        backgroundColor: '#1a1a2e',
        titleColor: '#ffffff',
        bodyColor: 'rgba(255,255,255,0.7)',
        cornerRadius: 12,
        padding: 14,
        borderColor: 'rgba(6, 182, 212, 0.2)',
        borderWidth: 1,
        callbacks: {
          label: (context) => ` Merchants: ${context.parsed.y}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 11, weight: '600' } },
        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }
      },
      x: {
        ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 11, weight: '600' } },
        grid: { display: false }
      }
    }
  };

  // Payment Methods Doughnut
  const paymentData = {
    labels: data.paymentMethods?.labels || ['UPI', 'Credit Card', 'Net Banking', 'Wallet', 'Debit Card'],
    datasets: [{
      data: data.paymentMethods?.data || [35, 25, 20, 12, 8],
      backgroundColor: ['#8b5cf6', '#06b6d4', '#6366f1', '#10b981', '#f59e0b'],
      borderColor: '#0a0a14',
      borderWidth: 4,
      hoverOffset: 12,
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
          color: 'rgba(255,255,255,0.5)',
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, weight: '600' },
          boxWidth: 8,
          boxHeight: 8,
        }
      },
      tooltip: {
        backgroundColor: '#1a1a2e',
        titleColor: '#ffffff',
        bodyColor: 'rgba(255,255,255,0.7)',
        cornerRadius: 12,
        padding: 14,
        borderColor: 'rgba(139, 92, 246, 0.2)',
        borderWidth: 1,
        callbacks: {
          label: (context) => ` ${context.label}: ${context.parsed}%`
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
      borderColor: '#0a0a14',
      borderWidth: 4,
      hoverOffset: 12,
    }]
  };

  const statusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'rgba(255,255,255,0.5)',
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, weight: '600' },
          boxWidth: 8,
          boxHeight: 8,
        }
      },
      tooltip: {
        backgroundColor: '#1a1a2e',
        titleColor: '#ffffff',
        bodyColor: 'rgba(255,255,255,0.7)',
        cornerRadius: 12,
        padding: 14,
        borderColor: 'rgba(139, 92, 246, 0.2)',
        borderWidth: 1,
        callbacks: {
          label: (context) => ` ${context.label}: ${context.parsed}%`
        }
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout pageTitle="Reports Telemetry">
        <LoadingAnimation 
          message="Generating analytics telemetry" 
          type="coin" 
          size="medium"
        />
      </DashboardLayout>
    );
  }

  const totalRevenue = (data.revenue || []).reduce((a, b) => a + b, 0);
  const totalTransactions = (data.transactions || []).reduce((a, b) => a + b, 0);
  const latestMerchants = data.merchants[data.merchants.length - 1] || 0;
  const successRate = data.statusDistribution?.data?.[0] || 65;

  return (
    <DashboardLayout pageTitle="Reports Telemetry">
      <div className="reports-page">
        
        {/* Header */}
        <div className="page-header">
          <div>
            <div className="header-badge" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
              <span className="pulse-dot"></span>
              <Icons.Sparkles />
              <span>System Telemetry & Insights</span>
            </div>
            <h1 className="page-title" style={{ color: '#ffffff' }}>
              Reports & <span className="gradient-text" style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}>Analytics</span>
            </h1>
            <p className="page-subtitle" style={{ color: 'rgba(255,255,255,0.4)' }}>Comprehensive performance metrics and financial breakdown</p>
          </div>
          <div className="header-actions">
            <button className="btn-outline-action" onClick={() => navigate('/reports/export')}>
              <Icons.Download />
              <span>Export CSV</span>
            </button>
            <button className="btn-primary-gradient" onClick={() => window.print()}>
              <Icons.Printer />
              <span>Print Report</span>
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
            <Icons.Calendar />
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

        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="kpi-icon-box cyan"><Icons.Revenue /></div>
            <div className="kpi-info">
              <span className="kpi-label" style={{ color: 'rgba(255,255,255,0.4)' }}>Total Revenue</span>
              <span className="kpi-value" style={{ color: '#06b6d4' }}>₹{totalRevenue.toLocaleString()}</span>
              <span className="kpi-change up" style={{ color: '#10b981' }}>↑ 18.5% from last period</span>
            </div>
          </div>

          <div className="kpi-card" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="kpi-icon-box purple"><Icons.Transactions /></div>
            <div className="kpi-info">
              <span className="kpi-label" style={{ color: 'rgba(255,255,255,0.4)' }}>Total Transactions</span>
              <span className="kpi-value" style={{ color: '#8b5cf6' }}>{totalTransactions}</span>
              <span className="kpi-change up" style={{ color: '#10b981' }}>↑ 12.3% from last period</span>
            </div>
          </div>

          <div className="kpi-card" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="kpi-icon-box blue"><Icons.Merchants /></div>
            <div className="kpi-info">
              <span className="kpi-label" style={{ color: 'rgba(255,255,255,0.4)' }}>Active Merchants</span>
              <span className="kpi-value" style={{ color: '#3b82f6' }}>{latestMerchants}</span>
              <span className="kpi-change up" style={{ color: '#10b981' }}>↑ 8.7% from last period</span>
            </div>
          </div>

          <div className="kpi-card" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="kpi-icon-box green"><Icons.Success /></div>
            <div className="kpi-info">
              <span className="kpi-label" style={{ color: 'rgba(255,255,255,0.4)' }}>Success Rate</span>
              <span className="kpi-value" style={{ color: '#10b981' }}>{successRate}%</span>
              <span className="kpi-change up" style={{ color: '#10b981' }}>↑ 2.5% from last period</span>
            </div>
          </div>
        </div>

        {/* Row 1 Charts */}
        <div className="charts-grid-two">
          <div className="chart-card large" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="chart-header">
              <div>
                <div className="chart-title" style={{ color: '#ffffff' }}>Revenue <span className="gradient-text" style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}>Overview</span></div>
                <div className="chart-subtitle" style={{ color: 'rgba(255,255,255,0.3)' }}>Monthly revenue trend</div>
              </div>
              <div className="chart-badge-pill" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
                <Icons.TrendingUp />
                <span>+23%</span>
              </div>
            </div>
            <div className="chart-wrapper">
              <Bar data={revenueData} options={revenueOptions} />
            </div>
          </div>

          <div className="chart-card" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="chart-header">
              <div>
                <div className="chart-title" style={{ color: '#ffffff' }}>Transaction <span className="gradient-text" style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}>Growth</span></div>
                <div className="chart-subtitle" style={{ color: 'rgba(255,255,255,0.3)' }}>Monthly transaction volume trajectory</div>
              </div>
            </div>
            <div className="chart-wrapper">
              <Line data={growthData} options={growthOptions} />
            </div>
          </div>
        </div>

        {/* Row 2 Charts */}
        <div className="charts-grid-three">
          <div className="chart-card" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="chart-header">
              <div>
                <div className="chart-title" style={{ color: '#ffffff' }}>Merchant <span className="gradient-text" style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>Growth</span></div>
                <div className="chart-subtitle" style={{ color: 'rgba(255,255,255,0.3)' }}>New merchants onboarded</div>
              </div>
            </div>
            <div className="chart-wrapper">
              <Bar data={merchantData} options={merchantOptions} />
            </div>
          </div>

          <div className="chart-card" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="chart-header">
              <div>
                <div className="chart-title" style={{ color: '#ffffff' }}>Payment <span className="gradient-text" style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}>Methods</span></div>
                <div className="chart-subtitle" style={{ color: 'rgba(255,255,255,0.3)' }}>Channel share</div>
              </div>
            </div>
            <div className="chart-wrapper">
              <Doughnut data={paymentData} options={paymentOptions} />
            </div>
          </div>

          <div className="chart-card" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="chart-header">
              <div>
                <div className="chart-title" style={{ color: '#ffffff' }}>Status <span className="gradient-text" style={{ background: 'linear-gradient(135deg, #10b981, #8b5cf6)' }}>Distribution</span></div>
                <div className="chart-subtitle" style={{ color: 'rgba(255,255,255,0.3)' }}>Transaction status ratio</div>
              </div>
            </div>
            <div className="chart-wrapper">
              <Pie data={statusData} options={statusOptions} />
            </div>
          </div>
        </div>

        {/* Summary Table */}
        <div className="table-card" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="table-header">
            <div>
              <div className="table-title-text" style={{ color: '#ffffff' }}>📊 Monthly Financial Audit</div>
              <div className="table-subtitle" style={{ color: 'rgba(255,255,255,0.3)' }}>Detailed telemetry breakdown by month</div>
            </div>
          </div>
          
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ color: 'rgba(255,255,255,0.4)', borderBottomColor: 'rgba(255,255,255,0.06)' }}>Month</th>
                  <th style={{ color: 'rgba(255,255,255,0.4)', borderBottomColor: 'rgba(255,255,255,0.06)' }}>Revenue (₹)</th>
                  <th style={{ color: 'rgba(255,255,255,0.4)', borderBottomColor: 'rgba(255,255,255,0.06)' }}>Transactions</th>
                  <th style={{ color: 'rgba(255,255,255,0.4)', borderBottomColor: 'rgba(255,255,255,0.06)' }}>Active Merchants</th>
                  <th style={{ color: 'rgba(255,255,255,0.4)', borderBottomColor: 'rgba(255,255,255,0.06)' }}>Growth Trajectory</th>
                </tr>
              </thead>
              <tbody>
                {(data.revenue || []).map((rev, i) => {
                  const prevRev = i > 0 ? data.revenue[i-1] : rev;
                  const growth = i > 0 ? ((rev - prevRev) / prevRev * 100) : 0;
                  return (
                    <tr key={i} className="table-row-hover">
                      <td>
                        <span className="month-name-badge" style={{ background: 'rgba(139, 92, 246, 0.08)', color: '#8b5cf6' }}>
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                        </span>
                      </td>
                      <td>
                        <span className="revenue-val" style={{ color: '#ffffff' }}>₹{rev.toLocaleString()}</span>
                      </td>
                      <td style={{ color: 'rgba(255,255,255,0.7)' }}>{data.transactions[i] || 0}</td>
                      <td style={{ color: 'rgba(255,255,255,0.7)' }}>{data.merchants[i] || 0}</td>
                      <td>
                        <span className={`growth-pill ${i > 0 && rev > data.revenue[i-1] ? 'positive' : 'negative'}`} style={i === 0 ? { 
                          background: 'rgba(255,255,255,0.04)', 
                          color: 'rgba(255,255,255,0.2)' 
                        } : {
                          background: growth > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: growth > 0 ? '#10b981' : '#ef4444'
                        }}>
                          {i > 0 ? `${growth > 0 ? '↑' : '↓'} ${Math.abs(growth).toFixed(1)}%` : '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Reports;