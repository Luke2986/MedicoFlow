import { describe, expect, it } from "vitest";
import {
  estraiParametri,
  messaggiLlm,
  normalizzaRisposta,
  strutturaConRegole,
  strutturaReferto,
  strutturaSimulata,
} from "../../server/ai/referto";
import { classificaFrasi, dettaturaSimulata } from "../../server/ai/simulazione";
import type { Visita } from "../../shared/schema";
import { correctMedicalText } from "../../server/ai/medical-dictionary";
import { DETTATURE_ESEMPIO } from "../../shared/dettature-esempio";

const esempio = (id: string) => DETTATURE_ESEMPIO.find((d) => d.id === id)!.testo;

describe("strutturazione a regole", () => {
  it("splits the sample dictations on the spoken section names", () => {
    const iper = strutturaConRegole(esempio("ipertensione"));
    expect(iper.motivoVisita).toBe("controllo della pressione.");
    expect(iper.diagnosi).toBe("ipertensione arteriosa essenziale non ancora a target.");
    expect(iper.terapia).toBe("aumento ramipril a 10 milligrammi al mattino, riduzione del sale.");
    expect(iper.esamiEseguiti).toBe("creatinina, elettroliti e profilo lipidico.");
    expect(iper.noteCliniche).toBe("ricontrollo tra un mese.");
    expect(iper).toMatchObject({ pressioneSistolica: 145, pressioneDiastolica: 90, frequenzaCardiaca: 76 });

    const lombalgia = strutturaConRegole(esempio("lombalgia"));
    expect(lombalgia.terapia).toContain("calore locale");
    expect(lombalgia.peso).toBe(78);
    expect(lombalgia.prescrizioneFarmaci).toBe("");

    const asma = strutturaConRegole(esempio("asma"));
    expect(asma.prescrizioneFarmaci).toContain("una inalazione due volte al giorno");
    expect(asma).toMatchObject({ temperatura: 368, frequenzaCardiaca: 82, pressioneSistolica: null });
  });

  it("opens a section only at the start of a sentence, and keeps unlabelled text in the notes", () => {
    const campi = strutturaConRegole("Il paziente è in terapia con ramipril. Diagnosi, ipertensione.");
    expect(campi.terapia).toBe("");
    expect(campi.diagnosi).toBe("ipertensione.");
    expect(campi.noteCliniche).toBe("Il paziente è in terapia con ramipril.");
  });

  it("reads spoken vital signs and ignores implausible values", () => {
    expect(estraiParametri("pressione 140 su 90, frequenza 72, temperatura 37 e 5, altezza 1,75")).toMatchObject({
      pressioneSistolica: 140, pressioneDiastolica: 90, frequenzaCardiaca: 72, temperatura: 375, altezza: 175,
    });
    expect(estraiParametri("PA 120/80, peso 70 chili, altezza 168 cm")).toMatchObject({ pressioneSistolica: 120, peso: 70, altezza: 168 });
    expect(estraiParametri("frequenza respiratoria 16, temperatura 45")).toMatchObject({ frequenzaCardiaca: null, temperatura: null });
  });
});

describe("dizionario medico", () => {
  it("fixes known mistranscriptions without rewriting correct Italian words", () => {
    expect(correctMedicalText("sefalea e nausia").correctedText).toBe("cefalea e nausea");
    const corretto = "calore locale, una inalazione, asma allergico parzialmente controllato, ipertensione arteriosa, settimana";
    expect(correctMedicalText(corretto).correctedText).toBe(corretto);
  });
});

describe("strutturazione con il modello", () => {
  const testo = "Esame obiettivo: pressione 130 su 85. Diagnosi: gastrite.";

  it("keeps known fields only and drops vital signs that were never dictated", () => {
    const campi = normalizzaRisposta(
      { diagnosi: "gastrite.", terapia: 42, pressioneSistolica: 130, pressioneDiastolica: 80, frequenzaCardiaca: 70, extra: "x" },
      testo,
    );
    expect(campi.diagnosi).toBe("gastrite.");
    expect(campi.terapia).toBe("");
    expect(campi).toMatchObject({ pressioneSistolica: 130, pressioneDiastolica: null, frequenzaCardiaca: null });
    expect(campi).not.toHaveProperty("extra");
  });

  it("sends only the dictation and the specialty, and falls back to the rules on a bad answer", async () => {
    let inviato = "";
    const client = {
      chat: {
        completions: {
          create: async (body: { messages: { content: string }[] }) => {
            inviato = JSON.stringify(body.messages);
            return { choices: [{ message: { content: "non è json" } }] };
          },
        },
      },
    };
    const proposta = await strutturaReferto(testo, { specializzazione: "Gastroenterologia", client });
    expect(inviato).toContain("Gastroenterologia");
    expect(proposta.motore).toBe("regole");
    expect(proposta.campi.diagnosi).toBe("gastrite.");

    const buono = {
      chat: { completions: { create: async () => ({ choices: [{ message: { content: JSON.stringify({ diagnosi: "Gastrite" }) } }] }) } },
    };
    expect(await strutturaReferto(testo, { specializzazione: "Gastroenterologia", client: buono })).toMatchObject({
      motore: "llm",
      campi: { diagnosi: "Gastrite", anamnesi: "" },
    });
  });

  it("tells the model not to infer anything", () => {
    const [sistema, utente] = messaggiLlm(testo, "Cardiologia");
    expect(sistema.content).toMatch(/Non dedurre/);
    expect(utente.content).toContain(testo);
  });
});

describe("simulazione demo", () => {
  it("assigns free sentences by clinical keywords and never adds text", () => {
    const testo = "Allora, il paziente si presenta per dolore toracico. Riferisce dolore da tre giorni. All'auscultazione toni cardiaci validi. Quadro compatibile con dolore muscolare. Paracetamolo 1 g al bisogno.";
    expect(classificaFrasi(testo)).toEqual({
      motivoVisita: "il paziente si presenta per dolore toracico.",
      anamnesi: "Riferisce dolore da tre giorni.",
      esameObiettivo: "All'auscultazione toni cardiaci validi.",
      diagnosi: "Quadro compatibile con dolore muscolare.",
      terapia: "Paracetamolo 1 g al bisogno.",
    });
    const campi = strutturaSimulata(`${testo} Note: ricontrollo tra una settimana.`);
    expect(campi.motivoVisita).toBe("Il paziente si presenta per dolore toracico.");
    expect(campi.noteCliniche).toBe("Ricontrollo tra una settimana.");
  });

  it("dictates from the last visit, so structuring it fills the same fields", () => {
    const visita = {
      motivoVisita: "Controllo pressorio",
      anamnesi: "BPCO nota, iperteso in terapia",
      esameObiettivo: "Toni validi",
      diagnosi: "Ipertensione arteriosa (I10)",
      terapia: "Ramipril 5 mg",
      esamiEseguiti: null,
      pressioneSistolica: 140,
      pressioneDiastolica: 90,
      frequenzaCardiaca: 72,
    } as unknown as Visita;
    const testo = dettaturaSimulata([visita]);
    expect(testo).not.toContain("I10");
    expect(testo).toContain("Anamnesi: BPCO nota");
    const campi = strutturaSimulata(testo);
    expect(campi.diagnosi).toBe("Ipertensione arteriosa.");
    expect(campi.terapia).toBe("Ramipril 5 mg.");
    expect(Math.abs(campi.pressioneSistolica! - 140)).toBeLessThanOrEqual(6);
    expect(campi.frequenzaCardiaca).not.toBeNull();
    expect(dettaturaSimulata([])).toMatch(/Diagnosi/);
  });
});
