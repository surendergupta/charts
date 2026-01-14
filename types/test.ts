export type TestPriority = "Immediate" | "Routine";

export type TestOption = {
  name: string;
  priority?: TestPriority | string;
  when?: string;
  sampleType?: string;
  location?: string;
};

export type TestItem = {
  id: string;
  name: string;
  priority: TestPriority;
  when: string;
  sampleType: string;
  location: string;
  notes: string;
  showNotes: boolean;
  selected: boolean;
};
