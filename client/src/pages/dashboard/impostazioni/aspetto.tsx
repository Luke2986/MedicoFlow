import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Palette, Loader2, Eye, Download, RotateCcw, Sparkles } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAmbulatorio } from '@/lib/useAmbulatorio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
}

export default function ImpostazioniAspetto() {
  const { palette, reloadTheme } = useTheme();
  const { ambulatorioId } = useAmbulatorio();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [previewPalette, setPreviewPalette] = useState<ColorPalette>(palette);
  const [siteUrl, setSiteUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sourceType, setSourceType] = useState<'default' | 'url' | 'custom'>('default');

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

      await reloadTheme();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      toast({
        title: "Tema salvato!",
        description: "Le modifiche sono state applicate con successo",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!ambulatorioId) return;
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/theme?ambulatorioId=${ambulatorioId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        throw new Error('Errore durante il reset');
      }

      await reloadTheme();
      setPreviewPalette({
        primary: '#2563eb',
        primaryLight: '#3b82f6',
        primaryDark: '#1e40af',
        accent: '#10b981',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444'
      });
      setSourceType('default');
      setSiteUrl('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      toast({
        title: "Tema ripristinato",
        description: "Colori predefiniti applicati",
      });
    } catch (err: any) {
      setError(err.message);
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
