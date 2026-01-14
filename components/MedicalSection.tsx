"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MedicineMaster, MedicineItem, MedicineChip } from "@/types/medicine";

import { generateId } from "@/utils/generateId";
import { parseMedicineText } from "@/utils/parseMedicine";
import { hasInteraction } from "@/utils/checkInteractions";
import { normalizeFrequency } from "@/utils/normalizeFrequency";

const norm = (s: string) => (s ?? "").trim().toLowerCase();

function dedupeByName(list: MedicineMaster[]) {
    const seen = new Set<string>();
    const out: MedicineMaster[] = [];
    for (const m of list || []) {
        const key = norm(m?.name);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(m);
    }
    return out;
}

function startsWithSmart(full: string, q: string) {
    return norm(full).startsWith(norm(q));
}

type Props = {
    suggestedMedicines: MedicineMaster[];
    loading: boolean;
    disabled?: boolean;
    searchMedicines: (q: string) => Promise<MedicineMaster[]>;
};

export default function MedicalSection({
    suggestedMedicines,
    loading,
    disabled,
    searchMedicines,
}: Props) {
    // ✅ chips only (doctor selected)
    const [selectedChips, setSelectedChips] = useState<MedicineChip[]>([]);

    // ✅ table rows (later you can add separately) — NOT touched by add flow here
    const [selectedMedicines, setSelectedMedicines] = useState<MedicineItem[]>([]);

    const [medicineQuery, setMedicineQuery] = useState("");
    const [emrResults, setEmrResults] = useState<MedicineMaster[]>([]);
    const [emrLoading, setEmrLoading] = useState(false);

    const reqIdRef = useRef(0);

    const suggestedList = useMemo(
        () => dedupeByName(suggestedMedicines || []),
        [suggestedMedicines]
    );

    // ✅ EMR search (debounced) for hint purpose only
    useEffect(() => {
        const q = norm(medicineQuery);

        if (q.length < 3) {
            setEmrResults([]);
            setEmrLoading(false);
            return;
        }

        const t = window.setTimeout(async () => {
            const myReq = ++reqIdRef.current;
            try {
                setEmrLoading(true);
                const res = await searchMedicines(q);
                if (myReq !== reqIdRef.current) return;
                setEmrResults(dedupeByName(res || []).slice(0, 30));
            } catch {
                if (myReq !== reqIdRef.current) return;
                setEmrResults([]);
            } finally {
                if (myReq === reqIdRef.current) setEmrLoading(false);
            }
        }, 250);

        return () => window.clearTimeout(t);
    }, [medicineQuery, searchMedicines]);

    // ✅ compute best hint (no dropdown)
    const hintText = useMemo(() => {
        const q = (medicineQuery ?? "").trim();
        if (q.length < 1) return "";

        // 1) suggestedList priority
        const s1 = suggestedList.find((m) => startsWithSmart(m.name, q));
        if (s1) return s1.name;

        // 2) EMR results
        const s2 = emrResults.find((m) => startsWithSmart(m.name, q));
        if (s2) return s2.name;

        // 3) fallback empty
        return "";
    }, [medicineQuery, suggestedList, emrResults]);

    const seedForName = (name: string) => {
        const v = norm(name);
        const s1 = suggestedList.find((m) => norm(m.name) === v);
        if (s1) return s1;
        const s2 = emrResults.find((m) => norm(m.name) === v);
        if (s2) return s2;
        return null;
    };

    // ✅ add ONLY to chips (not table)
    const addToChips = (rawName: string) => {
        if (disabled) return;

        const value = (rawName ?? "").trim();
        if (!value) return;

        const finalName = hintText && startsWithSmart(hintText, value) ? hintText : value;

        const exists = selectedChips.some((m) => norm(m.name) === norm(finalName));
        if (exists) {
            setMedicineQuery("");
            return;
        }

        const seed = seedForName(finalName);

        setSelectedChips((prev) => [
            ...prev,
            {
                id: generateId(),
                selected: true,
                name: finalName,
                strength: seed?.strength ?? "",
                frequency: seed?.frequency ?? "",
                duration: seed?.duration ?? "",
                when: seed?.when ?? "",
                salt: seed?.salt ?? "",
                route: seed?.route ?? "",
                notes: "",
                showNotes: false,
            },
        ]);

        setMedicineQuery("");
    };

    const removeChip = (id: string) => {
        if (disabled) return;
        setSelectedChips((prev) => prev.filter((c) => c.id !== id));
    };

    // const moveChipToTable = (chipId: string) => {
    //     if (disabled) return;

    //     setSelectedChips((chipsPrev) => {
    //         const chip = chipsPrev.find((c) => c.id === chipId);
    //         if (!chip) return chipsPrev;

    //         setSelectedMedicines((tablePrev) => {
    //             const exists = tablePrev.some((m) => norm(m.name) === norm(chip.name));
    //             if (exists) return tablePrev;

    //             return [
    //                 ...tablePrev,
    //                 {
    //                     ...chip,
    //                     id: generateId(), // new id for table row
    //                     selected: true,
    //                 },
    //             ];
    //         });

    //         return chipsPrev.filter((c) => c.id !== chipId);
    //     });
    // };

    // Move a chip to the table
    const moveChipToTable = (chipId: string) => {
  if (disabled) return;

  setSelectedChips((chipsPrev) => {
    const chip = chipsPrev.find((c) => c.id === chipId);
    if (!chip) return chipsPrev;

    setSelectedMedicines((tablePrev) => {
      const exists = tablePrev.some(
        (m) => norm(m.name) === norm(chip.name)
      );
      if (exists) return tablePrev;

      const seed = seedForName(chip.name);
      const parsed = parseMedicineText(
        `${chip.name} ${chip.strength} ${chip.frequency}`,
        seed
      );

      const isPediatric =
        parsed.unit === "mg" && Number(parsed.strength) < 300;

      const newRow = {
  ...chip,
  id: generateId(),
  strength: parsed.strength,
  frequency: parsed.frequency,
  unit: parsed.unit,
  pediatric: isPediatric,
  interactions: seed?.interactions ?? [],
  selected: true,
  notes: chip.notes ?? "",
  showNotes: chip.showNotes ?? false,
} satisfies MedicineItem;

      return [...tablePrev, newRow];
    });

    return chipsPrev.filter((c) => c.id !== chipId);
  });
};

    // Move all chips to the table

    const moveAllChipsToTable = () => {
  if (disabled) return;

  setSelectedMedicines((tablePrev) => {
    const existing = new Set(tablePrev.map((m) => norm(m.name)));

    const toAdd = selectedChips
      .filter((c) => !existing.has(norm(c.name)))
      .map((chip) => {
        const seed = seedForName(chip.name);
        const parsed = parseMedicineText(
          `${chip.name} ${chip.strength} ${chip.frequency}`,
          seed
        );

        const isPediatric =
          parsed.unit === "mg" && Number(parsed.strength) < 300;

        return {
          ...chip,
          id: generateId(),
  strength: parsed.strength,
  frequency: parsed.frequency,
  unit: parsed.unit,
  pediatric: isPediatric,
  interactions: seed?.interactions ?? [],
  selected: true,
  notes: chip.notes ?? "",
  showNotes: chip.showNotes ?? false,
} satisfies MedicineItem;
      });

    return [...tablePrev, ...toAdd];
  });

  setSelectedChips([]);
};

    const removeTableRow = (id: string) => {
        if (disabled) return;
        setSelectedMedicines((prev) => prev.filter((m) => m.id !== id));
    };

    const updateTableRow = (id: string, field: keyof MedicineItem, value: any) => {
        if (disabled) return;
        setSelectedMedicines((prev) =>
            prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
        );
    };
    return (
        <section
            className={`p-3 pl-6 mt-3 rounded-4xl border border-[#F2F2F2] bg-white backdrop-blur-xl ${disabled ? "opacity-60" : ""
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-[22px] text-black">Rx</h4>
                    <div className="text-xs text-[#7B7B7B]">
                        {selectedChips.length} shortlisted • {selectedMedicines.length} in Rx
                    </div>
                </div>

                {/* ✅ Move all */}
                <button
                    type="button"
                    disabled={disabled || selectedChips.length === 0}
                    onClick={moveAllChipsToTable}
                    className={`rounded-full border px-3 py-1 text-xs ${disabled || selectedChips.length === 0
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-zinc-50"
                        }`}
                >
                    Add all to table
                </button>
            </div>

            {loading && <p className="text-sm text-gray-400 mt-2">Analyzing medicines…</p>}

            {/* ✅ Chips show ONLY selectedChips */}
            <div className="flex gap-3 overflow-x-auto mb-3">
                {selectedChips.length > 0 ? (
                    selectedChips.map((m) => (
                        <div
                            key={m.id}
                            className="flex items-center gap-2 px-3 py-1 rounded-full border bg-[#E5EEDD] border-[#9CD793] whitespace-nowrap"
                        >
                            <div className="h-4 w-4 rounded-full border flex items-center justify-center bg-[#9CD793] border-[#9CD793]">
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                    <path
                                        d="M1 4L3.5 6.5L9 1"
                                        stroke="white"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>

                            <span className="text-sm text-black">{m.name}</span>
                            <button
                                type="button"
                                disabled={disabled}
                                onClick={() => moveChipToTable(m.id)}
                                className={`ml-1 rounded-full border px-2 py-0.5 text-[11px] ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-white"
                                    }`}
                                title="Move to table"
                            >
                                Add
                            </button>
                            <button
                                type="button"
                                disabled={disabled}
                                onClick={() => removeChip(m.id)}
                                className={`ml-1 ${disabled ? "cursor-not-allowed opacity-50 text-zinc-400" : "text-zinc-600 hover:text-red-500"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">close_small</span>
                            </button>
                        </div>
                    ))
                ) : (
                    <span className="text-sm text-[#7B7B7B]">No medicines selected</span>
                )}
            </div>

            {/* ✅ Add medicine (hint-only autocomplete, no dropdown) */}
            <div className="flex items-center gap-3 bg-[#FAFAFA] text-black border border-[#F2F2F2] rounded-4xl p-3 h-23 mb-3">
                <div className="relative flex-1">
                    {/* Hint layer (ghost text) */}
                    <div className="pointer-events-none absolute inset-0 flex items-center px-3 py-2 text-black/30">
                        <span className="invisible whitespace-pre">{medicineQuery}</span>
                        <span className="whitespace-pre">
                            {hintText && startsWithSmart(hintText, medicineQuery)
                                ? hintText.slice(medicineQuery.length)
                                : ""}
                        </span>
                    </div>

                    <input
                        disabled={disabled}
                        value={medicineQuery}
                        onChange={(e) => setMedicineQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (disabled) return;

                            // ✅ Accept hint with Tab/Right
                            if ((e.key === "Tab" || e.key === "ArrowRight") && hintText) {
                                e.preventDefault();
                                setMedicineQuery(hintText);
                                return;
                            }

                            // ✅ Enter adds to chips (not table)
                            if (e.key === "Enter") {
                                e.preventDefault();
                                addToChips(medicineQuery);
                                return;
                            }
                        }}
                        placeholder="Search medicine (AI first, then EMR)…"
                        className="w-full bg-transparent outline-none px-3 py-2"
                    />
                </div>

                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => addToChips(medicineQuery)}
                    className={`h-9 w-9 rounded-full border flex items-center justify-center bg-[#F2F2F2] border-[#F2F2F2] ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                        }`}
                    title="Add"
                >
                    <span className="material-symbols-outlined text-black">arrow_right_alt</span>
                </button>
            </div>

            {/* tiny status */}
            <div className="mb-3 text-[11px] text-[#7B7B7B]">
                {emrLoading ? "Searching EMR…" : hintText ? "Press Tab to accept hint. Enter to add." : "Type 3+ letters to search EMR."}
            </div>

            {/* ✅ Table remains independent (not auto-filled by this input) */}
            <div className="overflow-hidden rounded-4xl border border-[#F2F2F2] bg-white">
                <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr_1fr_1.5fr_40px] items-center gap-3 px-4 py-3 text-center text-xs font-medium uppercase text-[#7B7B7B]">
                    <div className="text-left">Name</div>
                    <div>Strength</div>
                    <div>Frequency</div>
                    <div>Duration</div>
                    <div>When</div>
                    <div>Generic</div>
                    <div>Route</div>
                    <div>Instructions</div>
                    <div />
                </div>

                {selectedMedicines.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-[#7B7B7B]">
                        Table not linked to search input. (You can add a “Move to Rx Table” action later.)
                    </div>
                ) : (
                    selectedMedicines.map((m) => {
                        const interaction = hasInteraction(
    m,
    selectedMedicines.filter((x) => x.id !== m.id)
  );
                        return(
                            <div
      key={m.id}
      className={`grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr_1fr_1.5fr_40px]
      items-center gap-3 px-4 py-2 text-sm border-t border-zinc-100
      ${interaction ? "bg-red-50" : ""}`}
    >
      {/* Name */}
      <div className="text-left">
        {m.name}
        {m.strength && (
          <span
            className={`ml-2 rounded px-2 py-0.5 text-xs ${
              m.pediatric
                ? "bg-yellow-100 text-yellow-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {m.strength}
            {m.unit}
          </span>
        )}
      </div>

      {/* Strength */}
      <div className="text-center">{m.strength}</div>

      {/* Frequency */}
      <input
        value={m.frequency.replace(/-/g, "")}
        placeholder="101"
        maxLength={3}
        onChange={(e) => {
          const v = e.target.value.replace(/[^01]/g, "").slice(0, 3);
          updateTableRow(m.id, "frequency", v);
        }}
        onBlur={() =>
          updateTableRow(
            m.id,
            "frequency",
            normalizeFrequency(m.frequency)
          )
        }
        className="w-20 mx-auto border px-2 py-1 text-center rounded"
      />

      <div>{m.duration || "-"}</div>
      <div>{m.when || "-"}</div>
      <div>{m.salt || "-"}</div>
      <div>{m.route || "-"}</div>
      <div className="text-xs text-zinc-600">{m.notes || "-"}</div>

      {/* Remove */}
      <button
        onClick={() => removeTableRow(m.id)}
        className="text-zinc-400 hover:text-red-500"
        title="Remove"
      >
        ✕
      </button>
    </div>
                    )})
                )}
            </div>
        </section>
    );
}