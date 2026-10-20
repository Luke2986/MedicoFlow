# MedicoFlow

Gestionale web per ambulatori medici italiani: pazienti, appuntamenti e cartella clinica digitale in un'unica interfaccia.

> **Stato: prototipo.** Accesso con email e password e dati isolati per ambulatorio sono presenti, ma il progetto non è ancora stato sottoposto a un audit di sicurezza né adeguato completamente al GDPR. Valuta con attenzione prima di usarlo con dati reali di pazienti.

## Funzionalità

- **Accesso sicuro** con email e password, senza servizi esterni: sessioni di 12 ore, password di almeno 10 caratteri, protezione dai tentativi ripetuti
- **Team e ruoli**: l'amministratore crea gli account di medici e segreteria, reimposta le password e rimuove gli utenti; ogni ambulatorio vede solo i propri dati
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
- **Demo pronta senza database**: senza configurare nulla l'app parte con un ambulatorio di esempio (dati inventati) e si può svuotare per ripartire da zero

## Stack

| Livello | Tecnologie |
|---|---|
| Frontend | React 18, TypeScript, Vite, Wouter, TanStack Query, Tailwind CSS, shadcn/ui |
| Form e validazione | react-hook-form, Zod |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (oppure PGlite in memoria per la demo), Drizzle ORM |
| PDF | @react-pdf/renderer |

## Struttura del progetto

```
client/     Frontend React (pagine, componenti, hook)
server/     Backend Express (route divise per area in server/routes, autenticazione, storage)
shared/     Schema del database e validatori condivisi tra client e server
api/        Entry point della funzione serverless per Vercel
docs/       Linee guida di design
migrations/ Migrazioni SQL del database, generate da Drizzle
scripts/    Script di manutenzione (migrazioni e seed)
tests/      Test automatici (unitari e di integrazione API)
```

## Prova veloce (senza database)

Serve solo Node.js 22 (oppure 20.19 o successiva).

```bash
git clone https://github.com/Luke2986/MedicoFlow.git
cd MedicoFlow
npm install
npm run dev
```

Apri `http://localhost:5000/login` e premi **Entra nella demo**.

Senza `DATABASE_URL` l'app usa un database PostgreSQL in memoria ([PGlite](https://pglite.dev)) e lo riempie con un ambulatorio di esempio: 4 utenti, 24 pazienti, appuntamenti della settimana corrente e della prossima, storico delle visite. Tutti i dati sono inventati.

- **Ripristina dati demo** (banner in alto nella dashboard) cancella le modifiche e ricarica l'esempio.
- **Ricomincia da zero** svuota tutto e apre la configurazione iniziale, per provare l'app con il proprio ambulatorio.
- Con `DEMO_DATA=false` l'app parte direttamente vuota.

Limiti della modalità demo: i dati restano solo nella memoria del server, si perdono a ogni riavvio e sono condivisi tra tutti i visitatori. Non usarla per dati reali. Per lo stesso motivo nella demo l'invio al Sistema TS è disattivato: riepilogo ed export CSV restano disponibili sulle fatture di esempio.

Senza `GROQ_API_KEY` la demo non chiama nessun fornitore AI: dettatura e referto sono simulati (`server/ai/simulazione.ts`). La "registrazione" non usa il microfono e restituisce una dettatura costruita dall'ultima visita del paziente; la strutturazione divide il testo per sezioni e parole chiave cliniche. Il flusso resta quello reale: consenso, registro AI con fornitore `simulato` e revisione obbligatoria del medico. Il badge "simulazione demo" lo dichiara. La simulazione non si attiva mai con un database esterno o con una chiave configurata.

## Avvio in locale con un database

### Requisiti

- Node.js 22 (oppure 20.19 o successiva)
- Un database PostgreSQL qualsiasi: locale, Docker, Supabase, Neon, Railway, ecc.

### 1. Installazione

```bash
git clone https://github.com/Luke2986/MedicoFlow.git
cd MedicoFlow
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
| `DATABASE_URL` | No | Stringa di connessione PostgreSQL. Senza, l'app parte in modalità demo con un database in memoria |
| `DEMO_DATA` | No | Solo in modalità demo: `false` per partire vuoti invece che con i dati di esempio |
| `BETTER_AUTH_SECRET` | Sì con un database | Chiave per firmare le sessioni. Generala con `openssl rand -base64 32` e non condividerla. In modalità demo, se manca, ne viene generata una a ogni avvio |
| `BETTER_AUTH_URL` | No | URL pubblico dell'app (es. `https://medicoflow.example.it`). Su Vercel viene ricavato in automatico; in locale il default è `http://localhost:5000` |
| `PORT` | No | Porta del server (default `5000`) |
| `GROQ_API_KEY` | No | Abilita la dettatura vocale (Whisper) e la proposta di referto con LLM. Senza chiave, nella demo in memoria dettatura e referto sono simulati; con un database esterno la dettatura resta disattivata e il referto si struttura con regole locali sulle sezioni dettate |
| `TRUST_PROXY` | No | Numero di reverse proxy davanti al server (es. `1` dietro Nginx). Su Vercel non serve |
| `TS_ENV` | No | Ambiente del Sistema Tessera Sanitaria: `test` (default) o `prod` |
| `TS_CERT_PATH` / `TS_CERT_PEM` | No | Certificato di cifratura del kit di sviluppo del Sistema TS (percorso del file o contenuto PEM). Senza certificato l'invio diretto è disattivato e resta l'export CSV. Le credenziali TS dei medici si inseriscono a ogni invio e non vengono salvate |

Il valore d'esempio di `DATABASE_URL` in `.env.example` (da decommentare) corrisponde al database avviato con `docker compose`.

