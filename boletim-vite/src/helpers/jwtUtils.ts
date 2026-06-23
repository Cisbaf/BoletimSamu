import { ApiBaseUrl } from "../settings";

/**
 * Decodifica o payload de um JWT e verifica se está expirado.
 * Adiciona margem de 10 s para compensar diferenças de relógio.
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp < Date.now() / 1000 + 10;
  } catch {
    return true;
  }
}

/**
 * Chama /auth/refresh/ com o refresh token e retorna o novo access token.
 * Retorna null se o refresh falhar (token inválido, rede, etc.).
 */
export async function tryRefreshToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch(`${ApiBaseUrl}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.access ?? null;
  } catch {
    return null;
  }
}
