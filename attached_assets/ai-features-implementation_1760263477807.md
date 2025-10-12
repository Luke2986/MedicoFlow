# 🤖 AI Features Implementation - Professional & Enterprise

## OBIETTIVO
Implementare funzionalità AI differenziate per piani Professional ed Enterprise:
- Voice-to-Clinical-Note (Whisper API)
- Smart Autocomplete
- AI Analytics
- Usage tracking & limits
- Upgrade prompts

---

## 📦 SETUP INIZIALE

### 1. Installa Dipendenze

```bash
npm install openai
npm install react-dropzone
npm install @tremor/react  # Per analytics charts
```

### 2. Aggiungi API Keys in Environment

```env
# .env
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."  # Per Claude (già usato in Step 6B)
```

### 3. Aggiorna Prisma Schema

Aggiungi tracking usage AI:

```prisma
model AIUsage {
  id              String   @id @default(cuid())
  ambulatorioId   String
  userId          String
  month           String   // formato: "2025-01"
  
  // Counters
  voiceNotesUsed  Int      @default(0)
  autoCompleteUsed Int     @default(0)
  analyticsUsed   Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([ambulatorioId, month])
  @@index([ambulatorioId])
}
```

Esegui migrazione:
```bash
npx prisma migrate dev --name add_ai_usage
npx prisma generate
```

---

## 📁 FILE 1: lib/ai/whisper.ts

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface TranscriptionResult {
  text: string
  sections: {
    anamnesi?: string
    esameObiettivo?: string
    diagnosi?: string
    terapia?: string
  }
  raw: string
}

export async function transcribeAudio(
  audioFile: File
): Promise<TranscriptionResult> {
  try {
    // 1. Trascrivi audio con Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'it',
      response_format: 'text'
    })

    const rawText = transcription

    // 2. Struttura il testo con Claude (GPT-4 alternativa)
    const structured = await structureClinicalNote(rawText)

    return {
      text: rawText,
      sections: structured,
      raw: rawText
    }
  } catch (error) {
    console.error('Errore Whisper:', error)
    throw new Error('Errore durante la trascrizione audio')
  }
}

async function structureClinicalNote(text: string) {
  const prompt = `Sei un assistente medico specializzato. Analizza questa nota clinica e suddividila nelle seguenti sezioni:

TESTO TRASCRITTO:
"${text}"

Estrai e organizza il contenuto in queste sezioni (se presenti):
1. ANAMNESI: Storia clinica, sintomi riferiti dal paziente
2. ESAME OBIETTIVO: Osservazioni cliniche, parametri vitali
3. DIAGNOSI: Diagnosi clinica con eventuali codici ICD-10
4. TERAPIA: Terapia prescritta, farmaci, raccomandazioni

Rispondi SOLO con JSON in questo formato:
{
  "anamnesi": "...",
  "esameObiettivo": "...",
  "diagnosi": "...",
  "terapia": "..."
}

Se una sezione non è presente nel testo, omettila dal JSON.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'Sei un assistente medico che struttura note cliniche.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error('Nessuna risposta AI')

    return JSON.parse(content)
  } catch (error) {
    console.error('Errore strutturazione:', error)
    // Fallback: restituisci tutto come anamnesi
    return { anamnesi: text }
  }
}
```

---

## 📁 FILE 2: lib/ai/autocomplete.ts

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface AutocompleteResult {
  suggestions: string[]
  confidence: number
}

export async function getSmartSuggestions(
  context: {
    field: 'diagnosi' | 'terapia' | 'anamnesi'
    currentText: string
    patientHistory?: string[]
  }
): Promise<AutocompleteResult> {
  const prompts = {
    diagnosi: `Suggerisci diagnosi ICD-10 appropriate basandoti su questi sintomi/anamnesi:
"${context.currentText}"

Rispondi con JSON: { "suggestions": ["diagnosi 1 (codice)", "diagnosi 2 (codice)", ...] }`,
    
    terapia: `Suggerisci terapie appropriate per questa diagnosi:
"${context.currentText}"

Rispondi con JSON: { "suggestions": ["terapia 1", "terapia 2", ...] }`,
    
    anamnesi: `Completa questa nota anamnestica in modo professionale:
"${context.currentText}"

Rispondi con JSON: { "suggestions": ["completamento 1", "completamento 2", ...] }`
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { 
          role: 'system', 
          content: 'Sei un assistente medico che aiuta con suggerimenti clinici. Rispondi sempre in italiano con JSON valido.' 
        },
        { role: 'user', content: prompts[context.field] }
      ],
      temperature: 0.5,
      max_tokens: 300,
      response_format: { type: 'json_object' }
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error('Nessuna risposta')

    const result = JSON.parse(content)
    
    return {
      suggestions: result.suggestions || [],
      confidence: 0.8
    }
  } catch (error) {
    console.error('Errore autocomplete:', error)
    return { suggestions: [], confidence: 0 }
  }
}
```

---

## 📁 FILE 3: lib/ai/usage.ts

```typescript
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function checkAIQuota(
  feature: 'voiceNotes' | 'autoComplete' | 'analytics'
): Promise<{ allowed: boolean; used: number; limit: number; resetDate: Date }> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Non autorizzato')

  // Get subscription
  const subscription = await prisma.subscription.findUnique({
    where: { ambulatorioId: user.ambulatorioId }
  })

  if (!subscription) {
    return { allowed: false, used: 0, limit: 0, resetDate: new Date() }
  }

  // Define limits per plan
  const limits = {
    BASE: { voiceNotes: 0, autoComplete: 0, analytics: 0 },
    PROFESSIONAL: { voiceNotes: 150, autoComplete: -1, analytics: -1 }, // -1 = unlimited
    ENTERPRISE: { voiceNotes: -1, autoComplete: -1, analytics: -1 }
  }

  const planLimits = limits[subscription.piano as keyof typeof limits]
  const limit = planLimits[feature]

  // Se unlimited, return allowed
  if (limit === -1) {
    return { 
      allowed: true, 
      used: 0, 
      limit: -1, 
      resetDate: getNextMonthStart() 
    }
  }

  // Get current month usage
  const currentMonth = getCurrentMonth()
  const usage = await prisma.aIUsage.findUnique({
    where: {
      ambulatorioId_month: {
        ambulatorioId: user.ambulatorioId,
        month: currentMonth
      }
    }
  })

  const featureMap = {
    voiceNotes: 'voiceNotesUsed',
    autoComplete: 'autoCompleteUsed',
    analytics: 'analyticsUsed'
  }

  const used = usage?.[featureMap[feature] as keyof typeof usage] as number || 0

  return {
    allowed: used < limit,
    used,
    limit,
    resetDate: getNextMonthStart()
  }
}

