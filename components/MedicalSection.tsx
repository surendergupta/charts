"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  MedicineMaster,
  MedicineItem,
  MedicineChip,
} from "@/types/medicine";

import { generateId } from "@/utils/generateId";
import { parseMedicineText } from "@/utils/parseMedicine";
import { hasInteraction } from "@/utils/checkInteractions";
import { normalizeFrequency } from "@/utils/normalizeFrequency";

const norm = (s: string) => (s ?? "").trim().toLowerCase();

const normalizeText = (v: string | string[]) =>
  Array.isArray(v) ? v.join(" ") : String(v ?? "");

const startsWithSmart = (full: string, q: string) =>
  norm(full).startsWith(norm(q));
const SEPARATOR = "•";

function getSegmentRanges(value: string) {
  const parts = value.split(SEPARATOR);
  let index = 0;

  return parts.map((part) => {
    const start = index;
    const end = start + part.length;
    index = end + SEPARATOR.length;
    return { start, end };
  });
}

function moveSegment(input: HTMLInputElement, direction: "next" | "prev") {
  const value = input.value;
  const cursor = input.selectionStart ?? 0;
  const ranges = getSegmentRanges(value);

  const currentIndex = ranges.findIndex(
    (r) => cursor >= r.start && cursor <= r.end
  );

  if (currentIndex === -1) return;

  const targetIndex =
    direction === "next"
      ? Math.min(ranges.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1);

  const target = ranges[targetIndex];

  requestAnimationFrame(() => {
    input.setSelectionRange(target.start, target.end);
  });
}
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

function parseStrengthText(strengthText: string | string[]): {
  value: number | null;
  unit: string;
} {
  const s = normalizeText(strengthText).trim().toLowerCase();
  // capture: number + optional space + unit letters/% (e.g. 650mg, 0.5 g, 5 ml)
  const m = s.match(/(\d+(?:\.\d+)?)\s*([a-z%]+)?/i);
  const value = m ? Number(m[1]) : null;
  const unit = (m?.[2] ?? "").toLowerCase();
  return {
    value: Number.isFinite(value as number) ? (value as number) : null,
    unit,
  };
}

function isPediatricFromStrength(strengthText: string) {
  const { value, unit } = parseStrengthText(strengthText);
  return unit === "mg" && value != null && value < 300;
}

type Props = {
  suggestedMedicines: MedicineMaster[];
  loading: boolean;
  disabled?: boolean;
  searchMedicines: (q: string) => Promise<MedicineMaster[]>;
};

