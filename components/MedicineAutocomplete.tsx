"use client";
import { useEffect, useRef, useState } from "react";
import { medicines } from "./medicines";

type Unit = "mg" | "ml";

type Medicine = {
  id: string;
  name: string;
  dose: string;
  unit: Unit;
  frequency: string; // stored as digits "101"
  type: string;
  category: string;
  pediatric?: boolean;
  interactions?: string[];
};

const UNITS: Unit[] = ["mg", "ml"];
const uid = () => crypto.randomUUID();

const parseMedicineText = (text: string): Partial<Medicine> => {
  const lower = text.toLowerCase();
  const found = medicines.find((m) => lower.includes(m.name.toLowerCase()));
  const doseMatch = lower.match(/(\d+)\s*(mg|ml)/);
  const freqMatch = lower.match(/\d-\d-\d/);

  return {
    name: found?.name || text.split(" ")[0],
    dose: doseMatch?.[1] || "",
    unit: (doseMatch?.[2] as Unit) || "mg",
    frequency: freqMatch?.[0]?.replace(/-/g, "") || "101",
  };
};

const formatFrequency = (raw: string): string => {
  let digits = raw.replace(/[^01]/g, "").slice(0, 3).split("") as ("0" | "1")[];
  while (digits.length < 3) digits.push("0");
  if (digits.every((d) => d === "0")) digits =[digits[0], digits[1], "1"];
  return digits.join("-");
};

