import React, { useEffect, useState, useMemo } from 'react';
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
import './MerchantDashboard.css';

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
  Transactions: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Settlement: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  Agents: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Branches: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  ArrowUp: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  ArrowDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
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
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

const MerchantDashboard = () => {
  const { theme, currentTheme } = useTheme();
  const [chartKey, setChartKey] = useState(0);
  const [activeRange, setActiveRange] = useState('Week');

  useEffect(() => {
    setChartKey(prev => prev + 1);
  }, [currentTheme]);

  // ✅ Get accent color from theme
  const accentColor = theme.accent || '#8b5cf6';
  const accentColorLight = theme.accentLight || 'rgba(139, 92, 246, 0.12)';
  
  // ✅ Get theme colors for charts
  const chartColors = theme.chartColors || ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981'];
  
  const stats = [
    { 
      label: 'Total Transactions', 
      value: '234', 
      icon: <Icons.Transactions />,
      change: '+12.5%',
      color: chartColors[0],
      bgColor: accentColorLight,
      subtitle: 'This month'
    },
    { 
      label: 'Settlements', 
      value: '₹8.7L', 
      icon: <Icons.Settlement />,
      change: '+5.7%',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.12)',
      subtitle: 'Total settled'
    },
    { 
      label: 'Active Agents', 
      value: '12', 
      icon: <Icons.Agents />,
      change: '+2',
      color: '#06b6d4',
      bgColor: 'rgba(6, 182, 212, 0.12)',
      subtitle: 'Currently active'
    },
    { 
      label: 'Total Branches', 
      value: '8', 
      icon: <Icons.Branches />,
      change: '+1',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.12)',
      subtitle: 'Active branches'
    },
  ];

  // ✅ Revenue Bar Chart with Theme Colors
  const revenueData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Revenue (₹)',
      data: [45000, 52000, 38000, 61000, 48000, 73000, 56000],
      backgroundColor: chartColors.map(c => c + 'E6'),
      borderColor: accentColor,
      borderWidth: 2,
      borderRadius: 8,
      barPercentage: 0.6,
    }]
  };

  const revenueOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: theme.bgCard || '#1a1a2e',
        titleColor: theme.textPrimary || '#ffffff',
        bodyColor: theme.textSecondary || 'rgba(255,255,255,0.7)',
        cornerRadius: 12,
        padding: 14,
        borderColor: accentColor + '33',
        borderWidth: 1,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: theme.textMuted || 'rgba(255,255,255,0.3)',
          font: { size: 11, weight: '600' },
          callback: (value) => value >= 1000 ? `₹${value/1000}k` : `₹${value}`
        },
        grid: { 
          color: theme.borderColor + '40' || 'rgba(255,255,255,0.04)',
          drawBorder: false,
        }
      },
      x: {
        ticks: { 
          color: theme.textMuted || 'rgba(255,255,255,0.3)', 
          font: { size: 11, weight: '600' } 
        },
        grid: { display: false }
      }
    }
  };

  // ✅ Transaction Status Doughnut
  const statusData = {
    labels: ['Completed', 'Pending', 'Failed', 'Refunded'],
    datasets: [{
      data: [65, 20, 10, 5],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444', chartColors[0]],
      borderColor: theme.bgCard || '#0b0f19',
      borderWidth: 4,
      hoverOffset: 12,
    }]
  };

  const statusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme.textSecondary || 'rgba(255,255,255,0.5)',
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, weight: '600' },
          boxWidth: 8,
          boxHeight: 8,
        }
      },
      tooltip: {
        backgroundColor: theme.bgCard || '#1a1a2e',
        titleColor: theme.textPrimary || '#ffffff',
        bodyColor: theme.textSecondary || 'rgba(255,255,255,0.7)',
        cornerRadius: 12,
        padding: 12,
        borderColor: accentColor + '33',
        borderWidth: 1,
        callbacks: {
          label: (context) => ` ${context.label}: ${context.parsed}%`
        }
      }
    }
  };

  // ✅ Settlements Line Chart
  const settlementData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Settlements (₹)',
      data: [32000, 41000, 28000, 53000, 39000, 62000, 48000],
      borderColor: '#10b981',
      backgroundColor: (context) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return 'rgba(0, 0, 0, 0)';
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
        gradient.addColorStop(0.6, 'rgba(16, 185, 129, 0.08)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
        return gradient;
      },
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#10b981',
      pointBorderColor: theme.bgCard || '#0b0f19',
      pointBorderWidth: 3,
      pointRadius: 6,
      pointHoverRadius: 10,
      borderWidth: 3,
    }]
  };

  const settlementOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { 
          color: theme.textSecondary || 'rgba(255,255,255,0.5)', 
          font: { size: 12, weight: '600' },
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      tooltip: {
        backgroundColor: theme.bgCard || '#1a1a2e',
        titleColor: theme.textPrimary || '#ffffff',
        bodyColor: theme.textSecondary || 'rgba(255,255,255,0.7)',
        cornerRadius: 12,
        padding: 12,
        borderColor: 'rgba(16, 185, 129, 0.2)',
        borderWidth: 1,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: theme.textMuted || 'rgba(255,255,255,0.3)',
          font: { size: 11, weight: '600' },
          callback: (value) => value >= 1000 ? `₹${value/1000}k` : `₹${value}`
        },
        grid: { 
          color: theme.borderColor + '40' || 'rgba(255,255,255,0.04)',
          drawBorder: false,
        }
      },
      x: {
        ticks: { 
          color: theme.textMuted || 'rgba(255,255,255,0.3)', 
          font: { size: 11, weight: '600' } 
        },
        grid: { display: false }
      }
    }
  };

  // ✅ Top Merchants Doughnut
  const merchantData = {
    labels: ['Merchant A', 'Merchant B', 'Merchant C', 'Others'],
    datasets: [{
      data: [40, 25, 20, 15],
      backgroundColor: chartColors,
      borderColor: theme.bgCard || '#0b0f19',
      borderWidth: 4,
      hoverOffset: 12,
    }]
  };

  const merchantOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme.textSecondary || 'rgba(255,255,255,0.5)',
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, weight: '600' },
          boxWidth: 8,
          boxHeight: 8,
        }
      },
      tooltip: {
        backgroundColor: theme.bgCard || '#1a1a2e',
        titleColor: theme.textPrimary || '#ffffff',
        bodyColor: theme.textSecondary || 'rgba(255,255,255,0.7)',
        cornerRadius: 12,
        padding: 12,
        borderColor: accentColor + '33',
        borderWidth: 1,
        callbacks: {
          label: (context) => ` ${context.label}: ${context.parsed}%`
        }
      }
    }
  };

  return (
    <DashboardLayout pageTitle="Merchant Dashboard">
      <div className="merchant-dashboard" style={{ 
        background: theme.bgPrimary || '#0a0a14' 
      }}>
        
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-left">
            <div className="header-badge" style={{ 
              background: accentColorLight, 
              color: accentColor 
            }}>
              <span className="header-badge-pulse"></span>
              <Icons.Sparkles />
              <span>Merchant Control Panel</span>
            </div>
            <h1 className="dashboard-title" style={{ 
              color: theme.textPrimary || '#ffffff' 
            }}>
              Merchant <span className="gradient-text" style={{ 
                background: `linear-gradient(135deg, ${accentColor}, #06b6d4)` 
              }}>Dashboard</span>
            </h1>
            <p className="dashboard-subtitle" style={{ 
              color: theme.textMuted || 'rgba(255,255,255,0.4)' 
            }}>Real-time overview of your transactions, settlements, and agent network</p>
          </div>
          
          <div className="header-right">
            <div className="header-stats-mini" style={{ 
              background: accentColorLight, 
              color: accentColor 
            }}>
              <Icons.TrendingUp />
              <span>+18.7% Growth</span>
            </div>
            <span className="date-badge" style={{ 
              background: theme.bgCard || 'rgba(255,255,255,0.03)',
              color: theme.textMuted || 'rgba(255,255,255,0.4)',
              borderColor: theme.borderColor || 'rgba(255,255,255,0.06)',
            }}>
              <Icons.Calendar />
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {stats.map((stat, i) => (
            <div key={i} className="stat-card-ultra" style={{ 
              background: theme.bgCard || 'rgba(255,255,255,0.03)',
              borderColor: theme.borderColor || 'rgba(255,255,255,0.06)',
            }}>
              <div className="stat-glow-bg" style={{ background: `radial-gradient(circle, ${stat.color}20 0%, transparent 70%)` }}></div>
              
              <div className="stat-card-top">
                <div className="stat-card-icon" style={{ background: stat.bgColor, color: stat.color }}>
                  {stat.icon}
                </div>
                <div className="stat-badge-trend" style={{ background: stat.color + '15', color: stat.color }}>
                  {stat.change.startsWith('+') ? <Icons.ArrowUp /> : <Icons.ArrowDown />}
                  {stat.change}
                </div>
              </div>

              <div className="stat-card-main">
                <div className="stat-card-value" style={{ color: theme.textPrimary || '#ffffff' }}>{stat.value}</div>
                <div className="stat-card-label" style={{ color: theme.textMuted || 'rgba(255,255,255,0.4)' }}>{stat.label}</div>
              </div>

              <div className="stat-card-footer" style={{ borderTopColor: theme.borderColor || 'rgba(255,255,255,0.04)' }}>
                <span className="stat-card-subtitle" style={{ color: theme.textMuted || 'rgba(255,255,255,0.2)' }}>{stat.subtitle}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="charts-row">
          <div className="chart-card premium-chart" style={{ 
            background: theme.bgCard || 'rgba(255,255,255,0.03)',
            borderColor: theme.borderColor || 'rgba(255,255,255,0.06)',
          }}>
            <div className="chart-card-header">
              <div>
                <div className="chart-card-title" style={{ color: theme.textPrimary || '#ffffff' }}>
                  Revenue <span className="title-accent" style={{ color: accentColor }}>Overview</span>
                </div>
                <div className="chart-card-subtitle" style={{ color: theme.textMuted || 'rgba(255,255,255,0.3)' }}>Weekly revenue breakdown</div>
              </div>
              <div className="chart-actions">
                {['Week', 'Month', 'Year'].map((range) => (
                  <button 
                    key={range}
                    className={`chart-btn ${activeRange === range ? 'active' : ''}`}
                    onClick={() => setActiveRange(range)}
                    style={activeRange === range ? { 
                      background: accentColor, 
                      borderColor: accentColor, 
                      color: '#ffffff' 
                    } : { 
                      color: theme.textMuted || 'rgba(255,255,255,0.3)', 
                      borderColor: theme.borderColor || 'rgba(255,255,255,0.06)' 
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
            background: theme.bgCard || 'rgba(255,255,255,0.03)',
            borderColor: theme.borderColor || 'rgba(255,255,255,0.06)',
          }}>
            <div className="chart-card-header">
              <div>
                <div className="chart-card-title" style={{ color: theme.textPrimary || '#ffffff' }}>
                  Transaction <span className="title-accent" style={{ color: accentColor }}>Status</span>
                </div>
                <div className="chart-card-subtitle" style={{ color: theme.textMuted || 'rgba(255,255,255,0.3)' }}>Success vs failure ratio</div>
              </div>
            </div>
            <div className="chart-wrapper">
              <Doughnut key={`status-${chartKey}`} data={statusData} options={statusOptions} />
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="charts-row">
          <div className="chart-card premium-chart" style={{ 
            background: theme.bgCard || 'rgba(255,255,255,0.03)',
            borderColor: theme.borderColor || 'rgba(255,255,255,0.06)',
          }}>
            <div className="chart-card-header">
              <div>
                <div className="chart-card-title" style={{ color: theme.textPrimary || '#ffffff' }}>
                  Settlements <span className="title-accent" style={{ color: '#10b981' }}>Trend</span>
                </div>
                <div className="chart-card-subtitle" style={{ color: theme.textMuted || 'rgba(255,255,255,0.3)' }}>Daily settlement volume</div>
              </div>
            </div>
            <div className="chart-wrapper">
              <Line key={`line-${chartKey}`} data={settlementData} options={settlementOptions} />
            </div>
          </div>

          <div className="chart-card premium-chart" style={{ 
            background: theme.bgCard || 'rgba(255,255,255,0.03)',
            borderColor: theme.borderColor || 'rgba(255,255,255,0.06)',
          }}>
            <div className="chart-card-header">
              <div>
                <div className="chart-card-title" style={{ color: theme.textPrimary || '#ffffff' }}>
                  Top <span className="title-accent" style={{ color: '#06b6d4' }}>Merchants</span>
                </div>
                <div className="chart-card-subtitle" style={{ color: theme.textMuted || 'rgba(255,255,255,0.3)' }}>Revenue distribution</div>
              </div>
            </div>
            <div className="chart-wrapper">
              <Doughnut key={`merchant-${chartKey}`} data={merchantData} options={merchantOptions} />
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default MerchantDashboard;