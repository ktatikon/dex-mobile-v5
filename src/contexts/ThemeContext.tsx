import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: {
    primary: string;
    secondary: string;
  };
  positive: string;
  negative: string;
  accent: string;
}

interface ThemeContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  colors: ThemeColors;
  isDark: boolean;
}

const darkTheme: ThemeColors = {
  primary: '#B1420A',     // Dark Orange
  secondary: '#1C1C1E',   // Dark Gray
  background: '#000000',  // Black
  card: '#1C1C1E',        // Dark Gray
  text: {
    primary: '#FFFFFF',   // White
    secondary: '#8E8E93', // Light Gray
  },
  positive: '#34C759',    // Green
  negative: '#FF3B30',    // Red
  accent: '#D2691E',      // Peru
};

const lightTheme: ThemeColors = {
  primary: '#B1420A',     // Dark Orange (same)
  secondary: '#F2F2F7',   // Light Gray
  background: '#FFFFFF',  // White
  card: '#F2F2F7',        // Light Gray
  text: {
    primary: '#000000',   // Black
    secondary: '#6D6D80', // Medium Gray
  },
  positive: '#34C759',    // Green (same)
  negative: '#FF3B30',    // Red (same)
  accent: '#D2691E',      // Peru (same)
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('dex-mobile-theme') as 'dark' | 'light';
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
      setTheme(savedTheme);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    // Save to localStorage
    localStorage.setItem('dex-mobile-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const colors = theme === 'dark' ? darkTheme : lightTheme;
  const isDark = theme === 'dark';

  const contextValue: ThemeContextType = {
    theme,
    toggleTheme,
    colors,
    isDark
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme toggle component for settings
export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out
        ${isDark ? 'bg-dex-primary' : 'bg-gray-200'}
        ${className}
      `}
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out
          ${isDark ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
};
