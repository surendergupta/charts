import { MedicineMaster } from "@/types/medicine";

export const AI_MEDICINES: MedicineMaster[] = [
  {
    id: "1",
    name: "Paracetamol",
    strength: "500",
    unit: "mg",
    frequency: "1-1-1",
    duration: "5 days",
    when: "After food",
    salt: "Paracetamol",
    route: "Oral",
  },
  {
    id: "2",
    name: "Amoxicillin",
    strength: "250",
    unit: "mg",
    frequency: "1-1-1",
    duration: "7 days",
    when: "After food",
    salt: "Amoxicillin",
    route: "Oral",
    pediatric: true,
    interactions: ["Methotrexate"],
  },
  {
    id: "3",
    name: "Metformin",
    strength: "500",
    unit: "mg",
    frequency: "1-0-1",
    duration: "30 days",
    when: "With meals",
    salt: "Metformin HCl",
    route: "Oral",
  },
];