Con un database esterno le funzioni demo (accesso rapido, ripristino, ricomincia da zero) sono disattivate: i tuoi dati non vengono mai cancellati dall'app.

### 4. Schema e dati iniziali

```bash
npm run db:setup
```

Applica le migrazioni in `migrations/` e inserisce le specializzazioni mediche. Il comando si può rilanciare: applica solo le migrazioni nuove e non duplica i dati.

Un database creato con una versione precedente tramite `db:push` non ha lo storico delle migrazioni: per quello continua a usare `npm run db:push`, oppure ricrea il database da zero.

### 5. Avvio

```bash
npm run dev
```

L'app è disponibile su `http://localhost:5000`. Frontend e backend sono serviti dallo stesso processo.

### 6. Primo accesso

Al primo avvio, con il database vuoto, l'app apre la pagina **Configurazione iniziale**: inserisci il nome dell'ambulatorio e i dati dell'amministratore. La pagina funziona una sola volta: appena esiste un account si chiude per sempre.

Dopo l'accesso, l'amministratore aggiunge i colleghi da **Impostazioni → Team** scegliendo il ruolo:

| Ruolo | Cosa può fare |
|---|---|
| Amministratore | Tutto, compresi dati dell'ambulatorio, team e registro AI |
| Medico | Pazienti, appuntamenti, visite |
| Segreteria | Pazienti e appuntamenti |

Non esiste registrazione pubblica: gli account li crea solo l'amministratore. Ognuno può cambiare la propria password da **Impostazioni → Team**.

Su un'installazione pubblica completa la configurazione iniziale subito dopo il deploy, prima che lo faccia qualcun altro.

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

**Come demo pubblica**: importa il repository su Vercel (il preset "Other" va bene, build e output sono già configurati) e fai il deploy senza variabili d'ambiente. Chi apre il link trova l'ambulatorio di esempio. Vercel può avviare più istanze o fermarle quando non ricevono traffico: ognuna ha il suo database in memoria, quindi i dati possono tornare all'esempio e la sessione può chiudersi. Basta rientrare con **Entra nella demo**.

**Con un database vero**:

1. Importa il repository su Vercel.
2. In **Settings → Environment Variables** aggiungi `DATABASE_URL` e `BETTER_AUTH_SECRET` (e opzionalmente `GROQ_API_KEY`).
3. Prepara il database una volta con `npm run db:setup` dal tuo computer.
4. Fai il deploy e apri subito l'app per la configurazione iniziale.

Nota: il limite ai tentativi di accesso è tenuto in memoria, quindi su Vercel vale per singola istanza.

Nota: le funzioni Vercel accettano richieste fino a 4,5 MB, quindi le registrazioni vocali molto lunghe possono essere rifiutate.

### Docker

```bash
docker build -t medicoflow .
docker run -p 5000:5000 -e DATABASE_URL="postgresql://..." -e BETTER_AUTH_SECRET="..." medicoflow
```

Prima del primo avvio esegui `npm run db:setup` contro lo stesso database. Senza `-e DATABASE_URL` il container parte in modalità demo.

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
| `npm test` | Esegue i test (quelli di integrazione richiedono `DATABASE_URL`) |
| `npm run db:migrate` | Applica le migrazioni al database |
| `npm run db:generate` | Crea una nuova migrazione dopo una modifica a `shared/schema.ts` |
| `npm run db:push` | Sincronizza lo schema senza migrazioni (solo per prove in locale) |
| `npm run db:seed` | Inserisce le specializzazioni mediche |
| `npm run db:setup` | `db:migrate` + `db:seed` |

## Test

```bash
docker compose up -d
docker compose exec db createdb -U postgres medicoflow_test
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/medicoflow_test" npm test
```

I test unitari girano sempre. Quelli di integrazione verificano accesso, ruoli e isolamento tra ambulatori su un database PostgreSQL reale, e partono solo se `DATABASE_URL` è impostata. **Usa un database dedicato ai test: tutte le tabelle vengono svuotate a ogni esecuzione.**

Ogni push e pull request su GitHub esegue controllo dei tipi, test e build (`.github/workflows/ci.yml`).

## Roadmap

- [x] Autenticazione e gestione dei ruoli
- [x] Isolamento dei dati per ambulatorio
- [ ] Recupero password via email (SMTP opzionale)
- [ ] Passkey o autenticazione a due fattori
- [ ] Conformità GDPR completa per i dati sanitari
- [x] Test automatici e CI
- [x] Aggiornamento a Tailwind CSS 4 e Vite 8
- [x] Demo pronta senza database
- [x] Informativa e consenso del paziente all'uso dell'AI (L. 132/2025, art. 7), con blocco della dettatura e registro d'uso. Il testo è una bozza da validare con un DPO o un legale
- [x] Fattura sanitaria al paziente (fuori SdI) con PDF, numerazione per medico e anno, bollo
- [ ] Invio al Sistema TS: inserimento implementato, da provare nell'ambiente di test con il kit ufficiale (certificato e XSD aggiornato). Mancano variazione, cancellazione e rimborso
- [x] Referto strutturato dalla dettatura: proposta campo per campo (LLM su Groq oppure regole locali senza chiave), revisione e conferma del medico obbligatorie prima del salvataggio, registrate nel registro AI
- [ ] Dettatura vocale con [Wispr Flow](https://wisprflow.ai) come alternativa a Groq: oggi tra le migliori per qualità della trascrizione. L'accesso all'API va richiesto al team enterprise di Wispr

## Contribuire

Segnalazioni, idee e pull request sono benvenute: leggi [CONTRIBUTING.md](CONTRIBUTING.md). Per le vulnerabilità di sicurezza segui [SECURITY.md](SECURITY.md) e non aprire issue pubbliche.

## Licenza

Distribuito con licenza [MIT](LICENSE).
