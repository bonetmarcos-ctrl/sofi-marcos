import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createEmptyState, normalizeBudgetBase } from "@sofi-marqui/domain";
import { apiClient } from "../services/apiClient.ts";

const STORAGE_KEY = "sofi_marqui_state_v1";

const getStorageKey = (ownerId = "default") => `${STORAGE_KEY}_${ownerId}`;

const loadLocalState = (ownerId) => {
  try {
    const raw = window.localStorage.getItem(getStorageKey(ownerId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveLocalState = (state, ownerId) => {
  try {
    window.localStorage.setItem(getStorageKey(ownerId), JSON.stringify(state));
  } catch {
    // Best-effort fallback for private mode or full storage.
  }
};

const resolveUpdater = (updater, currentValue) =>
  typeof updater === "function" ? updater(currentValue) : updater;

const normalizeState = (state) => {
  const initialState = createEmptyState();
  const normalized = { ...initialState, ...(state || {}) };

  Object.entries(initialState).forEach(([collection, value]) => {
    if (Array.isArray(value) && !Array.isArray(normalized[collection])) {
      normalized[collection] = value;
    }
  });

  normalized.base = normalizeBudgetBase(normalized.base);

  return normalized;
};

export const useAppState = (ownerId = "default") => {
  const [state, setState] = useState(() => normalizeState(loadLocalState(ownerId)));
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState("loading");
  const hydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    apiClient
      .getState()
      .then((remoteState) => {
        if (cancelled) return;
        const normalizedState = normalizeState(remoteState);
        setState(normalizedState);
        saveLocalState(normalizedState, ownerId);
        setStatus("api");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("local");
      })
      .finally(() => {
        if (cancelled) return;
        hydratedRef.current = true;
        setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  useEffect(() => {
    if (!hydratedRef.current) return undefined;

    const handle = window.setTimeout(() => {
      saveLocalState(state, ownerId);
      apiClient
        .replaceState(state)
        .then(() => setStatus("api"))
        .catch(() => setStatus("local"));
    }, 300);

    return () => window.clearTimeout(handle);
  }, [state, ownerId]);

  const setCollection = useCallback((collection, updater) => {
    setState((currentState) => ({
      ...currentState,
      [collection]: resolveUpdater(updater, currentState[collection] || []),
    }));
  }, []);

  const setBase = useCallback((updater) => {
    setState((currentState) => ({
      ...currentState,
      base: normalizeBudgetBase(resolveUpdater(updater, currentState.base)),
    }));
  }, []);

  return useMemo(
    () => ({ state, setCollection, setBase, loaded, status }),
    [state, setCollection, setBase, loaded, status],
  );
};