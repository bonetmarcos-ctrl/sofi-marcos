const apiBaseUrl = import.meta.env.VITE_API_URL || "";

const request = async (path, options = {}) => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `HTTP ${response.status}`);
  }

  return response.json();
};

export const apiClient = {
  getState: () => request("/api/state"),
  replaceState: (state) => request("/api/state", { method: "PUT", body: JSON.stringify(state) }),
  health: () => request("/api/health"),
};