import OpenAI from "openai";
import { correctMedicalText } from "./medical-dictionary";

// Using Groq API (OpenAI-compatible) for faster inference
const groq = new OpenAI({ 
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

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
    const transcription = await groq.audio.transcriptions.create({
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
