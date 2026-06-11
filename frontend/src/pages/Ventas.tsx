import { useEffect, useState } from "react";

import { listPedidos, type Pedido } from "../api/orders";
import Icon from "../ui/Icon";
import { printTicket, waTicketUrl } from "../ui/ticket";

const money = (n: number): string => "$" + n.toFixed(2);

export default function Ventas({ negocio }: { negocio: string }) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Pedido | null>(null);

  useEffect(() => {
    listPedidos()
      .then(setPedidos)
      .catch(() => setError("No se pudieron cargar las ventas."));
  }, []);

  if (error) return <div className="error">{error}</div>;

  // Ventas realizadas = pedidos no cancelados.
  const ventas = pedidos.filter((p) => p.estado !== "cancelado");
  const total = ventas.reduce((s, p) => s + Number(p.total), 0);
  const promedio = ventas.length ? total / ventas.length : 0;

  const stats: { label: string; value: string; sub: string; icon: string }[] = [
    { label: "Ventas totales", value: money(total), sub: `${ventas.length} pedidos`, icon: "cash" },
    { label: "Pedidos", value: String(ventas.length), sub: "sin cancelados", icon: "receipt" },
    { label: "Ticket promedio", value: money(promedio), sub: "por pedido", icon: "chart" },
  ];

  function enviarWhatsapp(p: Pedido) {
    if (!p.telefono) return;
    window.open(waTicketUrl(p, negocio, p.telefono), "_blank");
  }

  return (
    <div className="col" style={{ gap: 16, maxWidth: 920 }}>
      <div className="statgrid">
        {stats.map((s) => (
          <div key={s.label} className="card statcard">
            <div className="statcard__ico"><Icon name={s.icon} size={18} /></div>
            <div className="statcard__val tnum">{s.value}</div>
            <div className="statcard__lbl">{s.label}</div>
            <div className="mute2" style={{ fontSize: 11.5, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <section className="card panelcard">
        <h3 className="panelcard__h"><Icon name="receipt" size={17} /> Pedidos y tickets</h3>
        <div className="col" style={{ gap: 10 }}>
          {ventas.map((p) => (
            <div key={p.id} className="venta-row">
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="spread">
                  <span style={{ fontWeight: 800, fontSize: 14 }}>{p.numero} · {p.nombre_cliente}</span>
                  <span className="tnum" style={{ fontWeight: 800, fontSize: 15 }}>{money(Number(p.total))}</span>
                </div>
                <div className="mute2" style={{ fontSize: 12, marginTop: 2 }}>
                  {p.tipo === "mesa" ? `Mesa ${p.mesa_texto || "—"}` : "Para llevar"} · {p.metodo_pago_label} · {p.estado_label}
                  {p.telefono ? ` · ${p.telefono}` : ""}
                </div>
              </div>
              <div className="row" style={{ gap: 7 }}>
                <button className="btn btn--ghost btn--sm" onClick={() => setOpen(p)}>
                  <Icon name="eye" size={13} /> Ver
                </button>
                <button className="btn btn--ghost btn--sm" onClick={() => printTicket(p, negocio)}>
                  <Icon name="receipt" size={13} /> Imprimir
                </button>
                <button
                  className="btn btn--wa btn--sm"
                  disabled={!p.telefono}
                  onClick={() => enviarWhatsapp(p)}
                  title={p.telefono ? `Enviar a ${p.telefono}` : "Sin teléfono"}
                >
                  <Icon name="chat" size={13} /> WhatsApp
                </button>
              </div>
            </div>
          ))}
          {ventas.length === 0 && <div className="mute2" style={{ fontSize: 13 }}>Aún no hay ventas.</div>}
        </div>
      </section>

      {open && (
        <div className="ov-modal-bg" onClick={() => setOpen(null)}>
          <div className="ov-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17 }}>{open.numero} · {open.nombre_cliente}</div>
                <div className="mute2" style={{ fontSize: 12.5, marginTop: 2 }}>
                  {open.tipo === "mesa" ? `Mesa ${open.mesa_texto || "—"}` : "Para llevar"} · {open.metodo_pago_label} · {open.estado_label}
                  {open.telefono ? ` · ${open.telefono}` : ""}
                </div>
              </div>
              <button className="btn btn--ghost btn--sm" onClick={() => setOpen(null)} aria-label="Cerrar"><Icon name="x" size={15} /></button>
            </div>

            <div className="ov-rule" />
            {open.lineas.map((l) => (
              <div key={l.id} className="ov-line">
                <span>{l.cantidad}× {l.nombre}{l.notas ? <span className="mute2"> — {l.notas}</span> : null}</span>
                <span className="tnum">{money(Number(l.precio_unitario) * l.cantidad)}</span>
              </div>
            ))}
            {open.nota && <div className="mute2" style={{ fontSize: 12.5, marginTop: 8 }}>Nota: {open.nota}</div>}
            <div className="ov-rule" />

            <div className="ov-line"><span className="mute2">Subtotal</span><span className="tnum">{money(Number(open.subtotal))}</span></div>
            <div className="ov-line"><span className="mute2">Propina</span><span className="tnum">{money(Number(open.propina))}</span></div>
            <div className="ov-total"><span>Total</span><span className="tnum">{money(Number(open.total))}</span></div>

            <div className="row" style={{ gap: 8, marginTop: 16 }}>
              <button className="btn btn--ghost btn--sm grow" onClick={() => printTicket(open, negocio)}>
                <Icon name="receipt" size={14} /> Imprimir
              </button>
              <button className="btn btn--wa btn--sm grow" disabled={!open.telefono} onClick={() => enviarWhatsapp(open)}>
                <Icon name="chat" size={14} /> WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
