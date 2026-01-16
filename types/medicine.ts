export type Unit = "mg" | "ml";

export type MedicineMaster = {
  id: string;
  name: string;
  strength: string | string[];
  frequency: string;
  duration: string;
  when: string;
  salt: string;
  route: string;
  unit?: Unit;
  pediatric?: boolean;
  notes?: string;
  interactions?: string[];
};

/** 🔹 Used ONLY for top chips */
export type MedicineChip = {
  id: string;
  name: string;
  strength: string;
  frequency: string;
  duration: string;
  when: string;
  salt: string;
  route: string;
  selected: boolean;
  notes: string;
  showNotes: boolean;
};

/** 🔹 Used in final Rx table */
export type MedicineItem = MedicineMaster & {
  selected: boolean;
  notes: string;
  showNotes: boolean;
};
