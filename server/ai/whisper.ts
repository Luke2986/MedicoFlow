import OpenAI from "openai";

// Using Groq API (OpenAI-compatible) for faster inference
const groq = new OpenAI({ 
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

export interface TranscriptionResult {
  text: string;
  sections: {
    anamnesi?: string;
    esameObiettivo?: string;
    diagnosi?: string;
    terapia?: string;
  };
  raw: string;
}

export async function transcribeAudio(
  audioFile: File
): Promise<TranscriptionResult> {
  try {
    // 1. Trascrivi audio con Whisper su Groq
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3',
      language: 'it',
      response_format: 'text'
    });

    const rawText = transcription as string;

    // 2. Struttura il testo con GPT-5
    const structured = await structureClinicalNote(rawText);

    return {
      text: rawText,
      sections: structured,
      raw: rawText
    };
  } catch (error) {
    console.error('Errore Whisper:', error);
    throw new Error('Errore durante la trascrizione audio');
  }
}

async function structureClinicalNote(text: string) {
  const prompt = `Sei un assistente medico specializzato. Analizza questa nota clinica e suddividila nelle seguenti sezioni:

TESTO TRASCRITTO:
"${text}"

Estrai e organizza il contenuto in queste sezioni (se presenti):
1. ANAMNESI: Storia clinica, sintomi riferiti dal paziente
2. ESAME OBIETTIVO: Osservazioni cliniche, parametri vitali
3. DIAGNOSI: Diagnosi clinica con eventuali codici ICD-10
4. TERAPIA: Terapia prescritta, farmaci, raccomandazioni

Rispondi SOLO con JSON in questo formato:
{
  "anamnesi": "...",
  "esameObiettivo": "...",
  "diagnosi": "...",
  "terapia": "..."
}

Se una sezione non è presente nel testo, omettila dal JSON.`;

  try {
    // Usa Llama 3.3 70B su Groq per estrazione strutturata
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Sei un assistente medico che struttura note cliniche.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2048,
      temperature: 0.3
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('Nessuna risposta AI');

    return JSON.parse(content);
  } catch (error) {
    console.error('Errore strutturazione:', error);
    // Fallback: restituisci tutto come anamnesi
    return { anamnesi: text };
  }
}