export async function incrementAIUsage(
  feature: 'voiceNotes' | 'autoComplete' | 'analytics'
) {
  const user = await getCurrentUser()
  if (!user) return

  const currentMonth = getCurrentMonth()
  const featureMap = {
    voiceNotes: 'voiceNotesUsed',
    autoComplete: 'autoCompleteUsed',
    analytics: 'analyticsUsed'
  }

  await prisma.aIUsage.upsert({
    where: {
      ambulatorioId_month: {
        ambulatorioId: user.ambulatorioId,
        month: currentMonth
      }
    },
    create: {
      ambulatorioId: user.ambulatorioId,
      userId: user.id,
      month: currentMonth,
      [featureMap[feature]]: 1
    },
    update: {
      [featureMap[feature]]: { increment: 1 }
    }
  })
}

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getNextMonthStart(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 1)
}
```

---

## 📁 FILE 4: app/api/ai/transcribe/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio } from '@/lib/ai/whisper'
import { checkAIQuota, incrementAIUsage } from '@/lib/ai/usage'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Check quota
    const quota = await checkAIQuota('voiceNotes')
    if (!quota.allowed) {
      return NextResponse.json({
        error: 'Limite voice notes raggiunto',
        quota: {
          used: quota.used,
          limit: quota.limit,
          resetDate: quota.resetDate
        }
      }, { status: 429 })
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json({ error: 'File audio mancante' }, { status: 400 })
    }

    // Validate file size (max 25MB)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'File troppo grande (max 25MB)' }, { status: 400 })
    }

    // Transcribe
    const result = await transcribeAudio(audioFile)

    // Increment usage
    await incrementAIUsage('voiceNotes')

    return NextResponse.json({
      success: true,
      result,
      quota: {
        used: quota.used + 1,
        limit: quota.limit,
        resetDate: quota.resetDate
      }
    })
  } catch (error: any) {
    console.error('Errore trascrizione:', error)
    return NextResponse.json({ 
      error: error.message || 'Errore durante la trascrizione' 
    }, { status: 500 })
  }
}
```

---

## 📁 FILE 5: app/api/ai/autocomplete/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSmartSuggestions } from '@/lib/ai/autocomplete'
import { checkAIQuota, incrementAIUsage } from '@/lib/ai/usage'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Check quota (autocomplete unlimited su Professional+)
    const quota = await checkAIQuota('autoComplete')
    if (!quota.allowed) {
      return NextResponse.json({
        error: 'Funzionalità disponibile solo su piani Professional+'
      }, { status: 403 })
    }

    const body = await request.json()
    const { field, currentText, patientHistory } = body

    if (!field || !currentText) {
      return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 })
    }

    const result = await getSmartSuggestions({
      field,
      currentText,
      patientHistory
    })

    // Increment usage
    await incrementAIUsage('autoComplete')

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Errore autocomplete:', error)
    return NextResponse.json({ 
      error: error.message || 'Errore durante suggerimenti' 
    }, { status: 500 })
  }
}
```

---

## 📁 FILE 6: components/ai/VoiceRecorder.tsx

```typescript
'use client'

