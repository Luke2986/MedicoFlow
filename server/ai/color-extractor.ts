import OpenAI from 'openai';
import Color from 'color';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
}

export async function extractColorsFromUrl(url: string): Promise<ColorPalette> {
  try {
    // 1. Fetch HTML del sito (con timeout)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'MedicoFlow Color Extractor/1.0'
      }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();

    // 2. Estrai sezione rilevante (primi 50KB per performance)
    const htmlSnippet = html.substring(0, 50000);

    // 3. Usa OpenAI per analizzare ed estrarre colori
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Analizza questo HTML e CSS inline ed estrai la color palette principale del brand.

HTML SNIPPET:
\`\`\`html
${htmlSnippet}
\`\`\`

Identifica:
1. PRIMARY COLOR: Il colore principale del brand (logo, CTA, header)
2. ACCENT COLOR: Colore secondario/accento
3. SUCCESS/WARNING/ERROR: Colori per stati (se presenti, altrimenti suggerisci appropriati)

Rispondi SOLO con JSON in questo formato:
{
  "primary": "#RRGGBB",
  "accent": "#RRGGBB",
  "success": "#RRGGBB",
  "warning": "#RRGGBB",
  "error": "#RRGGBB"
}

IMPORTANTE: 
- Tutti i colori devono essere in formato esadecimale #RRGGBB
- Se non trovi colori espliciti, estrapola dal contesto del brand
- Assicurati che i colori abbiano buon contrasto per accessibilità`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.3
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // 4. Parse risposta JSON
    const baseColors: Partial<ColorPalette> = JSON.parse(content);

    // 5. Genera varianti light/dark usando la libreria color
    const primaryColor = Color(baseColors.primary || '#2563eb');
    
    const palette: ColorPalette = {
      primary: primaryColor.hex(),
      primaryLight: primaryColor.lighten(0.2).hex(),
      primaryDark: primaryColor.darken(0.2).hex(),
      accent: baseColors.accent || '#10b981',
      success: baseColors.success || '#22c55e',
      warning: baseColors.warning || '#f59e0b',
      error: baseColors.error || '#ef4444'
    };

    // 6. Valida formato colori
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    const requiredKeys: (keyof ColorPalette)[] = [
      'primary', 'primaryLight', 'primaryDark', 'accent', 
      'success', 'warning', 'error'
    ];

    for (const key of requiredKeys) {
      if (!palette[key] || !hexPattern.test(palette[key])) {
        throw new Error(`Invalid color format for ${key}: ${palette[key]}`);
      }
    }

    return palette;
  } catch (error) {
    console.error('Error extracting colors:', error);
    throw new Error('Impossibile estrarre i colori dal sito. Verifica che l\'URL sia corretto e accessibile.');
  }
}

export function getDefaultPalette(): ColorPalette {
  return {
    primary: '#2563eb',      // blue-600
    primaryLight: '#3b82f6', // blue-500
    primaryDark: '#1e40af',  // blue-700
    accent: '#10b981',       // green-500
    success: '#22c55e',      // green-500
    warning: '#f59e0b',      // amber-500
    error: '#ef4444'         // red-500
  };
}
