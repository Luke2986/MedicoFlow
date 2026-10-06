import { db } from "./db";
import { specializations } from "../shared/schema";

export async function seedSpecializations() {
  try {
    const existing = await db.select().from(specializations).limit(1);
    
    if (existing.length > 0) {
      console.log("ℹ️  Specializations already seeded");
      return;
    }

    await db.insert(specializations).values([
      {
        nome: "Medicina Generale",
        slug: "medicina-generale",
        descrizione: "Ambulatorio o poliambulatorio di medicina generale (medici di base)",
        defaultKPIs: [
          "visite-oggi",
          "ricette-prescritte",
          "certificati-emessi",
          "pazienti-cronici-follow-up"
        ],
        cartellaTemplate: JSON.stringify({
          anamnesi: {
            familiare: ["malattie-cardiovascolari", "diabete", "tumori", "malattie-neurologiche"],
            fisiologica: ["fumo", "alcol", "attivita-fisica", "alimentazione"],
            patologica: ["allergie", "interventi-chirurgici", "ricoveri-precedenti", "farmaci-in-uso"]
          },
          esamiComuni: [
            "Emocromo completo", "Glicemia", "Colesterolo totale/HDL/LDL", 
            "Creatinina", "TSH", "Urine complete", "ECG", "Radiografia torace"
          ],
          diagnosiFrequenti: [
            "Ipertensione arteriosa essenziale (I10)",
            "Diabete mellito tipo 2 (E11)",
            "BPCO (J44)",
            "Gastrite (K29)",
            "Lombalgia (M54.5)",
            "Cefalea (R51)",
            "Influenza (J11)",
            "Infezione vie urinarie (N39.0)"
          ]
        }),
        parametriVitali: [
          "Pressione Arteriosa", "Frequenza Cardiaca", "Temperatura", 
          "Peso", "Altezza", "BMI", "Saturazione O2", "Glicemia"
        ],
        quickActions: JSON.stringify([
          { label: "Prescrivi Ricetta", icon: "FileText", action: "/ricette/nuova" },
          { label: "Certificato Malattia", icon: "FileCheck", action: "/certificati/malattia" },
          { label: "Richiesta Esami", icon: "ClipboardList", action: "/esami/richiesta" },
          { label: "Visita Domiciliare", icon: "Home", action: "/visite/domiciliare" }
        ])
      },
      {
        nome: "Cardiologia",
        slug: "cardiologia",
        descrizione: "Ambulatorio specializzato in cardiologia e malattie cardiovascolari",
        defaultKPIs: [
          "visite-cardiologiche",
          "ecg-eseguiti",
          "holter-richiesti",
          "follow-up-scompenso"
        ],
        cartellaTemplate: JSON.stringify({
          anamnesi: {
            familiare: ["cardiopatia-ischemica", "ipertensione", "morte-improvvisa", "aritmie"],
            fisiologica: ["fumo", "alcol", "attivita-fisica", "alimentazione", "stress"],
            patologica: ["infarto", "angina", "scompenso", "aritmie", "valvulopatie"]
          },
          esamiComuni: [
            "ECG", "Ecocardiogramma", "Test da sforzo", "Holter ECG 24h",
            "Holter pressorio", "Angio-TC coronarica", "Coronarografia"
          ],
          diagnosiFrequenti: [
            "Ipertensione arteriosa (I10-I15)",
            "Cardiopatia ischemica (I25)",
            "Fibrillazione atriale (I48)",
            "Scompenso cardiaco (I50)",
            "Valvulopatie (I34-I39)"
          ]
        }),
        parametriVitali: [
          "Pressione Arteriosa", "Frequenza Cardiaca", "Saturazione O2",
          "Peso", "Edemi", "Dispnea (NYHA)", "ECG"
        ],
        quickActions: JSON.stringify([
          { label: "ECG Urgente", icon: "Activity", action: "/ecg/nuovo" },
          { label: "Ecocardiogramma", icon: "Heart", action: "/eco/prenota" },
          { label: "Holter 24h", icon: "Clock", action: "/holter/richiesta" },
          { label: "Visita Controllo", icon: "CalendarCheck", action: "/follow-up" }
        ])
      },
      {
        nome: "Pediatria",
        slug: "pediatria",
        descrizione: "Ambulatorio pediatrico per bambini e adolescenti",
        defaultKPIs: [
          "visite-pediatriche",
          "vaccinazioni",
          "bilanci-salute",
          "certificati-sportivi"
        ],
        cartellaTemplate: JSON.stringify({
          anamnesi: {
            familiare: ["malattie-genetiche", "allergie", "asma", "malattie-metaboliche"],
            neonatale: ["parto", "peso-nascita", "apgar", "complicanze"],
            patologica: ["malattie-infettive", "ospedalizzazioni", "allergie", "vaccinazioni"]
          },
          esamiComuni: [
            "Emocromo", "Esame urine", "Test allergologici", 
            "Ecografia addome", "Rx torace", "Curve crescita"
          ],
          diagnosiFrequenti: [
            "Faringotonsillite (J02-J03)",
            "Otite media (H66)",
            "Bronchite (J20)",
            "Gastroenterite (A09)",
            "Dermatite atopica (L20)",
            "Asma bronchiale (J45)"
          ]
        }),
        parametriVitali: [
          "Peso", "Altezza", "Temperatura", "Frequenza Cardiaca",
          "Pressione Arteriosa", "Saturazione O2", "Percentili crescita"
        ],
        quickActions: JSON.stringify([
          { label: "Bilancio Salute", icon: "Baby", action: "/bilancio/nuovo" },
          { label: "Vaccinazione", icon: "Syringe", action: "/vaccinazioni" },
          { label: "Certificato Sportivo", icon: "Trophy", action: "/certificati/sportivo" },
          { label: "Curva Crescita", icon: "TrendingUp", action: "/crescita" }
        ])
      }
    ]);

    console.log("✅ Specializations seeded successfully");
  } catch (error) {
    console.log("ℹ️  Specializations seed error:", error);
  }
}