import { useState, useRef } from 'react'
import { Mic, Square, Upload, Loader2, Sparkles } from 'lucide-react'

interface VoiceRecorderProps {
  onTranscriptionComplete: (result: any) => void
  disabled?: boolean
}

export default function VoiceRecorder({ 
  onTranscriptionComplete, 
  disabled 
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        await processAudio(audioBlob)
        
        // Stop stream
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setError('')
    } catch (err) {
      setError('Errore accesso microfono. Controlla i permessi.')
      console.error('Errore microfono:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (res.status === 429) {
        // Quota exceeded
        setError(`Limite raggiunto: ${data.quota.used}/${data.quota.limit} note questo mese. Reset: ${new Date(data.quota.resetDate).toLocaleDateString('it')}`)
        return
      }

      if (!res.ok) {
        throw new Error(data.error || 'Errore trascrizione')
      }

      onTranscriptionComplete(data.result)
    } catch (err: any) {
      setError(err.message || 'Errore durante la trascrizione')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('audio', file)

      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (res.status === 429) {
        setError(`Limite raggiunto: ${data.quota.used}/${data.quota.limit} note questo mese`)
        return
      }

      if (!res.ok) {
        throw new Error(data.error || 'Errore trascrizione')
      }

      onTranscriptionComplete(data.result)
    } catch (err: any) {
      setError(err.message || 'Errore durante la trascrizione')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Voice-to-Clinical-Note
        </h3>
        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
          AI
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Parla durante la visita e l'AI trascriverà e strutturerà automaticamente la cartella clinica.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        {!isRecording ? (
          <>
            <button
              onClick={startRecording}
              disabled={disabled || isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <Mic className="w-5 h-5" />
              Inizia Registrazione
            </button>

            <label className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors">
              <Upload className="w-5 h-5" />
              <span className="hidden sm:inline">Carica Audio</span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                disabled={disabled || isProcessing}
                className="hidden"
              />
            </label>
          </>
        ) : (
          <button
            onClick={stopRecording}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors animate-pulse"
          >
            <Square className="w-5 h-5" />
            Stop Registrazione
          </button>
        )}
      </div>

      {isProcessing && (
        <div className="mt-4 flex items-center justify-center gap-2 text-purple-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">
            Trascrizione e strutturazione in corso...
          </span>
        </div>
      )}
    </div>
  )
}
```

---

## 📁 FILE 7: components/ai/SmartAutocomplete.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { debounce } from 'lodash'

interface SmartAutocompleteProps {
  field: 'diagnosi' | 'terapia' | 'anamnesi'
  currentText: string
  onSuggestionSelect: (suggestion: string) => void
}

export default function SmartAutocomplete({
  field,
  currentText,
  onSuggestionSelect
}: SmartAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    if (currentText.length < 10) {
      setSuggestions([])
      return
    }

    const fetchSuggestions = debounce(async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/ai/autocomplete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ field, currentText })
        })

        const data = await res.json()

        if (res.ok && data.suggestions) {
          setSuggestions(data.suggestions)
          setShowSuggestions(true)
        }
      } catch (error) {
        console.error('Errore autocomplete:', error)
      } finally {
        setLoading(false)
      }
    }, 1000)

    fetchSuggestions()

    return () => fetchSuggestions.cancel()
  }, [currentText, field])

  if (!showSuggestions && suggestions.length === 0) return null

  return (
    <div className="relative">
      {loading && (
        <div className="absolute -top-8 right-0 flex items-center gap-2 text-xs text-purple-600">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>AI suggerisce...</span>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-semibold text-purple-900">
              Suggerimenti AI
            </span>
            <button
              onClick={() => setShowSuggestions(false)}
              className="ml-auto text-xs text-purple-600 hover:text-purple-800"
            >
              Nascondi
            </button>
          </div>
          <div className="space-y-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSuggestionSelect(suggestion)
                  setShowSuggestions(false)
                }}
                className="block w-full text-left px-3 py-2 bg-white rounded border border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-colors text-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## 📁 FILE 8: Integrazione con CartellaForm

Aggiorna `components/cartella/CartellaForm.tsx`:

```typescript
// Aggiungi imports
import VoiceRecorder from '@/components/ai/VoiceRecorder'
import SmartAutocomplete from '@/components/ai/SmartAutocomplete'
import { useSession } from 'next-auth/react'

// Nel componente, aggiungi state per subscription check
const { data: session } = useSession()
const [hasAI, setHasAI] = useState(false)

