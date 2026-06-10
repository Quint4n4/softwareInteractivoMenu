// Ticket (recibo) compartido entre la vitrina (cliente) y el panel (admin).
// Genera el ticket en texto (para WhatsApp) y lo imprime / guarda como PDF
// usando la impresión del navegador (sin librerías ni APIs externas).
import type { Pedido } from "../api/public";

function money(n: number): string {
  return "$" + (Number.isInteger(n) ? n.toString() : n.toFixed(2));
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => {
    if (c === "&") return "&amp;";
    if (c === "<") return "&lt;";
    if (c === ">") return "&gt;";
    return "&quot;";
  });
}

function tipoLabel(order: Pedido): string {
  return order.tipo === "mesa" ? `Mesa ${order.mesa_texto || "—"}` : "Para llevar";
}

/** Ticket como texto plano (para enviarlo por WhatsApp). */
export function ticketText(order: Pedido, negocio: string): string {
  const items = order.lineas
    .map((l) => `${l.cantidad}x ${l.nombre}  ${money(Number(l.precio_unitario) * l.cantidad)}`)
    .join("\n");
  return [
    `🧾 ${negocio}`,
    `${order.numero} · ${tipoLabel(order)} · ${order.nombre_cliente}`,
    "————————————————",
    items,
    "————————————————",
    `Subtotal: ${money(Number(order.subtotal))}`,
    `Propina: ${money(Number(order.propina))}`,
    `Total: ${money(Number(order.total))}`,
    `Pago: ${order.metodo_pago_label}`,
    "",
    "¡Gracias por tu compra!",
  ].join("\n");
}

/** Enlace de WhatsApp (sin API) con el ticket pre-escrito. Antepone 52 (México) a números de 10 dígitos. */
export function waTicketUrl(order: Pedido, negocio: string, phone: string): string {
  const d = phone.replace(/\D/g, "");
  const num = d.length === 10 ? "52" + d : d;
  return `https://wa.me/${num}?text=${encodeURIComponent(ticketText(order, negocio))}`;
}

/** Abre el ticket en una ventana e invoca imprimir (el navegador permite "Guardar como PDF"). */
export function printTicket(order: Pedido, negocio: string): void {
  const rows = order.lineas
    .map((l) => `<tr><td>${l.cantidad}× ${esc(l.nombre)}</td><td class="r">${money(Number(l.precio_unitario) * l.cantidad)}</td></tr>`)
    .join("");
  const html =
    `<!doctype html><html><head><meta charset="utf-8"><title>Ticket ${esc(order.numero)}</title>` +
    `<style>*{font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif}` +
    `body{width:280px;margin:0 auto;padding:14px;color:#1f2430}` +
    `h1{font-size:18px;text-align:center;margin:0 0 2px}` +
    `.m{text-align:center;font-size:12px;color:#777;margin-bottom:10px}` +
    `table{width:100%;border-collapse:collapse;font-size:13px}td{padding:3px 0}` +
    `.r{text-align:right}.rule{border-top:1px dashed #bbb;margin:8px 0}` +
    `.t{display:flex;justify-content:space-between;font-size:13px;margin:2px 0}` +
    `.t.b{font-weight:800;font-size:15px}.thx{text-align:center;font-size:12px;color:#777;margin-top:10px}</style>` +
    `</head><body onload="window.print()">` +
    `<h1>${esc(negocio)}</h1>` +
    `<div class="m">${esc(order.numero)} · ${esc(tipoLabel(order))} · ${esc(order.nombre_cliente)}</div>` +
    `<div class="rule"></div><table>${rows}</table><div class="rule"></div>` +
    `<div class="t"><span>Subtotal</span><span>${money(Number(order.subtotal))}</span></div>` +
    `<div class="t"><span>Propina</span><span>${money(Number(order.propina))}</span></div>` +
    `<div class="t b"><span>Total</span><span>${money(Number(order.total))}</span></div>` +
    `<div class="t"><span>Pago</span><span>${esc(order.metodo_pago_label)}</span></div>` +
    `<div class="thx">¡Gracias por tu compra!</div></body></html>`;
  const w = window.open("", "_blank", "width=360,height=640");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}
