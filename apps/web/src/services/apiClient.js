const apiBaseUrl = import.meta.env.VITE_API_URL || "";

const request = async (path, options = {}) => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) return null;

  return response.json();
};

export const apiClient = {
  getSession: () => request("/api/auth/me"),
  login: (credentials) => request("/api/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  getState: () => request("/api/state"),
  replaceState: (state) => request("/api/state", { method: "PUT", body: JSON.stringify(state) }),
  health: () => request("/api/health"),
};