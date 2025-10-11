# MedicoFlow - Prompt Completi per Replit

## 📋 Setup Iniziale Database

**PRIMA DI INIZIARE:**
1. Nel tuo Repl, vai su **Tools → Database**
2. Click su **"Create PostgreSQL database"**
3. Replit genererà automaticamente `DATABASE_URL` nel tuo `.env`
4. Conferma che vedi la variabile `DATABASE_URL` nel pannello Secrets/Environment

---

## 🚀 STEP 1: Setup Architettura Base

```
Crea setup iniziale per web app gestionale ambulatorio medico italiano "MedicoFlow".

STACK:
- Next.js 14 con App Router
- TypeScript (strict mode)
- Prisma ORM + PostgreSQL (Replit Database)
- Tailwind CSS
- shadcn/ui per componenti

SETUP RICHIESTO:

1. Inizializza progetto Next.js 14 con TypeScript se non già fatto:
   npx create-next-app@latest medicoflow --typescript --tailwind --app --no-src

2. Installa dipendenze base:
   npm install prisma @prisma/client
   npm install date-fns lucide-react
   npm install -D @types/node

3. Configura Prisma:
   npx prisma init
   
4. Aggiorna prisma/schema.prisma con questo contenuto COMPLETO:

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String
  role          String   @default("medico")
  ambulatorioId String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Ambulatorio {
  id              String   @id @default(cuid())
  nome            String
  indirizzo       String
  citta           String
  provincia       String
  telefono        String
  email           String
  piva            String
  regione         String
  specializzazione String
  createdAt       DateTime @default(now())
}

model Paziente {
  id              String   @id @default(cuid())
  nome            String
  cognome         String
  codiceFiscale   String   @unique
  dataNascita     DateTime
  luogoNascita    String
  sesso           String
  indirizzo       String
  citta           String
  provincia       String
  cap             String
  telefono        String
  email           String?
  note            String?
  ambulatorioId   String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([cognome, nome])
}

model Appuntamento {
  id            String   @id @default(cuid())
  pazienteId    String
  medicoId      String
  dataOra       DateTime
  durata        Int      @default(30)
  tipo          String
  stato         String   @default("confermato")
  motivoVisita  String?
  note          String?
  ambulatorioId String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([dataOra])
  @@index([pazienteId])
}

5. Crea lib/prisma.ts per Prisma client singleton:

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

6. Crea struttura cartelle:
app/
  api/
  dashboard/
  auth/
  layout.tsx
  page.tsx
components/
  ui/
  layout/
lib/
  prisma.ts
  utils.ts
types/

7. Aggiorna tailwind.config.ts con tema medicale professionale:
- Primary color: blue (600/700)
- Font: Inter o system-ui
- Aggiungi utilities per layout dashboard

8. Crea layout principale (app/layout.tsx):
- HTML lang="it"
- Metadata: titolo "MedicoFlow - Gestionale Ambulatorio Moderno"
- Font Inter
- Import Tailwind globals
- Body con antialiasing

9. Crea homepage semplice (app/page.tsx):
- Hero section pulita
- Logo/titolo "MedicoFlow"
- Tagline "Gestionale moderno per ambulatori medici italiani"
- CTA button "Accedi" → /auth/signin
- Design minimale professionale

10. Crea componente Sidebar (components/layout/Sidebar.tsx):
- Width fissa 240px
- Logo MedicoFlow in alto
- Navigation menu con icone lucide-react:
  * Dashboard (LayoutDashboard icon)
  * Pazienti (Users icon)
  * Appuntamenti (Calendar icon)
  * Cartella Clinica (FileText icon)
  * Impostazioni (Settings icon)
- Active state con bg-blue-50
- Hover states
- Responsive (collassabile su mobile)

11. Crea layout dashboard base (app/dashboard/layout.tsx):
- Sidebar fissa sinistra
- Area contenuto principale con padding
- Struttura flex per responsive
- Placeholder per header (lo faremo dopo auth)

12. Crea pagina dashboard placeholder (app/dashboard/page.tsx):
- Titolo "Dashboard"
- Griglia placeholder cards per stats future
- Messaggio "In costruzione..."

13. Esegui prima migrazione Prisma:
npx prisma migrate dev --name init
npx prisma generate

14. Verifica che il database Replit sia connesso correttamente

RISULTATO ATTESO:
- App Next.js avviabile con npm run dev
- Homepage raggiungibile
- Navigazione /dashboard con sidebar visibile
- Prisma connesso a database Replit
- Nessun errore TypeScript
- Layout responsive base funzionante

NON implementare ancora:
- Autenticazione
- Seed data
- Logica business
- Form o tabelle

Testa che tutto compili senza errori.
```

