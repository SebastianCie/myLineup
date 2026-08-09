import { useEffect, useMemo, useRef, useState } from "react";
import { COUNTRIES_BY_CONTINENT } from "./countries";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

/** Durchsuchbares Land-Dropdown (Freitext-Filter über alle Kontinente hinweg). */
export default function CountrySearchSelect({ value, onChange }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(value);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COUNTRIES_BY_CONTINENT.map((group) => ({
      continent: group.continent,
      countries: group.countries.filter((c) => c.toLowerCase().includes(q)),
    })).filter((group) => group.countries.length > 0);
  }, [query]);

  function selectCountry(country: string) {
    onChange(country);
    setQuery(country);
    setOpen(false);
  }

  return (
    <div className="country-select" ref={containerRef}>
      <input
        type="text"
        value={query}
        placeholder="Land suchen…"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            setQuery(value);
          }
        }}
      />
      {open && (
        <div className="country-select-dropdown">
          <button
            type="button"
            className="country-select-option country-select-clear"
            onClick={() => selectCountry("")}
          >
            – kein Land –
          </button>
          {filteredGroups.length === 0 && <p className="country-select-empty">Keine Treffer</p>}
          {filteredGroups.map((group) => (
            <div key={group.continent}>
              <div className="country-select-group-label">{group.continent}</div>
              {group.countries.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="country-select-option"
                  onClick={() => selectCountry(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
