/**
 * Dizionario termini medici italiani per correzione post-trascrizione
 * Include termini comuni che possono essere mal interpretati da ASR
 */

export const medicalTerms: Record<string, string> = {
  // Sintomi comuni
  'emicrania': 'emicrania',
  'emicrani': 'emicrania',
  'micrani': 'emicrania',
  'ai micrani': 'emicrania',
  'cefalea': 'cefalea',
  'sefalea': 'cefalea',
  'chefalea': 'cefalea',
  'nausea': 'nausea',
  'nausia': 'nausea',
  'vomito': 'vomito',
  'bomito': 'vomito',
  'diarrea': 'diarrea',
  'diarrhea': 'diarrea',
  'diarèa': 'diarrea',
  'stipsi': 'stipsi',
  'stitichezza': 'stitichezza',
  'vertigini': 'vertigini',
  'bertigini': 'vertigini',
  'dispnea': 'dispnea',
  'dispnèa': 'dispnea',
  'tosse': 'tosse',
  'febbre': 'febbre',
  'febre': 'febbre',
  
  // Parti del corpo
  'addome': 'addome',
  'abdome': 'addome',
  'torace': 'torace',
  'thorace': 'torace',
  'polmoni': 'polmoni',
  'polmone': 'polmone',
  'cuore': 'cuore',
  'core': 'cuore',
  'fegato': 'fegato',
  'milza': 'milza',
  'reni': 'reni',
  'stomaco': 'stomaco',
  'intestino': 'intestino',
  
  // Condizioni mediche
  'ipertensione': 'ipertensione',
  'ipertension': 'ipertensione',
  'ipotensione': 'ipotensione',
  'diabete': 'diabete',
  'diabeto': 'diabete',
  'asma': 'asma',
  'azma': 'asma',
  'allergia': 'allergia',
  'alergia': 'allergia',
  'infezione': 'infezione',
  'infezzione': 'infezione',
  'infiammazione': 'infiammazione',
  'infiamazzione': 'infiammazione',
  'artrite': 'artrite',
  'arthrosi': 'artrosi',
  'artrosi': 'artrosi',
  
  // Esami e procedure
  'radiografia': 'radiografia',
  'radiographia': 'radiografia',
  'ecografia': 'ecografia',
  'echografia': 'ecografia',
  'tac': 'TAC',
  'risonanza': 'risonanza',
  'rizonanza': 'risonanza',
  'elettrocardiogramma': 'elettrocardiogramma',
  'ecg': 'ECG',
  'esame': 'esame',
  'ezame': 'esame',
  'sangue': 'sangue',
  'analisi': 'analisi',
  'anàlisi': 'analisi',
  
  // Terapie e farmaci
  'terapia': 'terapia',
  'therapia': 'terapia',
  'farmaco': 'farmaco',
  'antibiotico': 'antibiotico',
  'antibiòtico': 'antibiotico',
  'antinfiammatorio': 'antinfiammatorio',
  'antinfiamatòrio': 'antinfiammatorio',
  'analgesico': 'analgesico',
  'analgésico': 'analgesico',
  'riposo': 'riposo',
  'ripozo': 'riposo',
  
  // Termini generali
  'paziente': 'paziente',
  'pazienti': 'pazienti',
  'paziénte': 'paziente',
  'diagnosi': 'diagnosi',
  'diagnòsi': 'diagnosi',
  'prognosi': 'prognosi',
  'prognòsi': 'prognosi',
  'sintomo': 'sintomo',
  'sintomi': 'sintomi',
  'sporadico': 'sporadico',
  'sporadici': 'sporadici',
  'esporadico': 'sporadico',
  'esporadi': 'sporadici',
  'cronico': 'cronico',
  'acuto': 'acuto',
  'grave': 'grave',
  'lieve': 'lieve',
  'moderato': 'moderato',
  
  // Frequenze temporali
  'quotidiano': 'quotidiano',
  'quotidiana': 'quotidiana',
  'settimanale': 'settimanale',
  'mensile': 'mensile',
  'giornaliero': 'giornaliero',
  'occasionale': 'occasionale',
  'occasionali': 'occasionali',
};

// Exact matches only. Fuzzy matching against every word rewrote correct Italian ("calore" became "cuore",
// "inalazione" became "infezione"): in a clinical record a wrong correction is worse than none.
function findClosestMedicalTerm(word: string): string | null {
  return medicalTerms[word.toLowerCase()] ?? null;
}

/**
 * Corregge il testo trascritto usando il dizionario medico
 */
export function correctMedicalText(text: string): {
  correctedText: string;
  corrections: Array<{ original: string; corrected: string; position: number }>;
} {
  const words = text.split(/\b/);
  const corrections: Array<{ original: string; corrected: string; position: number }> = [];
  let position = 0;
  
  const correctedWords = words.map(word => {
    const wordPosition = position;
    position += word.length;
    
    // Salta punteggiatura e spazi
    if (!/[a-zA-Zàèéìòù]/.test(word)) {
      return word;
    }
    
    const correction = findClosestMedicalTerm(word);
    
    if (correction && correction.toLowerCase() !== word.toLowerCase()) {
      corrections.push({
        original: word,
        corrected: correction,
        position: wordPosition
      });
      
      // Mantieni maiuscole/minuscole originali
      if (word[0] === word[0].toUpperCase()) {
        return correction.charAt(0).toUpperCase() + correction.slice(1);
      }
      return correction;
    }
    
    return word;
  });
  
  return {
    correctedText: correctedWords.join(''),
    corrections
  };
}
