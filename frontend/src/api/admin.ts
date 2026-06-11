// Cliente del panel de PLATAFORMA (super-admin). Todo pasa por el cliente
// central `api` (axios con refresh automático). El backend es la autoridad de
// permisos: estos endpoints ya exigen IsPlatformAdmin (403 si no eres admin).
import { api } from "./client";

export interface AdminNegocio {
  id: string;
  nombre: string;
  slug: string;
  tipo_negocio: string;
  modo_vitrina: string;
  idiomas: string[];
  activo: boolean;
  plan: number | null;
  plan_nombre: string | null;
  owner_email: string | null;
  proximo_cobro: string | null;
  estado_pago: string;
  creado: string;
}

export interface AdminPlan {
  id: number;
  nombre: string;
  precio_base: string;
  descripcion: string;
}

export interface ModuloOverview {
  clave: string;
  nombre: string;
  descripcion: string;
  precio_addon: string;
  activo: boolean;
  precio_aplicado: string | null;
}

export interface PlatformStats {
  negocios_total: number;
  negocios_activos: number;
  negocios_suspendidos: number;
  negocios_vencidos: number;
  mrr: string;
  ventas_total: string;
  pedidos_total: number;
}

export interface NuevoNegocio {
  username: string;
  email: string;
  password: string;
  nombre_negocio: string;
  slug?: string;
}

type Paginated<T> = { count: number; results: T[] } | T[];
function unwrap<T>(data: Paginated<T>): T[] {
  return Array.isArray(data) ? data : data.results;
}

// ---- Negocios ----
export async function listNegocios(): Promise<AdminNegocio[]> {
  const { data } = await api.get<Paginated<AdminNegocio>>("/admin/negocios/");
  return unwrap(data);
}
export async function crearNegocio(payload: NuevoNegocio): Promise<AdminNegocio> {
  const { data } = await api.post<AdminNegocio>("/admin/negocios/", payload);
  return data;
}
export async function suspenderNegocio(id: string): Promise<AdminNegocio> {
  const { data } = await api.post<AdminNegocio>(`/admin/negocios/${id}/suspender/`);
  return data;
}
export async function reactivarNegocio(id: string): Promise<AdminNegocio> {
  const { data } = await api.post<AdminNegocio>(`/admin/negocios/${id}/reactivar/`);
  return data;
}
export async function asignarPlan(id: string, plan_id: number | null): Promise<AdminNegocio> {
  const { data } = await api.patch<AdminNegocio>(`/admin/negocios/${id}/`, { plan_id });
  return data;
}
export async function registrarPago(id: string): Promise<AdminNegocio> {
  const { data } = await api.post<AdminNegocio>(`/admin/negocios/${id}/pago/`);
  return data;
}
export async function setProximoCobro(id: string, proximo_cobro: string | null): Promise<AdminNegocio> {
  const { data } = await api.patch<AdminNegocio>(`/admin/negocios/${id}/`, { proximo_cobro });
  return data;
}
export async function resetPassword(id: string): Promise<{ password: string }> {
  const { data } = await api.post<{ password: string }>(`/admin/negocios/${id}/reset-password/`);
  return data;
}

// ---- Planes ----
export async function listPlanes(): Promise<AdminPlan[]> {
  const { data } = await api.get<AdminPlan[]>("/admin/planes/");
  return data;
}

// ---- Estadísticas de la plataforma ----
export async function getPlatformStats(): Promise<PlatformStats> {
  const { data } = await api.get<PlatformStats>("/admin/stats/");
  return data;
}

// ---- Módulos / add-ons ----
export async function listModulosDe(id: string): Promise<ModuloOverview[]> {
  const { data } = await api.get<ModuloOverview[]>(`/admin/negocios/${id}/modulos/`);
  return data;
}
export async function setModulo(
  id: string,
  clave: string,
  activo: boolean,
): Promise<ModuloOverview[]> {
  const { data } = await api.post<ModuloOverview[]>(`/admin/negocios/${id}/modulos/`, {
    clave,
    activo,
  });
  return data;
}
