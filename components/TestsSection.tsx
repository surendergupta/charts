"use client";

import { useMemo, useRef, useState, useEffect } from "react";
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

// Normalize string for fuzzy matching (remove dots/spaces, lowercase)
const norm = (s: string) => (s ?? "").replace(/[\s.]/g, "").toLowerCase();

function dedupeByName(list: TestItem[]) {
  const seen = new Set<string>();
  const out: TestItem[] = [];
  for (const m of list || []) {
    const key = norm(m.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}

function startsWithSmart(full: string, q: string) {
  return norm(full).startsWith(norm(q));
}

const fetchTestsAPI = async (query: string): Promise<TestItem[]> => {
  const allTests = [
    "Complete Blood Count",
    "CBC with Differential",
    "Liver Function Test",
    "Kidney Function Test",
    "HbA1c",
    "Thyroid Profile",
    "Urine Routine",
    "Lipid Profile",
    "C-Reactive Protein",
  ];
  return allTests
    .filter((t) => t.toLowerCase().includes(query.toLowerCase()))
    .map((name) => normalize({ name, selected: false }));
};

type Props = {
  tests: TestItem[];
  onChange: (tests: TestItem[]) => void;
  loading?: boolean;
  disabled?: boolean;
};

export default function TestsSection({
  tests,
  onChange,
  loading,
  disabled,
}: Props) {
  // ---------------- STATE ----------------
  const [chips, setChips] = useState<TestItem[]>([]);
  const [tableRows, setTableRows] = useState<TestItem[]>([]);
  const [testQuery, setTestQuery] = useState("");
  const [suggestions, setSuggestions] = useState<TestItem[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const fetchRef = useRef(0);

  // ---------------- FETCH SUGGESTIONS ----------------
  useEffect(() => {
    const fetchId = ++fetchRef.current;
    if (!testQuery.trim()) {
      setSuggestions([]);
      setHighlightIndex(0);
      return;
    }

    fetchTestsAPI(testQuery).then((res) => {
      if (fetchId === fetchRef.current) {
        setSuggestions(res);
        setHighlightIndex(0);
      }
    });
  }, [testQuery]);

  // ---------------- ACTIONS ----------------

  const removeTableRow = (id: string) => {
    if (disabled) return;
    setChips(chips.filter((c) => c.id !== id));
    setTableRows(tableRows.filter((t) => t.id !== id));
  };

  const updateNotes = (id: string, notes: string) => {
    setTableRows(tableRows.map((t) => (t.id === id ? { ...t, notes } : t)));
  };

  const addTestToTable = (name: string) => {
    if (disabled) return;
    const value = name.trim();
    if (!value) return;

    // Fuzzy duplicate check
    const existsTable = tableRows.find((t) => norm(t.name) === norm(value));
    const existsChip = chips.find((t) => norm(t.name) === norm(value));

    if (existsTable) {
      setTestQuery("");
      return;
    }

    const newRow = normalize({ name: value, selected: true });

    // Add to table
    setTableRows([...tableRows, newRow]);

    // Add chip for preview
    if (!existsChip) setChips([...chips, newRow]);

    setTestQuery("");
  };

  // ---------------- HINT TEXT ----------------
  const hintText = useMemo(() => {
    if (!testQuery || suggestions.length === 0) return "";
    return suggestions[highlightIndex]?.name || "";
  }, [suggestions, highlightIndex, testQuery]);

  const remainingHint = hintText
    .toLowerCase()
    .startsWith(testQuery.toLowerCase())
    ? hintText.slice(testQuery.length)
    : "";

  // ---------------- KEY HANDLING ----------------
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setHighlightIndex((prev) => (prev + 1) % suggestions.length);
      }
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setHighlightIndex(
          (prev) => (prev - 1 + suggestions.length) % suggestions.length
        );
      }
    }

    if (e.key === "Tab") {
      e.preventDefault();
      if (hintText) setTestQuery(hintText);
    }

    if (e.key === "Enter") {
      e.preventDefault();
      addTestToTable(hintText || testQuery);
    }
  };

  return (
    <section
      className={`p-3 pl-6 mt-3 rounded-4xl border border-[#F2F2F2] bg-white backdrop-blur-xl ${
        disabled ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <h4 className="font-semibold text-[22px] text-black">Tests</h4>
        {loading && (
          <span className="text-xs text-zinc-500">Analyzing tests…</span>
        )}
      </div>

      {/* Chips (all tests, selected/unselected) */}
      <div className="flex gap-3 overflow-x-auto mb-3">
        {chips.length > 0 ? (
          chips.map((t) => {
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

                {/* Remove chip */}
                <span
                  onClick={() => removeTableRow(t.id)}
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
      </div>

      {/* Add test (hint-only autocomplete, no dropdown) */}
      <div className="flex items-center justify-between gap-3 bg-[#FAFAFA] text-black border border-[#F2F2F2] rounded-4xl p-3 h-23 mb-4 transition-all">
        <div className="relative flex-1">
          {/* Ghost hint */}
          <div className="pointer-events-none absolute inset-0 flex items-center px-3 py-2 text-black/30">
            <span className="invisible whitespace-pre">{testQuery}</span>
            <span className="whitespace-pre">{remainingHint}</span>
          </div>

          <input
            type="text"
            value={testQuery}
            disabled={disabled}
            onChange={(e) => setTestQuery(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
              handleKeyDown(e)
            }
            placeholder="Search or add test..."
            className="w-full bg-transparent outline-none px-3 py-2 resize-none text-black placeholder:text-black/40"
          />
        </div>
        <button
          disabled={disabled}
          onClick={() => addTestToTable(hintText || testQuery)}
          className={`h-9 w-9 rounded-full border flex items-center justify-center bg-[#F2F2F2] border-[#F2F2F2] cursor-pointer ${
            disabled ? "cursor-not-allowed opacity-50" : ""
          }`}
        >
          <span className="material-symbols-outlined text-black">
            arrow_right_alt
          </span>
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
          <div className="px-6 py-4 text-sm text-[#7B7B7B]">
            No selected tests
          </div>
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

                <div className="relative">
                  <input
                    value={t.notes}
                    disabled={disabled}
                    onChange={(e) => updateNotes(t.id, e.target.value)}
                    placeholder="Add instructions..."
                    className="w-full bg-transparent outline-none resize-none px-2 py-1 text-sm text-black placeholder:text-black/40 border border-zinc-200 rounded-md"
                  />
                </div>
                <span
                  className={`material-symbols-outlined text-[#7B7B7B] ${
                    disabled
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer hover:text-black"
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
