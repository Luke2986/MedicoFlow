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
  applyPalette: (colors: ColorPalette) => void;
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

  // Calculate relative luminance for WCAG contrast formula
  const getLuminance = (r: number, g: number, b: number): number => {
    // Convert RGB to linear values
    const toLinear = (val: number) => {
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    };
    
    const rLinear = toLinear(r);
    const gLinear = toLinear(g);
    const bLinear = toLinear(b);
    
    // WCAG luminance formula
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  };

  // Calculate WCAG contrast ratio between two colors
  const getContrastRatio = (lum1: number, lum2: number): number => {
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  };

  // Get foreground color that meets WCAG AA (4.5:1 minimum)
  const getForegroundColor = (hexColor: string): string => {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16) / 255;
    const g = parseInt(hexColor.slice(3, 5), 16) / 255;
    const b = parseInt(hexColor.slice(5, 7), 16) / 255;
    
    const bgLuminance = getLuminance(r, g, b);
    
    // White and black luminance values
    const whiteLuminance = 1.0;
    const blackLuminance = 0.0;
    
    // Calculate contrast with white and black
    const contrastWithWhite = getContrastRatio(bgLuminance, whiteLuminance);
    const contrastWithBlack = getContrastRatio(bgLuminance, blackLuminance);
    
    // Choose white or black based on which gives better contrast
    // Prefer white if both meet WCAG AA (4.5:1), otherwise choose the better one
    if (contrastWithWhite >= 4.5) {
      return '0 0% 100%'; // White
    } else if (contrastWithBlack >= 4.5) {
      return '0 0% 10%'; // Near black
    } else {
      // Neither meets 4.5:1, choose the better one (should rarely happen with proper colors)
      return contrastWithWhite > contrastWithBlack ? '0 0% 100%' : '0 0% 10%';
    }
  };

  const applyTheme = (colors: ColorPalette) => {
    const root = document.documentElement;
    
    // Convert hex to HSL and apply shadcn CSS variables
    root.style.setProperty('--primary', hexToHSL(colors.primary));
    root.style.setProperty('--primary-foreground', getForegroundColor(colors.primary));
    
    root.style.setProperty('--accent', hexToHSL(colors.accent));
    root.style.setProperty('--accent-foreground', getForegroundColor(colors.accent));
    
    root.style.setProperty('--destructive', hexToHSL(colors.error));
    root.style.setProperty('--destructive-foreground', getForegroundColor(colors.error));
    
    // DON'T override sidebar colors - they have built-in contrast
    // The sidebar uses its own color system to ensure accessibility
    // --sidebar-primary and --sidebar-accent are kept at default values
    
    // Update ring color (focus outlines) - keep primary for consistency
    root.style.setProperty('--ring', hexToHSL(colors.primary));
    
    // Update chart colors for data visualization
    root.style.setProperty('--chart-1', hexToHSL(colors.primary));
    root.style.setProperty('--chart-2', hexToHSL(colors.success));
    root.style.setProperty('--chart-3', hexToHSL(colors.warning));
    root.style.setProperty('--chart-4', hexToHSL(colors.accent));
    root.style.setProperty('--chart-5', hexToHSL(colors.error));
  };

  const applyPalette = (colors: ColorPalette) => {
    applyTheme(colors);
    setPalette(colors);
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
    <ThemeContext.Provider value={{ 
      palette, 
      reloadTheme: loadTheme, 
      applyPalette,
      isLoading 
    }}>
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
