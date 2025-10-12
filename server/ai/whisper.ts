import OpenAI from "openai";

// Using Groq API (OpenAI-compatible) for faster inference
const groq = new OpenAI({ 
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

export interface TranscriptionResult {
  text: string;
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

    return {
      text: rawText
    };
  } catch (error) {
    console.error('Errore Whisper:', error);
    throw new Error('Errore durante la trascrizione audio');
  }
}