export default function MedicineAutocomplete() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Medicine[]>([]);
  const [selected, setSelected] = useState<Medicine[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const rowRefs = useRef<Array<HTMLInputElement | null>>([]);
  const freqRefs = useRef<Array<HTMLInputElement | null>>([]);

  /* ---------- INPUT HANDLER ---------- */
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.length >= 2) {
      const filtered = medicines.filter((m) =>
        m.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered as Medicine[]);
      setActiveIndex(0);
    } else {
      setSuggestions([]);
    }
  };

  /* ---------- SELECT MEDICINE ---------- */
  const selectMedicine = (raw: string) => {
    const parsed = parseMedicineText(raw);
    if (!parsed.name) return;

    const existingIndex = selected.findIndex(
      (m) => m.name === parsed.name && m.dose === parsed.dose
    );
    if (existingIndex >= 0) {
      setHighlightedId(selected[existingIndex].id);
      setTimeout(() => setHighlightedId(null), 1500);
      return;
    }

    const base = medicines.find(
      (m) => m.name === parsed.name && m.dose === parsed.dose
    );

    const newMed: Medicine = {
      id: uid(),
      name: parsed.name!,
      dose: parsed.dose || "",
      unit: parsed.unit || "mg",
      frequency: parsed.frequency || "101",
      type: base?.type || "",
      category: base?.category || "",
      pediatric: base?.pediatric ?? (base?.dose ? parseInt(base.dose) < 300 : undefined),
      interactions: base?.interactions || [],
    };

    setSelected((p) => [...p, newMed]);
    setQuery("");
    setSuggestions([]);
  };

  /* ---------- KEYBOARD NAVIGATION ---------- */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((p) => (p + 1) % suggestions.length);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((p) => (p === 0 ? suggestions.length - 1 : p - 1));
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (suggestions.length > 0) {
        selectMedicine(suggestions[activeIndex].name);
      } else {
        selectMedicine(query);
      }
      setTimeout(() => {
        rowRefs.current[selected.length]?.focus();
      }, 0);
    }
  };

  useEffect(() => {
    rowRefs.current[selected.length - 1]?.focus();
  }, [selected.length]);

  const hasInteraction = (med: Medicine) =>
    med.interactions?.some((i) => selected.find((s) => s.name === i));

  const removeRow = (id: string) => {
    setSelected((p) => p.filter((m) => m.id !== id));
  };

  const activeSuggestion = suggestions[activeIndex];
  const queryParts = query.split(" ");
  const ghostParts = activeSuggestion
    ? [
        activeSuggestion.name?.slice(queryParts[0]?.length ?? 0) ?? "",
        activeSuggestion.dose?.slice(queryParts[1]?.length ?? 0) ?? "",
        activeSuggestion.frequency?.slice(queryParts[2]?.length ?? 0) ?? "",
      ]
    : [];

  return (
    <div className="w-[700px]" role="application" aria-label="Medicine entry">
      <div className="relative">
        <textarea
          rows={3}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Paracetamol 500mg 1-0-1"
          className="w-full border px-3 py-2 rounded"
          aria-label="Medicine input"
        />
        {ghostParts.some(Boolean) && (
          <div className="absolute inset-0 px-3 py-2 text-gray-400 pointer-events-none whitespace-pre-wrap">
            {ghostParts.map((ghost, i) => (
              <span key={i}>{ghost} </span>
            ))}
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <ul role="listbox" className="border mt-1 rounded bg-white">
          {suggestions.map((m, i) => (
            <li
              key={`${m.name}-${m.dose}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={`px-3 py-2 cursor-pointer ${
                i === activeIndex ? "bg-blue-100" : ""
              }`}
              onClick={() => selectMedicine(m.name)}
            >
              {m.name} ({m.dose})
            </li>
          ))}
        </ul>
      )}

      {selected.length > 0 && (
        <table className="mt-4 w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th>Name + Dose</th>
              <th>Unit</th>
              <th>Frequency</th>
              <th>Type</th>
              <th>Category</th>
              <th>Remove</th>
            </tr>
          </thead>

          <tbody>
            {selected.map((med, index) => (
              <tr
                key={med.id}
                className={`border-t transition ${
                  highlightedId === med.id
                    ? "bg-yellow-200"
                    : hasInteraction(med)
                    ? "bg-red-100"
                    : ""
                }`}
              >
                <td className="p-2 flex gap-2 items-center">
                  <input
                    ref={(el: HTMLInputElement) => {
                      rowRefs.current[index] = el;
                    }}
                    value={med.name}
                    readOnly
                    className="border px-2 py-1 w-1/3"
                  />
                  <input
                    value={med.dose}
                    placeholder="500"
                    onChange={(e) => {
                      const updated = [...selected];
                      updated[index].dose = e.target.value.replace(/\D/g, "");
                      setSelected(updated);
                    }}
                    className={`border px-2 py-1 w-20 ${
                      !med.dose
                        ? "border-red-500 bg-red-50"
                        : med.pediatric
                        ? "border-yellow-400 bg-yellow-50"
                        : ""
                    }`}
                  />
                  {med.dose && (
                    <span className="text-xs bg-blue-100 px-2 rounded inline-block">
                      &lt;{med.dose}{med.unit}&gt;
                    </span>
                  )}
                </td>

                <td className="p-2">
                  <select
                    value={med.unit}
                    onChange={(e) => {
                      const updated = [...selected];
                      updated[index].unit = e.target.value as Unit;
                      setSelected(updated);
                    }}
                    className="border px-1 py-1"
                  >
                    {UNITS.map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                </td>

                <td className="p-2">
                  <input
                    ref={(el: HTMLInputElement) => {freqRefs.current[index] = el}}
                    value={med.frequency}
                    placeholder="1-0-1"
                    maxLength={3}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^01]/g, "").slice(0, 3);
                      const updated = [...selected];
                      updated[index].frequency = val;
                      setSelected(updated);

                      // auto-advance cursor after typing each digit
                      if (val.length === 3) {
                        freqRefs.current[index + 1]?.focus();
                      }
                    }}
                    onBlur={() => {
                      const updated = [...selected];
                      updated[index].frequency = formatFrequency(updated[index].frequency);
                      setSelected(updated);
                    }}
                    className="border px-2 py-1 w-20"
                  />
                </td>

                <td className="p-2">{med.type}</td>
                <td className="p-2">{med.category}</td>

                <td className="p-2">
                  <button
                    className="text-red-600 px-2 py-1 border rounded"
                    onClick={() => removeRow(med.id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
