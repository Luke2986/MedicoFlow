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

  const hexToHSL = (hex: string): string => {
    // Convert hex to RGB
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
  };

  const applyTheme = (colors: ColorPalette) => {
    const root = document.documentElement;
    
    // Convert hex to HSL and apply shadcn CSS variables
    root.style.setProperty('--primary', hexToHSL(colors.primary));
    root.style.setProperty('--accent', hexToHSL(colors.accent));
    root.style.setProperty('--destructive', hexToHSL(colors.error));
    
    // Update sidebar colors to match primary
    root.style.setProperty('--sidebar-primary', hexToHSL(colors.primary));
    root.style.setProperty('--sidebar-accent', hexToHSL(colors.accent));
    
    // Update ring color (focus outlines)
    root.style.setProperty('--ring', hexToHSL(colors.primary));
    
    // Update chart colors
    root.style.setProperty('--chart-1', hexToHSL(colors.primary));
    root.style.setProperty('--chart-2', hexToHSL(colors.success));
    root.style.setProperty('--chart-3', hexToHSL(colors.warning));
    root.style.setProperty('--chart-4', hexToHSL(colors.accent));
    root.style.setProperty('--chart-5', hexToHSL(colors.error));
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
