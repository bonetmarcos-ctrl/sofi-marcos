import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createInitialState } from "@sofi-marqui/domain";
import { apiClient } from "../services/apiClient.ts";

const STORAGE_KEY = "sofi_marqui_state_v1";

const loadLocalState = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveLocalState = (state) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Best-effort fallback for private mode or full storage.
  }
};

const resolveUpdater = (updater, currentValue) =>
  typeof updater === "function" ? updater(currentValue) : updater;

export const useAppState = () => {
  const [state, setState] = useState(() => loadLocalState() || createInitialState());
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState("loading");
  const hydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    apiClient
      .getState()
      .then((remoteState) => {
        if (cancelled) return;
        setState(remoteState);
        saveLocalState(remoteState);
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
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return undefined;

    const handle = window.setTimeout(() => {
      saveLocalState(state);
      apiClient
        .replaceState(state)
        .then(() => setStatus("api"))
        .catch(() => setStatus("local"));
    }, 300);

    return () => window.clearTimeout(handle);
  }, [state]);

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