# 📋 STEP 8: Cartella Clinica Digitale

## OBIETTIVO
Implementa sistema completo di cartella clinica elettronica con form strutturato, storico visite, visualizzazione read-only, e export PDF.

**Features:**
- Form cartella clinica completo (anamnesi, esame, diagnosi, terapia)
- Storico cartelle per paziente
- Visualizzazione read-only per compliance
- Collegamento con appuntamenti
- Export PDF (opzionale)
- Validazione campi obbligatori

---

## 📦 SETUP DATABASE

### 1. Aggiorna Prisma Schema

Aggiungi questo model in `prisma/schema.prisma`:

```prisma
model CartellaClinica {
  id              String   @id @default(cuid())
  pazienteId      String
  paziente        Paziente @relation(fields: [pazienteId], references: [id], onDelete: Cascade)
  medicoId        String
  appuntamentoId  String?  // Opzionale: link ad appuntamento
  dataVisita      DateTime @default(now())
  
  // Dati clinici
  anamnesi        String?  @db.Text
  esameObiettivo  String?  @db.Text
  diagnosi        String?  @db.Text
  terapia         String?  @db.Text
  notePrivate     String?  @db.Text
  
  // Metadata
  allegati        String[] // Array URLs allegati
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([pazienteId])
  @@index([dataVisita])
}
```

### 2. Aggiorna model Paziente per relazione

Nel model Paziente esistente, aggiungi:

```prisma
model Paziente {
  // ... campi esistenti ...
  cartelle        CartellaClinica[]
}
```

### 3. Esegui migrazione

```bash
npx prisma migrate dev --name add_cartella_clinica
npx prisma generate
```

### 4. Aggiorna seed (opzionale)

Aggiungi in `prisma/seed.ts` dopo creazione appuntamenti:

```typescript
// Crea alcune cartelle cliniche esempio
await prisma.cartellaClinica.createMany({
  data: [
    {
      pazienteId: pazienti[0].id,
      medicoId: medico.id,
      dataVisita: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      anamnesi: 'Paziente in follow-up per disturbo d\'ansia generalizzato. Riferisce miglioramento sintomatologia ansiosa con terapia in corso.',
      esameObiettivo: 'Paziente vigile, orientato, collaborante. Tono dell\'umore stabile. Eloquio fluente e coerente.',
      diagnosi: 'Disturbo d\'ansia generalizzato (F41.1) - in miglioramento',
      terapia: 'Prosegue terapia psicologica settimanale. Continua sertralina 50mg/die.',
      notePrivate: 'Buona compliance terapeutica. Prossimo controllo tra 4 settimane.'
    },
    {
      pazienteId: pazienti[1].id,
      medicoId: medico.id,
      dataVisita: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      anamnesi: 'Prima visita. Paziente riferisce sintomi depressivi da circa 3 mesi: umore deflesso, anedonia, disturbi del sonno.',
      esameObiettivo: 'Paziente vigile, orientato. Umore deflesso. Eloquio rallentato. Ideazione rallentata.',
      diagnosi: 'Episodio depressivo maggiore, moderato (F32.1)',
      terapia: 'Avviata psicoterapia supportiva. Proposto trattamento farmacologico - paziente richiede tempo per valutare.',
      notePrivate: 'Paziente motivato al trattamento. Rivalutare necessità farmaci tra 2 settimane.'
    }
  ]
})
console.log('✅ Cartelle cliniche create')
```

---

