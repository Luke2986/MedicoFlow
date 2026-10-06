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
api/      Entry point della funzione serverless per Vercel
scripts/  Script di manutenzione (seed del database)
```

## Avvio in locale

### Requisiti

- Node.js 20+
- Un database PostgreSQL qualsiasi: locale, Docker, Supabase, Neon, Railway, ecc.

### 1. Installazione

```bash
git clone https://github.com/Luke2986/MedicoFlowClinic.git
cd MedicoFlowClinic
npm install
```

### 2. Database

Se non hai già un Postgres, puoi avviarne uno con Docker:

```bash
docker compose up -d
```

In alternativa usa un database hosted (vedi [Supabase](#supabase)).

### 3. Variabili d'ambiente

```bash
cp .env.example .env
```

| Variabile | Obbligatoria | Descrizione |
|---|---|---|
| `DATABASE_URL` | Sì | Stringa di connessione PostgreSQL |
| `PORT` | No | Porta del server (default `5000`) |
| `GROQ_API_KEY` | No | Abilita la dettatura vocale. Senza chiave l'app funziona e la funzione resta disattivata |
| `ADMIN_TOKEN` | No | Abilita le rotte admin (elenco dei contatti raccolti dalla pagina prezzi). Senza token restano disattivate |
| `TRUST_PROXY` | No | Numero di reverse proxy davanti al server (es. `1` dietro Nginx). Su Vercel non serve |

Il valore di default in `.env.example` corrisponde al database avviato con `docker compose`.

### 4. Schema e dati iniziali

```bash
npm run db:setup
```

Crea le tabelle e inserisce le specializzazioni mediche e un ambulatorio demo. Il comando si può rilanciare senza duplicare i dati.

### 5. Avvio

```bash
npm run dev
```

L'app è disponibile su `http://localhost:5000`. Frontend e backend sono serviti dallo stesso processo.

## Deploy

L'app è un normale server Node.js con un database PostgreSQL: funziona su qualsiasi hosting che supporti Node. Sotto le configurazioni già pronte.

### Supabase

1. Crea un progetto su Supabase.
2. Da **Connect** copia la stringa di connessione:
   - **Session pooler** (porta `5432`) per eseguire `npm run db:setup` dal tuo computer;
   - **Transaction pooler** (porta `6543`) come `DATABASE_URL` per un deploy serverless come Vercel.
3. Esegui `npm run db:setup` con la `DATABASE_URL` del session pooler.

### Vercel

Il repository include già `vercel.json` e la funzione `api/index.js`:

- il frontend viene servito come sito statico da `dist/public`;
- tutte le richieste `/api/*` passano a un'unica funzione serverless che esegue l'app Express.

Passi:

1. Importa il repository su Vercel (il preset "Other" va bene, build e output sono già configurati).
2. In **Settings → Environment Variables** aggiungi `DATABASE_URL` (e opzionalmente `GROQ_API_KEY`).
3. Prepara il database una volta con `npm run db:setup` dal tuo computer.
4. Fai il deploy.

Nota: le funzioni Vercel accettano richieste fino a 4,5 MB, quindi le registrazioni vocali molto lunghe possono essere rifiutate.

### Docker

```bash
docker build -t medicoflow .
docker run -p 5000:5000 -e DATABASE_URL="postgresql://..." medicoflow
```

Prima del primo avvio esegui `npm run db:setup` contro lo stesso database.

### Server Node (VPS, Render, Railway, Fly.io, ...)

```bash
npm ci
npm run build
npm run db:setup
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
| `npm run db:seed` | Inserisce i dati iniziali |
| `npm run db:setup` | `db:push` + `db:seed` |

## Roadmap

- [ ] Autenticazione e gestione dei ruoli
- [ ] Isolamento dei dati per ambulatorio
- [ ] Conformità GDPR completa per i dati sanitari
- [ ] Test automatici

## Licenza

Distribuito con licenza [MIT](LICENSE).
