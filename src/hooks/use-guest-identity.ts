"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "beam:guest-identity";

export interface GuestIdentity {
  name: string;
  email?: string;
}

/** Caches a guest's name + optional email in localStorage so they only fill it once. */
export function useGuestIdentity() {
  const [identity, setIdentity] = useState<GuestIdentity | null>(null);
  const [prompt, setPrompt] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as GuestIdentity;
      if (parsed?.name) setIdentity(parsed);
    } catch {
      // ignore parse errors
    }
  }, []);

  const save = (next: GuestIdentity) => {
    setIdentity(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* private mode etc */
    }
  };

  const clear = () => {
    setIdentity(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  return { identity, save, clear, prompt, setPrompt };
}
