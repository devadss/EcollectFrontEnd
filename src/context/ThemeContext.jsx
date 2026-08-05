import React, { createContext, useState, useContext, useEffect } from 'react';

export const themes = {
  light: {
    name: 'Light',
    // Backgrounds
    bgPrimary: '#f5f5f5',
    bgSecondary: '#ffffff',
    bgCard: '#ffffff',
    bgHover: '#f0f0f0',
    // Text
    textPrimary: '#1a1a2e',
    textSecondary: '#666666',
    textMuted: '#888888',
    // Borders
    borderColor: '#e5e5e5',
    borderLight: '#f0f0f0',
    // Cards
    cardShadow: '0 2px 20px rgba(0, 0, 0, 0.04)',
    cardShadowHover: '0 8px 40px rgba(0, 0, 0, 0.08)',
    // Sidebar
    sidebarBg: '#ffffff',
    sidebarText: '#666666',
    sidebarActive: '#000000',
    sidebarHover: '#f5f5f5',
    // Accent
    accent: '#000000',
    accentLight: 'rgba(0, 0, 0, 0.06)',
    accentDark: '#000000',
    // Charts
    chartColors: ['#000000', '#333333', '#555555', '#888888', '#bbbbbb'],
    chartBorder: '#ffffff',
    // Scrollbar
    scrollbar: '#cccccc',
    scrollbarHover: '#888888',
    // Toggle
    toggleBg: '#ffffff',
    toggleColor: '#000000',
    // Stats
    statBorder: '#e5e5e5',
    statBg: '#ffffff',
    // Table
    tableHeader: '#888888',
    tableBorder: '#e5e5e5',
    tableHover: '#f5f5f5',
  },
  dark: {
    name: 'Dark',
    bgPrimary: '#0a0a0a',
    bgSecondary: '#1a1a1a',
    bgCard: '#1a1a1a',
    bgHover: '#2a2a2a',
    textPrimary: '#ffffff',
    textSecondary: '#aaaaaa',
    textMuted: '#666666',
    borderColor: '#2d2d2d',
    borderLight: '#1a1a1a',
    cardShadow: '0 2px 20px rgba(0, 0, 0, 0.2)',
    cardShadowHover: '0 8px 40px rgba(0, 0, 0, 0.3)',
    sidebarBg: '#1a1a1a',
    sidebarText: '#888888',
    sidebarActive: '#ffffff',
    sidebarHover: '#2a2a2a',
    accent: '#ffffff',
    accentLight: 'rgba(255, 255, 255, 0.06)',
    accentDark: '#ffffff',
    chartColors: ['#ffffff', '#cccccc', '#999999', '#666666', '#333333'],
    chartBorder: '#1a1a1a',
    scrollbar: '#444444',
    scrollbarHover: '#666666',
    toggleBg: '#2d2d2d',
    toggleColor: '#ffffff',
    statBorder: '#2d2d2d',
    statBg: '#1a1a1a',
    tableHeader: '#666666',
    tableBorder: '#2d2d2d',
    tableHover: '#1a1a1a',
  },
  blue: {
    name: 'Blue',
    bgPrimary: '#eff6ff',
    bgSecondary: '#ffffff',
    bgCard: '#ffffff',
    bgHover: '#f0f7ff',
    textPrimary: '#1a1a2e',
    textSecondary: '#4b5563',
    textMuted: '#6b7280',
    borderColor: '#dbeafe',
    borderLight: '#eff6ff',
    cardShadow: '0 2px 20px rgba(26, 86, 219, 0.04)',
    cardShadowHover: '0 8px 40px rgba(26, 86, 219, 0.08)',
    sidebarBg: '#1e3a5f',
    sidebarText: '#93c5fd',
    sidebarActive: '#ffffff',
    sidebarHover: '#2a4a7a',
    accent: '#1a56db',
    accentLight: 'rgba(26, 86, 219, 0.08)',
    accentDark: '#1a56db',
    chartColors: ['#1a56db', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
    chartBorder: '#ffffff',
    scrollbar: '#3b82f6',
    scrollbarHover: '#1a56db',
    toggleBg: '#ffffff',
    toggleColor: '#1a56db',
    statBorder: '#dbeafe',
    statBg: '#ffffff',
    tableHeader: '#6b7280',
    tableBorder: '#dbeafe',
    tableHover: '#eff6ff',
  },
  purple: {
    name: 'Purple',
    bgPrimary: '#f5f0ff',
    bgSecondary: '#ffffff',
    bgCard: '#ffffff',
    bgHover: '#f8f5ff',
    textPrimary: '#1a1a2e',
    textSecondary: '#5b4b7a',
    textMuted: '#8b7aaa',
    borderColor: '#e5d9f5',
    borderLight: '#f5f0ff',
    cardShadow: '0 2px 20px rgba(108, 43, 217, 0.04)',
    cardShadowHover: '0 8px 40px rgba(108, 43, 217, 0.08)',
    sidebarBg: '#2d1b4e',
    sidebarText: '#a78bfa',
    sidebarActive: '#ffffff',
    sidebarHover: '#3d2b5e',
    accent: '#6C2BD9',
    accentLight: 'rgba(108, 43, 217, 0.08)',
    accentDark: '#6C2BD9',
    chartColors: ['#6C2BD9', '#8B5CF6', '#a78bfa', '#c4b5fd', '#ddd6fe'],
    chartBorder: '#ffffff',
    scrollbar: '#8B5CF6',
    scrollbarHover: '#6C2BD9',
    toggleBg: '#ffffff',
    toggleColor: '#6C2BD9',
    statBorder: '#e5d9f5',
    statBg: '#ffffff',
    tableHeader: '#7a6b9a',
    tableBorder: '#e5d9f5',
    tableHover: '#f5f0ff',
  },
  pink: {
    name: 'Pink',
    bgPrimary: '#fdf2f8',
    bgSecondary: '#ffffff',
    bgCard: '#ffffff',
    bgHover: '#fff5f9',
    textPrimary: '#1a1a2e',
    textSecondary: '#7a4a6a',
    textMuted: '#aa7a9a',
    borderColor: '#fce7f3',
    borderLight: '#fdf2f8',
    cardShadow: '0 2px 20px rgba(219, 39, 119, 0.04)',
    cardShadowHover: '0 8px 40px rgba(219, 39, 119, 0.08)',
    sidebarBg: '#4a0e2a',
    sidebarText: '#f472b6',
    sidebarActive: '#ffffff',
    sidebarHover: '#5a1e3a',
    accent: '#db2777',
    accentLight: 'rgba(219, 39, 119, 0.08)',
    accentDark: '#db2777',
    chartColors: ['#db2777', '#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8'],
    chartBorder: '#ffffff',
    scrollbar: '#ec4899',
    scrollbarHover: '#db2777',
    toggleBg: '#ffffff',
    toggleColor: '#db2777',
    statBorder: '#fce7f3',
    statBg: '#ffffff',
    tableHeader: '#9a6a8a',
    tableBorder: '#fce7f3',
    tableHover: '#fdf2f8',
  },
  green: {
    name: 'Green',
    bgPrimary: '#ecfdf5',
    bgSecondary: '#ffffff',
    bgCard: '#ffffff',
    bgHover: '#f5fdf8',
    textPrimary: '#1a1a2e',
    textSecondary: '#4a7a6a',
    textMuted: '#8aaa9a',
    borderColor: '#d1fae5',
    borderLight: '#ecfdf5',
    cardShadow: '0 2px 20px rgba(5, 150, 105, 0.04)',
    cardShadowHover: '0 8px 40px rgba(5, 150, 105, 0.08)',
    sidebarBg: '#064e3b',
    sidebarText: '#6ee7b7',
    sidebarActive: '#ffffff',
    sidebarHover: '#0a5e4b',
    accent: '#059669',
    accentLight: 'rgba(5, 150, 105, 0.08)',
    accentDark: '#059669',
    chartColors: ['#059669', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'],
    chartBorder: '#ffffff',
    scrollbar: '#34d399',
    scrollbarHover: '#059669',
    toggleBg: '#ffffff',
    toggleColor: '#059669',
    statBorder: '#d1fae5',
    statBg: '#ffffff',
    tableHeader: '#6a9a8a',
    tableBorder: '#d1fae5',
    tableHover: '#ecfdf5',
  },
  red: {
    name: 'Red',
    bgPrimary: '#fef2f2',
    bgSecondary: '#ffffff',
    bgCard: '#ffffff',
    bgHover: '#fff5f5',
    textPrimary: '#1a1a2e',
    textSecondary: '#7a4a4a',
    textMuted: '#aa7a7a',
    borderColor: '#fecaca',
    borderLight: '#fef2f2',
    cardShadow: '0 2px 20px rgba(220, 38, 38, 0.04)',
    cardShadowHover: '0 8px 40px rgba(220, 38, 38, 0.08)',
    sidebarBg: '#4a0e0e',
    sidebarText: '#fca5a5',
    sidebarActive: '#ffffff',
    sidebarHover: '#5a1e1e',
    accent: '#dc2626',
    accentLight: 'rgba(220, 38, 38, 0.08)',
    accentDark: '#dc2626',
    chartColors: ['#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca'],
    chartBorder: '#ffffff',
    scrollbar: '#ef4444',
    scrollbarHover: '#dc2626',
    toggleBg: '#ffffff',
    toggleColor: '#dc2626',
    statBorder: '#fecaca',
    statBg: '#ffffff',
    tableHeader: '#9a6a6a',
    tableBorder: '#fecaca',
    tableHover: '#fef2f2',
  },
  gold: {
    name: 'Gold',
    bgPrimary: '#faf8f0',
    bgSecondary: '#ffffff',
    bgCard: '#ffffff',
    bgHover: '#f8f4e8',
    textPrimary: '#1a1a2e',
    textSecondary: '#6b6a5a',
    textMuted: '#9a9a8a',
    borderColor: '#f0e8d0',
    borderLight: '#faf8f0',
    cardShadow: '0 2px 20px rgba(201, 168, 76, 0.04)',
    cardShadowHover: '0 8px 40px rgba(201, 168, 76, 0.08)',
    sidebarBg: '#2d2410',
    sidebarText: '#e8d5a3',
    sidebarActive: '#ffffff',
    sidebarHover: '#3d341a',
    accent: '#c9a84c',
    accentLight: 'rgba(201, 168, 76, 0.08)',
    accentDark: '#c9a84c',
    chartColors: ['#c9a84c', '#d4b86a', '#e0c888', '#e8d5a3', '#f0e8d0'],
    chartBorder: '#ffffff',
    scrollbar: '#c9a84c',
    scrollbarHover: '#b8943a',
    toggleBg: '#ffffff',
    toggleColor: '#c9a84c',
    statBorder: '#f0e8d0',
    statBg: '#ffffff',
    tableHeader: '#8a8a7a',
    tableBorder: '#f0e8d0',
    tableHover: '#faf8f0',
  }
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setCurrentTheme(savedTheme);
  }, []);

  const changeTheme = (themeName) => {
    setCurrentTheme(themeName);
    localStorage.setItem('theme', themeName);
  };

  const theme = themes[currentTheme] || themes.light;

  // Apply theme CSS variables to document root
  useEffect(() => {
    const root = document.documentElement;
    Object.keys(theme).forEach(key => {
      if (key !== 'name' && key !== 'chartColors' && key !== 'chartBorder') {
        root.style.setProperty(`--${key}`, theme[key]);
      }
    });
    // Set chart colors separately
    root.style.setProperty('--chart-colors', theme.chartColors.join(','));
    root.style.setProperty('--chart-border', theme.chartBorder);
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