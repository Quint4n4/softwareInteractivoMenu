import { api } from "./client";

export interface Coleccion {
  id: number;
  tipo: "menu" | "catalogo";
  nombre: string;
  activo: boolean;
  orden: number;
}

export interface Categoria {
  id: number;
  coleccion_id: number;
  nombre: string;
  orden: number;
  activo: boolean;
  i18n: Record<string, unknown>;
}

export interface Variante {
  id: number;
  item_id: number;
  nombre: string;
  precio_extra: string;
}

export interface Item {
  id: number;
  categoria_id: number;
  nombre: string;
  descripcion: string;
  precio: string;
  moneda: string;
  imagen: string | null;
  disponible: boolean;
  destacado: boolean;
  etiqueta: string;
  es_paquete: boolean;
  incluye: string[];
  orden: number;
  sku: string;
  stock: number | null;
  i18n: Record<string, unknown>;
  variantes: Variante[];
}

type Paginated<T> = { count: number; results: T[] } | T[];
function unwrap<T>(data: Paginated<T>): T[] {
  return Array.isArray(data) ? data : data.results;
}

// ---- Colecciones ----
export async function listColecciones(): Promise<Coleccion[]> {
  const { data } = await api.get<Paginated<Coleccion>>("/colecciones/");
  return unwrap(data);
}
export async function createColeccion(payload: {
  tipo?: string;
  nombre: string;
  orden?: number;
}): Promise<Coleccion> {
  const { data } = await api.post<Coleccion>("/colecciones/", payload);
  return data;
}

// ---- Categorías ----
export async function listCategorias(): Promise<Categoria[]> {
  const { data } = await api.get<Paginated<Categoria>>("/categorias/");
  return unwrap(data);
}
export async function createCategoria(payload: {
  coleccion_id: number;
  nombre: string;
  orden?: number;
}): Promise<Categoria> {
  const { data } = await api.post<Categoria>("/categorias/", payload);
  return data;
}
export async function updateCategoria(
  id: number,
  payload: { nombre?: string; orden?: number; i18n?: Record<string, unknown> },
): Promise<Categoria> {
  const { data } = await api.patch<Categoria>(`/categorias/${id}/`, payload);
  return data;
}
export async function deleteCategoria(id: number): Promise<void> {
  await api.delete(`/categorias/${id}/`);
}

// ---- Ítems ----
export interface ItemInput {
  categoria_id: number;
  nombre: string;
  precio: string;
  descripcion?: string;
  etiqueta?: string;
  es_paquete?: boolean;
  incluye?: string[];
  orden?: number;
  sku?: string;
  stock?: number | null;
  i18n?: Record<string, unknown>;
}

export async function listItems(): Promise<Item[]> {
  const { data } = await api.get<Paginated<Item>>("/items/");
  return unwrap(data);
}
export async function createItem(payload: ItemInput): Promise<Item> {
  const { data } = await api.post<Item>("/items/", payload);
  return data;
}
export async function updateItem(id: number, payload: Partial<ItemInput>): Promise<Item> {
  const { data } = await api.patch<Item>(`/items/${id}/`, payload);
  return data;
}
export async function setDisponible(id: number, disponible: boolean): Promise<Item> {
  const { data } = await api.post<Item>(`/items/${id}/disponibilidad/`, { disponible });
  return data;
}
export async function uploadItemImagen(id: number, file: File): Promise<Item> {
  const form = new FormData();
  form.append("imagen", file);
  const { data } = await api.post<Item>(`/items/${id}/imagen/`, form);
  return data;
}
export async function deleteItem(id: number): Promise<void> {
  await api.delete(`/items/${id}/`);
}

// ---- Variantes ----
export async function createVariante(payload: {
  item_id: number;
  nombre: string;
  precio_extra: string;
}): Promise<Variante> {
  const { data } = await api.post<Variante>("/variantes/", payload);
  return data;
}
export async function deleteVariante(id: number): Promise<void> {
  await api.delete(`/variantes/${id}/`);
}
