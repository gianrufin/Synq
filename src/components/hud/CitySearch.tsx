"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { searchCities, type City } from "@/lib/cities";

interface CitySearchProps {
  /** Fired with the chosen city's coordinates — App reframes onto it. */
  onSelect: (city: City) => void;
}

/**
 * A glass search box for jumping to a city by name. Results appear in a
 * dropdown; Enter picks the highlighted one, arrows move, Escape clears.
 * Selecting a city hands its coordinates up to {@link App}, which flies the
 * camera there and opens its clock — the same path as tapping the globe.
 */
export default function CitySearch({ onSelect }: CitySearchProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const results = useMemo(() => searchCities(query), [query]);

  // Keep the highlight in range as results change.
  useEffect(() => setActive(0), [query]);

  // Close the dropdown on an outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const choose = (city: City) => {
    onSelect(city);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setQuery("");
      setOpen(false);
      return;
    }
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[active] ?? results[0]);
    }
  };

  const showList = open && results.length > 0;

  return (
    <div ref={rootRef} className="relative w-[min(80vw,17rem)]">
      <div className="glass flex items-center gap-2 rounded-2xl px-3.5 py-2.5">
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="none"
          className="shrink-0 text-ink-500"
          aria-hidden
        >
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M11 11l3.5 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search a city…"
          aria-label="Search for a city"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          className="w-full bg-transparent text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
        />
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="glass absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-2xl py-1.5"
        >
          {results.map((city, i) => (
            <li key={city.timeZone} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(city)}
                className={`flex w-full items-baseline justify-between gap-2 px-4 py-2 text-left transition-colors ${
                  i === active ? "bg-cyan-glow/12" : "hover:bg-cyan-glow/8"
                }`}
              >
                <span className="truncate text-sm text-ink-100">{city.name}</span>
                <span className="shrink-0 text-[11px] text-ink-500">
                  {city.region}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
