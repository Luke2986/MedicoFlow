// Invented dictations, written the way a doctor speaks them, used by the demo when no audio can be transcribed.
export interface DettaturaEsempio {
  id: string;
  titolo: string;
  testo: string;
}

export const DETTATURE_ESEMPIO: readonly DettaturaEsempio[] = [
  {
    id: "ipertensione",
    titolo: "Controllo pressorio",
    testo:
      "Motivo della visita: controllo della pressione. Anamnesi: paziente iperteso da circa cinque anni, in terapia con ramipril, " +
      "riferisce buona aderenza, nega cefalea e dolore toracico. Esame obiettivo: toni cardiaci validi e ritmici, nessun edema declive, " +
      "pressione 145 su 90, frequenza 76. Diagnosi: ipertensione arteriosa essenziale non ancora a target. Terapia: aumento ramipril a " +
      "10 milligrammi al mattino, riduzione del sale. Esami: creatinina, elettroliti e profilo lipidico. Note: ricontrollo tra un mese.",
  },
  {
    id: "lombalgia",
    titolo: "Lombalgia acuta",
    testo:
      "Motivo: dolore lombare. Anamnesi: dolore insorto dopo aver sollevato un peso circa una settimana fa, senza irradiazione alle gambe, " +
      "nessun disturbo sfinterico. Esame obiettivo: contrattura paravertebrale lombare, Lasègue negativo bilateralmente, forza e riflessi " +
      "conservati, peso 78 chili. Diagnosi: lombalgia acuta meccanica. Terapia: paracetamolo un grammo al bisogno fino a tre volte al giorno, " +
      "calore locale, evitare il riposo prolungato.",
  },
  {
    id: "asma",
    titolo: "Riacutizzazione asmatica",
    testo:
      "Motivo della visita: tosse notturna e respiro sibilante. Anamnesi: asma allergico noto, peggiorato con la stagione dei pollini, usa il " +
      "broncodilatatore al bisogno tre o quattro volte a settimana. Esame obiettivo: sibili espiratori sparsi, buona ventilazione, temperatura " +
      "36 e 8, frequenza cardiaca 82. Diagnosi: asma bronchiale parzialmente controllato. Prescrizione: budesonide formoterolo 160 su 4,5 " +
      "una inalazione due volte al giorno. Esami: spirometria con test di broncodilatazione.",
  },
];
