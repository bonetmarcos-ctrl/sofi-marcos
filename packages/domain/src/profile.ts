export const DEFAULT_APP_NAME = "Iter";

export const normalizeAppName = (appName?: string | null) => {
  const normalized = String(appName || "").trim();
  return normalized || DEFAULT_APP_NAME;
};