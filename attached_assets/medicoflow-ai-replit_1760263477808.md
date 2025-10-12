# 🤖 MedicoFlow AI Features - File Completi Replit

Copia e incolla questi file direttamente nel tuo progetto Replit.

---

## 📋 SETUP INIZIALE

### 1. Replit Secrets (Tools → Secrets)
```
OPENAI_API_KEY=sk-...
```

### 2. Install Dependencies
```bash
npm install openai
```

---

## 🗄️ FILE 1: prisma/schema.prisma

**Aggiungi questi models al tuo schema esistente:**

```prisma
model Subscription {
  id              String   @id @default(cuid())
  ambulatorioId   String   @unique
  piano           String   @default("BASE") // "BASE", "PROFESSIONAL", "ENTERPRISE"
  status          String   @default("active")
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([ambulatorioId])
}

model AIUsage {
  id              String   @id @default(cuid())
  ambulatorioId   String
  userId          String
  month           String   // formato: "2025-01"
  
  voiceNotesUsed  Int      @default(0)
  autoCompleteUsed Int     @default(0)
  analyticsUsed   Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([ambulatorioId, month])
  @@index([ambulatorioId])
  @@index([month])
}
```

**Poi esegui:**
```bash
npx prisma migrate dev --name add_ai_features
npx prisma generate
```

---

## 🌱 FILE 2: prisma/seed.ts

**Aggiungi questo DOPO la creazione ambulatorio:**

```typescript
// Crea subscription Professional per test
const subscription = await prisma.subscription.create({
  data: {
    ambulatorioId: ambulatorio.id,
    piano: 'PROFESSIONAL',
    status: 'active'
  }
})
console.log('✅ Subscription Professional creata')
```

**Esegui:**
```bash
npx prisma db seed
```

---

## 📁 FILE 3: lib/ai/whisper.ts

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
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'it',
      response_format: 'text'
    })

    const rawText = transcription as string
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
    return { anamnesi: text }
  }
}
```

---

## 📁 FILE 4: lib/ai/usage.ts

```typescript
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const PLAN_LIMITS = {
  BASE: { 
    voiceNotes: 0, 
    autoComplete: 0, 
    analytics: 0 
  },
  PROFESSIONAL: { 
    voiceNotes: 150,
    autoComplete: -1,
    analytics: -1
  },
  ENTERPRISE: { 
    voiceNotes: -1,
    autoComplete: -1,
    analytics: -1
  }
} as const

type PlanName = keyof typeof PLAN_LIMITS
type FeatureName = 'voiceNotes' | 'autoComplete' | 'analytics'

export async function checkAIQuota(
  feature: FeatureName
): Promise<{ 
  allowed: boolean
  used: number
  limit: number
  resetDate: Date
  percentageUsed: number
}> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Non autorizzato')

  const subscription = await prisma.subscription.findUnique({
    where: { ambulatorioId: user.ambulatorioId }
  })

  if (!subscription) {
    return { 
      allowed: false, 
      used: 0, 
      limit: 0, 
      resetDate: new Date(),
      percentageUsed: 0
    }
  }

  const planLimits = PLAN_LIMITS[subscription.piano as PlanName]
  const limit = planLimits[feature]

  if (limit === -1) {
    return { 
      allowed: true, 
      used: 0, 
      limit: -1, 
      resetDate: getNextMonthStart(),
      percentageUsed: 0
    }
  }

  if (limit === 0) {
    return {
      allowed: false,
      used: 0,
      limit: 0,
      resetDate: getNextMonthStart(),
      percentageUsed: 0
    }
  }

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
  } as const

  const used = (usage?.[featureMap[feature]] as number) || 0
  const percentageUsed = (used / limit) * 100

  return {
    allowed: used < limit,
    used,
    limit,
    resetDate: getNextMonthStart(),
    percentageUsed
  }
}