---

## 🔐 STEP 2: Sistema Autenticazione

```
Implementa autenticazione completa con NextAuth.js per MedicoFlow.

INSTALLAZIONE:

1. Installa dipendenze NextAuth:
npm install next-auth @auth/prisma-adapter
npm install -D @types/next-auth

2. Aggiorna prisma/schema.prisma - AGGIUNGI questi models per NextAuth:

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

3. MODIFICA il model User esistente aggiungendo le relazioni:

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String
  image         String?
  role          String    @default("medico")
  ambulatorioId String
  accounts      Account[]
  sessions      Session[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

4. Esegui migrazione:
npx prisma migrate dev --name add_nextauth
npx prisma generate

5. Crea app/api/auth/[...nextauth]/route.ts:

import NextAuth, { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null
        
        // Per MVP: login semplificato (in produzione: hash password)
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })
        
        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            ambulatorioId: user.ambulatorioId
          }
        }
        
        return null
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
        session.user.ambulatorioId = token.ambulatorioId as string
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.ambulatorioId = user.ambulatorioId
      }
      return token
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

6. Crea types/next-auth.d.ts per TypeScript:

import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      ambulatorioId: string
    }
  }

  interface User {
    role: string
    ambulatorioId: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    ambulatorioId: string
  }
}

7. Crea lib/auth.ts per helper functions:

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Non autorizzato")
  }
  return user
}

8. Crea pagina login app/auth/signin/page.tsx:

'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Stethoscope } from 'lucide-react'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const result = await signIn('credentials', { 
        email, 
        password,
        redirect: false
      })
      
      if (result?.error) {
        setError('Email o password non validi')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      setError('Errore durante il login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">MedicoFlow</h1>
          <p className="text-gray-600 mt-2">Accedi al tuo ambulatorio</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="medico@esempio.it"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Accesso in corso...
              </>
            ) : (
              'Accedi'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Demo: usa qualsiasi email del database seed
        </p>
      </div>
    </div>
  )
}

9. Crea SessionProvider wrapper - components/providers/SessionProvider.tsx:

'use client'

import { SessionProvider } from 'next-auth/react'

export default function AuthProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return <SessionProvider>{children}</SessionProvider>
}

10. Aggiorna app/layout.tsx per includere SessionProvider:

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/providers/SessionProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MedicoFlow - Gestionale Ambulatorio',
  description: 'Software gestionale moderno per ambulatori medici italiani',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

11. Proteggi dashboard - aggiorna app/dashboard/layout.tsx:

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'
import DashboardHeader from '@/components/layout/DashboardHeader'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

12. Crea Header con logout - components/layout/DashboardHeader.tsx:

'use client'

import { signOut } from 'next-auth/react'
import { LogOut, User } from 'lucide-react'

export default function DashboardHeader({ user }: { user: any }) {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          Benvenuto, {user.name}
        </h2>
        <p className="text-sm text-gray-500">{user.role}</p>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span>{user.email}</span>
        </div>
        
        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Esci</span>
        </button>
      </div>
    </header>
  )
}

13. Aggiungi variabili environment in Replit Secrets:
NEXTAUTH_SECRET="genera-una-stringa-casuale-lunga-qui"
NEXTAUTH_URL="https://[tuo-repl-url].replit.dev"

Per generare NEXTAUTH_SECRET usa: openssl rand -base64 32

RISULTATO ATTESO:
- Login funzionante su /auth/signin
- Redirect automatico a /dashboard dopo login
- Header mostra nome utente
- Logout funzionante
- Dashboard protetto (redirect se non autenticato)
- Session persistente

TESTING:
1. Prova ad accedere a /dashboard senza login → redirect a signin
2. Crea un utente test con seed (step successivo)
3. Login con email test
4. Verifica header e logout
```

---

## 🌱 STEP 3: Seed Data Database

