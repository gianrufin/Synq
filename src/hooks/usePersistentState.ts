"use client";

import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

/**
 * `useState` backed by `localStorage`. Starts from `initial` on the server and
 * the first client render (so hydration stays clean), then hydrates from
 * storage after mount and persists on every change. `hydrated` flips true once
 * the stored value has been read, letting callers avoid writing defaults over
 * real data or acting before restore.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {
      /* corrupt or unavailable storage — keep the default */
    }
    setHydrated(true);
    // Only read once, on mount, for this key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or unavailable — non-fatal */
    }
  }, [key, value, hydrated]);

  return [value, setValue, hydrated];
}
