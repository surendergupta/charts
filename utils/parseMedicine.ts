import type { MedicineMaster } from "@/types/medicine";
import { normalizeFrequency } from "./normalizeFrequency";

export type ParsedMedicine = {
  strength: string;
  unit: "mg" | "ml";
  frequency: string; // always normalized "1-0-1"
};

export function parseMedicineText(
  raw: string,
  seed?: MedicineMaster | null
): ParsedMedicine {
  const text = raw.toLowerCase();

  // strength
  const doseMatch = text.match(/(\d+)\s*(mg|ml)/);
  const strength = doseMatch?.[1] ?? seed?.strength ?? "";
  const unit = (doseMatch?.[2] as "mg" | "ml") ?? "mg";

  // frequency
  const freqMatch =
    text.match(/\d-\d-\d/) ||
    text.match(/\b101\b|\b010\b|\b011\b/) ||
    text.match(/\b(bd|tds|od|hs)\b/);

  const rawFreq = freqMatch?.[0] ?? seed?.frequency ?? "";

  return {
    strength,
    unit,
    frequency: normalizeFrequency(rawFreq),
  };
}