```
Crea dati di esempio nel database per testare l'applicazione.

OBIETTIVO: Popolare database con:
- 1 Ambulatorio demo
- 1 Medico (utente)
- 5 Pazienti
- 10 Appuntamenti
- 3 Cartelle cliniche

1. Crea prisma/seed.ts:

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Inizio seeding database...')

  // Crea ambulatorio
  const ambulatorio = await prisma.ambulatorio.upsert({
    where: { id: 'amb-demo-001' },
    update: {},
    create: {
      id: 'amb-demo-001',
      nome: 'Studio Psicologia Dott.ssa Elena Rossi',
      indirizzo: 'Via Dante Alighieri 45',
      citta: 'Milano',
      provincia: 'MI',
      telefono: '02 1234567',
      email: 'studio@rossipsicologia.it',
      piva: '12345678901',
      regione: 'Lombardia',
      specializzazione: 'Psicologia Clinica'
    }
  })
  console.log('✅ Ambulatorio creato')

  // Crea utente medico
  const medico = await prisma.user.upsert({
    where: { email: 'elena.rossi@medicoflow.it' },
    update: {},
    create: {
      email: 'elena.rossi@medicoflow.it',
      name: 'Dott.ssa Elena Rossi',
      role: 'medico',
      ambulatorioId: ambulatorio.id,
      emailVerified: new Date()
    }
  })
  console.log('✅ Medico creato: elena.rossi@medicoflow.it')

  // Crea pazienti
  const pazienti = await Promise.all([
    prisma.paziente.create({
      data: {
        nome: 'Mario',
        cognome: 'Bianchi',
        codiceFiscale: 'BNCMRA80A01F205X',
        dataNascita: new Date('1980-01-01'),
        luogoNascita: 'Milano',
        sesso: 'M',
        indirizzo: 'Via Roma 10',
        citta: 'Milano',
        provincia: 'MI',
        cap: '20121',
        telefono: '333 1234567',
        email: 'mario.bianchi@email.it',
        note: 'Paziente seguito dal 2023',
        ambulatorioId: ambulatorio.id
      }
    }),
    prisma.paziente.create({
      data: {
        nome: 'Laura',
        cognome: 'Verdi',
        codiceFiscale: 'VRDLRA85M45F205T',
        dataNascita: new Date('1985-08-05'),
        luogoNascita: 'Torino',
        sesso: 'F',
        indirizzo: 'Corso Garibaldi 23',
        citta: 'Milano',
        provincia: 'MI',
        cap: '20121',
        telefono: '340 9876543',
        email: 'laura.verdi@email.it',
        ambulatorioId: ambulatorio.id
      }
    }),
    prisma.paziente.create({
      data: {
        nome: 'Giuseppe',
        cognome: 'Russo',
        codiceFiscale: 'RSSGPP75D15F205K',
        dataNascita: new Date('1975-04-15'),
        luogoNascita: 'Roma',
        sesso: 'M',
        indirizzo: 'Via Manzoni 67',
        citta: 'Milano',
        provincia: 'MI',
        cap: '20122',
        telefono: '338 5551234',
        ambulatorioId: ambulatorio.id
      }
    }),
    prisma.paziente.create({
      data: {
        nome: 'Francesca',
        cognome: 'Marino',
        codiceFiscale: 'MRNFNC90L50F205B',
        dataNascita: new Date('1990-07-10'),
        luogoNascita: 'Napoli',
        sesso: 'F',
        indirizzo: 'Viale Monza 145',
        citta: 'Milano',
        provincia: 'MI',
        cap: '20125',
        telefono: '347 2223344',
        email: 'fra.marino@email.it',
        note: 'Terapia cognitivo-comportamentale',
        ambulatorioId: ambulatorio.id
      }
    }),
    prisma.paziente.create({
      data: {
        nome: 'Alessandro',
        cognome: 'Ferrari',
        codiceFiscale: 'FRRLSN88C12F205W',
        dataNascita: new Date('1988-03-12'),
        luogoNascita: 'Bologna',
        sesso: 'M',
        indirizzo: 'Via Larga 8',
        citta: 'Milano',
        provincia: 'MI',
        cap: '20122',
        telefono: '349 7778899',
        ambulatorioId: ambulatorio.id
      }
    })
  ])
  console.log('✅ 5 pazienti creati')

  // Crea appuntamenti (mix di passati e futuri)
  const oggi = new Date()
  oggi.setHours(0, 0, 0, 0)

  const appuntamenti = await Promise.all([
    // Appuntamenti passati completati
    prisma.appuntamento.create({
      data: {
        pazienteId: pazienti[0].id,
        medicoId: medico.id,
        dataOra: new Date(oggi.getTime() - 7 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // 7 giorni fa ore 10
        durata: 60,
        tipo: 'controllo',
        stato: 'completato',
        motivoVisita: 'Controllo mensile',
        ambulatorioId: ambulatorio.id
      }
    }),
    prisma.appuntamento.create({
      data: {
        pazienteId: pazienti[1].id,
        medicoId: medico.id,
        dataOra: new Date(oggi.getTime() - 5 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), // 5 giorni fa ore 14
        durata: 45,
        tipo: 'prima-visita',
        stato: 'completato',
        motivoVisita: 'Prima valutazione',
        ambulatorioId: ambulatorio.id
      }
    }),
    prisma.appuntamento.create({
      data: {
        pazienteId: pazienti[2].id,
        medicoId: medico.id,
        dataOra: new Date(oggi.getTime() - 3 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), // 3 giorni fa ore 11
        durata: 60,
        tipo: 'controllo',
        stato: 'no-show',
        motivoVisita: 'Seduta terapeutica',
        note: 'Paziente non si è presentato',
        ambulatorioId: ambulatorio.id
      }
    }),
    // Appuntamento oggi
    prisma.appuntamento.create({
      data: {
        pazienteId: pazienti[3].id,
        medicoId: medico.id,
        dataOra: new Date(oggi.getTime() + 15 * 60 * 60 * 1000), // Oggi ore 15
        durata: 60,
        tipo: 'controllo',
        stato: 'confermato',
        motivoVisita: 'Seduta settimanale',
        ambulatorioId: ambulatorio.id
      }
    }),
    prisma.appuntamento.create({
      data: {
        pazienteId: pazienti[4].id,
        medicoId: medico.id,
        dataOra: new Date(oggi.getTime() + 17 * 60 * 60 * 1000), // Oggi ore 17
        durata: 45,
        tipo: 'urgente',
        stato: 'confermato',
        motivoVisita: 'Situazione di urgenza',
        ambulatorioId: ambulatorio.id
      }
    }),
    // Appuntamenti futuri
    prisma.appuntamento.create({
      data: {
        pazienteId: pazienti[0].id,
        medicoId: medico.id,
        dataOra: new Date(oggi.getTime() + 2 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // Tra 2 giorni ore 9
        durata: 60,
        tipo: 'controllo',
        stato: 'confermato',
        motivoVisita: 'Follow-up',
        ambulatorioId: ambulatorio.id
      }
    }),
    prisma.appuntamento.create({
      data: {
        pazienteId: pazienti[1].id,
        medicoId: medico.id,
        dataOra: new Date(oggi.getTime() + 3 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), // Tra 3 giorni ore 14
        durata: 60,
        tipo: 'controllo',
        stato: 'confermato',
        motivoVisita: 'Secondo incontro',
        ambulatorioId: ambulatorio.id
      }
    }),
    prisma.appuntamento.create({
      data: {
        pazienteId: pazienti[3].id,
        medicoId: medico.id,
        dataOra: new Date(oggi.getTime() + 7 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // Tra 7 giorni ore 10
        durata: 60,
        tipo: 'controllo',
        stato: 'confermato',
        motivoVisita: 'Seduta programmata',
        ambulatorioId: ambulatorio.id
      }
    }),
    prisma.appuntamento.create({
      data: {
        pazienteId: pazienti[4].id,
        medicoId: medico.id,
        dataOra: new Date(oggi.getTime() + 10 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000), // Tra 10 giorni ore 16
        durata: 45,
        tipo: 'controllo',
        stato: 'confermato',
        motivoVisita: 'Valutazione progressi',
        ambulatorioId: ambulatorio.id
      }
    }),
    prisma.appuntamento.create({
      data: {
        pazienteId: pazienti[2].id,
        medicoId: medico.id,
        dataOra: new Date(oggi.getTime() + 14 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), // Tra 14 giorni ore 11
        durata: 60,
        tipo: 'prima-visita',
        stato: 'confermato',
        motivoVisita: 'Riprogrammato dopo no-show',
        ambulatorioId: ambulatorio.id
      }
    })
  ])
  console.log('✅ 10 appuntamenti creati')

  console.log('✅ Seeding completato!')
  console.log('\n📧 Credenziali di accesso:')
  console.log('Email: elena.rossi@medicoflow.it')
  console.log('Password: (qualsiasi - auth semplificata per MVP)\n')
}

main()
  .catch((e) => {
    console.error('❌ Errore durante seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

2. Aggiungi script seed in package.json:

"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}

E aggiungi in "scripts":
"seed": "prisma db seed"

3. Installa ts-node per eseguire seed:
npm install -D ts-node

4. Esegui il seed:
npx prisma db seed

RISULTATO ATTESO:
- Database popolato con dati demo
- Ambulatorio "Studio Psicologia Dott.ssa Rossi"
- Utente: elena.rossi@medicoflow.it
- 5 pazienti con dati realistici italiani
- 10 appuntamenti (passati, oggi, futuri)
- Stati diversi: completato, confermato, no-show

TESTING:
1. Login con elena.rossi@medicoflow.it
2. Verifica che dashboard carichi senza errori
3. Prepara per Step 4: Dashboard con dati reali
```

