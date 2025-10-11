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
- Gestione appuntamenti: CRUD completo (Create, Read, Update, Delete)
- **Calendario Appuntamenti Integrato** (gennaio 2025):
  - Toggle vista Lista/Calendario seamless
  - Vista calendario mensile con griglia 7 giorni
  - Navigazione mesi (prev/next) e bottone "Oggi"
  - Creazione appuntamento da calendario (data pre-selezionata)
  - Edit appuntamento diretto da click su calendario
  - Aggregazione appuntamenti per giorno
  - Badge stato colorati per ogni appuntamento
- **Integrazione Pazienti → Cartella Clinica** (gennaio 2025):
  - Link "Visualizza Cartella" con icona FileText in card pazienti
  - URL params per paziente pre-selezionato (?pazienteId=X)
  - Auto-selezione paziente da query string con useEffect
  - Breadcrumb navigation completo: Dashboard > Pazienti > [Nome] > Cartella Clinica
  - Navigazione bidirezionale con Link wouter
  - Timeline visite visibile immediatamente dopo selezione
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
- Ricerca fulltext (nome, cognome, codice fiscale)
- Eliminazione con conferma
- Form compatibilità FormData (HTML select nativi)

### Gestione Appuntamenti  
- Creazione con selezione paziente
- Assegnazione automatica medico
- Validazione date e orari
- Eliminazione con conferma

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
