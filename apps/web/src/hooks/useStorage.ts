/**
 * Wrappers sobre window.storage del entorno Claude artifacts.
 * En un entorno real (Vite/Next), reemplazar con localStorage, IndexedDB o API calls.
 */

declare global {
  interface Window {
    storage?: {
      set(key: string, value: string): Promise<void>;
      get(key: string): Promise<{ value?: string } | null>;
    };
  }
}

export const persist = async (k: string, v: unknown) => {
  try {
    await window.storage?.set(k, JSON.stringify(v));
  } catch {
    // silently fail — entorno sin storage
  }
};

export const retrieve = async <T>(k: string, fallback: T): Promise<T> => {
  try {
    const r = await window.storage?.get(k);
    return r?.value ? JSON.parse(r.value) : fallback;
  } catch {
    return fallback;
  }
};

/**
 * Claves de storage centralizadas — evita typos dispersos por el código.
 * Bump la versión si el shape del dato cambia (migración automática al fallback).
 */
export const STORAGE_KEYS = {
  eventos:     "eventos_v4",
  viajes:      "viajes_v2",
  bloqueos:    "bloqueos_v1",
  proyectos:   "proyectos_v1",
  palancas:    "palancas_v1",
  deudas:      "deudas_v1",
  suministros: "suministros_v1",
};
