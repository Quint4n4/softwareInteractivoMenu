import { api, clearTokens, setTokens } from "./client";

export interface Tenant {
  id: string;
  nombre: string;
  slug: string;
  modo_vitrina: string;
}

export interface Me {
  user: { id: number; username: string; email: string };
  tenant: Tenant | null;
  rol: string | null;
  is_platform_admin: boolean;
  modulos: string[];
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  nombre_negocio: string;
  slug?: string;
}

export async function login(username: string, password: string): Promise<void> {
  const { data } = await api.post("/auth/token/", { username, password });
  setTokens(data.access, data.refresh);
}

export async function register(payload: RegisterPayload): Promise<void> {
  const { data } = await api.post("/auth/register/", payload);
  setTokens(data.tokens.access, data.tokens.refresh);
}

export async function getMe(): Promise<Me> {
  const { data } = await api.get<Me>("/auth/me/");
  return data;
}

export function logout(): void {
  clearTokens();
}