## 📁 FILE 1: app/api/cartelle/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const pazienteId = searchParams.get('pazienteId')

    const where: any = {
      paziente: {
        ambulatorioId: user.ambulatorioId
      }
    }

    if (pazienteId) {
      where.pazienteId = pazienteId
    }

    const cartelle = await prisma.cartellaClinica.findMany({
      where,
      include: {
        paziente: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            dataNascita: true
          }
        }
      },
      orderBy: { dataVisita: 'desc' },
      take: 100 // Limita risultati
    })

    return NextResponse.json(cartelle)
  } catch (error) {
    console.error('Errore GET cartelle:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const body = await request.json()

    // Verifica che il paziente appartenga all'ambulatorio dell'utente
    const paziente = await prisma.paziente.findFirst({
      where: {
        id: body.pazienteId,
        ambulatorioId: user.ambulatorioId
      }
    })

    if (!paziente) {
      return NextResponse.json({ error: 'Paziente non trovato' }, { status: 404 })
    }

    const cartella = await prisma.cartellaClinica.create({
      data: {
        pazienteId: body.pazienteId,
        medicoId: user.id,
        appuntamentoId: body.appuntamentoId,
        dataVisita: body.dataVisita ? new Date(body.dataVisita) : new Date(),
        anamnesi: body.anamnesi,
        esameObiettivo: body.esameObiettivo,
        diagnosi: body.diagnosi,
        terapia: body.terapia,
        notePrivate: body.notePrivate,
        allegati: body.allegati || []
      },
      include: {
        paziente: {
          select: {
            id: true,
            nome: true,
            cognome: true
          }
        }
      }
    })

    return NextResponse.json(cartella, { status: 201 })
  } catch (error) {
    console.error('Errore POST cartella:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
```

---

## 📁 FILE 2: app/api/cartelle/[id]/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const cartella = await prisma.cartellaClinica.findFirst({
      where: {
        id: params.id,
        paziente: {
          ambulatorioId: user.ambulatorioId
        }
      },
      include: {
        paziente: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            codiceFiscale: true,
            dataNascita: true
          }
        }
      }
    })

    if (!cartella) {
      return NextResponse.json({ error: 'Cartella non trovata' }, { status: 404 })
    }

    return NextResponse.json(cartella)
  } catch (error) {
    console.error('Errore GET cartella:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Verifica ownership
    const cartella = await prisma.cartellaClinica.findFirst({
      where: {
        id: params.id,
        paziente: {
          ambulatorioId: user.ambulatorioId
        }
      }
    })

    if (!cartella) {
      return NextResponse.json({ error: 'Cartella non trovata' }, { status: 404 })
    }

    await prisma.cartellaClinica.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore DELETE cartella:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
```

---

## 📁 FILE 3: components/cartella/CartellaForm.tsx

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, FileText } from 'lucide-react'
import { format } from 'date-fns'

interface CartellaFormProps {
  paziente: {
    id: string
    nome: string
    cognome: string
  }
  appuntamentoId?: string
}

export default function CartellaForm({ paziente, appuntamentoId }: CartellaFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    dataVisita: format(new Date(), 'yyyy-MM-dd'),
    anamnesi: '',
    esameObiettivo: '',
    diagnosi: '',
    terapia: '',
    notePrivate: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/cartelle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pazienteId: paziente.id,
          appuntamentoId,
          dataVisita: new Date(formData.dataVisita).toISOString(),
          anamnesi: formData.anamnesi,
          esameObiettivo: formData.esameObiettivo,
          diagnosi: formData.diagnosi,
          terapia: formData.terapia,
          notePrivate: formData.notePrivate
        })
      })

      if (!res.ok) {
        throw new Error('Errore durante il salvataggio')
      }

      const cartella = await res.json()
      router.push(`/dashboard/cartella-clinica/${cartella.id}`)
    } catch (err) {
      setError('Errore durante il salvataggio della cartella')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Header Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Nuova Cartella Clinica</h3>
        </div>
        <p className="text-sm text-gray-700">
          Paziente: <strong>{paziente.cognome} {paziente.nome}</strong>
        </p>
      </div>

      {/* Data Visita */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Data Visita *
        </label>
        <input
          type="date"
          value={formData.dataVisita}
          onChange={(e) => setFormData(prev => ({ ...prev, dataVisita: e.target.value }))}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Anamnesi */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Anamnesi
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Storia clinica, sintomi riferiti dal paziente, motivo della visita
        </p>
        <textarea
          value={formData.anamnesi}
          onChange={(e) => setFormData(prev => ({ ...prev, anamnesi: e.target.value }))}
          rows={6}
          placeholder="Es: Paziente riferisce cefalea frontale da 3 giorni, non responsiva a FANS..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
        />
      </div>

      {/* Esame Obiettivo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Esame Obiettivo
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Osservazioni cliniche, parametri vitali, esame fisico
        </p>
        <textarea
          value={formData.esameObiettivo}
          onChange={(e) => setFormData(prev => ({ ...prev, esameObiettivo: e.target.value }))}
          rows={6}
          placeholder="Es: PA 120/80 mmHg, FC 72 bpm. Paziente vigile, orientato. Non segni di deficit neurologici focali..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
        />
      </div>

      {/* Diagnosi */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Diagnosi *
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Diagnosi clinica, codici ICD-10 se applicabili
        </p>
        <textarea
          value={formData.diagnosi}
          onChange={(e) => setFormData(prev => ({ ...prev, diagnosi: e.target.value }))}
          rows={4}
          required
          placeholder="Es: Cefalea tensiva (G44.2)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
        />
      </div>

      {/* Terapia */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Terapia e Prescrizioni
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Terapia farmacologica, prescrizioni, raccomandazioni
        </p>
        <textarea
          value={formData.terapia}
          onChange={(e) => setFormData(prev => ({ ...prev, terapia: e.target.value }))}
          rows={6}
          placeholder="Es: Ibuprofene 600mg x 2/die per 5 giorni. Riposo. Evitare stress. Controllo tra 10 giorni..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
        />
      </div>

      {/* Note Private */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Note Private (non visibili al paziente)
        </label>
        <textarea
          value={formData.notePrivate}
          onChange={(e) => setFormData(prev => ({ ...prev, notePrivate: e.target.value }))}
          rows={3}
          placeholder="Note personali, promemoria, osservazioni riservate..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Salvataggio...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Salva Cartella Clinica
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Annulla
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        ⚠️ La cartella clinica sarà read-only dopo il salvataggio per motivi di compliance medico-legale
      </p>
    </form>
  )
}
```

---

## 📁 FILE 4: components/cartella/CartellaView.tsx

```typescript
'use client'

import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Calendar, User, FileText, Stethoscope, Pill, StickyNote, Download, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CartellaViewProps {
  cartella: any
}

export default function CartellaView({ cartella }: CartellaViewProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Sei sicuro di voler eliminare questa cartella clinica? Questa azione è irreversibile.')) {
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/cartelle/${cartella.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        router.push(`/dashboard/pazienti/${cartella.pazienteId}`)
      } else {
        alert('Errore durante eliminazione')
      }
    } catch (error) {
      alert('Errore durante eliminazione')
    } finally {
      setDeleting(false)
    }
  }

  const handleExportPDF = () => {
    // TODO: Implementare export PDF
    alert('Funzionalità export PDF in arrivo!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Cartella Clinica
              </h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{cartella.paziente.cognome} {cartella.paziente.nome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(cartella.dataVisita), 'dd MMMM yyyy', { locale: it })}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Eliminazione...' : 'Elimina'}
            </button>
          </div>
        </div>
      </div>

      {/* Warning Read-Only */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          🔒 Questa cartella clinica è in modalità read-only per compliance medico-legale. 
          Non è possibile modificarla dopo il salvataggio.
        </p>
      </div>

      {/* Anamnesi */}
      {cartella.anamnesi && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Anamnesi</h3>
          </div>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded">
              {cartella.anamnesi}
            </p>
          </div>
        </div>
      )}

      {/* Esame Obiettivo */}
      {cartella.esameObiettivo && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Stethoscope className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Esame Obiettivo</h3>
          </div>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded">
              {cartella.esameObiettivo}
            </p>
          </div>
        </div>
      )}

      {/* Diagnosi */}
      {cartella.diagnosi && (
        <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6 border-l-4 border-l-blue-600">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Diagnosi</h3>
          </div>
          <div className="prose max-w-none">
            <p className="text-gray-900 whitespace-pre-wrap font-mono text-sm bg-blue-50 p-4 rounded font-semibold">
              {cartella.diagnosi}
            </p>
          </div>
        </div>
      )}

      {/* Terapia */}
      {cartella.terapia && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Pill className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Terapia e Prescrizioni</h3>
          </div>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded">
              {cartella.terapia}
            </p>
          </div>
        </div>
      )}

      {/* Note Private */}
      {cartella.notePrivate && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <StickyNote className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Note Private</h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              Non visibile al paziente
            </span>
          </div>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
              {cartella.notePrivate}
            </p>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Creata il:</span>{' '}
            {format(new Date(cartella.createdAt), 'dd/MM/yyyy HH:mm')}
          </div>
          <div>
            <span className="font-medium">ID Cartella:</span> {cartella.id}
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 📁 FILE 5: app/dashboard/cartella-clinica/nuovo/page.tsx

```typescript
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import CartellaForm from '@/components/cartella/CartellaForm'

async function getPaziente(pazienteId: string) {
  // In produzione: fetch da API
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/pazienti/${pazienteId}`, {
    cache: 'no-store'
  })
  if (!res.ok) return null
  return res.json()
}

