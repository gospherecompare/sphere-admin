import { useCallback, useEffect, useRef } from "react";

const DRAFT_VERSION = 1;
const DRAFT_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
const DEFAULT_DEBOUNCE_MS = 300;

const readDraftValue = (draftKey) => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(draftKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.version !== DRAFT_VERSION) return null;

    const savedAt = Number(parsed.savedAt || 0);
    if (savedAt && Date.now() - savedAt > DRAFT_TTL_MS) {
      window.sessionStorage.removeItem(draftKey);
      return null;
    }

    return parsed.value ?? null;
  } catch (error) {
    return null;
  }
};

const saveDraftValue = (draftKey, value) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      draftKey,
      JSON.stringify({
        version: DRAFT_VERSION,
        savedAt: Date.now(),
        value,
      }),
    );
  } catch (error) {
    // Ignore storage quota and serialization failures.
  }
};

const useFormDraft = ({
  draftKey,
  value,
  setValue,
  enabled = true,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  onRestore,
}) => {
  const hydratedRef = useRef(false);

  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.removeItem(draftKey);
    } catch (error) {
      // Ignore storage access failures.
    }
  }, [draftKey]);

  useEffect(() => {
    if (!enabled || hydratedRef.current) return;
    hydratedRef.current = true;

    const draftValue = readDraftValue(draftKey);
    if (draftValue === null || draftValue === undefined) return;

    setValue(draftValue);
    if (typeof onRestore === "function") {
      onRestore(draftValue);
    }
  }, [draftKey, enabled, onRestore, setValue]);

  useEffect(() => {
    if (!enabled || !hydratedRef.current) return;
    const timeoutId = setTimeout(() => {
      saveDraftValue(draftKey, value);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [debounceMs, draftKey, enabled, value]);

  return { clearDraft };
};

export default useFormDraft;
