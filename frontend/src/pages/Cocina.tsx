import { useCallback, useEffect, useState } from "react";

import { listPedidos, type Pedido, setPedidoEstado } from "../api/orders";

type Col = { estado: string; label: string; cls: string; next: string | null; action: string | null };

// Tablero de COCINA (restaurante): preparar y entregar.
const COCINA_COLS: Col[] = [
  { estado: "nuevo", label: "Recibido", cls: "st-new", next: "en_proceso", action: "Comenzar" },
  { estado: "en_proceso", label: "En preparación", cls: "st-prep", next: "listo", action: "Marcar listo" },
  { estado: "listo", label: "Listo", cls: "st-ready", next: "entregado", action: "Entregar" },
  { estado: "entregado", label: "Entregado", cls: "st-done", next: null, action: null },
];

// Tablero de PEDIDOS del catálogo (tienda): empacar y entregar/recoger.
const PEDIDOS_COLS: Col[] = [
  { estado: "nuevo", label: "Recibido", cls: "st-new", next: "en_proceso", action: "Empacar" },
  { estado: "en_proceso", label: "Empacando", cls: "st-prep", next: "listo", action: "Marcar listo" },
  { estado: "listo", label: "Listo para recoger", cls: "st-ready", next: "entregado", action: "Entregar" },
  { estado: "entregado", label: "Entregado", cls: "st-done", next: null, action: null },
];

export default function Cocina({ kind = "cocina" }: { kind?: "cocina" | "pedidos" }) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    listPedidos()
      .then(setPedidos)
      .catch(() => setError("No se pudieron cargar los pedidos."));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  async function avanzar(p: Pedido, next: string) {
    await setPedidoEstado(p.id, next);
    load();
  }

  if (error) return <div className="error">{error}</div>;

  const cols = kind === "pedidos" ? PEDIDOS_COLS : COCINA_COLS;
  // Cocina muestra pedidos con algo de menú; Pedidos (catálogo) los que llevan productos.
  const visibles = pedidos.filter((p) =>
    kind === "pedidos" ? p.origen !== "menu" : p.origen !== "catalogo",
  );

  return (
    <div className="kds">
      {cols.map((col) => {
        const items = visibles.filter((p) => p.estado === col.estado);
        return (
          <div key={col.estado} className="kcol">
            <div className="kcol__h">
              <span>{col.label}</span>
              <span className={"chip " + col.cls}>{items.length}</span>
            </div>
            {items.length === 0 && <div className="mute2" style={{ fontSize: 12, padding: "6px 4px" }}>—</div>}
            {items.map((p) => (
              <div key={p.id} className="kcard">
                <div className="kcard__top">
                  <span className="kcard__num">{p.numero}</span>
                  <span className="mute2" style={{ fontSize: 11.5 }}>
                    {p.tipo === "mesa"
                      ? `Mesa ${p.mesa_texto || "—"}`
                      : kind === "pedidos" ? "Recoger en tienda" : "Para llevar"}
                  </span>
                </div>
                <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 5 }}>{p.nombre_cliente}</div>
                {p.lineas.map((l) => (
                  <div key={l.id} className="kline">{l.cantidad}× {l.nombre}</div>
                ))}
                {p.nota && <div className="kline" style={{ marginTop: 4, fontStyle: "italic" }}>“{p.nota}”</div>}
                {col.next && col.action && (
                  <button
                    className="btn btn--primary btn--sm btn--block"
                    style={{ marginTop: 10 }}
                    onClick={() => avanzar(p, col.next as string)}
                  >
                    {col.action}
                  </button>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