export async function incrementAIUsage(
  feature: FeatureName
): Promise<void> {
  const user = await getCurrentUser()
  if (!user) return

  const currentMonth = getCurrentMonth()
  const featureMap = {
    voiceNotes: 'voiceNotesUsed',
    autoComplete: 'autoCompleteUsed',
    analytics: 'analyticsUsed'
  } as const

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

## 📁 FILE 5: app/api/ai/transcribe/route.ts

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

    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'File troppo grande (max 25MB)' }, { status: 400 })
    }

    const result = await transcribeAudio(audioFile)

    await incrementAIUsage('voiceNotes')

    const updatedQuota = await checkAIQuota('voiceNotes')

    return NextResponse.json({
      success: true,
      result,
      quota: {
        used: updatedQuota.used,
        limit: updatedQuota.limit,
        resetDate: updatedQuota.resetDate,
        percentageUsed: updatedQuota.percentageUsed
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

## 📁 FILE 6: app/api/ai/quota/route.ts

```typescript
import { NextResponse } from 'next/server'
import { checkAIQuota } from '@/lib/ai/usage'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { ambulatorioId: user.ambulatorioId }
    })

    const voiceQuota = await checkAIQuota('voiceNotes')

    return NextResponse.json({
      plan: subscription?.piano || 'BASE',
      voiceNotes: voiceQuota
    })
  } catch (error) {
    console.error('Errore quota:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
```

---

## 📁 FILE 7: components/ai/VoiceRecorder.tsx

```typescript
'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Upload, Loader2, Sparkles, AlertTriangle } from 'lucide-react'

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
  const [quota, setQuota] = useState<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    fetchQuota()
  }, [])

  const fetchQuota = async () => {
    try {
      const res = await fetch('/api/ai/quota')
      const data = await res.json()
      setQuota(data.voiceNotes)
    } catch (error) {
      console.error('Errore fetch quota:', error)
    }
  }

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
        setError(`Limite raggiunto: ${data.quota.used}/${data.quota.limit} note questo mese. Reset: ${new Date(data.quota.resetDate).toLocaleDateString('it')}`)
        setQuota(data.quota)
        return
      }

      if (!res.ok) {
        throw new Error(data.error || 'Errore trascrizione')
      }

      onTranscriptionComplete(data.result)
      setQuota(data.quota)
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
        setError(`Limite raggiunto: ${data.quota.used}/${data.quota.limit}`)
        setQuota(data.quota)
        return
      }

      if (!res.ok) {
        throw new Error(data.error || 'Errore trascrizione')
      }

      onTranscriptionComplete(data.result)
      setQuota(data.quota)
    } catch (err: any) {
      setError(err.message || 'Errore durante la trascrizione')
    } finally {
      setIsProcessing(false)
      e.target.value = ''
    }
  }

  const isNearLimit = quota && quota.limit > 0 && quota.percentageUsed > 80

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Voice-to-Clinical-Note
          </h3>
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
            AI
          </span>
        </div>
        
        {quota && quota.limit > 0 && (
          <div className="text-right">
            <div className="text-xs text-gray-600">
              {quota.used}/{quota.limit} questo mese
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-1.5 mt-1">
              <div
                className={`h-1.5 rounded-full ${isNearLimit ? 'bg-orange-500' : 'bg-purple-600'}`}
                style={{ width: `${Math.min(quota.percentageUsed, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Parla durante la visita e l'AI trascriverà e strutturerà la cartella clinica.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {isNearLimit && !error && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 text-orange-700 text-sm rounded-lg">
          ⚠️ Stai per raggiungere il limite mensile.
        </div>
      )}

      <div className="flex gap-3">
        {!isRecording ? (
          <>
            <button
              onClick={startRecording}
              disabled={disabled || isProcessing || (quota?.limit === 0)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <Mic className="w-5 h-5" />
              Inizia Registrazione
            </button>

            <label className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors">
              <Upload className="w-5 h-5" />
              <span className="hidden sm:inline">Carica</span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                disabled={disabled || isProcessing || (quota?.limit === 0)}
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
            Stop
          </button>
        )}
      </div>

      {isProcessing && (
        <div className="mt-4 flex items-center justify-center gap-2 text-purple-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">
            Trascrizione in corso...
          </span>
        </div>
      )}
    </div>
  )
}
```

---

## 📁 FILE 8: Integrazione nel Form Cartella

**Nel tuo file form cartella (es: components/cartella/CartellaForm.tsx):**

**Aggiungi import:**
```typescript
import VoiceRecorder from '@/components/ai/VoiceRecorder'
import { useState, useEffect } from 'react'
```

**Aggiungi state:**
```typescript
const [hasAI, setHasAI] = useState(false)

useEffect(() => {
  fetch('/api/ai/quota')
    .then(res => res.json())
    .then(data => {
      setHasAI(data.plan === 'PROFESSIONAL' || data.plan === 'ENTERPRISE')
    })
    .catch(() => setHasAI(false))
}, [])
```

**Aggiungi nel JSX PRIMA dei textarea:**
```typescript
{hasAI && (
  <VoiceRecorder
    onTranscriptionComplete={(result) => {
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
```

---

## ✅ CHECKLIST

- [ ] OpenAI API key in Replit Secrets
- [ ] `npm install openai` eseguito
- [ ] Prisma schema aggiornato
- [ ] Migrazione eseguita: `npx prisma migrate dev`
- [ ] Seed eseguito: `npx prisma db seed`
- [ ] File lib/ai/whisper.ts creato
- [ ] File lib/ai/usage.ts creato
- [ ] File app/api/ai/transcribe/route.ts creato
- [ ] File app/api/ai/quota/route.ts creato
- [ ] File components/ai/VoiceRecorder.tsx creato
- [ ] Integrazione nel form completata
- [ ] Test recording funzionante
- [ ] Test file upload funzionante

---

## 🧪 TEST

```bash
# Start Replit
# Login: elena.rossi@medicoflow.it
# Vai a "Nuova Cartella Clinica"
# Vedi VoiceRecorder component
# Click "Inizia Registrazione"
# Parla 30 secondi
# Click Stop
# Form auto-compilato ✅
```

---

## 🔧 DEBUG

**Query Replit DB:**
```sql
-- Check subscription
SELECT * FROM "Subscription" WHERE ambulatorioId = 'amb-demo-001';

-- Check usage
SELECT * FROM "AIUsage" WHERE ambulatorioId = 'amb-demo-001';

-- Reset quota (per test)
DELETE FROM "AIUsage" WHERE ambulatorioId = 'amb-demo-001';

-- Change plan
UPDATE "Subscription" SET piano = 'ENTERPRISE' WHERE ambulatorioId = 'amb-demo-001';
```

**Replit Console Logs:**
- Cerca "Errore Whisper"
- Cerca "Errore trascrizione"
- Verifica OPENAI_API_KEY caricato

---

**✅ Implementazione completata! Tutti i file pronti per Replit.**