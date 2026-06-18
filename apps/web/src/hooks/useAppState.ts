import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createInitialState } from "@sofi-marqui/domain";
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
  const initialState = createInitialState();
  const normalized = { ...initialState, ...(state || {}) };

  Object.keys(initialState).forEach((collection) => {
    if (!Array.isArray(normalized[collection])) {
      normalized[collection] = initialState[collection];
    }
  });

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

  return useMemo(
    () => ({ state, setCollection, loaded, status }),
    [state, setCollection, loaded, status],
  );
};