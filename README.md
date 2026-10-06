# MedicoFlow

Gestionale web per ambulatori medici italiani: pazienti, appuntamenti e cartella clinica digitale in un'unica interfaccia.

> **Stato: prototipo.** Il progetto non ha ancora autenticazione né controllo degli accessi. Non usarlo con dati reali di pazienti finché questi aspetti non saranno implementati.

## Funzionalità

- **Dashboard** con statistiche in tempo reale dell'ambulatorio
- **Anagrafica pazienti**: creazione, modifica ed eliminazione, ricerca fuzzy con autocompletamento, filtri, paginazione, validazione del codice fiscale ed export CSV
- **Agenda appuntamenti**: calendario settimanale interattivo, stati colorati e rilevamento dei conflitti di orario
- **Cartella clinica digitale**: visite strutturate (anamnesi, esame obiettivo, diagnosi, terapia, parametri vitali), storico cronologico, allergie e alert medici
- **Export PDF** della cartella clinica completa e delle singole visite
- **Dettatura vocale**: trascrizione di registrazioni audio in note cliniche modificabili
- **Specializzazioni mediche**: template per 8 specialità (Medicina Generale, Cardiologia, Pediatria, Dermatologia, Ortopedia, Ginecologia, Oculistica, Otorinolaringoiatria) con KPI, parametri vitali e diagnosi frequenti
- **Onboarding guidato** al primo accesso per configurare ambulatorio e specializzazione
- **Impostazioni**: dati ambulatorio, team, notifiche, privacy, preferenze (tema chiaro/scuro, densità tabelle) e aspetto
- **Interfaccia responsive**, ottimizzata anche per mobile, interamente in italiano

## Stack

| Livello | Tecnologie |
|---|---|
| Frontend | React 18, TypeScript, Vite, Wouter, TanStack Query, Tailwind CSS, shadcn/ui |
| Form e validazione | react-hook-form, Zod |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| PDF | @react-pdf/renderer |

## Struttura del progetto

```
client/   Frontend React (pagine, componenti, hook)
server/   Backend Express (route, storage, seed del database)
shared/   Schema del database e validatori condivisi tra client e server
```

## Avvio in locale

### Requisiti

- Node.js 20+
- Un database PostgreSQL (locale o hosted, es. Neon)

### Installazione

```bash
git clone https://github.com/Luke2986/MedicoFlowClinic.git
cd MedicoFlowClinic
npm install
```

### Variabili d'ambiente

| Variabile | Obbligatoria | Descrizione |
|---|---|---|
| `DATABASE_URL` | Sì | Stringa di connessione PostgreSQL |
| `PORT` | No | Porta del server (default `5000`) |
| `GROQ_API_KEY` | No | Necessaria solo per la dettatura vocale |

### Database

Crea le tabelle a partire dallo schema:

```bash
npm run db:push
```

Al primo avvio il server popola automaticamente il database con le specializzazioni mediche e un ambulatorio demo.

### Sviluppo

```bash
npm run dev
```

L'app è disponibile su `http://localhost:5000`. Frontend e backend sono serviti dallo stesso processo.

### Produzione

```bash
npm run build
npm start
```

## Script disponibili

| Comando | Descrizione |
|---|---|
| `npm run dev` | Avvia il server di sviluppo con hot reload |
| `npm run build` | Compila frontend e backend in `dist/` |
| `npm start` | Avvia la build di produzione |
| `npm run check` | Controllo dei tipi TypeScript |
| `npm run db:push` | Sincronizza lo schema con il database |

## Roadmap

- [ ] Autenticazione e gestione dei ruoli
- [ ] Isolamento dei dati per ambulatorio
- [ ] Conformità GDPR completa per i dati sanitari
- [ ] Test automatici

## Licenza

Distribuito con licenza [MIT](LICENSE).
