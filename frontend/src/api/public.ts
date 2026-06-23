import { api } from "./client";

export interface PubVariante {
  id: number;
  nombre: string;
  precio_extra: string;
}
// Traducciones por idioma. Ej: { en: { nombre, descripcion, incluye } }
export type I18n = Record<string, Record<string, unknown>>;

export interface PubItem {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string;
  moneda: string;
  imagen: string | null;
  destacado: boolean;
  etiqueta: string;
  es_paquete: boolean;
  incluye: string[];
  sku: string;
  tiempo_preparacion: number | null;
  agotado_hoy: boolean;
  i18n: I18n;
  variantes: PubVariante[];
}
export interface PubCategoria {
  id: number;
  nombre: string;
  orden: number;
  i18n: I18n;
  items: PubItem[];
}
export interface PubColeccion {
  id: number;
  tipo: string;
  nombre: string;
  orden: number;
  categorias: PubCategoria[];
}
export interface PublicMenu {
  negocio: {
    nombre: string;
    slug: string;
    modo_vitrina: string;
    idioma_default: string;
    idiomas: string[];
  };
  disponible: boolean;
  modulos: string[];
  tema: {
    color_primario: string;
    color_secundario: string;
    tipografia: string;
    logo: string | null;
  };
  colecciones: PubColeccion[];
}

export async function getPublicMenu(slug: string): Promise<PublicMenu> {
  const { data } = await api.get<PublicMenu>(`/public/${slug}/menu/`);
  return data;
}

// ---- Pedidos (Fase 2) ----
export interface PedidoLinea {
  id: number;
  nombre: string;
  cantidad: number;
  precio_unitario: string;
  notas: string;
}
export interface Pedido {
  id: number;
  numero: string;
  token: string;
  nombre_cliente: string;
  telefono: string;
  tipo: string;
  mesa_texto: string;
  nota: string;
  metodo_pago: string;
  metodo_pago_label: string;
  estado: string;
  estado_label: string;
  subtotal: string;
  propina: string;
  total: string;
  eta_min: number;
  creado: string;
  origen: string;
  lineas: PedidoLinea[];
}
export interface PedidoCreate {
  nombre_cliente: string;
  telefono?: string;
  tipo: string;
  mesa_texto?: string;
  nota?: string;
  metodo_pago?: string;
  propina?: number;
  items: { item_id: number; cantidad: number }[];
}

export async function createPedido(slug: string, payload: PedidoCreate): Promise<Pedido> {
  const { data } = await api.post<Pedido>(`/public/${slug}/pedidos/`, payload);
  return data;
}
export async function getPedido(slug: string, token: string): Promise<Pedido> {
  const { data } = await api.get<Pedido>(`/public/${slug}/pedidos/${token}/`);
  return data;
}
