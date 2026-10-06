# Contribuire a MedicoFlow

Grazie per l'interesse! MedicoFlow è un prototipo open source: ogni segnalazione, idea o pull request è benvenuta.

## Regola d'oro: niente dati reali di pazienti

MedicoFlow gestisce dati sanitari. In issue, pull request, screenshot, log, test e dati di esempio usa **solo dati inventati**: nomi, codici fiscali, recapiti e diagnosi di fantasia. Se ti accorgi di aver pubblicato dati reali, cancellali subito e avvisa i manutentori.

Per le vulnerabilità di sicurezza non aprire una issue pubblica: segui [SECURITY.md](SECURITY.md).

## Come contribuire

1. **Cerca prima** tra le [issue](../../issues) se il problema o l'idea è già stato discusso.
2. Per modifiche grandi (nuove funzionalità, cambi allo schema del database, nuove dipendenze) **apri una issue** e discutiamone prima di scrivere codice.
3. Fai un fork, crea un branch dal `main` e apri una pull request quando è pronta.

## Ambiente di sviluppo

Requisiti: Node.js 22 (oppure 20.19 o successiva) e Docker (oppure un PostgreSQL già disponibile).

```bash
git clone https://github.com/<tuo-utente>/MedicoFlowClinic.git
cd MedicoFlowClinic
npm install
cp .env.example .env
docker compose up -d
npm run db:setup
npm run dev
```

Apri `http://localhost:5000`: alla prima apertura l'app chiede di creare l'ambulatorio e l'account amministratore. I dettagli sono nel [README](README.md).

## Prima di aprire una pull request

Esegui gli stessi controlli della CI:

```bash
npm run check
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/medicoflow_test" npm test
npm run build
```

Usa un database dedicato ai test (`docker compose exec db createdb -U postgres medicoflow_test`): i test di integrazione svuotano tutte le tabelle.

## Linee guida per il codice

- **Interfaccia in italiano.** Tutti i testi visibili all'utente, compresi i messaggi di errore delle API, sono in italiano.
- **Sicurezza delle rotte.** Ogni nuova rotta `/api` è registrata dopo `requireAuth` (vedi `server/routes/index.ts`) e lavora solo sui dati dell'ambulatorio dell'utente:
  - usa `req.user.ambulatorioId`, mai un id preso dal client senza controllo;
  - per i record caricati per id usa `ownsRecord` da `server/authz.ts`;
  - le operazioni riservate all'amministratore usano `requireAdmin`.
- **Test.** Se aggiungi o modifichi una rotta, aggiungi un caso in `tests/integration/api.test.ts`, in particolare per l'accesso da un altro ambulatorio. La logica pura va in `tests/unit/`.
- **Database.** Dopo una modifica a `shared/schema.ts` genera la migrazione con `npm run db:generate` e includi nella pull request i file nuovi in `migrations/`. Non modificare migrazioni già pubblicate.
- **Segreti.** Nessuna chiave o password nel codice: le configurazioni passano da variabili d'ambiente, documentate in `.env.example` e nel README. Le integrazioni esterne (come la dettatura vocale) devono restare facoltative.
- **Dipendenze.** Aggiungine solo se necessarie e spiega il motivo nella pull request.
- **Interfaccia grafica.** Segui i componenti shadcn/ui già presenti e le indicazioni in [docs/design-guidelines.md](docs/design-guidelines.md). Verifica le modifiche anche su schermo mobile e in tema scuro.

## Pull request

- Una pull request per argomento, piccola quando possibile.
- Descrivi cosa cambia e perché, e come l'hai verificato.
- Per modifiche visive allega uno screenshot (con dati inventati).
- La CI deve essere verde prima del merge.

## Licenza

Contribuendo accetti che il tuo codice sia distribuito con la licenza [MIT](LICENSE) del progetto.
