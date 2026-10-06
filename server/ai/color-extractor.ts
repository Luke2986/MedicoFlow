import Groq from 'groq-sdk';
import Color from 'color';
import { promises as dns } from 'dns';
import * as ipaddr from 'ipaddr.js';

let groq: Groq | undefined;

function getGroq(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY non impostata: l'estrazione dei colori è disabilitata.");
  }
  groq ??= new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
}

export interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
}

function isPrivateOrReservedIp(ipString: string): boolean {
  try {
    // Parse and normalize IP using ipaddr.js
    const addr = ipaddr.process(ipString);
    
    // Check if it's a private/reserved range
    const range = addr.range();
    
    // Block all private and reserved ranges
    const blockedRanges = [
      'private',        // RFC1918 private addresses
      'loopback',       // Loopback addresses
      'linkLocal',      // Link-local addresses (169.254.x.x, fe80::/10)
      'broadcast',      // Broadcast addresses
      'reserved',       // Reserved addresses
      'carrierGradeNat',// Carrier-grade NAT (100.64.0.0/10)
      'uniqueLocal',    // IPv6 ULA (fc00::/7)
      'unspecified',    // 0.0.0.0 or ::
      'multicast',      // Multicast addresses
    ];
    
    if (blockedRanges.includes(range)) {
      return true;
    }
    
    // Additional check for IPv4-mapped IPv6 addresses
    if (addr.kind() === 'ipv6') {
      const ipv6Addr = addr as ipaddr.IPv6;
      if (ipv6Addr.isIPv4MappedAddress()) {
        const ipv4 = ipv6Addr.toIPv4Address();
        return isPrivateOrReservedIp(ipv4.toString());
      }
    }
    
    return false;
  } catch (error) {
    // If parsing fails, it's not a valid IP
    return false;
  }
}

async function validateUrl(urlString: string): Promise<void> {
  let parsedUrl: URL;
  
  try {
    parsedUrl = new URL(urlString);
  } catch {
    throw new Error('URL non valido');
  }

  // Allow only http and https
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Solo protocolli HTTP/HTTPS sono permessi');
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  
  // Block localhost and loopback addresses (literal check)
  const blockedHosts = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    '.local',
    'metadata.google.internal',
    'metadata',
    'instance-data'
  ];

  if (blockedHosts.some(blocked => hostname.includes(blocked))) {
    throw new Error('Non è possibile accedere a indirizzi locali o metadata services');
  }

  // Check if hostname is already an IP and validate it
  try {
    ipaddr.process(hostname);
    // If we get here, it's a valid IP - check if it's private
    if (isPrivateOrReservedIp(hostname)) {
      throw new Error('Non è possibile accedere a reti private o riservate');
    }
  } catch {
    // Not a valid IP, continue with domain validation
  }

  // Require public domain names (at least one dot and valid TLD)
  if (!hostname.includes('.') || hostname.endsWith('.')) {
    throw new Error('L\'URL deve essere un dominio pubblico valido');
  }

  // Resolve DNS to check if it points to private IPs
  try {
    const addresses = await dns.resolve4(hostname).catch(() => [] as string[]);
    const addresses6 = await dns.resolve6(hostname).catch(() => [] as string[]);
    
    const allAddresses = [...addresses, ...addresses6];
    
    if (allAddresses.length === 0) {
      throw new Error('Impossibile risolvere il DNS per questo dominio');
    }

    for (const addr of allAddresses) {
      if (isPrivateOrReservedIp(addr)) {
        throw new Error('Il dominio risolve a un indirizzo privato o riservato');
      }
    }
  } catch (err: any) {
    if (err.message.includes('risolve') || err.message.includes('privato')) {
      throw err;
    }
    // DNS resolution errors
    throw new Error('Errore nella risoluzione DNS del dominio');
  }
}

export async function extractColorsFromUrl(url: string): Promise<ColorPalette> {
  try {
    // 0. Validate URL for security (SSRF protection with DNS resolution)
    await validateUrl(url);

    // 1. Fetch HTML with redirect protection (manual redirect handling)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    let finalUrl = url;
    let redirectCount = 0;
    const maxRedirects = 5;
    
    while (redirectCount < maxRedirects) {
      const response = await fetch(finalUrl, {
        signal: controller.signal,
        redirect: 'manual',  // Prevent automatic redirects
        headers: {
          'User-Agent': 'MedicoFlow Color Extractor/1.0'
        }
      });

      // Handle redirects manually with validation
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) {
          throw new Error('Redirect senza Location header');
        }

        // Resolve relative URLs
        const redirectUrl = new URL(location, finalUrl).href;
        
        // Validate redirect target
        await validateUrl(redirectUrl);
        
        finalUrl = redirectUrl;
        redirectCount++;
        continue;
      }

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status}`);
      }

      const html = await response.text();

      // 2. Estrai sezione rilevante (primi 30KB per evitare token limit di Groq)
      const htmlSnippet = html.substring(0, 30000);

      // 3. Usa Groq (Llama 3.3) per analizzare ed estrarre colori
      const completion = await getGroq().chat.completions.create({
        model: 'llama-3.3-70b-versatile',
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
        throw new Error('No response from Groq');
      }

      // 4. Parse risposta JSON
      const baseColors: Partial<ColorPalette> = JSON.parse(content);

      // 5. Genera varianti light/dark usando la libreria color
      const primaryColor = Color(baseColors.primary || '#2563eb');
      
      // Get current lightness value
      const baseLightness = primaryColor.lightness();
      
      // Calculate light/dark variants with absolute lightness values
      // This prevents going to pure black (#000000) or pure white (#FFFFFF)
      const lightLightness = Math.min(baseLightness + 15, 85); // Add 15%, cap at 85%
      const darkLightness = Math.max(baseLightness - 15, 15);  // Subtract 15%, floor at 15%
      
      const palette: ColorPalette = {
        primary: primaryColor.hex(),
        primaryLight: primaryColor.lightness(lightLightness).hex(),
        primaryDark: primaryColor.lightness(darkLightness).hex(),
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
    }
    
    clearTimeout(timeout);
    throw new Error('Troppi redirect');
  } catch (error: any) {
    console.error('Error extracting colors:', error);
    
    // Check if it's a rate limit error
    if (error.status === 429 || error.code === 'rate_limit_exceeded') {
      throw new Error('Limite API Groq raggiunto. Riprova tra qualche ora oppure inserisci i colori manualmente usando i selettori colore sotto.');
    }
    
    // Check if Groq API key is missing
    if (!process.env.GROQ_API_KEY) {
      throw new Error('API key Groq non configurata. Usa i selettori colore manuali sotto per personalizzare il tema.');
    }
    
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
