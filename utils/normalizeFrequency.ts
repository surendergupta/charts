export function normalizeFrequency(input: string): string {
  const v = (input ?? "").toLowerCase();

  if (v === "bd") return "1-0-1";
  if (v === "tds") return "1-1-1";
  if (v === "od") return "1-0-0";
  if (v === "hs") return "0-0-1";

  if (/^\d{3}$/.test(v)) return v.split("").join("-");
  if (/^\d-\d-\d$/.test(v)) return v;

  return "1-0-1"; // safe default
}