export default async function NuovaCartellaPage({
  searchParams
}: {
  searchParams: { pazienteId?: string; appuntamentoId?: string }
}) {
  if (!searchParams.pazienteId) {
    redirect('/dashboard/pazienti')
  }

  const paziente = await getPaziente(searchParams.pazienteId)

  if (!paziente) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/pazienti/${paziente.id}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nuova Cartella Clinica</h1>
          <p className="text-gray-600 mt-1">
            Paziente: {paziente.cognome} {paziente.nome}
          </p>
        </div>
      </div>

      <CartellaForm 
        paziente={paziente}
        appuntamentoId={searchParams.appuntamentoId}
      />
    </div>
  )
}
```

---

## 📁 FILE 6: app/dashboard/cartella-clinica/[id]/page.tsx

```typescript
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import CartellaView from '@/components/cartella/CartellaView'

async function getCartella(id: string) {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/cartelle/${id}`, {
    cache: 'no-store'
  })
  if (!res.ok) return null
  return res.json()
}

export default async function VisualizzaCartellaPage({
  params
}: {
  params: { id: string }
}) {
  const cartella = await getCartella(params.id)

  if (!cartella) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/pazienti/${cartella.pazienteId}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Visualizza Cartella Clinica</h1>
          <p className="text-gray-600 mt-1">
            {cartella.paziente.cognome} {cartella.paziente.nome}
          </p>
        </div>
      </div>

      <CartellaView cartella={cartella} />
    </div>
  )
}
```

---

## 📁 FILE 7: Integrazione con Dettaglio Paziente

Aggiorna `app/dashboard/pazienti/[id]/page.tsx` per mostrare cartelle:

```typescript
// Aggiungi questa sezione dopo "Storico Appuntamenti"

{/* Cartelle Cliniche */}
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-semibold text-gray-900">
      Cartelle Cliniche
    </h2>
    <Link
      href={`/dashboard/cartella-clinica/nuovo?pazienteId=${paziente.id}`}
      className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
    >
      <FileText className="w-4 h-4" />
      Nuova Cartella
    </Link>
  </div>

  {paziente.cartelle?.length === 0 ? (
    <p className="text-gray-500 text-center py-8">
      Nessuna cartella clinica presente
    </p>
  ) : (
    <div className="space-y-3">
      {paziente.cartelle?.map((cartella: any) => (
        <Link
          key={cartella.id}
          href={`/dashboard/cartella-clinica/${cartella.id}`}
          className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {format(new Date(cartella.dataVisita), 'dd/MM/yyyy')}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {cartella.diagnosi?.substring(0, 80)}...
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>
      ))}
    </div>
  )}
</div>
```

E nella funzione `getPaziente`, includi le cartelle:

```typescript
const paziente = await prisma.paziente.findFirst({
  where: {
    id: params.id,
    ambulatorioId: user.ambulatorioId
  },
  include: {
    appuntamenti: {
      orderBy: { dataOra: 'desc' },
      take: 10
    },
    cartelle: {
      orderBy: { dataVisita: 'desc' },
      take: 10
    }
  }
})
```

---

## ✅ TESTING CHECKLIST

### Test 1: Setup Database
- [ ] Esegui migrazione Prisma
- [ ] Seed database (opzionale)
- [ ] Verifica model CartellaClinica creato

### Test 2: Crea Cartella
- [ ] Vai a dettaglio paziente
- [ ] Click "Nuova Cartella"
- [ ] Compila form completo
- [ ] Click "Salva"
- [ ] Redirect a visualizzazione

### Test 3: Visualizza Cartella
- [ ] Vedi tutte sezioni compilate
- [ ] Badge read-only visibile
- [ ] Formattazione corretta
- [ ] Note private separate

### Test 4: Storico Paziente
- [ ] Dettaglio paziente mostra cartelle
- [ ] Click su cartella → visualizzazione
- [ ] Lista ordinata per data

### Test 5: Delete
- [ ] Click "Elimina"
- [ ] Conferma richiesta
- [ ] Cartella eliminata
- [ ] Redirect a paziente

---

## 📊 RISULTATO ATTESO

✅ Form cartella completo e validato  
✅ Visualizzazione read-only elegante  
✅ Storico cartelle in dettaglio paziente  
✅ API routes funzionanti  
✅ Separazione note private  
✅ Design professionale medico  
✅ Compliance medico-legale (read-only)