const TOKEN_KEY = 'my-ledger-access-token';
const TOKEN_EXPIRES_KEY = 'my-ledger-token-expires-at';

export interface AuthStatus {
  is_local: boolean;
  lan_access: boolean;
  password_configured: boolean;
  authenticated: boolean;
  token_ttl_hours: number;
}

export function getStoredToken(): string | null {
  const token = window.localStorage.getItem(TOKEN_KEY);
  const expiresAt = Number(window.localStorage.getItem(TOKEN_EXPIRES_KEY) || 0);
  if (!token || !expiresAt || expiresAt <= Math.floor(Date.now() / 1000)) {
    clearStoredToken();
    return null;
  }
  return token;
}

export function saveStoredToken(token: string, expiresAt: number) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(TOKEN_EXPIRES_KEY, String(expiresAt));
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(TOKEN_EXPIRES_KEY);
}

export function authHeaders(): HeadersInit {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });
  if (response.status === 401) {
    clearStoredToken();
  }
  return response;
}
