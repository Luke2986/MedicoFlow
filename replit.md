# MedicoFlow - Gestionale Ambulatorio Medico

## Panoramica del Progetto
MedicoFlow è un sistema gestionale moderno per ambulatori medici italiani. Permette la gestione completa di pazienti, appuntamenti e cartelle cliniche in conformità con le normative italiane e il GDPR.

## Stack Tecnologico
- **Frontend**: React 18 + TypeScript + Wouter (routing)
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **UI**: Tailwind CSS + shadcn/ui components
- **Query Client**: TanStack Query v5

## Struttura del Progetto

### Frontend (`client/src/`)
- **pages/**: Tutte le pagine dell'applicazione
  - `home.tsx`: Homepage con hero section e presentazione funzionalità
  - `dashboard/`: Pagine della dashboard
    - `index.tsx`: Dashboard principale con statistiche
    - `pazienti.tsx`: Gestione anagrafica pazienti
    - `appuntamenti.tsx`: Calendario appuntamenti
    - `cartella-clinica.tsx`: Cartelle cliniche (placeholder)
    - `impostazioni.tsx`: Impostazioni (placeholder)
- **components/**: Componenti riutilizzabili
  - `app-sidebar.tsx`: Sidebar navigazione principale (240px)
  - `theme-toggle.tsx`: Toggle dark/light mode
  - `ui/`: Componenti shadcn/ui

### Backend (`server/`)
- `routes.ts`: API endpoints
- `storage.ts`: Interfaccia storage e implementazione database
- `db.ts`: Configurazione Drizzle ORM

### Schema Database (`shared/schema.ts`)
Modelli principali:
- **Ambulatori**: Dati della struttura medica
- **Users**: Utenti (medici e staff)
- **Pazienti**: Anagrafica pazienti con codice fiscale
- **Appuntamenti**: Calendario visite e appuntamenti

## Design System

### Colori
- **Primary**: Blue-600 (221 83% 53%) - Colore principale medicale
- **Font**: Inter (Google Fonts)
- **Tema**: Supporto dark/light mode completo

### Layout
- **Sidebar**: Fissa a sinistra, 240px (15rem)
- **Header**: Sticky top con toggle sidebar e theme
- **Content**: Max-width 7xl, padding responsive

### Componenti
- Utilizzo completo di shadcn/ui components
- Sistema di elevazione hover/active (hover-elevate, active-elevate-2)
- Cards con borders sottili e stati interattivi
- Empty states con icone e call-to-action

## Localizzazione Italiana
- Tutte le interfacce in italiano
- Formato date: gg/mm/aaaa
- Formato orario: 24h
- Codice fiscale validato
- Province e regioni italiane

## Stato Attuale MVP
✅ **Completati**:
- Setup completo schema database con relazioni PostgreSQL
- Homepage con hero section professionale
- Dashboard layout con sidebar navigazione
- Dashboard con statistiche reali (pazienti, appuntamenti oggi/settimana, tasso attività)
- Gestione pazienti: CRUD completo (Create, Read, Update, Delete)
- **Search Intelligente Pazienti** (gennaio 2025):
  - Custom hook useDebounce (500ms) per performance
  - Filtri avanzati: età (min/max), sesso, città, provincia
  - Ricerca fulltext su nome, cognome, codice fiscale
  - Validazione backend robusta (NaN guards, range 0-150 anni)
  - SQL date arithmetic timezone-safe per filtro età
  - UI collapsible con clear dinamico
- **Validazione CF e Sorting** (gennaio 2025):
  - Codice Fiscale: algoritmo checksum completo (mappe odd/even, controllo carattere)
  - Provincia: validazione regex /^[A-Za-z]{2}$/ + transform uppercase
  - Sorting pazienti: cognome/data/città, toggle asc/desc, stable comparator
  - Form fix: Select HTML nativi per FormData compatibility
  - Error messages italiano dettagliati
- **Fuzzy Search Intelligente** (gennaio 2025):
  - Ricerca con tolleranza typo tramite Fuse.js (threshold 0.3)
  - Autocomplete dropdown real-time (trigger dopo 2 caratteri)
  - Highlight match automatico in giallo (bg-yellow-200)
  - Keyboard navigation: Arrow keys, Enter, Escape
  - Click outside to close dropdown
  - Search su: nome, cognome, CF, telefono, città
  - Limit 8 risultati con relevance score (0-100%)
  - Card gradient blue con suggerimenti utente
  - Hook useFuzzySearch riutilizzabile
  - Utility highlightMatch con dark mode support
- Gestione appuntamenti: CRUD completo (Create, Read, Update, Delete)
- **Calendario Settimanale Interattivo** (ottobre 2025):
  - Vista settimanale 7 giorni (Lun-Dom) con griglia oraria 8:00-20:00 (slot 30min)
  - **Click-to-create**: click su slot vuoto apre modal con data/ora pre-compilati
  - **Click-to-edit**: click su appuntamento esistente apre modal modifica con delete
  - **Conflict detection**: backend previene sovrapposizioni, ritorna 409 error
  - **Navigazione settimane**: prev/next/oggi con aggiornamento dinamico week range
  - **Color coding by status**: confermato=blue, completato=green, cancellato=gray, no-show=red
  - **AppointmentModal unificato**: singolo componente per create/edit flows
  - **Backend join pazienti**: innerJoin popola relazione paziente in query appuntamenti
  - **WeekCalendar controllato**: componente riceve currentDate come prop per sync parent
  - Toggle vista Lista/Settimana seamless con empty states
- **Cartella Clinica Digitale** (ottobre 2025):
  - Form completo visita medica con struttura standardizzata
  - Campi: Data visita, Motivo visita, Anamnesi, **Esame Obiettivo**, Esami Strumentali/Laboratorio, Diagnosi, Terapia, Prescrizioni, Note cliniche
  - Parametri vitali: Peso, Altezza, PA sistolica/diastolica, FC, Temperatura
  - Storico visite cronologico con visualizzazione dettagliata
  - CRUD completo: creazione, modifica, eliminazione visite
  - Selezione paziente con dropdown + URL params (?pazienteId=X)
  - Link opzionale con appuntamenti (appuntamentoId)
  - Breadcrumb navigation: Dashboard > Pazienti > [Nome] > Cartella Clinica
  - Visualizzazione condizionale sezioni (solo se compilate)
  - Dark mode support completo
- Backend API completo con validazione Zod (POST, GET, PATCH, DELETE)
- Update schemas con .partial() per aggiornamenti parziali
- Database seeding automatico con ambulatorio di default
- Assegnazione automatica medico agli appuntamenti
- Integrazione frontend-backend con TanStack Query
- Dark/light mode
- Design system medicale completo

## Funzionalità Chiave
### Dashboard
- Card statistiche in tempo reale
- Pazienti totali, appuntamenti oggi/settimana
- Tasso di attività calcolato dinamicamente
- Lista prossimi appuntamenti

### Gestione Pazienti
- Creazione con validazione completa
- **Validazione Codice Fiscale Completa** (gennaio 2025):
  - Algoritmo checksum italiano con mappe odd/even
  - Calcolo carattere di controllo secondo normativa
  - Utility shared/validators.ts riutilizzabile
  - Validazione provincia (solo lettere, auto uppercase)
  - Error messages dettagliati in italiano
- **Sorting Intelligente** (gennaio 2025):
  - Ordinamento per cognome, data nascita, città
  - Toggle asc/desc con indicatori visuali (↑↓)
  - Stable sorting con comparator ottimizzato
  - UI moderna con bottoni state-aware
- **Fuzzy Search Intelligente** (gennaio 2025):
  - Autocomplete con tolleranza typo (Fuse.js)
  - Dropdown real-time con highlight match
  - Keyboard navigation completa
  - Relevance score e click-to-navigate
  - Design card gradient blue medicale
- Ricerca fulltext (nome, cognome, codice fiscale)
- Eliminazione con conferma
- Form compatibilità FormData (HTML select nativi)

### Gestione Appuntamenti
- **Calendario Settimanale Interattivo** (ottobre 2025):
  - Vista griglia 7 giorni × slots orari 8:00-20:00 (30 minuti)
  - Click slot vuoto → modal create con data/ora pre-popolati
  - Click appuntamento → modal edit con possibilità delete
  - Conflict detection server-side (sovrapposti → 409 error)
  - Navigazione settimane (prev/next/oggi) con query backend dinamiche
  - Color coding: confermato=blu, completato=verde, cancellato=grigio, no-show=rosso
  - Legenda colori e suggerimenti UX
- Creazione con selezione paziente e assegnazione automatica medico
- Validazione completa date, orari, durata
- Stati appuntamento: confermato, completato, cancellato, no-show
- Toggle vista Lista/Settimana con empty states
- Backend innerJoin pazienti per performance (evita N+1 queries)

### Cartella Clinica Digitale
- **Form Visita Medica Strutturato** (ottobre 2025):
  - Sezioni standard: Anamnesi, Esame Obiettivo, Esami Strumentali/Lab, Diagnosi, Terapia, Prescrizioni
  - Parametri vitali: Peso, Altezza, PA (sistolica/diastolica), FC, Temperatura
  - Campi opzionali con visualizzazione condizionale (mostrati solo se compilati)
  - Diagnosi obbligatoria per compliance medica
- **Storico Visite Cronologico**:
  - Ordinamento temporale decrescente (visita più recente in alto)
  - Card espanse con tutti i dettagli clinici
  - Badge colorati per parametri vitali
  - Edit e delete con conferma per ogni visita
- **Integrazione Pazienti**:
  - Selezione paziente con dropdown searchable
  - URL params (?pazienteId=X) per pre-selezione da altre pagine
  - Breadcrumb navigation: Dashboard > Pazienti > [Nome] > Cartella Clinica
  - Link opzionale con appuntamenti tramite appuntamentoId
- Empty states informativi quando nessuna visita registrata
- Dark mode support completo

## Sistema Pricing Tiers & Feature Flags
**Implementazione completa gennaio 2025** - Sistema di abbonamento con paywall e upselling feature premium

### Piani Disponibili
- **BASE** (€89/mese): Gestione base pazienti, appuntamenti, cartella clinica
  - Features: pazienti, appuntamenti, cartella-clinica, statistiche-base, export-pdf
  - Limiti: 200 pazienti, 2 utenti
- **PROFESSIONAL** (€199/mese): Piano consigliato con AI Agent Search
  - Features BASE + fuzzy-search, ai-agent-search, statistiche-avanzate, analytics-predittive, telemedicina, api-access
  - Limiti: 1000 pazienti, 5 utenti
- **ENTERPRISE** (€399/mese): Soluzione completa multi-sede
  - Features PROFESSIONAL + white-label, supporto-prioritario, account-manager, multi-sede
  - Limiti: illimitati

### Architettura
**Schema Database** (`shared/schema.ts`):
- Table `subscriptions`: ambulatorioId (FK), piano, status (TRIAL/ACTIVE/CANCELLED/EXPIRED), prezzoMensile, features[], dataInizio, dataFine
- Relazione one-to-one con ambulatori

**Feature Flags** (`shared/features.ts`):
- `PLANS` config con price, features, limits, description
- `hasFeature(subscription, 'feature-key')`: verifica accesso feature
- `canUpgrade/canDowngrade(plan)`: logica upgrade/downgrade
- **CRITICAL**: Piano BASE NON include 'fuzzy-search' (solo Professional+)

**API Routes** (`server/routes.ts`):
- GET `/api/subscription?ambulatorioId=X`: recupera subscription
- PUT `/api/subscription`: aggiorna piano (upgrade/downgrade)
- Validazione Zod completa

### Componenti UI
**PricingCard** (`client/src/components/PricingCard.tsx`):
- Mostra piano con prezzo €X/mese, lista features, badge stato
- Bottoni upgrade/downgrade condizionali
- Badge "Consigliato" per PROFESSIONAL

**UpgradePrompt** (`client/src/components/UpgradePrompt.tsx`):
- Paywall per feature premium bloccate
- Link diretto a pagina Billing per upgrade
- Design gradient medicale blue

**Billing Page** (`client/src/pages/dashboard/billing.tsx`):
- 3 pricing cards affiancate (BASE, PROFESSIONAL, ENTERPRISE)
- Card piano corrente con info trial/scadenza
- Upgrade/downgrade con mutation TanStack Query
- Toast confirmation post-upgrade

### Paywall Implementation
**AI Agent Search Premium Feature** (`client/src/pages/dashboard/pazienti.tsx`):
```typescript
const subscription = useQuery(["/api/subscription", ambulatorioId])
const hasFuzzySearch = hasFeature(subscription, 'fuzzy-search')

{hasFuzzySearch ? (
  <Card>AI Agent Search con AutocompleteSearch</Card>
) : (
  <UpgradePrompt featureName="AI Agent Search" requiredPlan="PROFESSIONAL" />
)}
```

### Feature Matrix Corretta (Post-Fix)
| Feature | BASE | PROFESSIONAL | ENTERPRISE |
|---------|------|--------------|------------|
| Pazienti, Appuntamenti, Cartella | ✅ | ✅ | ✅ |
| **AI Agent Search (Fuzzy)** | ❌ | ✅ | ✅ |
| Statistiche Avanzate | ❌ | ✅ | ✅ |
| Analytics Predittive | ❌ | ✅ | ✅ |
| White Label, Multi-sede | ❌ | ❌ | ✅ |

### Seeding & Trial
- Seed crea subscription trial 30 giorni con piano BASE
- Database seeding automatico in `server/seed.ts`
- Features sincronizzate con PLANS config

## Prossimi Sviluppi
1. Vista calendario appuntamenti (mensile con navigazione)
2. Sistema cartelle cliniche completo
3. Gestione anamnesi paziente
4. Report e statistiche avanzate con grafici
5. Gestione multi-ambulatorio
6. Sistema di autenticazione utenti

## Note Tecniche
- Font: Inter caricato da Google Fonts
- Routing: wouter (lightweight router)
- Forms: react-hook-form + zod validation
- Query: TanStack Query v5 (object form API)
- Database migrations: `npm run db:push`

## User Flow
1. **Homepage** → Presentazione MedicoFlow
2. **Dashboard** → Statistiche e panoramica
3. **Pazienti** → Gestione anagrafica completa
4. **Appuntamenti** → Calendario e prenotazioni
5. **Cartella Clinica** → Documentazione medica
6. **Impostazioni** → Configurazione ambulatorio
