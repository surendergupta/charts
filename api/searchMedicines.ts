import { AI_MEDICINES } from "@/data/medicines";
import { MedicineMaster } from "@/types/medicine";

export async function searchMedicines(q: string): Promise<MedicineMaster[]> {
  await new Promise((r) => setTimeout(r, 300));

  const query = q.toLowerCase();
  return AI_MEDICINES.filter((m) =>
    m.name.toLowerCase().includes(query)
  );
}
