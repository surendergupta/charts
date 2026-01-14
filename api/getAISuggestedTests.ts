import { TestItem } from "@/types/test";

export const getAISuggestedTests = async (): Promise<TestItem[]> => {
  return [
    {
      id: "cbc",
      name: "Complete Blood Count",
      priority: "Routine",
      when: "--",
      sampleType: "Blood",
      location: "Lab",
      notes: "",
      showNotes: false,
      selected: true,
    },
  ];
};
