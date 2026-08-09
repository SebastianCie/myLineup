import { useEffect, useRef, useState } from "react";

interface Option {
  id: number;
  label: string;
}

interface Props {
  label: string;
  options: Option[];
  selected: number[];
  onChange: (ids: number[]) => void;
}

export default function MultiSelect({ label, options, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function toggleOption(id: number) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  const buttonText =
    selected.length === 0
      ? `Alle ${label}`
      : selected.length === 1
        ? (options.find((o) => o.id === selected[0])?.label ?? label)
        : `${selected.length} ${label}`;

  return (
    <div className="multi-select" ref={ref}>
      <button
        type="button"
        className={`multi-select-toggle${selected.length > 0 ? " active" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        {buttonText}
      </button>
      {open && (
        <div className="multi-select-dropdown">
          {options.length === 0 && <p className="multi-select-empty">Keine Optionen</p>}
          {options.map((o) => (
            <label key={o.id} className="multi-select-option">
              <input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggleOption(o.id)} />
              {o.label}
            </label>
          ))}
          {selected.length > 0 && (
            <button type="button" className="multi-select-clear" onClick={() => onChange([])}>
              Zurücksetzen
            </button>
          )}
        </div>
      )}
    </div>
  );
}
