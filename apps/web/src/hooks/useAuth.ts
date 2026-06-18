import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "../services/apiClient.ts";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    apiClient
      .getSession()
      .then(({ user: sessionUser }) => {
        if (cancelled) return;
        setUser(sessionUser);
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setError("");
    const { user: sessionUser } = await apiClient.login(credentials);
    setUser(sessionUser);
  }, []);

  const logout = useCallback(async () => {
    await apiClient.logout().catch(() => null);
    setUser(null);
  }, []);

  const setLoginError = useCallback((message) => {
    setError(message);
  }, []);

  return useMemo(
    () => ({ user, loading, error, login, logout, setLoginError }),
    [user, loading, error, login, logout, setLoginError],
  );
};