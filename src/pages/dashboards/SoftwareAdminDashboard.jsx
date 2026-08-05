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

const SoftwareAdminDashboard = () => {
  const { theme, currentTheme } = useTheme();
  const [chartKey, setChartKey] = useState(0);

  // Force chart re-render when theme changes
  useEffect(() => {
    setChartKey(prev => prev + 1);
  }, [currentTheme]);

  // ============================================================
  // STATS DATA
  // ============================================================
  const stats = [
    { 
      label: 'Total Merchants', 
      value: '1,234', 
      icon: '🏪', 
      change: '+12.5%',
      color: theme.accent,
      bgColor: theme.accent + '15',
      subtitle: 'Active merchants'
    },
    { 
      label: 'Total Agents', 
      value: '456', 
      icon: '👤', 
      change: '+8.3%',
      color: theme.accent,
      bgColor: theme.accent + '15',
      subtitle: 'Active agents'
    },
    { 
      label: 'Total Branches', 
      value: '89', 
      icon: '🏢', 
      change: '+5.2%',
      color: theme.accent,
      bgColor: theme.accent + '15',
      subtitle: 'Active branches'
    },
    { 
      label: 'Total Revenue', 
      value: '₹45.6L', 
      icon: '💰', 
      change: '+18.7%',
      color: theme.accent,
      bgColor: theme.accent + '15',
      subtitle: 'This month'
    },
  ];

  // ============================================================
  // 1. REVENUE BAR CHART - With Theme Colors
  // ============================================================
  const revenueData = useMemo(() => ({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Revenue (₹)',
      data: [12000, 19000, 15000, 25000, 22000, 30000, 28000],
      backgroundColor: [
        theme.accent + 'D9',
        theme.accent + '99',
        theme.accent + 'D9',
        theme.accent + '99',
        theme.accent + 'D9',
        theme.accent + '99',
        theme.accent + 'E6'
      ],
      borderColor: theme.accent,
      borderWidth: 3,
      borderRadius: 10,
      barPercentage: 0.65,
      hoverBackgroundColor: theme.accent,
      hoverBorderColor: theme.bgCard,
      hoverBorderWidth: 4,
    }]
  }), [theme.accent]);

  const revenueOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: theme.bgCard,
        titleColor: theme.textPrimary,
        bodyColor: theme.textSecondary,
        cornerRadius: 16,
        padding: 16,
        borderColor: theme.accent + '30',
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
          color: theme.textMuted,
          font: { size: 12, weight: '500' },
          callback: (value) => value >= 1000 ? `₹${value/1000}k` : `₹${value}`
        },
        grid: { 
          color: theme.border + '40',
          drawBorder: false,
        }
      },
      x: {
        ticks: { 
          color: theme.textMuted, 
          font: { size: 12, weight: '500' } 
        },
        grid: { display: false }
      }
    }
  }), [theme]);

  // ============================================================
  // 2. PAYMENT METHODS DOUGHNUT - With Theme Colors
  // ============================================================
  const paymentData = useMemo(() => ({
    labels: ['Credit Card', 'UPI', 'Net Banking', 'Wallet', 'Debit Card'],
    datasets: [{
      data: [35, 30, 20, 10, 5],
      backgroundColor: [
        theme.accent,
        theme.accent + 'CC',
        theme.accent + '99',
        theme.accent + '66',
        theme.accent + '33'
      ],
      borderColor: theme.bgCard,
      borderWidth: 5,
      hoverOffset: 20,
      hoverBorderColor: theme.bgCard,
      hoverBorderWidth: 6,
    }]
  }), [theme.accent, theme.bgCard]);

  const paymentOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme.textSecondary,
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 13, weight: '500' },
          boxWidth: 12,
          boxHeight: 12,
        }
      },
      tooltip: {
        backgroundColor: theme.bgCard,
        titleColor: theme.textPrimary,
        bodyColor: theme.textSecondary,
        cornerRadius: 16,
        padding: 16,
        borderColor: theme.accent + '30',
        borderWidth: 1,
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed}%`
        }
      }
    }
  }), [theme]);

  // ============================================================
  // 3. TRANSACTION VOLUME - With Theme Colors
  // ============================================================
  const volumeData = useMemo(() => ({
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      label: 'Transactions',
      data: [120, 150, 180, 210],
      borderColor: theme.accent,
      backgroundColor: (context) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return 'rgba(0, 0, 0, 0)';
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, theme.accent + '40');
        gradient.addColorStop(0.5, theme.accent + '15');
        gradient.addColorStop(1, theme.accent + '00');
        return gradient;
      },
      tension: 0.4,
      fill: true,
      pointBackgroundColor: [
        theme.accent,
        theme.accent + 'CC',
        theme.accent + '99',
        theme.accent
      ],
      pointBorderColor: theme.bgCard,
      pointBorderWidth: 4,
      pointRadius: 8,
      pointHoverRadius: 14,
      borderWidth: 4,
    }]
  }), [theme.accent, theme.bgCard]);

  const volumeOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { 
          color: theme.textSecondary, 
          font: { size: 13, weight: '500' },
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      tooltip: {
        backgroundColor: theme.bgCard,
        titleColor: theme.textPrimary,
        bodyColor: theme.textSecondary,
        cornerRadius: 16,
        padding: 16,
        borderColor: theme.accent + '30',
        borderWidth: 1,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { 
          color: theme.textMuted, 
          font: { size: 12, weight: '500' } 
        },
        grid: { 
          color: theme.border + '40',
          drawBorder: false,
        }
      },
      x: {
        ticks: { 
          color: theme.textMuted, 
          font: { size: 12, weight: '500' } 
        },
        grid: { display: false }
      }
    }
  }), [theme]);

  // ============================================================
  // 4. STATUS DISTRIBUTION - With Theme Colors
  // ============================================================
  const statusData = useMemo(() => ({
    labels: ['Successful', 'Failed', 'Pending', 'Refunded'],
    datasets: [{
      data: [65, 15, 12, 8],
      backgroundColor: [
        theme.accent,
        theme.accent + 'CC',
        theme.accent + '88',
        theme.accent + '44'
      ],
      borderColor: theme.bgCard,
      borderWidth: 5,
      hoverOffset: 20,
      hoverBorderColor: theme.bgCard,
      hoverBorderWidth: 6,
    }]
  }), [theme.accent, theme.bgCard]);

  const statusOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme.textSecondary,
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 13, weight: '500' },
          boxWidth: 12,
          boxHeight: 12,
        }
      },
      tooltip: {
        backgroundColor: theme.bgCard,
        titleColor: theme.textPrimary,
        bodyColor: theme.textSecondary,
        cornerRadius: 16,
        padding: 16,
        borderColor: theme.accent + '30',
        borderWidth: 1,
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed}%`
        }
      }
    }
  }), [theme]);

  // ============================================================
  // TRANSACTIONS DATA
  // ============================================================
  const transactions = [
    { id: 'TXN-001', merchant: 'ABC Store', amount: '₹12,500', status: 'Success', date: '2024-01-15', time: '10:30 AM' },
    { id: 'TXN-002', merchant: 'XYZ Mart', amount: '₹8,200', status: 'Pending', date: '2024-01-15', time: '11:45 AM' },
    { id: 'TXN-003', merchant: 'PQR Shop', amount: '₹25,000', status: 'Success', date: '2024-01-14', time: '02:15 PM' },
    { id: 'TXN-004', merchant: 'LMN Traders', amount: '₹5,600', status: 'Failed', date: '2024-01-14', time: '04:30 PM' },
    { id: 'TXN-005', merchant: 'RST Corp', amount: '₹18,900', status: 'Success', date: '2024-01-13', time: '09:20 AM' },
  ];

  const getStatusClass = (status) => {
    const map = { 'Success': 'success', 'Failed': 'failed', 'Pending': 'pending', 'Refunded': 'refunded' };
    return map[status] || '';
  };

  return (
    <DashboardLayout role="softwareadmin">
      <div className="admin-dashboard" style={{ background: theme.bgPrimary }}>
        {/* Header - Ultra Premium */}
        <div className="dashboard-header">
          <div>
            <div className="header-badge" style={{ background: theme.accent + '15', color: theme.accent }}>
              <span className="header-badge-icon">✨</span>
              <span>Premium Dashboard</span>
            </div>
            <h1 className="dashboard-title" style={{ color: theme.textPrimary }}>
              <span className="gradient-text" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}CC)` }}>Software Admin</span> Dashboard
            </h1>
            <p className="dashboard-subtitle" style={{ color: theme.textMuted }}>Full system overview and control</p>
          </div>
          <div className="header-right">
            <div className="header-stats-mini" style={{ background: theme.accent + '15', color: theme.accent }}>
              <span>📈 +23% this month</span>
            </div>
            <span className="date-badge" style={{ 
              background: theme.bgCard,
              color: theme.textSecondary,
              borderColor: theme.border,
              boxShadow: `0 4px 20px ${theme.textPrimary}10`
            }}>
              📅 Today, {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Stats Cards - Ultra Premium */}
        <div className="stats-grid">
          {stats.map((stat, i) => (
            <div key={i} className="stat-card" style={{ 
              background: theme.bgCard,
              borderColor: theme.border,
              borderTop: `4px solid ${stat.color}` 
            }}>
              <div className="stat-card-glow" style={{ background: stat.color + '30' }}></div>
              <div className="stat-card-icon-wrapper">
                <div className="stat-card-icon" style={{ background: stat.bgColor, color: stat.color }}>
                  {stat.icon}
                </div>
              </div>
              <div className="stat-card-content">
                <div className="stat-card-label" style={{ color: theme.textMuted }}>{stat.label}</div>
                <div className="stat-card-value" style={{ color: stat.color }}>{stat.value}</div>
                <div className="stat-card-change up" style={{ color: stat.color }}>
                  <span className="change-icon">↑</span> {stat.change}
                  <span className="stat-card-subtitle" style={{ color: theme.textMuted }}>{stat.subtitle}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 - Ultra Premium */}
        <div className="charts-row">
          <div className="chart-card premium-chart" style={{ 
            background: theme.bgCard,
            borderColor: theme.border,
            boxShadow: `0 4px 24px ${theme.textPrimary}08`
          }}>
            <div className="chart-card-header">
              <div>
                <div className="chart-card-title" style={{ color: theme.textPrimary }}>
                  <span className="gradient-text" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}CC)` }}>Revenue</span> Overview
                </div>
                <div className="chart-card-subtitle" style={{ color: theme.textMuted }}>Last 7 days performance</div>
              </div>
              <div className="chart-actions">
                <button className="chart-btn active" style={{ background: theme.accent, borderColor: theme.accent, color: '#fff' }}>Week</button>
                <button className="chart-btn" style={{ color: theme.textMuted, borderColor: theme.border }}>Month</button>
                <button className="chart-btn" style={{ color: theme.textMuted, borderColor: theme.border }}>Year</button>
              </div>
            </div>
            <div className="chart-wrapper">
              <Bar key={`bar-${chartKey}`} data={revenueData} options={revenueOptions} />
            </div>
          </div>

          <div className="chart-card premium-chart" style={{ 
            background: theme.bgCard,
            borderColor: theme.border,
            boxShadow: `0 4px 24px ${theme.textPrimary}08`
          }}>
            <div className="chart-card-header">
              <div>
                <div className="chart-card-title" style={{ color: theme.textPrimary }}>
                  Payment <span className="gradient-text" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}CC)` }}>Methods</span>
                </div>
                <div className="chart-card-subtitle" style={{ color: theme.textMuted }}>Distribution breakdown</div>
              </div>
            </div>
            <div className="chart-wrapper">
              <Doughnut key={`doughnut-${chartKey}`} data={paymentData} options={paymentOptions} />
            </div>
          </div>
        </div>

        {/* Charts Row 2 - Ultra Premium */}
        <div className="charts-row">
          <div className="chart-card premium-chart" style={{ 
            background: theme.bgCard,
            borderColor: theme.border,
            boxShadow: `0 4px 24px ${theme.textPrimary}08`
          }}>
            <div className="chart-card-header">
              <div>
                <div className="chart-card-title" style={{ color: theme.textPrimary }}>
                  Transaction <span className="gradient-text" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}CC)` }}>Volume</span>
                </div>
                <div className="chart-card-subtitle" style={{ color: theme.textMuted }}>Last 30 days trend</div>
              </div>
            </div>
            <div className="chart-wrapper">
              <Line key={`line-${chartKey}`} data={volumeData} options={volumeOptions} />
            </div>
          </div>

          <div className="chart-card premium-chart" style={{ 
            background: theme.bgCard,
            borderColor: theme.border,
            boxShadow: `0 4px 24px ${theme.textPrimary}08`
          }}>
            <div className="chart-card-header">
              <div>
                <div className="chart-card-title" style={{ color: theme.textPrimary }}>
                  Status <span className="gradient-text" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}CC)` }}>Distribution</span>
                </div>
                <div className="chart-card-subtitle" style={{ color: theme.textMuted }}>Transaction status breakdown</div>
              </div>
            </div>
            <div className="chart-wrapper">
              <Doughnut key={`status-${chartKey}`} data={statusData} options={statusOptions} />
            </div>
          </div>
        </div>

        {/* Transactions Table - Ultra Premium */}
        <div className="table-card premium-table" style={{ 
          background: theme.bgCard,
          borderColor: theme.border,
          boxShadow: `0 4px 24px ${theme.textPrimary}08`
        }}>
          <div className="table-header">
            <div>
              <div className="table-title" style={{ color: theme.textPrimary }}>
                Recent <span className="gradient-text" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}CC)` }}>Transactions</span>
              </div>
              <div className="table-subtitle" style={{ color: theme.textMuted }}>Latest 5 transactions</div>
            </div>
            <a href="#" className="view-all" style={{ color: theme.accent }}>
              View All 
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
                  <th style={{ color: theme.textMuted, borderBottomColor: theme.border }}>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr key={i}>
                    <td>
                      <span className="tx-id" style={{ color: theme.textPrimary }}>{tx.id}</span>
                    </td>
                    <td style={{ color: theme.textSecondary }}>{tx.merchant}</td>
                    <td><span className="tx-amount" style={{ color: theme.textPrimary }}>{tx.amount}</span></td>
                    <td>
                      <span className={`status-badge ${getStatusClass(tx.status)}`}>
                        <span className="status-dot"></span>
                        {tx.status}
                      </span>
                    </td>
                    <td>
                      <div className="tx-date" style={{ color: theme.textPrimary }}>{tx.date}</div>
                      <div className="tx-time" style={{ color: theme.textMuted }}>{tx.time}</div>
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