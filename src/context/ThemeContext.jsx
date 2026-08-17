import React, { createContext, useState, useContext, useEffect } from 'react';

export const themes = {
  // 1. Standard Enterprise Dark (Stripe / Linear style)
  dark: {
    name: 'Midnight Slate (Dark)',
    id: 'dark',
    // Backgrounds
    bgPrimary: '#090d16',
    bgSecondary: '#0f172a',
    bgCard: '#111827',
    bgCardGlass: 'rgba(17, 24, 39, 0.75)',
    bgHover: '#1f2937',
    // Text
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    // Borders
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderLight: 'rgba(255, 255, 255, 0.04)',
    borderGlow: 'rgba(99, 102, 241, 0.35)',
    // Shadows
    cardShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 2px 6px -1px rgba(0, 0, 0, 0.3)',
    cardShadowHover: '0 12px 30px -4px rgba(0, 0, 0, 0.6), 0 0 25px -4px rgba(99, 102, 241, 0.35)',
    // Sidebar
    sidebarBg: '#0a0f1d',
    sidebarText: '#94a3b8',
    sidebarActive: '#ffffff',
    sidebarHover: '#1e293b',
    sidebarActiveBg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
    // Accent
    accent: '#6366f1',
    accentLight: 'rgba(99, 102, 241, 0.12)',
    accentGlow: 'rgba(99, 102, 241, 0.4)',
    accentDark: '#4f46e5',
    accentGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    // Charts
    chartColors: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
    chartBorder: '#090d16',
    // Scrollbar
    scrollbar: '#334155',
    scrollbarHover: '#475569',
    // Elements
    toggleBg: '#1e293b',
    toggleColor: '#6366f1',
    statBorder: 'rgba(255, 255, 255, 0.08)',
    statBg: '#111827',
    tableHeader: '#64748b',
    tableBorder: 'rgba(255, 255, 255, 0.06)',
    tableHover: 'rgba(255, 255, 255, 0.03)',
  },

  // 2. Standard Enterprise Clean Light (Stripe Dashboard style)
  light: {
    name: 'Enterprise Clean (Light)',
    id: 'light',
    bgPrimary: '#f8fafc',
    bgSecondary: '#ffffff',
    bgCard: '#ffffff',
    bgCardGlass: 'rgba(255, 255, 255, 0.9)',
    bgHover: '#f1f5f9',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    borderColor: '#e2e8f0',
    borderLight: '#f1f5f9',
    borderGlow: 'rgba(79, 70, 229, 0.25)',
    cardShadow: '0 2px 12px -2px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
    cardShadowHover: '0 8px 24px -3px rgba(0, 0, 0, 0.1), 0 0 20px -3px rgba(79, 70, 229, 0.15)',
    sidebarBg: '#ffffff',
    sidebarText: '#64748b',
    sidebarActive: '#0f172a',
    sidebarHover: '#f1f5f9',
    sidebarActiveBg: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%)',
    accent: '#4f46e5',
    accentLight: 'rgba(79, 70, 229, 0.08)',
    accentGlow: 'rgba(79, 70, 229, 0.25)',
    accentDark: '#4338ca',
    accentGradient: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
    chartColors: ['#4f46e5', '#0284c7', '#059669', '#d97706', '#dc2626'],
    chartBorder: '#ffffff',
    scrollbar: '#cbd5e1',
    scrollbarHover: '#94a3b8',
    toggleBg: '#f1f5f9',
    toggleColor: '#4f46e5',
    statBorder: '#e2e8f0',
    statBg: '#ffffff',
    tableHeader: '#64748b',
    tableBorder: '#e2e8f0',
    tableHover: '#f8fafc',
  },

  // 3. Corporate Banking Blue (Chase / Barclays / Visa style)
  blue: {
    name: 'Corporate Banking (Blue)',
    id: 'blue',
    bgPrimary: '#061121',
    bgSecondary: '#0b1d38',
    bgCard: '#0f2649',
    bgCardGlass: 'rgba(15, 38, 73, 0.75)',
    bgHover: '#163663',
    textPrimary: '#f0f9ff',
    textSecondary: '#93c5fd',
    textMuted: '#60a5fa',
    borderColor: 'rgba(147, 197, 253, 0.12)',
    borderLight: 'rgba(147, 197, 253, 0.06)',
    borderGlow: 'rgba(2, 132, 199, 0.4)',
    cardShadow: '0 4px 20px -2px rgba(2, 6, 23, 0.6)',
    cardShadowHover: '0 12px 30px -4px rgba(2, 6, 23, 0.7), 0 0 25px -4px rgba(2, 132, 199, 0.4)',
    sidebarBg: '#08172c',
    sidebarText: '#93c5fd',
    sidebarActive: '#ffffff',
    sidebarHover: '#102747',
    sidebarActiveBg: 'linear-gradient(135deg, rgba(2, 132, 199, 0.25) 0%, rgba(37, 99, 235, 0.15) 100%)',
    accent: '#0284c7',
    accentLight: 'rgba(2, 132, 199, 0.15)',
    accentGlow: 'rgba(2, 132, 199, 0.45)',
    accentDark: '#0369a1',
    accentGradient: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
    chartColors: ['#0284c7', '#38bdf8', '#60a5fa', '#34d399', '#f59e0b'],
    chartBorder: '#061121',
    scrollbar: '#1a365d',
    scrollbarHover: '#2563eb',
    toggleBg: '#0c2242',
    toggleColor: '#38bdf8',
    statBorder: 'rgba(147, 197, 253, 0.1)',
    statBg: '#0f2649',
    tableHeader: '#93c5fd',
    tableBorder: 'rgba(147, 197, 253, 0.08)',
    tableHover: 'rgba(255, 255, 255, 0.03)',
  },

  // 4. Graphite Minimal (GitHub / Bloomberg Terminal style)
  charcoal: {
    name: 'Graphite Slate (Neutral)',
    id: 'charcoal',
    bgPrimary: '#0d1117',
    bgSecondary: '#161b22',
    bgCard: '#21262d',
    bgCardGlass: 'rgba(33, 38, 45, 0.75)',
    bgHover: '#30363d',
    textPrimary: '#f0f6fc',
    textSecondary: '#8b949e',
    textMuted: '#6e7681',
    borderColor: 'rgba(240, 246, 252, 0.1)',
    borderLight: 'rgba(240, 246, 252, 0.05)',
    borderGlow: 'rgba(56, 189, 248, 0.35)',
    cardShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.6)',
    cardShadowHover: '0 12px 30px -4px rgba(0, 0, 0, 0.7), 0 0 25px -4px rgba(56, 189, 248, 0.3)',
    sidebarBg: '#010409',
    sidebarText: '#8b949e',
    sidebarActive: '#ffffff',
    sidebarHover: '#161b22',
    sidebarActiveBg: 'linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(99, 102, 241, 0.1) 100%)',
    accent: '#38bdf8',
    accentLight: 'rgba(56, 189, 248, 0.12)',
    accentGlow: 'rgba(56, 189, 248, 0.4)',
    accentDark: '#0284c7',
    accentGradient: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
    chartColors: ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f87171'],
    chartBorder: '#0d1117',
    scrollbar: '#30363d',
    scrollbarHover: '#484f58',
    toggleBg: '#161b22',
    toggleColor: '#38bdf8',
    statBorder: 'rgba(240, 246, 252, 0.08)',
    statBg: '#21262d',
    tableHeader: '#8b949e',
    tableBorder: 'rgba(240, 246, 252, 0.06)',
    tableHover: 'rgba(255, 255, 255, 0.02)',
  },

  // 5. Fintech Emerald (Robinhood / Bloomberg Green / Wise style)
  green: {
    name: 'Fintech Emerald (Green)',
    id: 'green',
    bgPrimary: '#05140e',
    bgSecondary: '#092118',
    bgCard: '#0e3124',
    bgCardGlass: 'rgba(14, 49, 36, 0.75)',
    bgHover: '#144332',
    textPrimary: '#ecfdf5',
    textSecondary: '#6ee7b7',
    textMuted: '#34d399',
    borderColor: 'rgba(110, 231, 183, 0.15)',
    borderLight: 'rgba(110, 231, 183, 0.08)',
    borderGlow: 'rgba(16, 185, 129, 0.4)',
    cardShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.6)',
    cardShadowHover: '0 12px 30px -4px rgba(0, 0, 0, 0.7), 0 0 25px -4px rgba(16, 185, 129, 0.4)',
    sidebarBg: '#071b13',
    sidebarText: '#6ee7b7',
    sidebarActive: '#ffffff',
    sidebarHover: '#0e3827',
    sidebarActiveBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(52, 211, 153, 0.15) 100%)',
    accent: '#10b981',
    accentLight: 'rgba(16, 185, 129, 0.15)',
    accentGlow: 'rgba(16, 185, 129, 0.45)',
    accentDark: '#059669',
    accentGradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    chartColors: ['#10b981', '#34d399', '#2dd4bf', '#38bdf8', '#fbbf24'],
    chartBorder: '#05140e',
    scrollbar: '#0f442c',
    scrollbarHover: '#10b981',
    toggleBg: '#0c2e21',
    toggleColor: '#34d399',
    statBorder: 'rgba(110, 231, 183, 0.12)',
    statBg: '#0e3124',
    tableHeader: '#6ee7b7',
    tableBorder: 'rgba(110, 231, 183, 0.1)',
    tableHover: 'rgba(255, 255, 255, 0.04)',
  },

  // 6. Wealth & Private Banking (Gold / Amber)
  gold: {
    name: 'Wealth Management (Gold)',
    id: 'gold',
    bgPrimary: '#100e07',
    bgSecondary: '#1c180d',
    bgCard: '#2b2414',
    bgCardGlass: 'rgba(43, 36, 20, 0.75)',
    bgHover: '#3d341c',
    textPrimary: '#fefce8',
    textSecondary: '#fde047',
    textMuted: '#eab308',
    borderColor: 'rgba(253, 224, 71, 0.15)',
    borderLight: 'rgba(253, 224, 71, 0.08)',
    borderGlow: 'rgba(234, 179, 8, 0.4)',
    cardShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.6)',
    cardShadowHover: '0 12px 30px -4px rgba(0, 0, 0, 0.7), 0 0 25px -4px rgba(234, 179, 8, 0.4)',
    sidebarBg: '#141209',
    sidebarText: '#fde047',
    sidebarActive: '#ffffff',
    sidebarHover: '#2a2312',
    sidebarActiveBg: 'linear-gradient(135deg, rgba(234, 179, 8, 0.25) 0%, rgba(245, 158, 11, 0.15) 100%)',
    accent: '#eab308',
    accentLight: 'rgba(234, 179, 8, 0.15)',
    accentGlow: 'rgba(234, 179, 8, 0.45)',
    accentDark: '#ca8a04',
    accentGradient: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)',
    chartColors: ['#eab308', '#fbbf24', '#f97316', '#34d399', '#38bdf8'],
    chartBorder: '#100e07',
    scrollbar: '#3d3215',
    scrollbarHover: '#eab308',
    toggleBg: '#211b0e',
    toggleColor: '#fbbf24',
    statBorder: 'rgba(253, 224, 71, 0.12)',
    statBg: '#2b2414',
    tableHeader: '#fde047',
    tableBorder: 'rgba(253, 224, 71, 0.1)',
    tableHover: 'rgba(255, 255, 255, 0.04)',
  }
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    } else {
      setCurrentTheme('dark');
    }
  }, []);

  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
      localStorage.setItem('theme', themeName);
    }
  };

  const theme = themes[currentTheme] || themes.dark;

  // Apply theme CSS variables to document root
  useEffect(() => {
    const root = document.documentElement;
    Object.keys(theme).forEach((key) => {
      if (key !== 'name' && key !== 'id' && key !== 'chartColors') {
        root.style.setProperty(`--${key}`, theme[key]);
      }
    });
    if (theme.chartColors && Array.isArray(theme.chartColors)) {
      root.style.setProperty('--chart-colors', theme.chartColors.join(','));
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, currentTheme, changeTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};