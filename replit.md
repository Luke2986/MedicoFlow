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
- Setup completo schema database con relazioni
- Homepage con hero section professionale
- Dashboard layout con sidebar navigazione
- Pagine placeholder per tutte le sezioni principali
- Sistema di routing completo
- Dark/light mode
- Design system medicale completo

🚧 **In sviluppo**:
- Backend API endpoints
- Integrazione database
- CRUD pazienti e appuntamenti

## Prossimi Sviluppi
1. Implementazione backend con DatabaseStorage
2. API endpoints per CRUD operations
3. Gestione completa pazienti con ricerca
4. Calendario appuntamenti interattivo
5. Sistema cartelle cliniche

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
