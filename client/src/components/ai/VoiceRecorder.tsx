import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, Loader2, Sparkles, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import type { ConsensoAi } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VoiceRecorderProps {
  ambulatorioId: string;
  userId: string;
  pazienteId?: string;
  onTranscriptionComplete: (result: any) => void;
  disabled?: boolean;
  /** Public demo without an AI provider: no microphone is opened and the server returns a simulated dictation. */
  simulazione?: boolean;
}

export function VoiceRecorder({ 
  ambulatorioId,
  userId,
  pazienteId,
  onTranscriptionComplete, 
  disabled,
  simulazione,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [consensoMancante, setConsensoMancante] = useState(false);
  const { data: consensoData, isLoading: isLoadingConsenso } = useQuery<{ consenso: ConsensoAi | null; versioneCorrente: string }>({
    queryKey: ['/api/pazienti', pazienteId, 'consenso-ai'],
    queryFn: async () => {
      const res = await fetch(`/api/pazienti/${pazienteId}/consenso-ai`);
      if (!res.ok) throw new Error('Errore nel caricamento del consenso AI');
      return res.json();
    },
    enabled: !!pazienteId,
  });
  const consensoAttivo = !!consensoData?.consenso?.consensoRegistrazione;
  const bloccatoPerConsenso = !pazienteId || isLoadingConsenso || !consensoAttivo;
  const [secondi, setSecondi] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!isRecording) return;
    setSecondi(0);
    const t = setInterval(() => setSecondi((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [isRecording]);

  const startRecording = async () => {
    if (simulazione) {
      setError('');
      setIsRecording(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      // Usa il miglior formato audio disponibile per Whisper
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        console.log('Audio registrato:', {
          size: audioBlob.size,
          type: audioBlob.type,
          duration: chunksRef.current.length
        });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError('');
      console.log('Registrazione avviata con:', mimeType);
    } catch (err) {
      setError('Errore accesso microfono. Controlla i permessi.');
      console.error('Errore microfono:', err);
    }
  };

  const stopRecording = () => {
    if (simulazione && isRecording) {
      setIsRecording(false);
      void sendAudio(null);
      return;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudio = async (audio: Blob | null, filename?: string) => {
    setIsProcessing(true);
    setError('');
    setConsensoMancante(false);

    try {
      const formData = new FormData();
      if (audio && filename) formData.append('audio', audio, filename);
      else if (audio) formData.append('audio', audio);
      formData.append('ambulatorioId', ambulatorioId);
      formData.append('userId', userId);
      if (pazienteId) formData.append('pazienteId', pazienteId);

      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'CONSENSO_AI_MANCANTE') setConsensoMancante(true);
        throw new Error(data.error || 'Errore durante la trascrizione');
      }

      onTranscriptionComplete(data.result);
    } catch (error: any) {
      setError(error.message || 'Errore durante la trascrizione');
    } finally {
      setIsProcessing(false);
    }
  };

  const processAudio = (audioBlob: Blob) => sendAudio(audioBlob, 'recording.webm');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setError('File troppo grande (max 25MB)');
      return;
    }

    await sendAudio(file);
    event.target.value = '';
  };

  const bloccato = disabled || isProcessing || bloccatoPerConsenso;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Voice-to-Clinical-Note</h3>
      </div>

      {!pazienteId && (
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            Seleziona un paziente per usare la dettatura vocale.
          </AlertDescription>
        </Alert>
      )}

      {pazienteId && !isLoadingConsenso && !consensoAttivo && (
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20" data-testid="alert-consenso-ai-mancante">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>Dettatura bloccata:</strong>{' '}
            {consensoData?.consenso
              ? 'il paziente ha rifiutato la trascrizione con AI.'
              : "il paziente non ha ancora ricevuto l'informativa sull'uso dell'AI (L. 132/2025, art. 7)."}
            <Link href={`/dashboard/pazienti/${pazienteId}`} className="block mt-1 underline font-medium">
              Gestisci l'informativa nella scheda del paziente
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Best Practices per Trascrizione di Qualità */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <strong className="block mb-2">Per una trascrizione ottimale:</strong>
          <ul className="space-y-1 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />
              <span><strong>Ambiente silenzioso</strong> - Chiudi finestre e spegni rumori di fondo</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />
              <span><strong>Microfono di qualità</strong> - Usa cuffie con microfono o microfono esterno</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />
              <span><strong>Parla lentamente</strong> - Scandisci bene i termini medici (es. "e-mi-cra-nia")</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />
              <span><strong>Distanza 10-15cm</strong> - Mantieni il microfono vicino alla bocca</span>
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="flex gap-2">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={bloccato}
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
            disabled={bloccato}
            asChild
            className={bloccato ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
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
            disabled={bloccato}
          />
        </label>
      </div>

      {isRecording && (
        <div className="flex items-center gap-3 text-sm text-blue-600 dark:text-blue-400" data-testid="indicatore-registrazione">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="font-mono tabular-nums">
            {String(Math.floor(secondi / 60)).padStart(2, '0')}:{String(secondi % 60).padStart(2, '0')}
          </span>
          <div className="flex items-end gap-0.5 h-5" aria-hidden>
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} className="onda-barra w-1 rounded-full bg-blue-500" style={{ animationDelay: `${(i * 137) % 900}ms` }} />
            ))}
          </div>
          <span className="font-medium">
            {simulazione ? 'Registrazione in corso' : 'Registrazione in corso - Parla chiaramente vicino al microfono'}
          </span>
        </div>
      )}

      {isProcessing && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="indicatore-trascrizione">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Trascrizione in corso…</span>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            {consensoMancante && pazienteId && (
              <Link href={`/dashboard/pazienti/${pazienteId}`} className="block mt-1 underline font-medium">
                Registra l'informativa AI nella scheda del paziente
              </Link>
            )}
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
}
