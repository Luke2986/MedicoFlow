import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAmbulatorio } from '@/lib/useAmbulatorio';

interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  sourceType?: string;
  sourceUrl?: string | null;
}

interface ThemeContextType {
  palette: ColorPalette;
  reloadTheme: () => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const defaultPalette: ColorPalette = {
  primary: '#2563eb',
  primaryLight: '#3b82f6',
  primaryDark: '#1e40af',
  accent: '#10b981',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444'
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [palette, setPalette] = useState<ColorPalette>(defaultPalette);
  const [isLoading, setIsLoading] = useState(true);
  const { ambulatorioId } = useAmbulatorio();

  const applyTheme = (colors: ColorPalette) => {
    const root = document.documentElement;
    
    // Applica CSS variables
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-light', colors.primaryLight);
    root.style.setProperty('--color-primary-dark', colors.primaryDark);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-success', colors.success);
    root.style.setProperty('--color-warning', colors.warning);
    root.style.setProperty('--color-error', colors.error);
  };

  const loadTheme = async () => {
    if (!ambulatorioId) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/theme?ambulatorioId=${ambulatorioId}`);
      if (res.ok) {
        const data = await res.json();
        setPalette(data);
        applyTheme(data);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTheme();
  }, [ambulatorioId]);

  return (
    <ThemeContext.Provider value={{ palette, reloadTheme: loadTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