---

## 📊 STEP 4: Dashboard con Statistiche

```
Implementa dashboard operativa con KPI e statistiche ambulatorio.

OBIETTIVO: Dashboard funzionale con:
- Card statistiche (pazienti totali, appuntamenti oggi, settimana, tasso no-show)
- Timeline appuntamenti oggi
- Lista ultimi pazienti
- Quick actions

1. Crea API route per statistiche - app/api/dashboard/stats/route.ts:

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const oggi = new Date()
    const inizioGiorno = startOfDay(oggi)
    const fineGiorno = endOfDay(oggi)
    const inizioSettimana = startOfWeek(oggi, { weekStartsOn: 1 })
    const fineSettimana = endOfWeek(oggi, { weekStartsOn: 1 })

    // Query parallele per performance
    const [
      totalepazienti,
      appuntamentiOggi,
      appuntamentiSettimana,
      noShowMese,
      totaleAppuntamentiMese
    ] = await Promise.all([
      prisma.paziente.count({
        where: { ambulatorioId: user.ambulatorioId }
      }),
      prisma.appuntamento.findMany({
        where: {
          ambulatorioId: user.ambulatorioId,
          dataOra: {
            gte: inizioGiorno,
            lte: fineGiorno
          }
        },
        include: {
          paziente: {
            select: {
              nome: true,
              cognome: true
            }
          }
        },
        orderBy: { dataOra: 'asc' }
      }),
      prisma.appuntamento.count({
        where: {
          ambulatorioId: user.ambulatorioId,
          dataOra: {
            gte: inizioSettimana,
            lte: fineSettimana
          }
        }
      }),
      prisma.appuntamento.count({
        where: {
          ambulatorioId: user.ambulatorioId,
          stato: 'no-show',
          dataOra: {
            gte: new Date(oggi.getFullYear(), oggi.getMonth(), 1)
          }
        }
      }),
      prisma.appuntamento.count({
        where: {
          ambulatorioId: user.ambulatorioId,
          dataOra: {
            gte: new Date(oggi.getFullYear(), oggi.getMonth(), 1)
          }
        }
      })
    ])

    const tassoNoShow = totaleAppuntamentiMese > 0 
      ? ((noShowMese / totaleAppuntamentiMese) * 100).toFixed(1)
      : '0.0'

    return NextResponse.json({
      totalePazienti: totalePazienti,
      appuntamentiOggi: appuntamentiOggi.length,
      appuntamentiSettimana,
      tassoNoShow,
      prossimiAppuntamenti: appuntamentiOggi.slice(0, 5)
    })
  } catch (error) {
    console.error('Errore stats:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

2. Crea componente StatCard - components/dashboard/StatCard.tsx:

import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  color?: 'blue' | 'green' | 'yellow' | 'red'
}

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp,
  color = 'blue' 
}: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

3. Crea componente AppointmentTimeline - components/dashboard/AppointmentTimeline.tsx:

import { Calendar, Clock, User } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface Appointment {
  id: string
  dataOra: Date
  durata: number
  tipo: string
  stato: string
  motivoVisita?: string | null
  paziente: {
    nome: string
    cognome: string
  }
}

export default function AppointmentTimeline({ 
  appointments 
}: { 
  appointments: Appointment[] 
}) {
  if (appointments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p>Nessun appuntamento oggi</p>
      </div>
    )
  }

  const getStatusColor = (stato: string) => {
    switch (stato) {
      case 'confermato': return 'bg-blue-100 text-blue-700'
      case 'completato': return 'bg-green-100 text-green-700'
      case 'cancellato': return 'bg-gray-100 text-gray-700'
      case 'no-show': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-4">
      {appointments.map((apt) => (
        <div 
          key={apt.id}
          className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col items-center justify-center w-16 h-16 bg-blue-50 rounded-lg">
            <span className="text-2xl font-bold text-blue-600">
              {format(new Date(apt.dataOra), 'HH')}
            </span>
            <span className="text-xs text-blue-600">
              {format(new Date(apt.dataOra), 'mm')}
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-gray-400" />
              <span className="font-semibold text-gray-900">
                {apt.paziente.nome} {apt.paziente.cognome}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-3 h-3" />
              <span>{apt.durata} minuti</span>
              {apt.motivoVisita && (
                <>
                  <span className="text-gray-400">•</span>
                  <span>{apt.motivoVisita}</span>
                </>
              )}
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.stato)}`}>
            {apt.stato}
          </span>
        </div>
      ))}
    </div>
  )
}