useEffect(() => {
  // Check se ha accesso AI features
  fetch('/api/subscription')
    .then(res => res.json())
    .then(data => {
      const hasAIAccess = ['PROFESSIONAL', 'ENTERPRISE'].includes(data.piano)
      setHasAI(hasAIAccess)
    })
}, [])

// Prima del form, aggiungi VoiceRecorder
{hasAI && (
  <VoiceRecorder
    onTranscriptionComplete={(result) => {
      // Auto-popola form con risultato AI
      setFormData(prev => ({
        ...prev,
        anamnesi: result.sections.anamnesi || prev.anamnesi,
        esameObiettivo: result.sections.esameObiettivo || prev.esameObiettivo,
        diagnosi: result.sections.diagnosi || prev.diagnosi,
        terapia: result.sections.terapia || prev.terapia
      }))
    }}
  />
)}

// Dopo ogni textarea, aggiungi SmartAutocomplete
<textarea
  value={formData.diagnosi}
  onChange={(e) => setFormData(prev => ({ ...prev, diagnosi: e.target.value }))}
  // ... altri props
/>
{hasAI && (
  <SmartAutocomplete
    field="diagnosi"
    currentText={formData.diagnosi}
    onSuggestionSelect={(suggestion) => 
      setFormData(prev => ({ ...prev, diagnosi: suggestion }))
    }
  />
)}
```

---

## 📁 FILE 9: components/ai/QuotaDisplay.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Sparkles, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function QuotaDisplay() {
  const [quota, setQuota] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuota()
  }, [])

  const fetchQuota = async () => {
    try {
      const res = await fetch('/api/ai/quota')
      const data = await res.json()
      setQuota(data)
    } catch (error) {
      console.error('Errore quota:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !quota) return null

  const percentage = quota.limit === -1 
    ? 100 
    : (quota.used / quota.limit) * 100

  const isNearLimit = percentage > 80

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-semibold text-gray-900">
            Voice Notes AI
          </span>
        </div>
        {quota.limit !== -1 && (
          <span className="text-sm text-gray-600">
            {quota.used}/{quota.limit}
          </span>
        )}
      </div>

      {quota.limit !== -1 ? (
        <>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all ${
                isNearLimit ? 'bg-orange-500' : 'bg-purple-600'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          {isNearLimit && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-xs text-orange-800 mb-2">
                ⚠️ Stai per raggiungere il limite mensile
              </p>
              <Link
                href="/dashboard/impostazioni/billing"
                className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 font-semibold"
              >
                <TrendingUp className="w-3 h-3" />
                Upgrade a Enterprise per voice notes unlimited
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <span className="font-semibold">✓ Unlimited</span>
          <span className="text-gray-500">Voice notes illimitate</span>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-2">
        Reset: {new Date(quota.resetDate).toLocaleDateString('it')}
      </p>
    </div>
  )
}
```

---

## 📁 FILE 10: app/api/ai/quota/route.ts

```typescript
import { NextResponse } from 'next/server'
import { checkAIQuota } from '@/lib/ai/usage'

export async function GET() {
  try {
    const quota = await checkAIQuota('voiceNotes')
    return NextResponse.json(quota)
  } catch (error) {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}
```

---

## ✅ TESTING CHECKLIST

### Test 1: Voice-to-Clinical-Note
- [ ] Vai a "Nuova Cartella Clinica"
- [ ] Se Professional/Enterprise → vedi VoiceRecorder
- [ ] Click "Inizia Registrazione"
- [ ] Parla: "Il paziente riferisce cefalea da 3 giorni..."
- [ ] Stop → attendi trascrizione
- [ ] Form auto-popolato con sezioni

### Test 2: Quota Limits
- [ ] Professional: vedi "150/mese"
- [ ] Enterprise: vedi "Unlimited"
- [ ] Usa 150 note (Professional)
- [ ] Vedi errore 429 + upgrade prompt

### Test 3: Smart Autocomplete
- [ ] Digita in campo Diagnosi
- [ ] Dopo 10+ caratteri → vedi "AI suggerisce..."
- [ ] Vedi 2-3 suggerimenti
- [ ] Click su suggerimento → auto-completa

### Test 4: File Upload
- [ ] Click "Carica Audio"
- [ ] Seleziona file .mp3/.wav
- [ ] Trascrizione funziona

### Test 5: Quota Display
- [ ] Dashboard mostra QuotaDisplay
- [ ] Vedi usage bar
- [ ] Warning a 80%+ utilizzo

---

## 📊 RISULTATO ATTESO

✅ Voice-to-Clinical-Note funzionante  
✅ Trascrizione + strutturazione automatica  
✅ Smart Autocomplete con suggerimenti AI  
✅ Quota tracking per piano  
✅ Upgrade prompts intelligenti  
✅ UI/UX premium per feature AI  
✅ Differenziazione Professional vs Enterprise