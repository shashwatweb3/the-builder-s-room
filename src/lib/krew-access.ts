import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "krew3.gated.v1";

/**
 * Shared Krew3 access code. Used by the members-only content gate and reused as
 * the signup credential for Krew ID member accounts.
 */
export const ACCESS_CODE = "K3-7VQ9-XM2";

/** True when the member has already entered the access code in this browser. */
export function hasKrewAccess(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Unlocks the members-only content gate for this browser. */
export function grantKrewAccess(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* storage unavailable */
  }
}

export function isValidAccessCode(code: string): boolean {
  return code.trim() === ACCESS_CODE;
}

function readAccess(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeAccess(value: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
}

export function useKrewAccess() {
  const [unlocked, setUnlocked] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setUnlocked(readAccess());
    setHydrated(true);
  }, []);

  const unlock = useCallback((code: string) => {
    if (code.trim() === ACCESS_CODE) {
      setUnlocked(true);
      writeAccess(true);
      setError(false);
      return true;
    }
    setError(true);
    return false;
  }, []);

  return { unlocked, hydrated, error, unlock };
}
