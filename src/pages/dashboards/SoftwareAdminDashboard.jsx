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
  const [activeRange, setActiveRange] = useState('Week'); // 'Week' | 'Month' | 'Year'

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
      color: theme.accent || '#06b6d4',
      bgColor: (theme.accent || '#06b6d4') + '15',
      subtitle: 'Active merchants'
    },
    { 
      label: 'Total Agents', 
      value: '456', 
      icon: '👤', 
      change: '+8.3%',
      color: theme.accent || '#6366f1',
      bgColor: (theme.accent || '#6366f1') + '15',
      subtitle: 'Active agents'
    },
    { 
      label: 'Total Branches', 
      value: '89', 
      icon: '🏢', 
      change: '+5.2%',
      color: theme.accent || '#3b82f6',
      bgColor: (theme.accent || '#3b82f6') + '15',
      subtitle: 'Active branches'
    },
    { 
      label: 'Total Revenue', 
      value: '₹45.6L', 
      icon: '💰', 
      change: '+18.7%',
      color: theme.accent || '#10b981',
      bgColor: (theme.accent || '#10b981') + '15',
      subtitle: 'This month'
    },
  ];

  // ============================================================
  // 1. REVENUE BAR CHART
  // ============================================================
  const revenueData = useMemo(() => ({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Revenue (₹)',
      data: [12000, 19000, 15000, 25000, 22000, 30000, 28000],
      backgroundColor: [
        (theme.accent || '#6366f1') + 'E6',
        (theme.accent || '#6366f1') + 'B3',
        (theme.accent || '#6366f1') + 'E6',
        (theme.accent || '#6366f1') + 'B3',
        (theme.accent || '#6366f1') + 'E6',
        (theme.accent || '#6366f1') + 'B3',
        (theme.accent || '#6366f1') + 'FF'
      ],
      borderColor: theme.accent || '#6366f1',
      borderWidth: 2,
      borderRadius: 8,
      barPercentage: 0.55,
      hoverBackgroundColor: theme.accent || '#6366f1',
      hoverBorderColor: theme.bgCard || '#ffffff',
      hoverBorderWidth: 3,
    }]
  }), [theme.accent, theme.bgCard]);

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
        boxPadding: 6,
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

  // ============================================================
  // 2. PAYMENT METHODS DOUGHNUT
  // ============================================================
  const paymentData = useMemo(() => ({
    labels: ['Credit Card', 'UPI', 'Net Banking', 'Wallet', 'Debit Card'],
    datasets: [{
      data: [35, 30, 20, 10, 5],
      backgroundColor: [
        theme.accent || '#6366f1',
        (theme.accent || '#6366f1') + 'D9',
        (theme.accent || '#6366f1') + 'A6',
        (theme.accent || '#6366f1') + '73',
        (theme.accent || '#6366f1') + '40'
      ],
      borderColor: theme.bgCard || '#ffffff',
      borderWidth: 4,
      hoverOffset: 12,
      hoverBorderColor: theme.bgCard || '#ffffff',
      hoverBorderWidth: 4,
    }]
  }), [theme.accent, theme.bgCard]);

  const paymentOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '74%',
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

  // ============================================================
  // 3. TRANSACTION VOLUME
  // ============================================================
  const volumeData = useMemo(() => ({
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      label: 'Transactions',
      data: [120, 150, 180, 210],
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
      tension: 0.38,
      fill: true,
      pointBackgroundColor: [
        theme.accent || '#6366f1',
        (theme.accent || '#6366f1') + 'CC',
        (theme.accent || '#6366f1') + '99',
        theme.accent || '#6366f1'
      ],
      pointBorderColor: theme.bgCard || '#ffffff',
      pointBorderWidth: 3,
      pointRadius: 6,
      pointHoverRadius: 10,
      borderWidth: 3,
    }]
  }), [theme.accent, theme.bgCard]);

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

  // ============================================================
  // 4. STATUS DISTRIBUTION
  // ============================================================
  const statusData = useMemo(() => ({
    labels: ['Successful', 'Failed', 'Pending', 'Refunded'],
    datasets: [{
      data: [65, 15, 12, 8],
      backgroundColor: [
        '#10b981', // Success Green
        '#ef4444', // Failed Red
        '#f59e0b', // Pending Yellow
        '#8b5cf6'  // Refunded Purple
      ],
      borderColor: theme.bgCard || '#ffffff',
      borderWidth: 4,
      hoverOffset: 12,
      hoverBorderColor: theme.bgCard || '#ffffff',
      hoverBorderWidth: 4,
    }]
  }), [theme.bgCard]);

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
      <div className="admin-dashboard-container" style={{ background: theme.bgPrimary }}>
        
        {/* Header Section */}
        <div className="dashboard-header">
          <div>
            <div className="header-badge" style={{ background: (theme.accent || '#6366f1') + '15', color: theme.accent || '#6366f1' }}>
              <span className="header-badge-pulse"></span>
              <span>System Control Telemetry</span>
            </div>
            {/* <h1 className="dashboard-title" style={{ color: theme.textPrimary }}>
              Software <span className="gradient-text" style={{ background: `linear-gradient(135deg, ${theme.accent || '#6366f1'}, #06b6d4)` }}>Admin Dashboard</span>
            </h1> */}
            <p className="dashboard-subtitle" style={{ color: theme.textMuted }}>Real-time overview of merchant operations, revenue, and system activity</p>
          </div>
          
          <div className="header-right">
            <div className="header-stats-mini">
              <span className="mini-trend-icon">📈</span>
              <span>+23.4% Growth</span>
            </div>
            <span className="date-badge" style={{ 
              background: theme.bgCard,
              color: theme.textSecondary,
              borderColor: theme.border,
            }}>
              📅 {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="stats-grid">
          {stats.map((stat, i) => (
            <div key={i} className="stat-card-ultra" style={{ 
              background: theme.bgCard,
              borderColor: theme.border,
            }}>
              <div className="stat-glow-bg" style={{ background: `radial-gradient(circle, ${stat.color}25 0%, transparent 70%)` }}></div>
              
              <div className="stat-card-top">
                <div className="stat-card-icon" style={{ background: stat.bgColor, color: stat.color }}>
                  {stat.icon}
                </div>
                <div className="stat-badge-trend" style={{ background: stat.color + '15', color: stat.color }}>
                  <span>↑</span> {stat.change}
                </div>
              </div>

              <div className="stat-card-main">
                <div className="stat-card-value" style={{ color: theme.textPrimary }}>{stat.value}</div>
                <div className="stat-card-label" style={{ color: theme.textMuted }}>{stat.label}</div>
              </div>

              <div className="stat-card-footer" style={{ borderTopColor: (theme.border || '#e2e8f0') + '60' }}>
                <span className="stat-card-subtitle" style={{ color: theme.textMuted }}>{stat.subtitle}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="charts-row">
          <div className="chart-card premium-chart" style={{ 
            background: theme.bgCard,
            borderColor: theme.border,
          }}>
            <div className="chart-card-header">
              <div>
                <div className="chart-card-title" style={{ color: theme.textPrimary }}>
                  Revenue <span className="title-accent">Overview</span>
                </div>
                <div className="chart-card-subtitle" style={{ color: theme.textMuted }}>Weekly settlement volume breakdown</div>
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

          <div className="chart-card premium-chart" style={{ 
            background: theme.bgCard,
            borderColor: theme.border,
          }}>
            <div className="chart-card-header">
              <div>
                <div className="chart-card-title" style={{ color: theme.textPrimary }}>
                  Payment <span className="title-accent">Methods</span>
                </div>
                <div className="chart-card-subtitle" style={{ color: theme.textMuted }}>Channel distribution ratio</div>
              </div>
            </div>
            <div className="chart-wrapper">
              <Doughnut key={`doughnut-${chartKey}`} data={paymentData} options={paymentOptions} />
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="charts-row">
          <div className="chart-card premium-chart" style={{ 
            background: theme.bgCard,
            borderColor: theme.border,
          }}>
            <div className="chart-card-header">
              <div>
                <div className="chart-card-title" style={{ color: theme.textPrimary }}>
                  Transaction <span className="title-accent">Volume</span>
                </div>
                <div className="chart-card-subtitle" style={{ color: theme.textMuted }}>Monthly processing volume trajectory</div>
              </div>
            </div>
            <div className="chart-wrapper">
              <Line key={`line-${chartKey}`} data={volumeData} options={volumeOptions} />
            </div>
          </div>

          <div className="chart-card premium-chart" style={{ 
            background: theme.bgCard,
            borderColor: theme.border,
          }}>
            <div className="chart-card-header">
              <div>
                <div className="chart-card-title" style={{ color: theme.textPrimary }}>
                  Status <span className="title-accent">Distribution</span>
                </div>
                <div className="chart-card-subtitle" style={{ color: theme.textMuted }}>Success vs. failure telemetry</div>
              </div>
            </div>
            <div className="chart-wrapper">
              <Doughnut key={`status-${chartKey}`} data={statusData} options={statusOptions} />
            </div>
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="table-card premium-table" style={{ 
          background: theme.bgCard,
          borderColor: theme.border,
        }}>
          <div className="table-header">
            <div>
              <div className="table-title" style={{ color: theme.textPrimary }}>
                Recent <span className="title-accent">Transactions</span>
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
                  <tr key={i} className="table-row-hover">
                    <td>
                      <span className="tx-id-badge" style={{ color: theme.textPrimary, background: (theme.border || '#e2e8f0') + '40' }}>
                        {tx.id}
                      </span>
                    </td>
                    <td style={{ color: theme.textSecondary, fontWeight: '600' }}>{tx.merchant}</td>
                    <td>
                      <span className="tx-amount" style={{ color: theme.textPrimary }}>{tx.amount}</span>
                    </td>
                    <td>
                      <span className={`status-pill ${getStatusClass(tx.status)}`}>
                        <span className="status-pulse-dot"></span>
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