"use client";

import { MedicineMaster } from "@/types/medicine";
import React, {
  useState,
  useMemo,
  KeyboardEvent,
  ChangeEvent,
  useEffect,
} from "react";
type SegmentKey =
  | "name"
  | "strength"
  | "frequency"
  | "duration"
  | "when"
  | "notes";

interface PrescriptionRow {
  name: string;
  strength: string;
  frequency: string;
  duration: string;
  when: string;
  salt: string;
  route: string;
  notes: string;
}

// --- Configuration ---

const SEGMENT_ORDER: SegmentKey[] = [
  "name",
  "strength",
  "frequency",
  "duration",
  "when",
  "notes",
];

const INITIAL_STATE: PrescriptionRow = {
  name: "",
  strength: "",
  frequency: "",
  duration: "",
  when: "",
  salt: "",
  route: "",
  notes: "",
};

const extractSuggestions = (
  segment: SegmentKey,
  medicines: any[]
): string[] => {
  switch (segment) {
    case "name":
      return medicines.map((m) => m.name).filter(Boolean);

    case "strength":
      return medicines.flatMap((m) => {
        if (Array.isArray(m.strength)) return m.strength;
        if (typeof m.strength === "string") return [m.strength];
        return [];
      });

    case "frequency":
      return medicines.map((m) => m.frequency).filter(Boolean);

    case "duration":
      return medicines.map((m) => m.duration).filter(Boolean);

    case "when":
      return medicines.map((m) => m.when).filter(Boolean);

    case "notes":
      return medicines.map((m) => m.salt).filter(Boolean);

    default:
      return [];
  }
};

type Props = {
  suggestedMedicines: MedicineMaster[];
  loading: boolean;
  disabled?: boolean;
  searchMedicines: (q: string) => Promise<MedicineMaster[]>;
};

