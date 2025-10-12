import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VoiceRecorderProps {
  ambulatorioId: string;
  userId: string;
  onTranscriptionComplete: (result: any) => void;
  disabled?: boolean;
}

interface QuotaInfo {
  allowed: boolean;
  used: number;
  limit: number;
  resetDate: string;
  percentageUsed: number;
}

export function VoiceRecorder({ 
  ambulatorioId,
  userId,
  onTranscriptionComplete, 
  disabled 
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [plan, setPlan] = useState<string>('');
  const [isLoadingQuota, setIsLoadingQuota] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (ambulatorioId && userId) {
      fetchQuota();
    }
  }, [ambulatorioId, userId]);

  const fetchQuota = async () => {
    try {
      setIsLoadingQuota(true);
      const res = await fetch(`/api/ai/quota?ambulatorioId=${ambulatorioId}&userId=${userId}`);
      const data = await res.json();
      setQuota(data.voiceNotes);
      setPlan(data.plan);
    } catch (error) {
      console.error('Errore fetch quota:', error);
    } finally {
      setIsLoadingQuota(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError('');
    } catch (err) {
      setError('Errore accesso microfono. Controlla i permessi.');
      console.error('Errore microfono:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('ambulatorioId', ambulatorioId);
      formData.append('userId', userId);

      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante la trascrizione');
      }

      // Update quota
      setQuota(data.quota);

      // Call parent callback with transcription result
      onTranscriptionComplete(data.result);
    } catch (error: any) {
      setError(error.message || 'Errore durante la trascrizione');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      setError('File troppo grande (max 25MB)');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('ambulatorioId', ambulatorioId);
      formData.append('userId', userId);

      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante la trascrizione');
      }

      // Update quota
      setQuota(data.quota);

      // Call parent callback
      onTranscriptionComplete(data.result);
    } catch (error: any) {
      setError(error.message || 'Errore durante la trascrizione');
    } finally {
      setIsProcessing(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Check if feature is available for current plan
  const isFeatureAvailable = quota?.limit !== 0;
  const isQuotaExceeded = quota ? !quota.allowed : false;

  if (plan === 'BASE') {
    return (
      <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800 dark:text-orange-200">
          <strong>Funzionalità AI disponibile da piano Professional</strong>
          <p className="mt-1 text-sm">
            Passa a Professional per sbloccare Voice-to-Clinical-Note e Smart Autocomplete.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Voice-to-Clinical-Note</h3>
          <Badge variant="outline" className="text-xs">
            {plan}
          </Badge>
        </div>
        {quota && quota.limit !== -1 && (
          <div className="text-sm text-muted-foreground">
            {quota.used}/{quota.limit} usati
          </div>
        )}
      </div>

      {quota && quota.limit !== -1 && (
        <div className="space-y-1">
          <Progress value={quota.percentageUsed} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Reset: {new Date(quota.resetDate).toLocaleDateString('it-IT')}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isProcessing || isQuotaExceeded}
          variant={isRecording ? 'destructive' : 'default'}
          className="flex-1"
          data-testid="button-voice-record"
        >
          {isRecording ? (
            <>
              <Square className="w-4 h-4 mr-2" />
              Stop Registrazione
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              Registra Audio
            </>
          )}
        </Button>

        <label>
          <Button
            variant="outline"
            disabled={disabled || isProcessing || isQuotaExceeded}
            asChild
            data-testid="button-voice-upload"
          >
            <span>
              <Upload className="w-4 h-4 mr-2" />
              Carica File
            </span>
          </Button>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={disabled || isProcessing || isQuotaExceeded}
          />
        </label>
      </div>

      {isProcessing && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Trascrizione in corso...</span>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isQuotaExceeded && quota && (
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            Limite mensile raggiunto. Reset: {new Date(quota.resetDate).toLocaleDateString('it-IT')}
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
}
