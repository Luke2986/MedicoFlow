// Draft text: it must be reviewed by the clinic's DPO or a lawyer before use with real patients.
// Bump the version whenever the text changes, so every consent stays tied to the wording the patient saw.
export const INFORMATIVA_AI_VERSIONE = "2026-10-bozza2";

export const INFORMATIVA_AI_TITOLO = "Informativa sull'uso dell'intelligenza artificiale per la documentazione clinica";

export const INFORMATIVA_AI_PARAGRAFI: readonly string[] = [
  "Ai sensi dell'art. 7 della Legge 23 settembre 2025, n. 132, La informiamo che durante o dopo la visita il medico può usare uno strumento di intelligenza artificiale per trascrivere in testo una registrazione vocale e aiutarsi nella stesura della documentazione clinica.",
  "Lo strumento serve solo a trascrivere e a proporre la suddivisione del testo dettato nei campi della cartella (per esempio anamnesi, esame obiettivo, terapia). Non aggiunge informazioni, non formula diagnosi e non prende decisioni: il medico rilegge, corregge e convalida sempre il testo, e ogni decisione clinica resta sua.",
  "La registrazione audio e il testo trascritto vengono inviati al fornitore del servizio di intelligenza artificiale e non vengono conservati dal gestionale dello studio: il gestionale non trasmette al fornitore il nome né il codice fiscale del paziente. Nella cartella clinica resta solo il testo convalidato dal medico. [DA COMPLETARE: nome del fornitore, paese in cui tratta i dati, tempi di conservazione presso il fornitore e garanzie per eventuali trasferimenti fuori dall'Unione Europea.]",
  "Può rifiutare l'uso di questo strumento: il rifiuto non cambia in alcun modo le cure che riceve. Può anche revocare in qualsiasi momento il consenso già dato, chiedendolo allo studio.",
  "Titolare del trattamento è lo studio medico indicato in questo documento. Per esercitare i diritti previsti dagli articoli 15-22 del Regolamento (UE) 2016/679 può rivolgersi allo studio. [DA COMPLETARE: contatti del titolare e del DPO, se nominato.]",
];
