import { AI_MEDICINES } from "@/data/medicines";
import { MedicineMaster } from "@/types/medicine";

export async function getAISuggestedMedicines(): Promise<MedicineMaster[]> {
  await new Promise((r) => setTimeout(r, 700)); // fake AI delay
  return AI_MEDICINES;
}
