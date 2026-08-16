import React, { useMemo, useState, useEffect } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useTheme } from '../../context/ThemeContext';
import { dashboardApi } from '../../services/api';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import './SoftwareAdminDashboard.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

// SVG Icons
const Icons = {
  Merchants: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Agents: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
      <path d="M17 10l2 2 4-4"/>
    </svg>
  ),
  Branches: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Revenue: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  ArrowUp: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  ),
  ArrowDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/>
    </svg>
  ),
  TrendingUp: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  XCircle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  Refresh: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
};

const SoftwareAdminDashboard = () => {
  const { theme, currentTheme } = useTheme();
  const [chartKey, setChartKey] = useState(0);
  const [activeRange, setActiveRange] = useState('Week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for data
  const [stats, setStats] = useState([]);
  const [revenueChart, setRevenueChart] = useState({ labels: [], data: [] });
  const [paymentMethods, setPaymentMethods] = useState({ labels: [], data: [] });
  const [transactionVolume, setTransactionVolume] = useState({ labels: [], data: [] });
  const [statusDistribution, setStatusDistribution] = useState({ labels: [], data: [] });
  const [transactions, setTransactions] = useState([]);

  // Force chart re-render when theme changes
  useEffect(() => {
    setChartKey(prev => prev + 1);
  }, [currentTheme]);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const statsRes = await dashboardApi.getStats();
      const statsData = statsRes.data;
      setStats([
        { 
          label: 'Total Merchants', 
          value: statsData.totalMerchants?.toLocaleString() || '0', 
          icon: <Icons.Merchants />,
          change: statsData.merchantChange || '+12.5%',
          color: '#8b5cf6',
          bgColor: 'rgba(139, 92, 246, 0.12)',
          subtitle: 'Active merchants'
        },
        { 
          label: 'Total Agents', 
          value: statsData.totalAgents?.toLocaleString() || '0', 
          icon: <Icons.Agents />,
          change: statsData.agentChange || '+8.3%',
          color: '#06b6d4',
          bgColor: 'rgba(6, 182, 212, 0.12)',
          subtitle: 'Active agents'
        },
        { 
          label: 'Total Branches', 
          value: statsData.totalBranches?.toLocaleString() || '0', 
          icon: <Icons.Branches />,
          change: statsData.branchChange || '+5.2%',
          color: '#f59e0b',
          bgColor: 'rgba(245, 158, 11, 0.12)',
          subtitle: 'Active branches'
        },
        { 
          label: 'Total Revenue', 
          value: `₹${(statsData.totalRevenue / 100000).toFixed(1)}L` || '₹0', 
          icon: <Icons.Revenue />,
          change: statsData.revenueChange || '+18.7%',
          color: '#10b981',
          bgColor: 'rgba(16, 185, 129, 0.12)',
          subtitle: 'This month'
        },
      ]);

      const revenueRes = await dashboardApi.getRevenueChart(activeRange);
      setRevenueChart({
        labels: revenueRes.data.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        data: revenueRes.data.data || [45000, 52000, 38000, 61000, 48000, 73000, 56000]
      });

      const paymentRes = await dashboardApi.getPaymentMethods();
      setPaymentMethods({
        labels: paymentRes.data.map(d => d.label) || ['Card', 'UPI', 'Net Banking', 'Wallet', 'Debit Card'],
        data: paymentRes.data.map(d => d.value) || [35, 30, 20, 10, 5]
      });

      const volumeRes = await dashboardApi.getTransactionVolume();
      setTransactionVolume({
        labels: volumeRes.data.labels || ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        data: volumeRes.data.data || [1200, 1450, 1100, 1680]
      });

      const statusRes = await dashboardApi.getStatusDistribution();
      setStatusDistribution({
        labels: statusRes.data.map(d => d.label) || ['Successful', 'Failed', 'Pending', 'Refunded'],
        data: statusRes.data.map(d => d.value) || [65, 15, 12, 8]
      });

      const txRes = await dashboardApi.getRecentTransactions(5);
      setTransactions(txRes.data || [
        { id: 'TX-2026-001', merchant: 'TechCorp Pvt Ltd', amount: '1,24,500', status: 'Success', date: 'Aug 15, 2026', time: '2:30 PM' },
        { id: 'TX-2026-002', merchant: 'GreenLeaf Industries', amount: '85,200', status: 'Success', date: 'Aug 15, 2026', time: '1:15 PM' },
        { id: 'TX-2026-003', merchant: 'BlueWave Solutions', amount: '42,800', status: 'Pending', date: 'Aug 14, 2026', time: '4:45 PM' },
        { id: 'TX-2026-004', merchant: 'Sunrise Retail Co', amount: '2,18,900', status: 'Success', date: 'Aug 14, 2026', time: '11:20 AM' },
        { id: 'TX-2026-005', merchant: 'Moonlight Services', amount: '37,600', status: 'Failed', date: 'Aug 13, 2026', time: '9:00 AM' },
      ]);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeRange]);

  // Revenue Bar Chart
  const revenueData = useMemo(() => ({
    labels: revenueChart.labels,
    datasets: [{
      label: 'Revenue (₹)',
      data: revenueChart.data,
      backgroundColor: revenueChart.data.map((_, i) => {
        const alpha = i % 2 === 0 ? 'E6' : 'B3';
        return (theme.accent || '#6366f1') + alpha;
      }),
      borderColor: theme.accent || '#6366f1',
      borderWidth: 2,
      borderRadius: 8,
      barPercentage: 0.6,
      hoverBackgroundColor: theme.accent || '#6366f1',
      hoverBorderColor: theme.bgCard || '#ffffff',
      hoverBorderWidth: 3,
    }]
  }), [revenueChart, theme.accent, theme.bgCard]);

  const revenueOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: theme.bgCard || '#ffffff',
        titleColor: theme.textPrimary || '#0f172a',
        bodyColor: theme.textSecondary || '#475569',
        cornerRadius: 12,
        padding: 14,
        borderColor: (theme.accent || '#6366f1') + '30',
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
          color: theme.textMuted || '#94a3b8',
          font: { size: 11, weight: '600' },
          callback: (value) => value >= 1000 ? `₹${value/1000}k` : `₹${value}`
        },
        grid: { 
          color: (theme.border || '#e2e8f0') + '40',
          drawBorder: false,
        }
      },
      x: {
        ticks: { 
          color: theme.textMuted || '#94a3b8', 
          font: { size: 11, weight: '600' } 
        },
        grid: { display: false }
      }
    }
  }), [theme]);

  // Payment Methods Doughnut
  const paymentData = useMemo(() => ({
    labels: paymentMethods.labels,
    datasets: [{
      data: paymentMethods.data,
      backgroundColor: [
        '#8b5cf6',
        '#06b6d4',
        '#f59e0b',
        '#10b981',
        '#ef4444'
      ],
      borderColor: theme.bgCard || '#ffffff',
      borderWidth: 3,
      hoverOffset: 12,
    }]
  }), [paymentMethods, theme.bgCard]);

  const paymentOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme.textSecondary || '#475569',
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, weight: '600' },
          boxWidth: 8,
          boxHeight: 8,
        }
      },
      tooltip: {
        backgroundColor: theme.bgCard || '#ffffff',
        titleColor: theme.textPrimary || '#0f172a',
        bodyColor: theme.textSecondary || '#475569',
        cornerRadius: 12,
        padding: 12,
        borderColor: (theme.accent || '#6366f1') + '30',
        borderWidth: 1,
        callbacks: {
          label: (context) => ` ${context.label}: ${context.parsed}%`
        }
      }
    }
  }), [theme]);

  // Transaction Volume Line Chart
  const volumeData = useMemo(() => ({
    labels: transactionVolume.labels,
    datasets: [{
      label: 'Transactions',
      data: transactionVolume.data,
      borderColor: theme.accent || '#6366f1',
      backgroundColor: (context) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return 'rgba(0, 0, 0, 0)';
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, (theme.accent || '#6366f1') + '45');
        gradient.addColorStop(0.6, (theme.accent || '#6366f1') + '10');
        gradient.addColorStop(1, (theme.accent || '#6366f1') + '00');
        return gradient;
      },
      tension: 0.4,
      fill: true,
      pointBackgroundColor: (theme.accent || '#6366f1'),
      pointBorderColor: theme.bgCard || '#ffffff',
      pointBorderWidth: 3,
      pointRadius: 6,
      pointHoverRadius: 10,
      borderWidth: 3,
    }]
  }), [transactionVolume, theme.accent, theme.bgCard]);

  const volumeOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { 
          color: theme.textSecondary || '#475569', 
          font: { size: 12, weight: '600' },
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      tooltip: {
        backgroundColor: theme.bgCard || '#ffffff',
        titleColor: theme.textPrimary || '#0f172a',
        bodyColor: theme.textSecondary || '#475569',
        cornerRadius: 12,
        padding: 12,
        borderColor: (theme.accent || '#6366f1') + '30',
        borderWidth: 1,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { 
          color: theme.textMuted || '#94a3b8', 
          font: { size: 11, weight: '600' } 
        },
        grid: { 
          color: (theme.border || '#e2e8f0') + '40',
          drawBorder: false,
        }
      },
      x: {
        ticks: { 
          color: theme.textMuted || '#94a3b8', 
          font: { size: 11, weight: '600' } 
        },
        grid: { display: false }
      }
    }
  }), [theme]);

  // Status Distribution Doughnut
  const statusData = useMemo(() => ({
    labels: statusDistribution.labels,
    datasets: [{
      data: statusDistribution.data,
      backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6'],
      borderColor: theme.bgCard || '#ffffff',
      borderWidth: 3,
      hoverOffset: 12,
    }]
  }), [statusDistribution, theme.bgCard]);

  const statusOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme.textSecondary || '#475569',
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, weight: '600' },
          boxWidth: 8,
          boxHeight: 8,
        }
      },
      tooltip: {
        backgroundColor: theme.bgCard || '#ffffff',
        titleColor: theme.textPrimary || '#0f172a',
        bodyColor: theme.textSecondary || '#475569',
        cornerRadius: 12,
        padding: 12,
        borderColor: (theme.accent || '#6366f1') + '30',
        borderWidth: 1,
        callbacks: {
          label: (context) => ` ${context.label}: ${context.parsed}%`
        }
      }
    }
  }), [theme]);

  const getStatusIcon = (status) => {
    const map = {
      'Success': <Icons.CheckCircle />,
      'Failed': <Icons.XCircle />,
      'Pending': <Icons.AlertCircle />,
      'Refunded': <Icons.Refresh />
    };
    return map[status] || null;
  };

  const getStatusClass = (status) => {
    const map = { 
      'Success': 'success', 
      'Failed': 'failed', 
      'Pending': 'pending', 
      'Refunded': 'refunded' 
    };
    return map[status] || '';
  };

  // Loading state with cute loader
  if (loading) {
    return (
      <DashboardLayout pageTitle="Software Admin Dashboard">
        <LoadingAnimation 
          message="Loading dashboard data" 
          type="coin" 
          size="medium"
        />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout pageTitle="Software Admin Dashboard">
        <div className="error-container" style={{ background: theme.bgPrimary, color: theme.textPrimary }}>
          <p>❌ {error}</p>
          <button onClick={fetchDashboardData} className="retry-btn">Retry</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Software Admin Dashboard">
      <div className="admin-dashboard-container" style={{ background: theme.bgPrimary }}>
        
        {/* Header Section */}
        <div className="dashboard-header">
          <div className="header-left">
            <div className="header-badge" style={{ background: (theme.accent || '#6366f1') + '12', color: theme.accent || '#6366f1' }}>
              <span className="header-badge-pulse"></span>
              <Icons.Sparkles />
              <span>System Control Telemetry</span>
            </div>
            <h1 className="dashboard-title" style={{ color: theme.textPrimary }}>
              Software <span className="gradient-text" style={{ background: `linear-gradient(135deg, ${theme.accent || '#6366f1'}, #06b6d4)` }}>Admin Dashboard</span>
            </h1>
            <p className="dashboard-subtitle" style={{ color: theme.textMuted }}>Real-time overview of merchant operations, revenue, and system activity</p>
          </div>
          
          <div className="header-right">
            <div className="header-stats-mini" style={{ background: (theme.accent || '#6366f1') + '10', color: theme.accent || '#6366f1' }}>
              <Icons.TrendingUp />
              <span>+23.4% Growth</span>
            </div>
            <span className="date-badge" style={{ 
              background: theme.bgCard,
              color: theme.textSecondary,
              borderColor: theme.border,
            }}>
              <Icons.Calendar />
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Stats Cards Grid - Removed rounded items */}
        <div className="stats-grid">
          {stats.map((stat, i) => (
            <div key={i} className="stat-card" style={{ 
              background: theme.bgCard,
              borderColor: theme.border,
            }}>
              <div className="stat-glow" style={{ background: `radial-gradient(circle, ${stat.color}20 0%, transparent 70%)` }}></div>
              
              <div className="stat-top">
                <div className="stat-icon" style={{ background: stat.bgColor, color: stat.color }}>
                  {stat.icon}
                </div>
                <div className="stat-trend" style={{ background: stat.color + '15', color: stat.color }}>
                  {stat.change.startsWith('+') ? <Icons.ArrowUp /> : <Icons.ArrowDown />}
                  {stat.change}
                </div>
              </div>

              <div className="stat-main">
                <div className="stat-value" style={{ color: theme.textPrimary }}>{stat.value}</div>
                <div className="stat-label" style={{ color: theme.textMuted }}>{stat.label}</div>
              </div>

              <div className="stat-footer" style={{ borderTopColor: (theme.border || '#e2e8f0') + '60' }}>
                <span className="stat-subtitle" style={{ color: theme.textMuted }}>{stat.subtitle}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="charts-row">
          <div className="chart-card" style={{ 
            background: theme.bgCard,
            borderColor: theme.border,
          }}>
            <div className="chart-header">
              <div>
                <div className="chart-title" style={{ color: theme.textPrimary }}>
                  Revenue <span className="title-accent" style={{ color: theme.accent || '#6366f1' }}>Overview</span>
                </div>
                <div className="chart-subtitle" style={{ color: theme.textMuted }}>Weekly settlement volume breakdown</div>
              </div>
              <div className="chart-actions">
                {['Week', 'Month', 'Year'].map((range) => (
                  <button 
                    key={range}
                    className={`chart-btn ${activeRange === range ? 'active' : ''}`}
                    onClick={() => setActiveRange(range)}
                    style={activeRange === range ? { 
                      background: theme.accent || '#6366f1', 
                      borderColor: theme.accent || '#6366f1', 
                      color: '#ffffff' 
                    } : { 
                      color: theme.textMuted, 
                      borderColor: theme.border 
                    }}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div className="chart-wrapper">
              <Bar key={`bar-${chartKey}`} data={revenueData} options={revenueOptions} />
            </div>
          </div>

          <div className="chart-card" style={{ 
            background: theme.bgCard,
            borderColor: theme.border,
          }}>
            <div className="chart-header">
              <div>
                <div className="chart-title" style={{ color: theme.textPrimary }}>
                  Payment <span className="title-accent" style={{ color: theme.accent || '#6366f1' }}>Methods</span>
                </div>
                <div className="chart-subtitle" style={{ color: theme.textMuted }}>Channel distribution ratio</div>
              </div>
            </div>
            <div className="chart-wrapper">
              <Doughnut key={`doughnut-${chartKey}`} data={paymentData} options={paymentOptions} />
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="charts-row">
          <div className="chart-card" style={{ 
            background: theme.bgCard,
            borderColor: theme.border,
          }}>
            <div className="chart-header">
              <div>
                <div className="chart-title" style={{ color: theme.textPrimary }}>
                  Transaction <span className="title-accent" style={{ color: theme.accent || '#6366f1' }}>Volume</span>
                </div>
                <div className="chart-subtitle" style={{ color: theme.textMuted }}>Monthly processing volume trajectory</div>
              </div>
            </div>
            <div className="chart-wrapper">
              <Line key={`line-${chartKey}`} data={volumeData} options={volumeOptions} />
            </div>
          </div>

          <div className="chart-card" style={{ 
            background: theme.bgCard,
            borderColor: theme.border,
          }}>
            <div className="chart-header">
              <div>
                <div className="chart-title" style={{ color: theme.textPrimary }}>
                  Status <span className="title-accent" style={{ color: theme.accent || '#6366f1' }}>Distribution</span>
                </div>
                <div className="chart-subtitle" style={{ color: theme.textMuted }}>Success vs. failure telemetry</div>
              </div>
            </div>
            <div className="chart-wrapper">
              <Doughnut key={`status-${chartKey}`} data={statusData} options={statusOptions} />
            </div>
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="table-card" style={{ 
          background: theme.bgCard,
          borderColor: theme.border,
        }}>
          <div className="table-header">
            <div>
              <div className="table-title" style={{ color: theme.textPrimary }}>
                Recent <span className="title-accent" style={{ color: theme.accent || '#6366f1' }}>Transactions</span>
              </div>
              <div className="table-subtitle" style={{ color: theme.textMuted }}>Live settlement audit log</div>
            </div>
            <a href="#viewall" className="view-all-link" style={{ color: theme.accent || '#6366f1' }}>
              <span>View All Log</span>
              <span className="view-all-arrow">→</span>
            </a>
          </div>
          
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ color: theme.textMuted, borderBottomColor: theme.border }}>Transaction ID</th>
                  <th style={{ color: theme.textMuted, borderBottomColor: theme.border }}>Merchant</th>
                  <th style={{ color: theme.textMuted, borderBottomColor: theme.border }}>Amount</th>
                  <th style={{ color: theme.textMuted, borderBottomColor: theme.border }}>Status</th>
                  <th style={{ color: theme.textMuted, borderBottomColor: theme.border }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr key={i} className="table-row">
                    <td>
                      <span className="tx-badge" style={{ color: theme.textPrimary, background: (theme.border || '#e2e8f0') + '30' }}>
                        {tx.id}
                      </span>
                    </td>
                    <td style={{ color: theme.textSecondary, fontWeight: '600' }}>{tx.merchant}</td>
                    <td>
                      <span className="tx-amount" style={{ color: theme.textPrimary }}>₹{tx.amount}</span>
                    </td>
                    <td>
                      <span className={`status-pill ${getStatusClass(tx.status)}`}>
                        {getStatusIcon(tx.status)}
                        {tx.status}
                      </span>
                    </td>
                    <td>
                      <div className="tx-date" style={{ color: theme.textPrimary }}>{tx.date}</div>
                      <div className="tx-time" style={{ color: theme.textMuted }}><Icons.Clock /> {tx.time}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default SoftwareAdminDashboard;