export default function MedicinesSection({
  suggestedMedicines,
  loading,
  disabled,
  searchMedicines,
}: Props) {
  // ✅ Table rows are the single source of truth
  const [selectedMedicines, setSelectedMedicines] = useState<MedicineItem[]>(
    []
  );

  // ✅ Chips are derived from table (display-only)
  const chips: MedicineChip[] = useMemo(() => {
    return (selectedMedicines || []).map((m) => ({
      id: m.id,
      selected: true,
      name: m.name,
      strength: String(m.strength ?? ""),
      frequency: String(m.frequency ?? ""),
      duration: String(m.duration ?? ""),
      when: String(m.when ?? ""),
      salt: String((m as any).salt ?? ""),
      route: String((m as any).route ?? ""),
      notes: String((m as any).notes ?? ""),
      showNotes: false,
    }));
  }, [selectedMedicines]);

  // ✅ Single inline input
  const [query, setQuery] = useState("");

  // ✅ EMR results (debounced) for NAME search
  const [emrResults, setEmrResults] = useState<MedicineMaster[]>([]);
  const [emrLoading, setEmrLoading] = useState(false);
  const reqIdRef = useRef(0);

  const suggestedList = useMemo(
    () => dedupeByName(suggestedMedicines || []),
    [suggestedMedicines]
  );

  // ✅ Debounced EMR search (names)
  useEffect(() => {
    const q = norm(query);
    if (q.length < 3) {
      setEmrResults([]);
      setEmrLoading(false);
      return;
    }

    // optional: skip EMR if query already has extras like "•" / mg / 101
    const looksLikeExtras =
      /(\bmg\b|\bml\b|\bmcg\b|\bg\b|\btab\b|\bcaps?\b|\b1-0-1\b|\b101\b|•)/i.test(
        query
      );
    if (looksLikeExtras) {
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
  }, [query, searchMedicines]);

  // ✅ best hint row by name prefix (suggested first, then EMR)
  const hintRow = useMemo(() => {
    const q = (query ?? "").trim();
    if (!q) return null;

    const s1 = suggestedList.find((m) => startsWithSmart(m.name, q));
    if (s1) return s1;

    const s2 = emrResults.find((m) => startsWithSmart(m.name, q));
    if (s2) return s2;

    return null;
  }, [query, suggestedList, emrResults]);

  // ✅ ghost hint includes: name + strength + freq + duration + when
  const hintText = useMemo(() => {
    const q = (query ?? "").trim();
    if (!q || !hintRow) return "";
    if (!startsWithSmart(hintRow.name, q)) return "";

    const parts = [
      hintRow.name,
      hintRow.strength,
      hintRow.frequency,
      hintRow.duration,
      hintRow.when,
      hintRow.notes,
    ]
      .map((x) => (x ?? "").toString().trim())
      .filter(Boolean);

    return parts.join(" • ");
  }, [query, hintRow]);

  const acceptHint = () => {
    if (!hintText) return;
    setQuery(hintText);
  };

  const seedForName = (name: string) => {
    const v = norm(name);
    return (
      suggestedList.find((m) => norm(m.name) === v) ??
      emrResults.find((m) => norm(m.name) === v) ??
      null
    );
  };

  // ✅ Build a table row from query (Tab hint or free text)
  const buildRowFromQuery = (raw: string): MedicineItem | null => {
    const text = (raw ?? "").trim();
    if (!text) return null;

    // Case A: accepted hint (exact)
    if (hintRow && text === hintText) {
      const seed = hintRow;

      const parsed = parseMedicineText(
        `${seed.name} ${seed.strength ?? ""} ${seed.frequency ?? ""}`,
        seed
      );

      const strengthText = normalizeText(seed.strength); // keep as "650 mg"
      const pediatric = isPediatricFromStrength(strengthText);

      return {
        id: generateId(),
        selected: true,
        name: seed.name,
        strength: strengthText,
        frequency: parsed.frequency || (seed.frequency ?? ""),
        duration: seed.duration ?? "",
        when: seed.when ?? "",
        salt: seed.salt ?? "",
        route: seed.route ?? "",
        interactions: seed.interactions ?? [],
        pediatric,
        notes: "",
        showNotes: false,
      } satisfies MedicineItem;
    }

    // Case B: user typed "•" style
    if (text.includes("•")) {
      const parts = text
        .split("•")
        .map((p) => p.trim())
        .filter(Boolean);
      const name = parts[0] ?? "";
      if (!name) return null;

      const seed = seedForName(name);
      const strengthText = (parts[1] ?? seed?.strength ?? "").trim();
      const frequency = parts[2] ?? seed?.frequency ?? "";
      const duration = parts[3] ?? seed?.duration ?? "";
      const when = parts[4] ?? seed?.when ?? "";
      const parsed = parseMedicineText(
        `${name} ${strengthText} ${frequency}`,
        seed ?? undefined
      );

      return {
        id: generateId(),
        selected: true,
        name,
        strength: strengthText,
        frequency: parsed.frequency || frequency,
        duration,
        when,
        salt: seed?.salt ?? "",
        route: seed?.route ?? "",
        interactions: seed?.interactions ?? [],
        pediatric: isPediatricFromStrength(strengthText),
        notes: "",
        showNotes: false,
      } satisfies MedicineItem;
    }

    // Case C: name-only typed
    const name = text;
    const seed = seedForName(name);
    const strengthText = normalizeText(seed?.strength ?? "");
    const frequency = seed?.frequency ?? "";
    const duration = seed?.duration ?? "";
    const when = seed?.when ?? "";

    const parsed = parseMedicineText(
      `${name} ${strengthText} ${frequency}`,
      seed ?? undefined
    );

    return {
      id: generateId(),
      selected: true,
      name,
      strength: strengthText,
      frequency: parsed.frequency || frequency,
      duration,
      when,
      salt: seed?.salt ?? "",
      route: seed?.route ?? "",
      interactions: seed?.interactions ?? [],
      pediatric: isPediatricFromStrength(strengthText),
      notes: "",
      showNotes: false,
    } satisfies MedicineItem;
  };

  // ✅ Enter adds DIRECTLY to table (chips auto-show from table)
  const addMedicineToTable = () => {
    if (disabled) return;

    const row = buildRowFromQuery(query);
    if (!row) return;

    const exists = selectedMedicines.some(
      (m) => norm(m.name) === norm(row.name)
    );
    if (exists) {
      setQuery("");
      return;
    }

    setSelectedMedicines((prev) => [...prev, row]);
    setQuery("");
  };

  const removeTableRow = (id: string) => {
    if (disabled) return;
    setSelectedMedicines((prev) => prev.filter((m) => m.id !== id));
  };

  const updateTableRow = (
    id: string,
    field: keyof MedicineItem,
    value: any
  ) => {
    if (disabled) return;
    setSelectedMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  return (
    <section
      className={`p-3 pl-6 mt-3 rounded-4xl border border-[#F2F2F2] bg-white backdrop-blur-xl ${
        disabled ? "opacity-60" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h4 className="font-semibold text-[22px] text-black">Rx</h4>
          <div className="text-xs text-[#7B7B7B]">
            {chips.length} selected • {selectedMedicines.length} in Rx
          </div>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-gray-400 mt-2">Analyzing medicines…</p>
      )}

      {/* ✅ Chips row (DISPLAY ONLY, derived from table) */}
      <div className="flex gap-3 overflow-x-auto mb-3">
        {chips.length > 0 ? (
          chips.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2 px-3 py-1 rounded-full border bg-[#E5EEDD] border-[#9CD793] whitespace-nowrap"
              title={[
                c.strength && `Strength: ${c.strength}`,
                c.frequency && `Freq: ${c.frequency}`,
                c.duration && `Duration: ${c.duration}`,
                c.when && `When: ${c.when}`,
                c.notes && `Instruction: ${c.notes}`,
              ]
                .filter(Boolean)
                .join(" | ")}
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

              <span className="text-sm text-black">{c.name}</span>

              {/* ✅ remove removes from TABLE (source of truth) */}
              <span
                className="material-symbols-outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTableRow(c.id);
                }}
              >
                close_small
              </span>
            </div>
          ))
        ) : (
          <span className="text-sm text-[#7B7B7B]">No medicines selected</span>
        )}
      </div>

      {/* ✅ Inline input (Tab accepts hint, Enter adds to table) */}
      <div className="flex items-center gap-3 bg-[#FAFAFA] text-black border border-[#F2F2F2] rounded-4xl p-3 h-23 mb-2">
        <div className="relative flex-1">
          {/* Ghost hint */}
          <div className="pointer-events-none absolute inset-0 flex items-center px-3 py-2 text-black/30">
            <span className="invisible whitespace-pre">{query}</span>
            <span className="whitespace-pre">
              {hintText && startsWithSmart(hintText, query)
                ? hintText.slice(query.length)
                : ""}
            </span>
          </div>

          <input
            disabled={disabled}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              const input = e.currentTarget;
              if (disabled) return;

              if ((e.key === "Tab" || e.key === "ArrowRight") && hintText) {
                e.preventDefault();
                acceptHint();
                return;
              }

              if (e.key === "Tab" && query.includes(SEPARATOR)) {
                e.preventDefault();
                moveSegment(input, e.shiftKey ? "prev" : "next");
                return;
              }

              if (e.key === "Enter") {
                e.preventDefault();
                addMedicineToTable();
                return;
              }
            }}
            placeholder="Search medicine… (Tab to accept hint, Enter to add)"
            className="w-full bg-transparent outline-none px-3 py-2"
          />
        </div>

        <button
          type="button"
          disabled={disabled || !query.trim()}
          onClick={addMedicineToTable}
          className={`h-9 w-9 rounded-full border flex items-center justify-center bg-[#F2F2F2] border-[#F2F2F2] ${
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
          title="Add"
        >
          <span className="material-symbols-outlined text-black">
            arrow_right_alt
          </span>
        </button>
      </div>

      {/* tiny status */}
      <div className="mb-3 text-[11px] text-[#7B7B7B]">
        {emrLoading
          ? "Searching EMR…"
          : hintRow
            ? "Tab to accept hint. Enter to add."
            : "Type 3+ letters to search EMR."}
      </div>

      {/* ✅ Editable Table */}
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
            No medicines in Rx table.
          </div>
        ) : (
          selectedMedicines.map((m) => {
            const interaction = hasInteraction(
              m,
              selectedMedicines.filter((x) => x.id !== m.id)
            );

            return (
              <div
                key={m.id}
                className={`grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr_1fr_1.5fr_40px]
                items-center gap-3 px-4 py-2 text-sm border-t border-zinc-100
                ${interaction ? "bg-red-50" : ""}`}
              >
                {/* Name + pediatric badge */}
                <div className="text-left">
                  {m.name}
                  {m.strength && (
                    <span
                      className={`ml-2 rounded px-2 py-0.5 text-xs ${
                        m.pediatric
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                      title={m.pediatric ? "Pediatric dose flag" : "Adult dose"}
                    >
                      {m.strength}
                    </span>
                  )}
                </div>

                {/* Strength + Unit */}
                <div className="text-center flex items-center justify-center">
                  <input
                    value={(m.strength as any) ?? ""}
                    placeholder="650"
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^a-zA-Z0-9.]/g, "");
                      updateTableRow(m.id, "strength", v);
                    }}
                    className="w-20 border border-[#b7b7b7] px-2 py-1 text-center rounded-full outline-none"
                  />
                </div>

                {/* Frequency */}
                <input
                  value={String(m.frequency ?? "")}
                  placeholder="1-0-1"
                  maxLength={6}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^01]/g, "").slice(0, 3);
                    updateTableRow(m.id, "frequency", v);
                  }}
                  onBlur={() =>
                    updateTableRow(
                      m.id,
                      "frequency",
                      normalizeFrequency(String(m.frequency ?? ""))
                    )
                  }
                  className="w-20 mx-auto border border-[#b7b7b7] px-2 py-1 text-center rounded-full outline-none"
                />

                {/* Duration */}
                <input
                  value={(m.duration as any) ?? ""}
                  placeholder="5 days"
                  onChange={(e) =>
                    updateTableRow(m.id, "duration", e.target.value)
                  }
                  className="w-24 mx-auto border border-[#b7b7b7] px-2 py-1 text-center rounded-full outline-none"
                />

                {/* When */}
                <input
                  value={(m.when as any) ?? ""}
                  placeholder="AF / BF / HS"
                  onChange={(e) => updateTableRow(m.id, "when", e.target.value)}
                  className="w-24 mx-auto border border-[#b7b7b7] px-2 py-1 text-center rounded-full outline-none"
                />

                {/* Generic */}
                <div className="text-[#363636]">{m.salt}</div>

                {/* Route */}
                <div className="text-[#363636]">{m.route}</div>

                {/* Instructions */}
                <input
                  value={(m.notes as any) ?? ""}
                  placeholder="After food"
                  onChange={(e) =>
                    updateTableRow(m.id, "notes", e.target.value)
                  }
                  className="w-full border border-[#b7b7b7] px-2 py-1 rounded-full outline-none text-sm"
                />

                {/* Remove */}
                <button
                  onClick={() => removeTableRow(m.id)}
                  className="text-zinc-400 hover:text-red-500"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