const MedicalSectionDone = ({
  suggestedMedicines,
  loading,
  disabled,
  searchMedicines,
}: Props) => {
  const [rows, setRows] = useState<PrescriptionRow[]>([]);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(0);
  const [currentValues, setCurrentValues] =
    useState<PrescriptionRow>(INITIAL_STATE);

  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);
  const activeSegment = SEGMENT_ORDER[activeSegmentIndex];
  const typedValue = currentValues[activeSegment] || "";

  useEffect(() => {
    if (!typedValue) {
      setDynamicSuggestions([]);
      return;
    }

    // 1️⃣ First: try local suggestedMedicines
    const local = extractSuggestions(activeSegment, suggestedMedicines).filter(
      (s) => s.toLowerCase().startsWith(typedValue.toLowerCase())
    );

    if (local.length > 0) {
      setDynamicSuggestions(local);
      return;
    }

    // 2️⃣ If none → call API (only for name segment usually)
    if (activeSegment === "name") {
      searchMedicines(typedValue).then((res) => {
        const apiResults = extractSuggestions("name", res);
        setDynamicSuggestions(apiResults);
      });
    }
  }, [typedValue, activeSegment, suggestedMedicines, searchMedicines]);

  // 1. Calculate Ghost Hint
  const ghostHint = useMemo(() => {
    if (!typedValue) return "";

    const match = dynamicSuggestions.find((s) =>
      s.toLowerCase().startsWith(typedValue.toLowerCase())
    );

    return match ? match.slice(typedValue.length) : "";
  }, [typedValue, dynamicSuggestions]);

  // 2. Event Handlers
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const fullSegmentValue = typedValue + ghostHint;
      let updatedValues = {
        ...currentValues,
        [activeSegment]: fullSegmentValue,
      };

      if (activeSegment === "name") {
        const matched = suggestedMedicines.find(
          (m: any) => m.name.toLowerCase() === fullSegmentValue.toLowerCase()
        );

        if (matched) {
          updatedValues = {
            ...updatedValues,
            salt: matched.salt || "",
            route: matched.route || "",
          };
        }
      }

      setCurrentValues(updatedValues);

      if (activeSegmentIndex < SEGMENT_ORDER.length - 1) {
        setActiveSegmentIndex(activeSegmentIndex + 1);
      }
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (!currentValues.name) return;

      const fullSegmentValue = typedValue + ghostHint;
      const finalRow = { ...currentValues, [activeSegment]: fullSegmentValue };

      setRows((prev) => [...prev, finalRow]);
      setCurrentValues(INITIAL_STATE);
      setActiveSegmentIndex(0);
    }

    if (e.key === "Backspace" && typedValue === "") {
      if (activeSegmentIndex > 0) {
        e.preventDefault();
        setActiveSegmentIndex(activeSegmentIndex - 1);
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCurrentValues({ ...currentValues, [activeSegment]: e.target.value });
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRowField = (
    rowIndex: number,
    field: keyof PrescriptionRow,
    value: string
  ) => {
    setRows((prev) =>
      prev.map((row, i) => (i === rowIndex ? { ...row, [field]: value } : row))
    );
  };

  const EDITABLE_FIELDS: SegmentKey[] = [
    "strength",
    "frequency",
    "duration",
    "when",
    "notes",
  ];

  return (
    <div className=" p-3 pl-6 mt-3 rounded-4xl border border-[#F2F2F2] bg-white backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h4 className="font-semibold text-[22px] text-black">Rx</h4>
          <div className="text-xs text-[#7B7B7B]">{rows.length} in Rx</div>
        </div>
      </div>
      {/* Loading Indicator */}
      {loading && (
        <p className="text-sm text-gray-400 mt-2">Analyzing medicines…</p>
      )}
      {/* Chips */}
      {rows.length > 0 && (
        <div className="flex gap-3 overflow-x-auto mb-3">
          {rows.map((row, index) => (
            <div
              key={index}
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

              <span className="text-sm text-black">{row.name}</span>
              <span
                className="material-symbols-outlined cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  removeRow(index);
                }}
              >
                close_small
              </span>
            </div>
          ))}
        </div>
      )}
      {/* Dynamic Input Bar */}
      <div className="relative flex items-center justify-between gap-3 bg-[#FAFAFA] text-black border border-[#F2F2F2] rounded-4xl p-3 h-23 mb-4 transition-all">
        {SEGMENT_ORDER.map((key, index) => {
          const isActive = index === activeSegmentIndex;
          const isCompleted = index < activeSegmentIndex;

          return (
            <div key={key} className="flex items-center">
              <div className="relative whitespace-nowrap">
                {isActive && (
                  <span className="absolute -top-7 left-0 text-[11px] text-indigo-600 font-sans font-bold uppercase tracking-widest">
                    {key}
                  </span>
                )}

                <span
                  className={`
                        ${
                          isActive
                            ? "text-slate-900 font-bold border-b-2 border-indigo-400"
                            : ""
                        }
                        ${isCompleted ? "text-indigo-900 font-medium" : ""}
                        ${!isActive && !isCompleted ? "text-slate-300" : ""}
                      `}
                >
                  {currentValues[key] || (isActive ? "" : key)}
                </span>

                {isActive && ghostHint && (
                  <span className="text-slate-400 pointer-events-none opacity-50 italic">
                    {ghostHint}
                  </span>
                )}
              </div>

              {index < SEGMENT_ORDER.length - 1 && (
                <span className="mx-3 text-slate-200 select-none">/</span>
              )}
            </div>
          );
        })}

        <input
          autoFocus
          className="absolute inset-0 w-full h-full opacity-0 cursor-text"
          value={typedValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <button
          type="button"
          disabled={disabled}
          // onClick={addMedicineToTable}
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

      {/* Results Table */}
      <div className="rounded-4xl border border-[#F2F2F2] bg-white overflow-hidden">
        <table className="w-full">
          <thead className="text-[#7B7B7B] text-sm uppercase font-bold">
            <tr>
              <th className="p-3 text-center">#</th>
              {SEGMENT_ORDER.map((s) => (
                <th key={s} className="p-3">
                  {s}
                </th>
              ))}
              <th className="p-3">Generic</th>
              <th className="p-3">Route</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={SEGMENT_ORDER.length + 3}
                  className="p-3 text-center text-[#7B7B7B] italic"
                >
                  Enter medicine details above to populate the list.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i}>
                  <td className="p-3 text-center text-[#7B7B7B]">{i + 1}</td>
                  {SEGMENT_ORDER.map((s) => (
                    <td key={s} className="p-3">
                      {EDITABLE_FIELDS.includes(s) ? (
                        <input
                          value={row[s]}
                          onChange={(e) =>
                            updateRowField(
                              i,
                              s as keyof PrescriptionRow,
                              e.target.value
                            )
                          }
                          className="w-full bg-transparent border-b-2 border-[#7B7B7B] focus:border-indigo-400 focus:outline-none text-[#7B7B7B]"
                        />
                      ) : (
                        row[s]
                      )}
                    </td>
                  ))}
                  <td className="p-3 text-[#7B7B7B] text-sm">{row.salt}</td>
                  <td className="p-3 text-[#7B7B7B] text-sm">{row.route}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MedicalSectionDone;