4. Aggiorna app/dashboard/page.tsx con dashboard completa:

import { Users, Calendar, TrendingUp, AlertTriangle } from 'lucide-react'
import StatCard from '@/components/dashboard/StatCard'
import AppointmentTimeline from '@/components/dashboard/AppointmentTimeline'
import Link from 'next/link'

async function getDashboardStats() {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/dashboard/stats`, {
    cache: 'no-store'
  })
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Panoramica del tuo ambulatorio</p>
        </div>
        <Link 
          href="/dashboard/appuntamenti/nuovo"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nuovo Appuntamento
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pazienti Totali"
          value={stats.totalePazienti}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Appuntamenti Oggi"
          value={stats.appuntamentiOggi}
          icon={Calendar}
          color="green"
        />
        <StatCard
          title="Appuntamenti Settimana"
          value={stats.appuntamentiSettimana}
          icon={TrendingUp}
          color="yellow"
        />
        <StatCard
          title="Tasso No-Show Mese"
          value={`${stats.tassoNoShow}%`}
          icon={AlertTriangle}
          color={parseFloat(stats.tassoNoShow) > 10 ? 'red' : 'green'}
        />
      </div>

      {/* Appuntamenti Oggi */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Appuntamenti di Oggi
        </h2>
        <AppointmentTimeline appointments={stats.prossimiAppuntamenti} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/pazienti/nuovo"
          className="p-6 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
        >
          <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <span className="font-medium text-gray-700">Aggiungi Paziente</span>
        </Link>
        <Link
          href="/dashboard/pazienti"
          className="p-6 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
        >
          <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <span className="font-medium text-gray-700">Vedi Tutti i Pazienti</span>
        </Link>
        <Link
          href="/dashboard/appuntamenti"
          className="p-6 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
        >
          <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <span className="font-medium text-gray-700">Calendario Completo</span>
        </Link>
      </div>
    </div>
  )
}

RISULTATO ATTESO:
- Dashboard con 4 card statistiche funzionanti
- Timeline appuntamenti oggi con design pulito
- Quick actions per navigazione rapida
- Dati reali dal database seed
- Design responsive e professionale

TESTING:
1. Login e verifica che dashboard carichi
2. Controlla che numeri corrispondano ai dati seed
3. Verifica che timeline mostri appuntamenti odierni
4. Testa responsive su mobile (sidebar collassabile)
```

---

## 👥 STEP 5: CRUD Pazienti Completo

*[Questo step sarà disponibile dopo conferma completamento Step 4]*

---

## 🔍 STEP 6: Fuzzy Search Intelligente (con Agent)

*[Qui integreremo un Agent per search avanzato]*

---

## 📅 STEP 7: Calendario Appuntamenti

*[Step successivi continuano...]*