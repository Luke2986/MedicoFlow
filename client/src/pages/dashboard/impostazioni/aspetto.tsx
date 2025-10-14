import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Palette, Loader2, Eye, Download, RotateCcw, Sparkles } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAmbulatorio } from '@/lib/useAmbulatorio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
}

interface ThemeSettings {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  sourceType: 'default' | 'url' | 'custom';
  sourceUrl: string | null;
}

export default function ImpostazioniAspetto() {
  const { palette, reloadTheme, applyPalette } = useTheme();
  const { ambulatorioId } = useAmbulatorio();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [previewPalette, setPreviewPalette] = useState<ColorPalette>(palette);
  const [siteUrl, setSiteUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sourceType, setSourceType] = useState<'default' | 'url' | 'custom'>('default');

  // Calculate light/dark variants from a color
  const calculateVariants = (hexColor: string) => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hexColor)) return { light: hexColor, dark: hexColor };
    
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Convert to HSL
    const r2 = r / 255;
    const g2 = g / 255;
    const b2 = b / 255;
    const max = Math.max(r2, g2, b2);
    const min = Math.min(r2, g2, b2);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r2: h = ((g2 - b2) / d + (g2 < b2 ? 6 : 0)) / 6; break;
        case g2: h = ((b2 - r2) / d + 2) / 6; break;
        case b2: h = ((r2 - g2) / d + 4) / 6; break;
      }
    }

    // Calculate light/dark variants
    const lightL = Math.min(l * 100 + 15, 85);
    const darkL = Math.max(l * 100 - 15, 15);

    // Convert back to RGB
    const hslToRgb = (h: number, s: number, l: number) => {
      let r, g, b;
      if (s === 0) {
        r = g = b = l;
      } else {
        const hue2rgb = (p: number, q: number, t: number) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }
      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    };

    const [rLight, gLight, bLight] = hslToRgb(h, s, lightL / 100);
    const [rDark, gDark, bDark] = hslToRgb(h, s, darkL / 100);

    const rgbToHex = (r: number, g: number, b: number) => 
      '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();

    return {
      light: rgbToHex(rLight, gLight, bLight),
      dark: rgbToHex(rDark, gDark, bDark)
    };
  };

  // Fetch saved theme settings
  const { data: savedTheme } = useQuery<ThemeSettings>({
    queryKey: ['/api/theme', ambulatorioId],
    queryFn: async () => {
      const res = await fetch(`/api/theme?ambulatorioId=${ambulatorioId}`);
      if (!res.ok) throw new Error('Failed to fetch theme');
      return res.json();
    },
    enabled: !!ambulatorioId
  });

  // Sync preview palette with saved theme when it loads
  useEffect(() => {
    if (savedTheme) {
      setPreviewPalette({
        primary: savedTheme.primary,
        primaryLight: savedTheme.primaryLight,
        primaryDark: savedTheme.primaryDark,
        accent: savedTheme.accent,
        success: savedTheme.success,
        warning: savedTheme.warning,
        error: savedTheme.error
      });
      setSourceType(savedTheme.sourceType);
      if (savedTheme.sourceUrl) {
        setSiteUrl(savedTheme.sourceUrl);
      }
    }
  }, [savedTheme]);

  const handleExtractColors = async () => {
    if (!siteUrl.trim()) {
      setError('Inserisci un URL valido');
      return;
    }

    setExtracting(true);
    setError('');

    try {
      const res = await fetch('/api/theme/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: siteUrl })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Errore durante estrazione');
      }

      setPreviewPalette(data.palette);
      setSourceType('url');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      toast({
        title: "Colori estratti!",
        description: "Palette colori estratta con successo dal sito",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleSaveTheme = async () => {
    if (!ambulatorioId) return;
    
    setLoading(true);
    setError('');

    try {
      // Apply theme IMMEDIATELY for instant visual feedback
      applyPalette(previewPalette);

      const res = await fetch('/api/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ambulatorioId,
          primary: previewPalette.primary,
          primaryLight: previewPalette.primaryLight,
          primaryDark: previewPalette.primaryDark,
          accent: previewPalette.accent,
          success: previewPalette.success,
          warning: previewPalette.warning,
          error: previewPalette.error,
          sourceType,
          sourceUrl: sourceType === 'url' ? siteUrl : null
        })
      });

      if (!res.ok) {
        throw new Error('Errore durante il salvataggio');
      }

      // Reload from server to sync state (optional, for confirmation)
      await reloadTheme();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      toast({
        title: "Tema salvato!",
        description: "Le modifiche sono state applicate con successo",
      });
    } catch (err: any) {
      setError(err.message);
      // On error, reload original theme
      await reloadTheme();
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!ambulatorioId) return;
    
    setLoading(true);
    setError('');

    try {
      const defaultColors = {
        primary: '#2563eb',
        primaryLight: '#3b82f6',
        primaryDark: '#1e40af',
        accent: '#10b981',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444'
      };

      // Apply default theme IMMEDIATELY
      applyPalette(defaultColors);
      setPreviewPalette(defaultColors);
      setSourceType('default');
      setSiteUrl('');

      const res = await fetch(`/api/theme?ambulatorioId=${ambulatorioId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        throw new Error('Errore durante il reset');
      }

      await reloadTheme();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      toast({
        title: "Tema ripristinato",
        description: "Colori predefiniti applicati",
      });
    } catch (err: any) {
      setError(err.message);
      // On error, reload original theme
      await reloadTheme();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/impostazioni">
          <Button variant="ghost" size="icon" data-testid="button-back-aspetto">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Aspetto</h1>
          <p className="text-muted-foreground mt-1">Personalizza i colori del tuo ambulatorio</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
          <AlertDescription>✅ Modifiche salvate con successo</AlertDescription>
        </Alert>
      )}

      {/* Metodo 1: Colori Default */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Palette Default
              </CardTitle>
              <CardDescription className="mt-1">
                Usa i colori medicali professionali predefiniti
              </CardDescription>
            </div>
            <Button
              onClick={handleResetToDefault}
              disabled={loading}
              variant="outline"
              data-testid="button-reset-default"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Default
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Metodo 2: Estrai da URL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Estrai Colori dal Tuo Sito
            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded">
              AI
            </span>
          </CardTitle>
          <CardDescription>
            Inserisci l'URL del tuo sito e l'AI estrarrà automaticamente i colori del brand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              type="url"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://tuosito.it"
              data-testid="input-site-url"
            />
            <Button
              onClick={handleExtractColors}
              disabled={extracting || !siteUrl.trim()}
              data-testid="button-extract-colors"
            >
              {extracting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Estrazione...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Estrai Colori
                </>
              )}
            </Button>
          </div>

          {extracting && (
            <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-purple-600 dark:text-purple-400 animate-spin" />
                <div>
                  <p className="font-medium text-purple-900 dark:text-purple-100">Analisi in corso...</p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    L'AI sta analizzando il sito e identificando i colori del brand
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metodo 3: Personalizza Manualmente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Personalizza Manualmente
          </CardTitle>
          <CardDescription>
            Seleziona i colori uno per uno usando i selettori
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Colore Primario</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={previewPalette.primary}
                  onChange={(e) => {
                    const variants = calculateVariants(e.target.value);
                    setPreviewPalette({ 
                      ...previewPalette, 
                      primary: e.target.value,
                      primaryLight: variants.light,
                      primaryDark: variants.dark
                    });
                    setSourceType('custom');
                  }}
                  className="w-16 h-10 rounded border cursor-pointer"
                  data-testid="input-color-primary"
                />
                <Input
                  type="text"
                  value={previewPalette.primary}
                  onChange={(e) => {
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                      const variants = calculateVariants(e.target.value);
                      setPreviewPalette({ 
                        ...previewPalette, 
                        primary: e.target.value,
                        primaryLight: variants.light,
                        primaryDark: variants.dark
                      });
                      setSourceType('custom');
                    }
                  }}
                  className="flex-1 font-mono"
                  placeholder="#2563eb"
                />
              </div>
              <p className="text-xs text-muted-foreground">Le varianti chiara/scura vengono generate automaticamente</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Colore Accento</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={previewPalette.accent}
                  onChange={(e) => {
                    setPreviewPalette({ ...previewPalette, accent: e.target.value });
                    setSourceType('custom');
                  }}
                  className="w-16 h-10 rounded border cursor-pointer"
                  data-testid="input-color-accent"
                />
                <Input
                  type="text"
                  value={previewPalette.accent}
                  onChange={(e) => {
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                      setPreviewPalette({ ...previewPalette, accent: e.target.value });
                      setSourceType('custom');
                    }
                  }}
                  className="flex-1 font-mono"
                  placeholder="#10b981"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anteprima Palette */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Anteprima Palette
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(previewPalette).map(([name, color]) => (
              <div key={name} className="space-y-2">
                <div
                  className="w-full h-20 rounded-lg border-2 border-border shadow-sm"
                  style={{ backgroundColor: color }}
                  data-testid={`color-preview-${name}`}
                />
                <div>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {name.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">{color}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Anteprima Live</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-x-3">
            <button
              style={{ backgroundColor: previewPalette.primary }}
              className="px-6 py-3 text-white rounded-lg font-medium shadow-sm"
            >
              Button Primary
            </button>
            <button
              style={{ backgroundColor: previewPalette.accent }}
              className="px-6 py-3 text-white rounded-lg font-medium shadow-sm"
            >
              Button Accent
            </button>
            <button
              style={{ backgroundColor: previewPalette.success }}
              className="px-6 py-3 text-white rounded-lg font-medium shadow-sm"
            >
              Success
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          onClick={handleSaveTheme}
          disabled={loading}
          className="flex-1"
          data-testid="button-save-theme"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvataggio...
            </>
          ) : (
            <>
              <Palette className="w-4 h-4 mr-2" />
              Applica Palette
            </>
          )}
        </Button>
        <Link href="/dashboard/impostazioni">
          <Button variant="outline">
            Annulla
          </Button>
        </Link>
      </div>

      {/* Info Box */}
      <Alert>
        <AlertDescription>
          <h3 className="font-semibold mb-2">💡 Come funziona</h3>
          <ul className="text-sm space-y-1">
            <li>• L'AI analizza il tuo sito e identifica automaticamente i colori del brand</li>
            <li>• I colori vengono estratti da logo, header, CTA e elementi principali</li>
            <li>• La palette viene ottimizzata per accessibilità e contrasto</li>
            <li>• I cambiamenti si applicano immediatamente a tutta la webapp</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
