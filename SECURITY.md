# Sicurezza

MedicoFlow gestisce dati sanitari, quindi prendiamo sul serio ogni segnalazione.

## Segnalare una vulnerabilità

**Non aprire una issue pubblica.** Usa la segnalazione privata di GitHub:

1. Apri la scheda **Security** del repository.
2. Clicca **Report a vulnerability**.
3. Descrivi il problema: componente coinvolto, passi per riprodurlo, impatto che hai osservato e, se ce l'hai, una proposta di correzione.

Riceverai una prima risposta entro 7 giorni. Una volta pubblicata la correzione, se vuoi, verrai citato nelle note di rilascio.

Durante le verifiche usa solo un'installazione tua con dati inventati. Non accedere a dati di altri e non degradare servizi di terzi.

## Versioni supportate

Il progetto è un prototipo: le correzioni di sicurezza vengono fatte solo sul branch `main`.

## Cosa rientra

- Accesso a dati di un altro ambulatorio o di un altro utente
- Aggiramento del login o dei ruoli (amministratore, medico, segreteria)
- Iniezione (SQL, XSS, comandi) ed esposizione di dati o segreti
- Problemi di sessione, password o limiti ai tentativi di accesso

Non rientrano le vulnerabilità che richiedono di controllare le variabili d'ambiente o il server, né quelle di dipendenze usate solo in sviluppo senza un impatto concreto sull'app in produzione.

## Per chi installa MedicoFlow

- Imposta un `BETTER_AUTH_SECRET` lungo e casuale (`openssl rand -base64 32`) e non condividerlo.
- Completa la configurazione iniziale (`/setup`) subito dopo il deploy.
- Servi l'app solo in HTTPS.
- Dietro un reverse proxy imposta `TRUST_PROXY` al numero di proxy, così i limiti ai tentativi di accesso vedono l'IP reale dei client.
- Tieni aggiornato il codice e fai backup regolari e cifrati del database.
- MedicoFlow non è ancora stato sottoposto a un audit di sicurezza né adeguato completamente al GDPR: valuta con attenzione prima di usarlo con dati reali.
