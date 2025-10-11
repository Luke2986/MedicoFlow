import { z } from 'zod';

/**
 * Validazione Codice Fiscale italiano con algoritmo checksum
 * Verifica formato e carattere di controllo secondo normativa italiana
 */
export function validateCodiceFiscale(cf: string): boolean {
  if (!cf || cf.length !== 16) return false;
  
  const cfUpper = cf.toUpperCase();
  const cfRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;
  if (!cfRegex.test(cfUpper)) return false;
  
  // Mappe per calcolo carattere di controllo
  const evenMap: Record<string, number> = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
    'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18,
    'T': 19, 'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25
  };
  
  const oddMap: Record<string, number> = {
    '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
    'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
    'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
    'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
  };
  
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const char = cfUpper[i];
    sum += i % 2 === 0 ? oddMap[char] : evenMap[char];
  }
  
  const controlChar = String.fromCharCode(65 + (sum % 26));
  return controlChar === cfUpper[15];
}

/**
 * Schema Zod per validazione form paziente
 */
export const pazienteFormSchema = z.object({
  nome: z.string()
    .min(2, 'Nome troppo corto (minimo 2 caratteri)')
    .max(50, 'Nome troppo lungo (massimo 50 caratteri)'),
  cognome: z.string()
    .min(2, 'Cognome troppo corto (minimo 2 caratteri)')
    .max(50, 'Cognome troppo lungo (massimo 50 caratteri)'),
  codiceFiscale: z.string()
    .length(16, 'Il Codice Fiscale deve essere di 16 caratteri')
    .refine(validateCodiceFiscale, {
      message: 'Codice Fiscale non valido (verificare carattere di controllo)'
    }),
  dataNascita: z.string().min(1, 'Data di nascita obbligatoria'),
  luogoNascita: z.string().min(2, 'Luogo di nascita obbligatorio'),
  sesso: z.enum(['M', 'F'], { 
    required_error: 'Seleziona il sesso',
    invalid_type_error: 'Valore non valido'
  }),
  indirizzo: z.string().min(5, 'Indirizzo obbligatorio (minimo 5 caratteri)'),
  citta: z.string().min(2, 'Città obbligatoria'),
  provincia: z.string()
    .length(2, 'Provincia deve essere 2 lettere (es. MI, RM)')
    .regex(/^[A-Z]{2}$/, 'Provincia deve essere 2 lettere maiuscole'),
  cap: z.string()
    .regex(/^\d{5}$/, 'CAP deve essere 5 cifre'),
  telefono: z.string()
    .regex(/^(\+39)?[\s]?[0-9]{9,10}$/, 'Telefono non valido (9-10 cifre)'),
  email: z.string()
    .email('Email non valida')
    .optional()
    .or(z.literal('')),
  note: z.string().optional().or(z.literal(''))
});

export type PazienteFormData = z.infer<typeof pazienteFormSchema>;
