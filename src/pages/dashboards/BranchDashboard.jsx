import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
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
import './BranchDashboard.css';

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
  Merchants: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Agents: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
      <path d="M17 10l2 2 4-4" />
    </svg>
  ),
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
  Building: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="9" y1="6" x2="15" y2="6" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <line x1="9" y1="14" x2="15" y2="14" />
      <line x1="9" y1="18" x2="12" y2="18" />
    </svg>
  ),
  Location: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  User: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" />
    </svg>
  ),
  Calendar: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  TrendingUp: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
};

const BranchDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState('Week');

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { 
      label: 'Branch Merchants', 
      value: '89', 
      icon: <Icons.Merchants />,
      change: '+12.5%',
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.12)',
    },
    { 
      label: 'Branch Agents', 
      value: '34', 
      icon: <Icons.Agents />,
      change: '+8.3%',
      color: '#06b6d4',
      bgColor: 'rgba(6, 182, 212, 0.12)',
    },
    { 
      label: 'Branch Revenue', 
      value: '₹18.2L', 
      icon: <Icons.Revenue />,
      change: '+18.7%',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.12)',
    },
    { 
      label: 'Transactions', 
      value: '567', 
      icon: <Icons.Transactions />,
      change: '+5.2%',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.12)',
    },
  ];

  // Revenue Bar Chart Data
  const revenueData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Revenue (₹)',
      data: [32000, 45000, 28000, 56000, 41000, 68000, 49000],
      backgroundColor: ['#8b5cf6', '#8b5cf6', '#8b5cf6', '#8b5cf6', '#8b5cf6', '#8b5cf6', '#8b5cf6'].map((c, i) => 
        i % 2 === 0 ? c + 'CC' : c + '88'
      ),
      borderColor: '#8b5cf6',
      borderWidth: 2,
      borderRadius: 6,
      barPercentage: 0.55,
    }]
  };

  const revenueOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        titleColor: '#ffffff',
        bodyColor: 'rgba(255,255,255,0.7)',
        cornerRadius: 10,
        padding: 12,
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
          color: 'rgba(255,255,255,0.25)',
          font: { size: 10, weight: '500' },
          callback: (value) => value >= 1000 ? `₹${value/1000}k` : `₹${value}`
        },
        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }
      },
      x: {
        ticks: { color: 'rgba(255,255,255,0.25)', font: { size: 10, weight: '500' } },
        grid: { display: false }
      }
    }
  };

  // Transaction Volume Line Chart
  const volumeData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      label: 'Transactions',
      data: [120, 145, 98, 167],
      borderColor: '#06b6d4',
      backgroundColor: (context) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return 'rgba(0, 0, 0, 0)';
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.30)');
        gradient.addColorStop(0.6, 'rgba(6, 182, 212, 0.08)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
        return gradient;
      },
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#06b6d4',
      pointBorderColor: '#0a0a14',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 8,
      borderWidth: 2.5,
    }]
  };

  const volumeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { 
          color: 'rgba(255,255,255,0.4)',
          font: { size: 11, weight: '500' },
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        titleColor: '#ffffff',
        bodyColor: 'rgba(255,255,255,0.7)',
        cornerRadius: 10,
        padding: 12,
        borderColor: 'rgba(6, 182, 212, 0.2)',
        borderWidth: 1,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: 'rgba(255,255,255,0.25)', font: { size: 10, weight: '500' } },
        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }
      },
      x: {
        ticks: { color: 'rgba(255,255,255,0.25)', font: { size: 10, weight: '500' } },
        grid: { display: false }
      }
    }
  };

  // Payment Methods Doughnut
  const paymentData = {
    labels: ['UPI', 'Credit Card', 'Net Banking', 'Wallet', 'Debit Card'],
    datasets: [{
      data: [35, 25, 20, 12, 8],
      backgroundColor: ['#8b5cf6', '#06b6d4', '#6366f1', '#10b981', '#f59e0b'],
      borderColor: '#0a0a14',
      borderWidth: 3,
      hoverOffset: 10,
    }]
  };

  const paymentOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'rgba(255,255,255,0.4)',
          padding: 14,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 11, weight: '500' },
          boxWidth: 8,
          boxHeight: 8,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        titleColor: '#ffffff',
        bodyColor: 'rgba(255,255,255,0.7)',
        cornerRadius: 10,
        padding: 12,
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
      <DashboardLayout pageTitle="Branch Dashboard">
        <LoadingAnimation message="Loading branch dashboard" type="coin" size="medium" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Branch Dashboard">
      <div className="branch-dashboard-container">
        
        {/* Header */}
        <div className="branch-dashboard-header">
          <div>
            <div className="branch-header-badge">
              <Icons.Sparkles />
              <span>Branch Control Panel</span>
            </div>
            <h1 className="branch-dashboard-title">
              Branch <span className="branch-title-gradient">Admin</span> Dashboard
            </h1>
            <p className="branch-dashboard-subtitle">Manage your branch operations, agents, and revenue</p>
          </div>
          <div className="branch-header-date">
            <Icons.Calendar />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="branch-stats-grid">
          {stats.map((stat, i) => (
            <div key={i} className="branch-stat-card">
              <div className="branch-stat-glow" style={{ background: `radial-gradient(circle at 70% 30%, ${stat.color}20 0%, transparent 70%)` }}></div>
              <div className="branch-stat-top">
                <div className="branch-stat-icon" style={{ background: stat.bgColor, color: stat.color }}>
                  {stat.icon}
                </div>
                <div className="branch-stat-change" style={{ background: stat.color + '15', color: stat.color }}>
                  ↑ {stat.change}
                </div>
              </div>
              <div className="branch-stat-value">{stat.value}</div>
              <div className="branch-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Branch Info */}
        <div className="branch-info-bar">
          <div className="branch-info-item">
            <Icons.Building />
            <span>Mumbai Central Branch</span>
          </div>
          <div className="branch-info-divider"></div>
          <div className="branch-info-item">
            <Icons.Location />
            <span>Mumbai, Maharashtra</span>
          </div>
          <div className="branch-info-divider"></div>
          <div className="branch-info-item">
            <Icons.User />
            <span>Manager: Rajesh Kumar</span>
          </div>
          <div className="branch-info-divider"></div>
          <div className="branch-info-item growth">
            <Icons.TrendingUp />
            <span>↑ 12.5% Growth</span>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="branch-charts-row">
          <div className="branch-chart-card">
            <div className="branch-chart-header">
              <div>
                <div className="branch-chart-title">Revenue <span className="branch-title-gradient">Overview</span></div>
                <div className="branch-chart-subtitle">Weekly revenue breakdown</div>
              </div>
              <div className="branch-chart-range">
                {['Week', 'Month', 'Year'].map((range) => (
                  <button 
                    key={range}
                    className={`branch-range-btn ${activeRange === range ? 'active' : ''}`}
                    onClick={() => setActiveRange(range)}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div className="branch-chart-wrapper">
              <Bar data={revenueData} options={revenueOptions} />
            </div>
          </div>

          <div className="branch-chart-card">
            <div className="branch-chart-header">
              <div>
                <div className="branch-chart-title">Transaction <span className="branch-title-gradient">Volume</span></div>
                <div className="branch-chart-subtitle">Monthly processing trajectory</div>
              </div>
            </div>
            <div className="branch-chart-wrapper">
              <Line data={volumeData} options={volumeOptions} />
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="branch-charts-row">
          <div className="branch-chart-card">
            <div className="branch-chart-header">
              <div>
                <div className="branch-chart-title">Payment <span className="branch-title-gradient">Methods</span></div>
                <div className="branch-chart-subtitle">Channel distribution ratio</div>
              </div>
            </div>
            <div className="branch-chart-wrapper" style={{ height: '220px' }}>
              <Doughnut data={paymentData} options={paymentOptions} />
            </div>
          </div>

          <div className="branch-chart-card">
            <div className="branch-chart-header">
              <div>
                <div className="branch-chart-title">Quick <span className="branch-title-gradient">Stats</span></div>
                <div className="branch-chart-subtitle">At a glance metrics</div>
              </div>
            </div>
            <div className="branch-quick-stats">
              <div className="branch-quick-stat">
                <span className="branch-quick-stat-value">₹18.2L</span>
                <span className="branch-quick-stat-label">Total Revenue</span>
              </div>
              <div className="branch-quick-stat">
                <span className="branch-quick-stat-value">567</span>
                <span className="branch-quick-stat-label">Transactions</span>
              </div>
              <div className="branch-quick-stat">
                <span className="branch-quick-stat-value">89</span>
                <span className="branch-quick-stat-label">Merchants</span>
              </div>
              <div className="branch-quick-stat">
                <span className="branch-quick-stat-value">34</span>
                <span className="branch-quick-stat-label">Agents</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default BranchDashboard;