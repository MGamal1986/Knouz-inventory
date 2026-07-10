import axios from "axios";

// Relative baseURL: the browser only ever talks to its own origin, which
// the Vite dev server (or a reverse proxy in production) forwards to the API.
// This keeps the auth cookies same-site — see vite.config.ts.
export const api = axios.create({
  baseURL: "",
  withCredentials: true,
});

function redirectToLogin() {
  const redirect = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/login?redirect=${redirect}`;
}

let refreshPromise: Promise<unknown> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthEndpoint = original?.url?.startsWith("/api/auth/");

    if (error.response?.status === 401 && !isAuthEndpoint && !original._retry) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = api.post("/api/auth/refresh").finally(() => {
            refreshPromise = null;
          });
        }
        await refreshPromise;
        return api(original);
      } catch {
        redirectToLogin();
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401 && !isAuthEndpoint) {
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);
