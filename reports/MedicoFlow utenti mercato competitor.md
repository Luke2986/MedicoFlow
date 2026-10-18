# MedicoFlow Italia: utenti, dimensione di mercato e concorrenti

**Data:** 18/10/2026
**Basato su:** il report [Mercato software medico Italia](Mercato%20software%20medico%20Italia.md), le sei note in `research_notes/Mercato software medico Italia/` e il codice attuale del repository MedicoFlow.
**Skill applicate:** research-users, market-sizing, competitive-analysis, competitor-analysis.

## Come leggere questo documento

- **Dato:** cifra con fonte e anno. Le fonti complete sono nelle note e nel report principale; qui sono richiamate in forma breve.
- **Dichiarato:** cifra comunicata dall'azienda stessa, non verificata in modo indipendente.
- **Ipotesi (A#):** assunzione mia, dichiarata con il ragionamento. Non è un dato.
- **Non trovato:** il dato non esiste o non è emerso dalle ricerche.

Limite più importante: **non esistono interviste, survey o dati d'uso di MedicoFlow**. Personas, segmenti e customer journey sono quindi **ipotesi informate da fonti secondarie**, non conclusioni. Le frasi tra virgolette nelle personas sono sintesi mie, non citazioni di medici reali.

---

## 1. Sintesi

1. **Il cliente giusto per partire è lo specialista privato, non il MMG.** Gli MMG (37.983 nel 2023) sono presidiati da Millennium (oltre 17.000 medici dichiarati) e CGM, con certificazione MDR obbligatoria dal 2024. Gli specialisti privati sono frammentati e usano già l'AI generativa (61% nel 2026), ma con strumenti generalisti non conformi.
2. **Il concorrente vero è MioDottore/Docplanner**, che ha marketplace, gestionale, CRM e scribe (NOA) nello stesso abbonamento. Zucchetti e TeamSystem non hanno un prodotto clinico per gli studi.
3. **Il concorrente indiretto più diffuso è ChatGPT.** Il 61% degli specialisti usa GenAI generalista, mentre il Garante (agosto 2025) mette in guardia proprio dal caricare referti sui chatbot. Il prodotto deve offrire la stessa comodità, ma in regola.
4. **Mercato servibile (SAM): €8,8 mln (prudente) – €128 mln (base) l'anno.** Una SOM realistica a 1-3 anni, con capitale da seed, va da **€0,2 mln a €1,9 mln di ARR** (scenari con ipotesi esplicite).
5. **Oggi a MedicoFlow mancano proprio le funzioni che lo differenzierebbero:** Sistema TS, fattura sanitaria fuori dallo SdI, ricetta bianca dematerializzata, informativa AI per il paziente (L. 132/2025), audit log. Il codice attuale non ne contiene nessuna.

---

## 2. Ricerca utenti

### 2.1 Personas

Le personas sono quattro, più una "anti-persona" da non servire subito. La prevalenza è indicata solo dove esiste un conteggio con fonte.

#### Persona 1 — Specialista in libera professione con studio proprio
*"Faccio tutto da solo: visite, fatture, invio al Sistema TS. Il referto lo scrivo la sera, a volte con ChatGPT."* (sintesi ipotetica)

- **Chi:** cardiologo, ginecologo, dermatologo, ortopedico, oculista, cioè le specializzazioni già presenti nei template di MedicoFlow. Lavora in studio singolo o in un piccolo studio condiviso.
- **JTBD principale:** quando finisco una visita voglio avere referto, fattura e adempimenti già pronti, così chiudo la giornata senza lavoro arretrato.
- **Pain principali:**
  1. Adempimenti italiani manuali: invio annuale al Sistema TS con l'opposizione del paziente, fattura non-SdI, ricetta bianca dematerializzata. Quest'ultima risulta adottata solo nel 15% circa dei casi (stima 2026, Agenda Digitale).
  2. Burocrazia percepita come eccessiva: 81,5% dei medici (FNOMCeO-Censis 2026). Il dato non è specifico per i liberi professionisti.
  3. Usa AI generalista senza garanzie: il 61% degli specialisti usa GenAI (PoliMi 2026), e il 63% considera critici regole e responsabilità professionale.
- **Gain:** meno lavoro serale, conformità senza pensarci, referto professionale da consegnare al paziente.
- **Comportamento probabile (ipotesi):** acquisisce pazienti anche da MioDottore o Doctolib e usa un gestionale self-serve da €15-40 al mese oppure carta ed Excel.
- **Prevalenza:** tra **22.049** (pavimento A2: 14.434 specialisti ambulatoriali convenzionati SUMAI più il 17% dei 44.791 medici in intramoenia che esercitano anche fuori) e **113.042** (tetto A1, ricavato dalla Quota B ENPAM). Il numero esatto non è stato trovato.

#### Persona 2 — Ospedaliero con attività privata (intramoenia allargata / extramoenia)
*"In ospedale ho la cartella aziendale. Per il privato del pomeriggio mi serve qualcosa di veloce che non devo imparare."* (sintesi ipotetica)

- **Chi:** dirigente medico SSN che fa visite private fuori dagli spazi aziendali.
- **JTBD:** quando faccio visite private nel tempo libero voglio uno strumento che mi faccia perdere zero tempo extra, così tengo l'attività privata sostenibile.
- **Pain:**
  1. Carico di lavoro: il 96,5% degli ospedalieri lo dichiara eccessivo (Anaao 2024, oltre 1.000 rispondenti).
  2. Burnout: 52% tra i medici (FADOI).
  3. Doppia documentazione tra ospedale e privato (ipotesi).
- **Gain:** setup in pochi minuti, scribe che produce un referto pronto da firmare.
- **Prevalenza:** 44.791 medici in intramoenia, di cui circa il 17% anche fuori dagli spazi aziendali, cioè circa **7.615** (Relazione ALPI 2022). Questo gruppo è già incluso nel pavimento della Persona 1.

#### Persona 3 — Titolare o direttore di poliambulatorio privato
*"Devo far lavorare insieme 10 medici e 3 segretarie, e dal 2027 forse dovrò alimentare il Fascicolo per l'accreditamento."* (sintesi ipotetica)

- **Chi:** proprietario o direttore sanitario. **È il buyer**, mentre gli utenti sono i medici e la segreteria.
- **JTBD:** quando gestisco una struttura con molti medici voglio un unico sistema per agenda, cartelle, ruoli e adempimenti, così controllo la qualità e i costi.
- **Pain:**
  1. Requisito di accreditamento sul FSE: le nuove regole sono sospese, ma la sospensione cesserebbe al 31/12/2026 senza un'intesa Stato-Regioni.
  2. Costi di interoperabilità segnalati dal privato (PoliMi 2026).
  3. Coordinamento tra medici e segreteria (ipotesi).
- **Gain:** dashboard, ruoli, conformità centralizzata, scribe per tutti i medici della struttura con un solo contratto.
- **Prevalenza:** **5.446** strutture private accreditate, di cui l'81% società (Annuario SSN 2023), con forte concentrazione al Sud: Campania 1.230, Sicilia 1.143. Le strutture **non accreditate** non sono censite.

#### Persona 4 — Segreteria / front office del poliambulatorio
*"Passo la mattina al telefono a spostare appuntamenti."* (sintesi ipotetica)

- **Chi:** utente quotidiano dell'agenda. Non decide l'acquisto, ma può bloccarne l'adozione.
- **JTBD:** quando arriva una richiesta di prenotazione voglio vedere subito disponibilità e conflitti, così non creo errori.
- **Pain:** volume delle chiamate. È un'ipotesi, ma il mercato la conferma indirettamente: CiaoDott ha raccolto €1,5 mln (marzo 2026) per un assistente vocale per cliniche, e MioDottore ha annunciato NOA Booking per le chiamate.
- **Prevalenza:** non trovata.
- **Copertura attuale in MedicoFlow:** il ruolo Segreteria esiste già, così come l'agenda con il rilevamento dei conflitti.

#### Anti-persona (per ora) — Medico di medicina generale
Il software deve essere certificato come dispositivo medico (MDR) dal 25/05/2024, servono ricetta SSN, integrazioni regionali e FSE, e il mercato è consolidato: Millewin costa €380-1.130 l'anno. Il MMG va considerato solo in una fase successiva, con un budget per la certificazione MDR.

### 2.2 Segmenti comportamentali

| Segmento | Dimensione | JTBD primario | Fit con MedicoFlow oggi | Disponibilità a pagare (da listini) | Valore | Crescita |
|---|---|---|---|---|---|---|
| **S1. "Shadow AI"**: specialisti che usano GenAI generalista | 61% degli specialisti (PoliMi 2026); in valore assoluto non misurato | AI per documentare, ma in regola | Medio: c'è la dettatura, mancano informativa e DPIA documentata | €125/mese per uno scribe premium (Tandem) | Alto | **Alta** (dal 26% al 61% in un anno) |
| **S2. Dipendenti dal marketplace** | Oltre 300.000 profili MioDottore e circa 30.000 su Doctolib (dichiarati). Paganti non trovati | Avere pazienti e avere l'agenda piena | Basso: MedicoFlow non porta pazienti | Doctolib "da €139/mese" (fonte concorrente); MioDottore su richiesta | Medio | Media |
| **S3. Self-serve o carta, sensibili al prezzo** | Non misurato | Restare in regola spendendo poco | Medio-alto, se si aggiungono TS, fattura e ricetta | €15-40/mese (Appuntoo, MEG, Medical Planner) | Basso per singolo cliente | Media |
| **S4. Strutture con più medici** | 5.446 accreditate, più quelle non accreditate (non censite) | Un sistema unico e conforme per tutta la struttura | Medio: ruoli e isolamento dei dati ci sono, FSE no | Appuntoo Studio €79,99/mese; Doctolib e GipoNext su richiesta | **Il più alto per contratto** | Media; più alta se l'obbligo FSE parte nel 2027 |

- **Segmento a più alto valore:** S4, perché un solo contratto porta molti medici paganti.
- **Segmento a più alta crescita:** S1, perché l'adozione di GenAI tra gli specialisti è più che raddoppiata in un anno.
- **Sovrapposizioni:** le Personas 1 e 2 cadono in S1, S2 e S3; le Personas 3 e 4 in S4.
- **Punto d'ingresso consigliato:** S1 ∩ S3, cioè specialisti che usano già ChatGPT e non pagano un marketplace. È anche il punto dove MioDottore pesa di meno.

### 2.3 Customer journey (ipotesi da validare)

| Fase | Touchpoint | Emozione | Pain point | Opportunità |
|---|---|---|---|---|
| **Awareness** | Colleghi, società scientifiche, commercialista, social, corsi ECM (ipotesi) | Scetticismo verso l'AI | Il 63% teme regole e responsabilità (PoliMi) | Contenuti su "AI in regola con la L. 132/2025 e il Garante" |
| **Consideration** | Confronto con MioDottore, ChatGPT e il gestionale attuale | Paura di perdere dati e tempo | Costo di migrazione (ipotesi, nessuna fonte italiana) | Import dei dati dal vecchio gestionale; piano free stile Tandem/Heidi, ormai uno standard di categoria |
| **Onboarding** | Configurazione iniziale e scelta della specializzazione (già presente) | Curiosità | Informativa al paziente sull'AI non pronta | Modulo informativa e consenso generato in automatico |
| **Primo valore (aha)** | Primo referto da registrazione, primo invio TS | Sollievo | Qualità della trascrizione in italiano medico | Template per specialità già pronti: è il primo referto a convincere |
| **Uso attivo** | Agenda, visite, PDF, fatturazione | Routine | Oggi mancano fattura, TS e ricetta, quindi lo studio deve tenere un secondo strumento | Chiudere il ciclo in un solo tool |
| **Espansione** | Aggiunta di colleghi e segreteria | Fiducia | Prezzo per seat | Prezzo per struttura |
| **Advocacy** | Passaparola tra colleghi | Orgoglio | Nessun incentivo | Programma referral; canale delle società scientifiche |

**Drop-off più probabili (ipotesi):**
- **Consideration**, per migrazione e paura sulla conformità.
- **Uso attivo**, se gli adempimenti obbligano a tenere comunque un secondo software.

### 2.4 Insight principali

1. **La domanda di AI c'è, ma oggi passa per strumenti non conformi.** Gli specialisti che usano GenAI sono passati dal 26% al 61% in un anno (PoliMi). Il Garante scoraggia l'uso dei chatbot generalisti per i referti. Chi offre la conformità come prodotto incontra una domanda già formata.
2. **Il risparmio di tempo dello scribe è reale ma modesto.** Negli studi randomizzati: -9,5% di tempo sulle note con Nabla, -0,36 ore al giorno nello studio UW Health. Vendere "2-3 ore al giorno risparmiate" non ha fonti ed è rischioso.
3. **Gli adempimenti obbligatori poco adottati sono una leva più concreta.** La ricetta bianca dematerializzata è obbligatoria dal 2025 ma usata nel 15% circa dei casi. Il Sistema TS è annuale e la fattura sanitaria è fuori dallo SdI in via permanente.
4. **La struttura moltiplica il valore.** Lexroom vende circa €1.500 l'anno per studio (dichiarato). Nel medicale lo stesso effetto si ottiene vendendo per struttura.

### 2.5 Raccomandazioni

1. Mettere in roadmap, prima di tutto il resto: invio Sistema TS con gestione dell'opposizione, fattura sanitaria (PDF con bollo, fuori SdI), ricetta bianca dematerializzata, informativa e consenso AI per il paziente, audit log.
2. Posizionare la dettatura come "referto in regola", non come "risparmio di ore".
3. Validare in 15-20 interviste con specialisti S1/S3 (vedi Domande aperte), con un test di prezzo a €29 / €49 / €79 al mese.

### 2.6 Domande aperte (ricerca da fare)

- Quanto tempo dedicano davvero alla documentazione gli specialisti privati italiani? Serve uno studio time-motion nei piloti.
- Quanti specialisti pagano già un marketplace e quanto spendono? Il numero di paganti di MioDottore non è stato trovato.
- I pazienti accettano la registrazione della visita? Non esiste un'indagine italiana.
- Esiste davvero un costo di migrazione dai gestionali attuali, e quanto pesa?

---

## 3. Dimensione del mercato (TAM / SAM / SOM)

### 3.1 Definizione del mercato

- **Problema:** documentazione clinica e adempimenti amministrativi obbligatori dello studio medico privato.
- **Geografia:** Italia.
- **Clienti nel TAM:** MMG/PLS, specialisti con attività privata, odontoiatri, strutture private accreditate.
- **Clienti nel SAM:** solo specialisti privati e strutture private.
- **Esclusi dal SAM:**
  - MMG/PLS, per barriera MDR e consolidamento del mercato;
  - dentale, presidiato da AlfaDocs (che ha già uno Scribe AI), XDENT e OrisLine;
  - strutture non accreditate, perché non censite.
- **Unità di valore:** ricavo ricorrente annuo per abbonamento software.

### 3.2 TAM: approccio top-down

Non esiste una stima top-down affidabile per questo mercato specifico. I numeri disponibili servono solo come cornice:

| Riferimento | Valore | Perché non è il TAM |
|---|---|---|
| Spesa per la sanità digitale (PoliMi) | €2,7 mld (2025) | È soprattutto spesa di Regioni e strutture, spinta dal PNRR |
| Spesa sanitaria privata delle famiglie (ISTAT SHA) | €41,3 mld (2024) | È spesa per cure, non per software |
| Ricavi di Docplanner Italy Srl (Atoka) | circa €42,3 mln (anno non indicato) | È un singolo player, e include marketplace e pubblicità. Serve come **triangolazione**: il leader fattura dentro il range del TAM bottom-up |
| Software dentale Italia (MarkWide, commerciale) | $48,7 mln (2026) | Stima a bassa affidabilità, ma coerente con il range bottom-up del dentale |

### 3.3 TAM: approccio bottom-up

Ripreso dal report principale. Le ipotesi A1-A5 sono spiegate lì.

| Segmento | Prudente | Base |
|---|---|---|
| MMG + PLS | 44.689 × €380 = €17,0 mln | 44.689 × €1.130 = €50,5 mln |
| Specialisti privati | 22.049 × €420 = €9,3 mln | 113.042 × €1.500 = €169,6 mln |
| Odontoiatri | 64.919 × €240 = €15,6 mln | 64.919 × €588 = €38,2 mln |
| Strutture accreditate | 5.446 × €960 = €5,2 mln | 5.446 × 5 × €1.500 = €40,8 mln |
| **TAM** | **≈ €47 mln** | **≈ €299 mln** |

**Riconciliazione:** il range bottom-up (€47-299 mln) contiene il fatturato attribuito a Docplanner Italy (circa €42 mln) e la stima commerciale sul dentale. Non ci sono contraddizioni evidenti. Il valore base è però un tetto teorico, perché presuppone che ogni specialista paghi uno scribe premium.

### 3.4 SAM

- **Formula:** (specialisti + strutture) × 61%, dove il 61% (ipotesi A6) è la quota di specialisti che usa GenAI ed è preso come proxy della propensione all'acquisto.
- **Prudente:** (9,3 + 5,2) × 0,61 ≈ **€8,8 mln**, cioè il 19% del TAM prudente.
- **Base:** (169,6 + 40,8) × 0,61 ≈ **€128 mln**, cioè il 43% del TAM base. Corrisponde a circa 68.956 specialisti e 3.322 strutture.

### 3.5 SOM a 1-3 anni (scenari)

Per il medicale italiano non esiste un benchmark di penetrazione. Il riferimento più vicino è Lexroom: circa 7.000 studi clienti a febbraio 2026, partendo dalla fondazione nel 2023, su circa 250.000 avvocati (dichiarato alla stampa). I round seed di software sanitario in Italia nel 2025-2026 sono tra €1 e €3 mln.

**Ipotesi di prezzo (A8):**
- **€49 al mese per specialista (€588 l'anno).** È sopra i gestionali self-serve (€15-40) e sotto la soglia dei €100 al mese, oltre la quale lo scribe da solo costa più dell'intera cartella di un MMG.
- **Struttura:** 5 medici × €49 × 12 ≈ **€2.940 l'anno**.

| Scenario (ipotesi A9) | Specialisti | Strutture | ARR | Quota sul SAM base specialisti |
|---|---|---|---|---|
| Lento | 300 | 20 | 300 × €588 + 20 × €2.940 ≈ **€0,24 mln** | 0,4% |
| Medio | 1.000 | 60 | €588.000 + €176.400 ≈ **€0,76 mln** | 1,5% |
| Forte (ritmo vicino a Lexroom) | 2.500 | 150 | €1.470.000 + €441.000 ≈ **€1,91 mln** | 3,6% |

Promemoria dal report principale: arrivare a €10 mln di ARR (la scala Lexroom) richiede circa 6.667 clienti a €1.500 l'anno. Al prezzo di €588 ne servono circa 17.000, cioè circa il 25% del SAM base degli specialisti. Il calcolo è mio. Ne segue che il prezzo per struttura, o un ARPU più alto con moduli aggiuntivi, è necessario per avvicinarsi a quella scala.

### 3.6 Tabella di sintesi

| Metrica | Stima attuale | Fra 2-3 anni |
|---|---|---|
| TAM | €47-299 mln | Nessuna fonte per una proiezione numerica. Sensitività sotto |
| SAM | €8,8-128 mln | Con propensione al 75% (ipotesi): €10,9-158 mln. Al 90% (ipotesi): €13,1-189 mln |
| SOM | — (pre-revenue) | €0,24-1,91 mln di ARR (scenari A8-A9) |

Non ho inventato tassi di crescita. I soli tassi di crescita con fonte sono di mercati vicini: spesa per la sanità digitale +9% nel 2025 (PoliMi), ricavi del gruppo Docplanner +20-30% a cambi costanti (dichiarato), adozione GenAI tra gli specialisti dal 26% al 61% (PoliMi).

### 3.7 Fattori che possono espandere o contrarre il mercato

- **Espansione:**
  - fine della sospensione sull'accreditamento: il FSE diventerebbe un requisito per tutte le strutture accreditate;
  - controlli sulla ricetta bianca dematerializzata;
  - crescita della spesa privata, con oltre 5.500 MMG mancanti e il 51,7% oltre il massimale (GIMBE);
  - informativa AI obbligatoria per legge.
- **Contrazione:**
  - lo scribe incluso gratis nei gestionali esistenti (NOA di MioDottore, Scribe AI di AlfaDocs, chatbot GPT in Millewin);
  - piani free di Tandem e Heidi;
  - un eventuale provvedimento restrittivo del Garante sulla registrazione delle visite (oggi non ne esistono).

### 3.8 Assunzioni e confidenza

| # | Assunzione | Confidenza | Come validarla |
|---|---|---|---|
| A1 | Proxy della Quota B ENPAM (113.042 specialisti con reddito privato) | Bassa (è un tetto) | Chiedere a ENPAM la distribuzione della Quota B per tipo di reddito |
| A2 | Pavimento di 22.049 specialisti | Media | Come sopra |
| A3 | Fatturazione per odontoiatra invece che per studio | Bassa | Dati ANDI o Key-Stone sugli studi |
| A4 | 5 medici per struttura | Bassa | Campione di siti di poliambulatori, o dati AIOP |
| A6 | GenAI 61% come proxy di propensione all'acquisto | Bassa | Test di prezzo nelle interviste |
| A8 | €49 al mese come prezzo sostenibile | Media (coerente con i listini) | Test Van Westendorp su 30 o più specialisti |
| A9 | Volumi di clienti degli scenari SOM | Bassa | Funnel reale dei primi 6 mesi |

---

## 4. Analisi competitiva

### 4.1 Panoramica del mercato

Il mercato si sta spostando dallo "scribe come prodotto" allo "scribe come funzione". Nel mondo nel 2025 sono andati $1,32 mld in 16 deal sulla documentazione ambient. In Europa sono arrivati i mega-round di Tandem ($100 mln, settembre 2026) e Heidi (US$100 mln di equity più US$240 mln di financing, settembre 2026), entrambi con piani free. In Italia chi ha già la distribuzione aggiunge lo scribe al proprio prodotto: MioDottore con NOA, AlfaDocs con Scribe AI, Millewin con un chatbot GPT. Il vantaggio competitivo resta su distribuzione, conformità e adempimenti nazionali.

### 4.2 Mappa dei concorrenti

| Concorrente | Categoria | Target | Posizionamento | Forza | Debolezza |
|---|---|---|---|---|---|
| **MioDottore / Docplanner** | Diretto | Specialisti, poliambulatori | Marketplace + gestionale + AI in un unico abbonamento | Domanda dei pazienti (25,5 mln di visite facilitate nel 2025), GipoNext, NOA | Prezzi non pubblici; il medico dipende dal marketplace; paganti non trovati |
| **Doctolib Italia** | Diretto | Centri medici, strutture | Gestionale cloud per centri (ex Vettore) + prenotazioni | Capitali del gruppo, prodotto per strutture | Scala italiana minore (circa 30.000 professionisti dichiarati); scribe in Italia non verificato |
| **AlfaDocs** | Diretto (dentale e medico) | Studi dentistici e medici | Cloud con Scribe AI | Focus sull'Italia, oltre 11.000 professionisti (dichiarato), oltre €15 mln di investimenti pianificati in Italia | Origine e forza nel dentale; funding modesto (Series A estesa da €3,7 mln) |
| **Tandem Health** | Diretto (solo scribe) | Ospedali e gruppi | Scribe europeo certificato MDR IIa | Humanitas da aprile 2026, $100 mln di Serie B, piano Free | Nessun gestionale; Pro a €125/mese, costoso per il singolo |
| **Heidi Health** | Diretto (solo scribe) | Singoli clinici, practice | Scribe freemium globale | Circa metà degli utenti gratuiti, capitali enormi | In Italia è ancora in fase di ingresso; prezzo in EUR non pubblico |
| **ChatGPT e GenAI generalisti** | Indiretto | Tutti | Strumento generico | Già usato dal 61% degli specialisti, gratuito o a basso costo | Non conforme (avviso del Garante, agosto 2025); nessuna integrazione |
| **Millennium / CGM** | Indiretto (MMG) | MMG, PLS | Cartella MMG certificata MDR | Oltre 17.000 medici (Millennium, dichiarato), ricetta SSN, FSE | Fuori dal segmento degli specialisti privati |
| **Self-serve (Appuntoo, MEG, Medical Planner, Docunque)** | Indiretto | Specialisti sensibili al prezzo | Gestionale economico | €15-40/mese, adempimenti di base | Nessuno scribe nativo verificato (Docunque ha alcune funzioni AI) |

### 4.3 Matrice funzionale

Legenda: ✓ = sì, con fonte; ✗ = no; n.v. = non verificato. MedicoFlow è valutato sul codice attuale del repository.

| Funzione | MedicoFlow (oggi) | MioDottore | Doctolib IT | AlfaDocs | Tandem | Heidi | Docunque |
|---|---|---|---|---|---|---|---|
| Agenda e prenotazioni | ✓ (con conflitti) | ✓ | ✓ | n.v. | ✗ | ✗ | ✓ |
| Marketplace pazienti | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Cartella clinica | ✓ | ✓ (GipoNext) | ✓ (Vettore) | ✓ | ✗ | ✗ | ✓ |
| Template per specialità | ✓ (8) | n.v. | n.v. | n.v. | ✓ (template) | ✓ | n.v. |
| AI scribe / trascrizione | ✓ (dettatura da registrazione) | ✓ NOA | n.v. in Italia | ✓ | ✓ | ✓ | ✗ |
| Sistema TS | ✗ | n.v. | n.v. | n.v. | ✗ | ✗ | ✓ |
| Fattura sanitaria | ✗ | n.v. | ✓ (Vettore) | n.v. | ✗ | ✗ | n.v. |
| Ricetta bianca dematerializzata | ✗ | n.v. | n.v. | n.v. | ✗ | ✗ | ✓ |
| FSE | ✗ | n.v. | n.v. | n.v. | ✗ | ✗ | ✓ |
| Ruoli e team multi-medico | ✓ | ✓ | ✓ | n.v. | Enterprise | Practice | ✓ (AFT) |
| Certificazione MDR | ✗ | n.v. | n.v. | n.v. | ✓ IIa | n.v. | n.v. |
| Piano gratuito | ✗ | n.v. | ✗ | n.v. | ✓ | ✓ | ✓ |
| Prezzo pubblico | ✗ | ✗ | ✗ ("da €139" secondo un concorrente) | "da €49" (non verificato) | €125/mese | ✗ | €29/mese |

### 4.4 Mappa di posizionamento

Gli assi sono due: ampiezza del prodotto (solo scribe ↔ gestionale completo) e target (singolo specialista ↔ struttura o ospedale).

```
                     STRUTTURA / OSPEDALE
                              │
        Tandem ●              │        ● Doctolib Italia
                              │        ● MioDottore (GipoNext + TuoTempo)
                              │
 SOLO SCRIBE ─────────────────┼───────────────── GESTIONALE COMPLETO
                              │
        Heidi ●               │        ● AlfaDocs (dentale)
     ChatGPT ●                │        ● Docunque, Appuntoo (senza scribe)
                              │   ◎ SPAZIO LIBERO: gestionale leggero +
                              │     scribe nativo + adempimenti IT
                     SINGOLO SPECIALISTA
```

Il quadrante in basso a destra (singolo specialista, gestionale completo) ha player con il gestionale ma senza scribe (Docunque, Appuntoo) e un player con scribe ma legato al marketplace (MioDottore). Manca un'offerta che unisca **scribe nativo in italiano, adempimenti completi e indipendenza dal marketplace**.

### 4.5 Opportunità di differenziazione

1. **"AI in regola" come prodotto.** DPIA pronta, hosting UE, nessun addestramento sui dati, informativa e consenso per il paziente (art. 7, L. 132/2025), audit log. È difendibile perché il 63-65% dei medici teme proprio il quadro regolatorio e nessun concorrente lo comunica come vantaggio principale (secondo le fonti trovate).
2. **Ciclo completo degli adempimenti italiani.** Sistema TS, fattura non-SdI, ricetta bianca. Gli scribe stranieri non lo faranno a breve, e la ricetta al 15% dimostra che oggi il problema non è risolto.
3. **Indipendenza dal marketplace.** Lo specialista che non vuole legare cartella e storico clinici al portale da cui riceve i pazienti è un segmento che MioDottore e Doctolib non possono servire per costruzione. Il segmento è un'ipotesi da validare.
4. **Prezzo per struttura.** Moltiplica i seat e aumenta l'ARPU, come serve per avvicinare la scala Lexroom.

### 4.6 Minacce

1. **MioDottore regala o include NOA nel gestionale.** Dichiara il 62% degli specialisti utilizzatori, senza base chiara. Risposta: non competere sul marketplace; integrarsi con le agende esterne e vincere su conformità e adempimenti.
2. **Heidi o Tandem lanciano un piano free in italiano.** Heidi cerca personale per l'Italia, Tandem è già in Humanitas. Risposta: offrire anche un piano free sulla trascrizione e far pagare gli adempimenti e il lavoro di team.
3. **AlfaDocs esce dal dentale verso il medico.** Ha già Scribe AI e oltre €15 mln pianificati in Italia. Risposta: puntare sulla profondità delle specializzazioni mediche non dentali.
4. **Provvedimento del Garante sulla registrazione delle visite.** Oggi non ne esistono. Risposta: consenso esplicito e possibilità di dettare senza registrare il paziente.

### 4.7 Raccomandazioni

- **Puntare su:** template per specialità, ruoli e isolamento dei dati per ambulatorio, dettatura già funzionante, interfaccia moderna in italiano.
- **Recuperare il gap su** (requisiti minimi per competere): Sistema TS, fattura sanitaria, ricetta bianca dematerializzata, informativa e consenso AI, audit log, piano free, prezzo pubblico. Da verificare anche dove il provider di trascrizione tratta i dati e se ha un DPA conforme al GDPR (oggi Groq).
- **Non inseguire:** il marketplace dei pazienti (lì MioDottore e Doctolib sono troppo avanti) e la certificazione MDR o il segmento MMG nella fase 1.

---

## 5. Profili dei 5 concorrenti diretti

### 5.1 MioDottore / Docplanner

- **Società:** Docplanner, fondata nel 2012 a Varsavia, CEO Mariusz Gralewski. In Italia opera Docplanner Italy Srl (Roma), CEO Luca Puccioni.
- **Funding:** circa €500 mln raccolti secondo Bloomberg (gennaio 2026), $141 mln secondo Tracxn: le due fonti sono in conflitto. Valutazione di $1 mld alla Series F (2021).
- **Gruppo (dichiarato):** circa $300 mln di ARR, EBITDA positivo nel 2025, IPO possibile.
- **Italia:**
  - oltre 300.000 professionisti sulla piattaforma (dichiarato, gennaio 2026): sono profili, non paganti;
  - 25,5 mln di visite facilitate nel 2025;
  - ricavi di circa €42,3 mln secondo Atoka, anno non indicato.
- **Prodotti:**
  - marketplace;
  - GipoNext, gestionale per poliambulatori acquisito nel 2020;
  - TuoTempo, CRM per le grandi strutture;
  - NOA Notes, scribe lanciato nel 2024, con oltre 15.000 medici abbonati nel primo anno a livello di gruppo;
  - NOA Booking, per le chiamate.
- **Forza:** controlla la domanda dei pazienti, quindi il medico ha già un motivo per pagarlo. Lo scribe è nello stesso abbonamento.
- **Debolezze:** prezzi non pubblici, dipendenza dal marketplace, il dato dei 300.000 non indica i paganti.
- **Modello:** abbonamento con vendita assistita (pro.miodottore.it). Appuntoo stima "da €69/mese", ma non è un listino.
- **Minaccia per MedicoFlow:** **alta**.
- **Costo di cambio per il cliente:** alto, perché agenda, recensioni e storico sono sulla sua piattaforma (ipotesi).

### 5.2 Doctolib Italia

- **Società:** Doctolib (Francia). In Italia dal 2021, con €250 mln di investimento annunciati e un tech hub a Milano. CEO Italia Nicola Brandolese.
- **Acquisizioni in Italia:** Dottori.it, Appocrate, Vettore Rinascimento (gestionale cloud per centri medici: prenotazioni, cartelle, fatturazione, contabilità).
- **Scala dichiarata:** circa 30.000 professionisti e oltre 1.000 strutture (LinkedIn, aprile 2026).
- **Prezzo:** "da €139/mese", ma la fonte è un concorrente.
- **AI:** l'assistente di consultazione esiste in Francia (oltre 12 mln di visite documentate); la disponibilità in Italia non è verificata.
- **Forza:** prodotto per strutture, capitali.
- **Debolezze:** scala italiana minore di MioDottore, prezzo alto per il singolo specialista.
- **Minaccia:** **media**, alta nel segmento S4.

### 5.3 AlfaDocs

- **Società:** nata a Monaco di Baviera, mercato principale l'Italia. Seed da €1,6 mln (2020), round da €2 mln, Series A estesa da €3,7 mln (maggio 2025) con Bayern Kapital e BayBG.
- **Piani:** oltre €15 mln di investimenti in Italia entro fine 2026.
- **Traction (dichiarata):** oltre 11.000 professionisti in Italia, modulo Scribe AI con cartella automatica.
- **Prezzo:** "da €49/mese", non verificato.
- **Forza:** focus sull'Italia, scribe già integrato nel gestionale.
- **Debolezza:** il core è il dentale; nel medico specialistico la presenza non è misurata.
- **Minaccia:** **media**. È il player più simile a ciò che MedicoFlow vuole diventare.

### 5.4 Tandem Health

- **Società:** Svezia. Serie A da $50 mln (2025) e Serie B da $100 mln (settembre 2026, EQT Scaleup Europe Fund), circa $160 mln in totale.
- **Diffusione (dichiarata):** oltre 10.000 organizzazioni in 14 mercati.
- **Certificazione:** scribe, codifica e supporto decisionale certificati MDR Classe IIa.
- **Italia:** in Humanitas dal 13/04/2026, partendo da 9 unità operative, in italiano. Risultati non pubblicati.
- **Prezzo:** Free; Pro a €125/utente/mese con fatturazione annuale; Enterprise su richiesta.
- **Forza:** certificazione, capitali, referenza ospedaliera in Italia.
- **Debolezze:** nessun gestionale né adempimenti italiani; prezzo alto per lo studio singolo.
- **Minaccia:** **media** per il singolo specialista, **alta** nelle grandi strutture.

### 5.5 Heidi Health

- **Società:** Australia. Serie B da $65 mln (ottobre 2025, valutazione $465 mln). Serie C (settembre 2026): US$100 mln di equity più US$240 mln di financing, valutazione A$1,26 mld (circa US$900 mln).
- **Ricavi:** circa A$50 mln annualizzati (aprile 2026, Forbes Australia).
- **Modello:** freemium, con circa metà degli utenti sul piano gratuito.
- **Prezzo:** non pubblico. Fonti terze riportano USD 150/mese, in conflitto tra loro.
- **Italia:** annuncio di lavoro del gennaio 2026 per avviare le operazioni italiane; nessun lancio formale trovato.
- **Forza:** piano gratuito e scala globale.
- **Debolezze:** solo scribe, nessun adempimento italiano.
- **Minaccia:** **media, in crescita**. Se entra con il free in italiano, alza le aspettative di tutto il mercato sulla trascrizione gratuita.

---

## 6. Posizionamento consigliato e orizzonte 12-18 mesi

**Posizionamento proposto:** *"Il gestionale per lo specialista privato che scrive il referto e fa gli adempimenti al posto tuo, in regola con Garante e L. 132/2025, e che non ti lega a un marketplace."*

- **Da enfatizzare:** conformità come prodotto, ciclo completo degli adempimenti italiani, template per specialità, prezzo pubblico e trasparente.
- **Segmenti su cui puntare:** S1 ∩ S3 (specialisti che usano già l'AI ma non hanno un marketplace) e poi S4 (strutture).
- **Segmenti da evitare per ora:** MMG/PLS e dentale.
- **Da monitorare nei prossimi 12-18 mesi:**
  - prezzo e packaging di NOA in Italia;
  - lancio di Heidi in Italia;
  - risultati di Tandem in Humanitas;
  - fine della sospensione sull'accreditamento (31/12/2026);
  - eventuali provvedimenti del Garante sugli scribe;
  - estensione di AlfaDocs al medico specialistico.

---

## Prossimi passi possibili

- Script di intervista per le Personas 1 e 3, con test di prezzo.
- Battlecard contro MioDottore.
- Proposta di valore e messaggi per il segmento S1.
- Roadmap prioritizzata dei gap della matrice funzionale.
