// import type { TestPriority } from "@/types/test";

// export const normalizePriority = (p: unknown): TestPriority => {
//   if (typeof p !== "string") return "Routine";
//   const v = p.trim().toLowerCase();
//   if (v === "immediate" || v === "urgent" || v === "stat") {
//     return "Immediate";
//   }
//   return "Routine";
// };

export const normalizePriority = (p: unknown): "Immediate" | "Routine" => {
  if (typeof p !== "string") return "Routine";
  const v = p.trim().toLowerCase();
  if (["immediate", "urgent", "stat"].includes(v)) return "Immediate";
  return "Routine";
};
