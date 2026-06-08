import { api } from "./client";
import type { Pedido } from "./public";

export type { Pedido } from "./public";

export async function listPedidos(estados?: string[]): Promise<Pedido[]> {
  const q = estados && estados.length ? `?estado=${estados.join(",")}` : "";
  const { data } = await api.get<Pedido[]>(`/pedidos/${q}`);
  return data;
}

export async function setPedidoEstado(id: number, estado: string): Promise<Pedido> {
  const { data } = await api.post<Pedido>(`/pedidos/${id}/estado/`, { estado });
  return data;
}
