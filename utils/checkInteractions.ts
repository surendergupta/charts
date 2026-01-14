import type { MedicineItem } from "@/types/medicine";

export function hasInteraction(
  med: MedicineItem,
  existing: MedicineItem[]
) {
  if (!med.interactions?.length) return false;
  return existing.some((e) =>
    med.interactions!.includes(e.name)
  );
}
