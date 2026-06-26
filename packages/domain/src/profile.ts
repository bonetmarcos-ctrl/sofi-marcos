export const DEFAULT_APP_NAME = "Sofi & Marqui";

export const normalizeAppName = (appName?: string | null) => {
  const normalized = String(appName || "").trim();
  return normalized || DEFAULT_APP_NAME;
};