import { describe, expect, it } from "vitest";
import { validateCodiceFiscale } from "../../shared/validators";
import { hasFeature, getNextPlan, getPreviousPlan } from "../../shared/features";
import { checkConflict } from "../../client/src/lib/calendar-utils";

describe("validateCodiceFiscale", () => {
  it("accepts a valid code in any case", () => {
    expect(validateCodiceFiscale("RSSMRA85M01H501Q")).toBe(true);
    expect(validateCodiceFiscale("rssmra85m01h501q")).toBe(true);
  });

  it("rejects a wrong check character", () => {
    expect(validateCodiceFiscale("RSSMRA85M01H501A")).toBe(false);
  });

  it("rejects wrong length or format", () => {
    expect(validateCodiceFiscale("")).toBe(false);
    expect(validateCodiceFiscale("RSSMRA85M01H501")).toBe(false);
    expect(validateCodiceFiscale("1SSMRA85M01H501Q")).toBe(false);
  });
});

describe("plans", () => {
  it("grants plan features and explicit extras only", () => {
    const base = { piano: "BASE", features: [] as string[] };
    expect(hasFeature(base, "export-pdf")).toBe(true);
    expect(hasFeature(base, "ai-agent-search")).toBe(false);
    expect(hasFeature({ ...base, features: ["ai-agent-search"] }, "ai-agent-search")).toBe(true);
    expect(hasFeature(null, "export-pdf")).toBe(false);
    expect(hasFeature({ piano: "SCONOSCIUTO", features: [] }, "export-pdf")).toBe(false);
  });

  it("walks the plan order", () => {
    expect(getNextPlan("BASE")).toBe("PROFESSIONAL");
    expect(getNextPlan("ENTERPRISE")).toBeNull();
    expect(getPreviousPlan("BASE")).toBeNull();
  });
});

describe("checkConflict", () => {
  const existing = [{ id: "a", dataOra: "2026-10-07T09:00:00.000Z", durata: 30 }];
  const at = (iso: string, minutes: number) => {
    const start = new Date(iso);
    return [start, new Date(start.getTime() + minutes * 60_000)] as const;
  };

  it("detects overlapping slots", () => {
    expect(checkConflict(...at("2026-10-07T09:15:00.000Z", 30), existing)).toBe(true);
  });

  it("allows back-to-back slots", () => {
    expect(checkConflict(...at("2026-10-07T09:30:00.000Z", 30), existing)).toBe(false);
  });

  it("ignores the appointment being edited", () => {
    expect(checkConflict(...at("2026-10-07T09:00:00.000Z", 30), existing, "a")).toBe(false);
  });
});
