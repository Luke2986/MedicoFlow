import OpenAI from "openai";
import { correctMedicalText } from "./medical-dictionary";

let groq: OpenAI | undefined;

// Groq exposes an OpenAI-compatible API; the client is created lazily so the key stays optional.
function getGroq(): OpenAI {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY non impostata: la dettatura vocale è disabilitata.");
  }
  groq ??= new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });
  return groq;
}

export interface TranscriptionResult {
  text: string;
  correctedText?: string;
  corrections?: Array<{ original: string; corrected: string; position: number }>;
}

export async function transcribeAudio(
  audioFile: File
): Promise<TranscriptionResult> {
  try {
    // Trascrivi audio con Whisper su Groq (solo testo grezzo)
    const transcription = await getGroq().audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3',
      language: 'it',
      response_format: 'text'
    });

    const rawText = transcription as string;

    // Post-processing: correggi termini medici
    const { correctedText, corrections } = correctMedicalText(rawText);

    console.log('Trascrizione raw:', rawText);
    if (corrections.length > 0) {
      console.log('Correzioni applicate:', corrections.length);
      console.log('Correzioni:', corrections);
    }

    return {
      text: rawText, // Mantieni il testo raw originale
      correctedText: corrections.length > 0 ? correctedText : undefined,
      corrections: corrections.length > 0 ? corrections : undefined
    };
  } catch (error) {
    console.error('Errore Whisper:', error);
    throw new Error('Errore durante la trascrizione audio');
  }
}
