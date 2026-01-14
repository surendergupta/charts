"use client";

import { useMemo, useRef, useState } from "react";
import type { TestItem, TestOption } from "@/types/test";
import { generateId } from "@/utils/generateId";
import { normalizePriority } from "@/utils/tests";

const normalize = (t: Partial<TestItem>): TestItem => ({
    id: t.id ?? generateId(),
    name: (t.name ?? "").trim(),
    priority: normalizePriority(t.priority),
    when: (t.when && t.when.trim()) || "--",
    sampleType: (t.sampleType && t.sampleType.trim()) || "--",
    location: (t.location && t.location.trim()) || "--",
    notes: t.notes ?? "",
    showNotes: t.showNotes ?? false,
    selected: t.selected ?? true,
});

const norm = (s: string) => (s ?? "").trim().toLowerCase();

function dedupeByName(list: TestOption[]) {
    const seen = new Set<string>();
    const out: TestOption[] = [];
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
    tests: TestItem[];
    onChange: (tests: TestItem[]) => void;
    loading?: boolean;
    disabled?: boolean;
};

export default function TestsSection({ tests, onChange, loading, disabled }: Props) {

    // ---------------- STATE ----------------
  const [chips, setChips] = useState<TestItem[]>([]);
  const [tableRows, setTableRows] = useState<TestItem[]>([]);
  const [testQuery, setTestQuery] = useState("");
  const reqIdRef = useRef(0);

  // ---------------- COMPUTED ----------------
  const filteredChips = useMemo(() => {
    const q = testQuery.trim().toLowerCase();
    if (!q) return chips;
    return chips.filter((t) => t.name.toLowerCase().includes(q));
  }, [chips, testQuery]);

  // ---------------- ACTIONS ----------------

  // Add new chip
  const addChip = (name: string) => {
    if (disabled) return;
    const value = name.trim();
    if (!value) return;

    const exists = chips.find((c) => c.name.toLowerCase() === value.toLowerCase());
    if (exists) return;

    const newChip = normalize({ name: value, selected: false });
    setChips([...chips, newChip]);
    setTestQuery("");
  };

  // Remove chip
  const removeChip = (id: string) => {
    if (disabled) return;
    setChips(chips.filter((c) => c.id !== id));
  };

  // Move chip to table
  const addToTable = (id: string) => {
    if (disabled) return;
    const chip = chips.find((c) => c.id === id);
    if (!chip) return;

    const newRow = { ...chip, selected: true };
    setTableRows([...tableRows, newRow]);
    setChips(chips.filter((c) => c.id !== id));
  };

  // Move all chips to table
  const moveAllToTable = () => {
    if (disabled) return;
    const newRows = chips.map((c) => ({ ...c, selected: true }));
    setTableRows([...tableRows, ...newRows]);
    setChips([]);
  };

  // Remove table row
  const removeTableRow = (id: string) => {
    if (disabled) return;
    setTableRows(tableRows.filter((t) => t.id !== id));
  };

  // Toggle notes
  const toggleNotes = (id: string) => {
    setTableRows(
      tableRows.map((t) => (t.id === id ? { ...t, showNotes: !t.showNotes } : t))
    );
  };

  // Update notes text
  const updateNotes = (id: string, notes: string) => {
    setTableRows(tableRows.map((t) => (t.id === id ? { ...t, notes } : t)));
  };

    
  /*
    const addTestByName = (name: string) => {
        if (disabled) return;

        const value = name.trim();
        if (!value) return;

        const existing = tests.find((t) => t.name.toLowerCase() === value.toLowerCase());
        if (existing) {
            // If it already exists, just re-select it
            onChange(
                tests.map((t) => (t.id === existing.id ? { ...t, selected: true } : t))
            );
            setTestQuery("");
            return;
        }

        const newItem = normalize({
            name: value,
            selected: true,
            // leave others defaulted
        });

        onChange([...tests, newItem]);
        setTestQuery("");
    };

    const toggleTest = (id: string) => {
        if (disabled) return;
        onChange(tests.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t)));
    };

    const removeTest = (id: string) => {
        if (disabled) return;
        onChange(tests.filter((t) => t.id !== id));
    };

    const toggleNotes = (id: string) => {
        if (disabled) return;
        onChange(tests.map((t) => (t.id === id ? { ...t, showNotes: !t.showNotes } : t)));
    };

    const updateNotes = (id: string, notes: string) => {
        if (disabled) return;
        onChange(tests.map((t) => (t.id === id ? { ...t, notes } : t)));
    };

    const selectedTests = useMemo(() => tests.filter((t) => t.selected), [tests]);
  */
    return (
        <section
            className={`p-3 pl-6 mt-3 rounded-4xl border border-[#F2F2F2] bg-white backdrop-blur-xl ${disabled ? "opacity-60 pointer-events-none" : ""
                }`}
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
                <h4 className="font-semibold text-[22px] text-black">Tests</h4>
                {loading && <span className="text-xs text-zinc-500">Analyzing tests…</span>}
            </div>

            {/* Chips (all tests, selected/unselected) */}
            <div className="flex gap-3 overflow-x-auto mb-3">
                {filteredChips.length > 0 ? (
                    filteredChips.map((t) => {

                        return (
                            <div
                                key={t.id}
                                className={`flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer border bg-[#E5EEDD] border-[#9CD793]}`}
                            >
                                <div
                                    className={`h-4 w-4 rounded-full border flex items-center justify-center bg-[#9CD793] border-[#9CD793]}`}
                                >
                                    
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
                                {t.name}

                                {/* Add to table button */}
              {!t.selected && (
                <button
                  onClick={() => addToTable(t.id)}
                  className="text-xs px-2 py-0.5 rounded-full border border-green-400 text-green-600 hover:bg-green-50"
                >
                  Add
                </button>
              )}

              {/* Remove chip */}
              <span
                onClick={() => removeChip(t.id)}
                className="material-symbols-outlined cursor-pointer text-zinc-400 hover:text-black"
              >
                close_small
              </span>
                            </div>
                        );
                    })
                ) : (
                    <span className="text-sm text-[#7B7B7B]">No test found</span>
                )}

                {/* Move all chips to table */}
        {chips.length > 1 && (
          <button
            onClick={moveAllToTable}
            className="ml-2 text-xs px-3 py-1 rounded-full border border-blue-400 text-blue-600 hover:bg-blue-50"
          >
            Add All
          </button>
        )}
            </div>

            {/* Add test (hint-only autocomplete, no dropdown) */}
            <div className="flex items-center gap-3 bg-[#FAFAFA] border border-[#F2F2F2] rounded-4xl p-3 h-23 mb-3">
                <textarea
                    value={testQuery}
                    disabled={disabled}
                    onChange={(e) => setTestQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (disabled) return;
                        if (e.key === "Enter" || e.key === "Tab") {
              e.preventDefault();
              addChip(testQuery);
            }
                    }}
                    placeholder="Search or add test..."
                    className="flex-1 h-full resize-none outline-none text-black bg-transparent"
                />

                <button
                    disabled={disabled}
                    onClick={() => addChip(testQuery)}
                    className={`h-9 w-9 rounded-full border flex items-center justify-center bg-[#F2F2F2] border-[#F2F2F2] cursor-pointer ${disabled ? "cursor-not-allowed opacity-50" : ""
                        }`}
                >
                    <span className="material-symbols-outlined text-black">arrow_right_alt</span>
                </button>
            </div>

            {/* Table (only selected tests) */}
            <div className="overflow-hidden rounded-4xl border border-[#F2F2F2] bg-white">
                {/* Header */}
                <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1.2fr_40px] items-center gap-3 px-6 py-3 text-center text-xs font-medium uppercase text-[#7B7B7B]">
                    <div className="text-left">Name</div>
                    <div>Priority</div>
                    <div>When</div>
                    <div>Sample Type</div>
                    <div>Location</div>
                    <div>Instructions</div>
                    <div />
                </div>

                {tableRows.length === 0 ? (
                    <div className="px-6 py-4 text-sm text-[#7B7B7B]">No selected tests</div>
                ) : (
                    tableRows.map((t) => {

                        return (
                            <div
                                key={t.id}
                                className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1.2fr_40px] items-center gap-3 px-6 py-1.75 text-center border-t border-zinc-100"
                            >
                                <p className="text-left text-sm text-black">{t.name}</p>

                                <span className="mx-auto inline-flex items-center justify-center rounded-full border border-[#C7C7C7] px-3 py-1 text-xs leading-none text-black">
                                    {t.priority}
                                </span>

                                <p className="text-sm text-[#7B7B7B]">{t.when}</p>
                                <p className="text-sm text-[#7B7B7B]">{t.sampleType}</p>
                                <p className="text-sm text-[#7B7B7B]">{t.location}</p>

                                <div className="mx-auto">
                                    <button
                                        disabled={disabled}
                                        onClick={() => toggleNotes(t.id)}
                                        className={`rounded-xl border border-zinc-300 px-3 py-0.5 text-xs text-zinc-600 hover:bg-zinc-50 ${disabled ? "cursor-not-allowed opacity-50" : ""
                                            }`}
                                    >
                                        {t.showNotes ? "Hide Notes" : "Add Notes"}
                                    </button>

                                    {t.showNotes && (
                                        <textarea
                                            value={t.notes}
                                            onChange={(e) => updateNotes(t.id, e.target.value)}
                                            className="mt-2 w-full rounded-xl border border-zinc-200 p-2 text-xs text-black"
                                            placeholder="Instructions / notes…"
                                        />
                                    )}
                                </div>

                                <span
                                    className={`material-symbols-outlined text-[#7B7B7B] ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:text-black"
                                        }`}
                                    onClick={() => removeTableRow(t.id)}
                                >
                                    close_small
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
}