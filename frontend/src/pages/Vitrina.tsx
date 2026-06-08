import { type CSSProperties, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { mediaUrl } from "../api/client";
import {
  createPedido,
  getPedido,
  getPublicMenu,
  type Pedido,
  type PubCategoria,
  type PubItem,
  type PublicMenu,
} from "../api/public";
import Icon from "../ui/Icon";
import { FONTS } from "../ui/brandOptions";
import { localizeCategoria, localizeItem, type UIStrings, uiFor } from "../ui/i18n";

type Screen = "welcome" | "home" | "menu" | "cart" | "pedido";
type Cart = Record<number, number>;
interface Guest { nombre: string; tipo: string; mesa: string }

function cur(it: PubItem): string {
  return it.moneda === "MXN" ? "$" : it.moneda + " ";
}
function money(n: number, c = "$"): string {
  return c + (Number.isInteger(n) ? n.toString() : n.toFixed(2));
}

/* ---------------- Language switch ---------------- */
function LangSwitch({ lang, idiomas, onChange, right }: {
  lang: string; idiomas: string[]; onChange: (l: string) => void; right?: boolean;
}) {
  if (!idiomas || idiomas.length < 2) return null;
  return (
    <div className={"v-lang" + (right ? " v-lang--right" : "")} role="group" aria-label="Idioma">
      {idiomas.map((l) => (
        <button
          key={l}
          type="button"
          className={"v-lang__btn" + (l === lang ? " is-on" : "")}
          onClick={() => onChange(l)}
          aria-pressed={l === lang}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function QtyControl({ qty, onAdd, onDec }: { qty: number; onAdd: () => void; onDec: () => void }) {
  if (qty <= 0) {
    return (
      <button className="v-add" aria-label="+" onClick={(e) => { e.stopPropagation(); onAdd(); }}>
        <Icon name="plus" size={20} />
      </button>
    );
  }
  return (
    <div className="v-stepper" onClick={(e) => e.stopPropagation()}>
      <button onClick={onDec} aria-label="-"><Icon name="minus" size={16} /></button>
      <span className="v-count">{qty}</span>
      <button onClick={onAdd} aria-label="+"><Icon name="plus" size={16} /></button>
    </div>
  );
}

/* ---------------- Menu item card ---------------- */
function ItemCard({ it, qty, onAdd, onDec, onOpen, ui }: { it: PubItem; qty: number; onAdd: () => void; onDec: () => void; onOpen: (it: PubItem) => void; ui: UIStrings }) {
  return (
    <div className="v-card" onClick={() => onOpen(it)}>
      <div className="v-thumb">
        {it.imagen ? <img src={mediaUrl(it.imagen) ?? ""} alt={it.nombre} /> : <Icon name={it.es_paquete ? "box" : "image"} size={22} />}
      </div>
      <div className="v-item-body">
        <div className="v-row">
          <span className="v-item-name">{it.nombre}</span>
          {it.es_paquete && <span className="v-chip v-chip--pack"><Icon name="box" size={11} /> {ui.bundle}</span>}
          {it.etiqueta && (
            <span className="v-chip v-chip--tag">
              {it.etiqueta === "Favorito" ? <Icon name="star" size={11} fill="var(--v-accent)" stroke="none" /> : <Icon name="leaf" size={11} />}
              {ui.etiquetas[it.etiqueta] ?? it.etiqueta}
            </span>
          )}
        </div>
        {it.es_paquete && it.incluye.length > 0 ? (
          <>
            <div className="v-incluye-h">{ui.includes}</div>
            <div className="v-desc">{it.incluye.join(" · ")}</div>
          </>
        ) : (
          it.descripcion && <div className="v-desc">{it.descripcion}</div>
        )}
        <div className="v-price-row">
          <span className="v-price">{money(Number(it.precio), cur(it))}</span>
          <QtyControl qty={qty} onAdd={onAdd} onDec={onDec} />
        </div>
      </div>
    </div>
  );
}

/* ---------------- Item detail sheet ---------------- */
function DetailSheet({ it, qty, onAdd, onDec, onClose, ui }: { it: PubItem; qty: number; onAdd: () => void; onDec: () => void; onClose: () => void; ui: UIStrings }) {
  return (
    <div className="v-sheet-overlay" onClick={onClose}>
      <div className="v-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="v-sheet-grip" />
        <div className="v-sheet-photo">
          {it.imagen ? <img src={mediaUrl(it.imagen) ?? ""} alt={it.nombre} /> : <Icon name={it.es_paquete ? "box" : "image"} size={40} />}
        </div>
        <div className="v-sheet-top">
          <div>
            <div className="v-sheet-name">{it.nombre}</div>
            {it.es_paquete ? (
              <span className="v-chip v-chip--tag" style={{ marginTop: 6 }}><Icon name="box" size={12} /> {ui.bundle}</span>
            ) : (
              it.etiqueta && <span className="v-chip v-chip--tag" style={{ marginTop: 6 }}>{ui.etiquetas[it.etiqueta] ?? it.etiqueta}</span>
            )}
          </div>
          <span className="v-sheet-price">{money(Number(it.precio), cur(it))}</span>
        </div>
        {it.descripcion && <p className="v-sheet-desc">{it.descripcion}</p>}
        {it.es_paquete && it.incluye.length > 0 && (
          <div className="v-incluye-card">
            <div className="v-incluye-title">{ui.includes}</div>
            {it.incluye.map((p, i) => (
              <div key={i} className="v-incluye-row"><span className="v-check"><Icon name="check" size={12} stroke={3} /></span><span>{p}</span></div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {qty > 0 && <QtyControl qty={qty} onAdd={onAdd} onDec={onDec} />}
          <button className="v-btn" style={{ flex: 1 }} onClick={() => { onAdd(); onClose(); }}>
            <Icon name="plus" size={18} /> {qty > 0 ? ui.addAnother : ui.addToCart}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Welcome (intake) ---------------- */
function WelcomeScreen({ nombreNegocio, onStart, ui }: { nombreNegocio: string; onStart: (g: Guest) => void; ui: UIStrings }) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("mesa");
  const [mesa, setMesa] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    if (nombre.trim().length < 2) return;
    onStart({ nombre: nombre.trim(), tipo, mesa: mesa.trim() });
  }
  return (
    <form onSubmit={submit} style={{ padding: "26px 20px" }}>
      <div className="v-hero__script" style={{ color: "var(--v-accent)", fontSize: 30 }}>{ui.hi}</div>
      <div className="v-title" style={{ fontSize: 26 }}>{ui.welcomeTo} {nombreNegocio}</div>
      <p className="v-cta-note" style={{ textAlign: "left", margin: "8px 0 18px" }}>{ui.welcomeNote}</p>

      <label className="v-field-label">{ui.howVisit}</label>
      <div className="v-typecards" style={{ marginBottom: 16 }}>
        <button type="button" className={"v-typecard" + (tipo === "mesa" ? " is-on" : "")} onClick={() => setTipo("mesa")}>
          <span className="ico"><Icon name="pin" size={20} /></span>
          <span><span className="t">{ui.dineIn}</span><div className="s">{ui.atTable}</div></span>
        </button>
        <button type="button" className={"v-typecard" + (tipo === "llevar" ? " is-on" : "")} onClick={() => setTipo("llevar")}>
          <span className="ico"><Icon name="box" size={20} /></span>
          <span><span className="t">{ui.takeout}</span><div className="s">{ui.pickupBar}</div></span>
        </button>
      </div>

      <label className="v-field-label">{ui.yourName}</label>
      <input className="v-input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={ui.yourNamePh} style={{ marginBottom: 14 }} autoFocus />

      {tipo === "mesa" && (
        <>
          <label className="v-field-label">{ui.tableNumber}</label>
          <input className="v-input" value={mesa} onChange={(e) => setMesa(e.target.value)} placeholder={ui.tablePh} style={{ marginBottom: 14 }} />
        </>
      )}

      <button className="v-btn" type="submit" disabled={nombre.trim().length < 2} style={{ marginTop: 8 }}>
        {ui.seeMenu} <Icon name="chevron" size={17} />
      </button>
    </form>
  );
}

/* ---------------- Home ---------------- */
function HomeScreen({ data, cats, favoritos, goMenu, onOpen, ui, lang, idiomas, onLang, vista, hasTabs, onVista }: {
  data: PublicMenu; cats: PubCategoria[]; favoritos: PubItem[];
  goMenu: (catId?: number) => void; onOpen: (it: PubItem) => void;
  ui: UIStrings; lang: string; idiomas: string[]; onLang: (l: string) => void;
  vista: "menu" | "tienda"; hasTabs: boolean; onVista: (v: "menu" | "tienda") => void;
}) {
  return (
    <div>
      <div className="v-toprow">
        <span className="v-mesa"><Icon name="pin" size={14} /> {ui.menuDigital}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LangSwitch lang={lang} idiomas={idiomas} onChange={onLang} />
          <span className="v-iconbtn" aria-hidden><Icon name="bell" size={19} /></span>
        </div>
      </div>
      <div className="v-logobar">
        {data.tema.logo ? (
          <img className="v-logobar__img" src={mediaUrl(data.tema.logo) ?? ""} alt={data.negocio.nombre} />
        ) : (
          <div className="v-logobar__name">{data.negocio.nombre}</div>
        )}
      </div>
      {hasTabs && <div style={{ padding: "0 18px" }}><ViewTabs vista={vista} onVista={onVista} ui={ui} /></div>}
      <div className="v-cta">
        <button className="v-btn" onClick={() => goMenu()}>{vista === "tienda" ? ui.seeStore : ui.seeMenu} <Icon name="chevron" size={17} /></button>
        <p className="v-cta-note">{ui.tapCategory}</p>
      </div>
      <div className="v-chips">
        {cats.map((c) => <button key={c.id} className="v-pill" style={{ flex: "none" }} onClick={() => goMenu(c.id)}>{c.nombre}</button>)}
      </div>
      {favoritos.length > 0 && (
        <div className="v-fav">
          <div className="v-fav__head"><span className="v-sec-title">{ui.startHere}</span><span className="v-sec-count">{ui.favorites}</span></div>
          <div className="v-fav__row">
            {favoritos.map((it) => (
              <div key={it.id} className="v-favcard" onClick={() => onOpen(it)}>
                <div className="v-favthumb">{it.imagen ? <img src={mediaUrl(it.imagen) ?? ""} alt={it.nombre} /> : <Icon name={it.es_paquete ? "box" : "image"} size={24} />}</div>
                <div className="v-favname">{it.nombre}</div>
                <div className="v-favdesc">{it.es_paquete && it.incluye.length ? it.incluye.join(" · ") : it.descripcion}</div>
                <div className="v-favbot">
                  <span className="v-price">{money(Number(it.precio), cur(it))}</span>
                  <button className="v-add" aria-label={"+ " + it.nombre} onClick={(e) => { e.stopPropagation(); onOpen(it); }}><Icon name="plus" size={19} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Menu ---------------- */
function MenuScreen({ cats, query, setQuery, active, scrollToCat, qtyOf, onAdd, onDec, onOpen, secRefs, goHome, ui, lang, idiomas, onLang, vista, hasTabs, onVista }: {
  cats: PubCategoria[]; query: string; setQuery: (s: string) => void; active: number | null;
  scrollToCat: (id: number) => void; qtyOf: (id: number) => number; onAdd: (id: number) => void; onDec: (id: number) => void;
  onOpen: (it: PubItem) => void; secRefs: React.MutableRefObject<Record<number, HTMLElement | null>>; goHome: () => void;
  ui: UIStrings; lang: string; idiomas: string[]; onLang: (l: string) => void;
  vista: "menu" | "tienda"; hasTabs: boolean; onVista: (v: "menu" | "tienda") => void;
}) {
  const q = query.trim().toLowerCase();
  const filtered = cats
    .map((c) => ({ ...c, items: c.items.filter((it) => !q || it.nombre.toLowerCase().includes(q) || it.descripcion.toLowerCase().includes(q)) }))
    .filter((c) => c.items.length > 0);
  return (
    <div>
      <div className="v-top">
        <button className="v-iconbtn" onClick={goHome} aria-label="Inicio"><Icon name="back" size={19} /></button>
        <span className="v-title">{vista === "tienda" ? ui.store : ui.menu}</span>
        <LangSwitch lang={lang} idiomas={idiomas} onChange={onLang} right />
      </div>
      {hasTabs && <div style={{ padding: "0 18px 4px" }}><ViewTabs vista={vista} onVista={onVista} ui={ui} /></div>}
      <div className="v-search">
        <Icon name="search" size={18} color="var(--cocoa-mute)" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={vista === "tienda" ? ui.searchStore : ui.searchPlaceholder} />
      </div>
      {cats.length > 0 && (
        <div className="v-tabs">
          <div className="v-tabs__row">
            {cats.map((c) => <button key={c.id} className={"v-pill" + (active === c.id ? " is-on" : "")} onClick={() => scrollToCat(c.id)}>{c.nombre}</button>)}
          </div>
        </div>
      )}
      {filtered.length === 0 && <div className="v-placeholder" style={{ minHeight: 200 }}>{q ? `${ui.noResultsPre} “${query}”.` : ui.emptyMenu}</div>}
      {filtered.map((c) => (
        <section key={c.id} className="v-section" ref={(el) => { secRefs.current[c.id] = el; }}>
          <div className="v-sec-head"><span className="v-sec-title">{c.nombre}</span><span className="v-sec-count">{c.items.length} {ui.options}</span></div>
          <div className={vista === "tienda" ? "v-grid" : "v-items"}>
            {c.items.map((it) => (vista === "tienda"
              ? <ProductCard key={it.id} it={it} qty={qtyOf(it.id)} onAdd={() => onAdd(it.id)} onDec={() => onDec(it.id)} onOpen={onOpen} ui={ui} />
              : <ItemCard key={it.id} it={it} qty={qtyOf(it.id)} onAdd={() => onAdd(it.id)} onDec={() => onDec(it.id)} onOpen={onOpen} ui={ui} />))}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ---------------- Checkout (cart) ---------------- */
const TIPS = [{ pct: 0 }, { pct: 10 }, { pct: 15 }];

function CheckoutScreen({ lines, subtotal, guest, busy, onAdd, onDec, onRemove, goMenu, onConfirm, ui }: {
  lines: { it: PubItem; qty: number }[]; subtotal: number; guest: Guest; busy: boolean;
  onAdd: (id: number) => void; onDec: (id: number) => void; onRemove: (id: number) => void;
  goMenu: () => void; onConfirm: (f: { nota: string; propina: number; metodo: string }) => void; ui: UIStrings;
}) {
  const [nota, setNota] = useState("");
  const [tipPct, setTipPct] = useState(10);
  const [metodo, setMetodo] = useState("tarjeta");
  const propina = Math.round(subtotal * tipPct) / 100;
  const total = subtotal + propina;

  if (lines.length === 0) {
    return (
      <div className="v-placeholder">
        <div className="v-emoji">🛒</div>
        <div className="v-title">{ui.cartEmpty}</div>
        <p>{ui.cartEmptyNote}</p>
        <button className="v-btn" style={{ maxWidth: 200, marginTop: 8 }} onClick={goMenu}>{ui.seeMenu}</button>
      </div>
    );
  }

  return (
    <div>
      <div className="v-top"><span className="v-title">{ui.yourCart}</span></div>
      <div className="v-co">
        <span className="v-mesa" style={{ marginBottom: 14 }}>
          <Icon name="pin" size={14} /> {guest.tipo === "mesa" ? `${ui.table} ${guest.mesa || "—"}` : ui.takeout} · {guest.nombre}
        </span>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {lines.map(({ it, qty }) => (
            <div key={it.id} className="v-co-item">
              <div className="v-co-thumb">{it.imagen ? <img src={mediaUrl(it.imagen) ?? ""} alt={it.nombre} /> : <Icon name={it.es_paquete ? "box" : "image"} size={20} />}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <div className="v-co-name">{it.nombre}</div>
                    <div className="v-co-unit">{money(Number(it.precio), cur(it))} {ui.each}</div>
                  </div>
                  <button className="v-trash" aria-label="x" onClick={() => onRemove(it.id)}><Icon name="trash" size={18} /></button>
                </div>
                <div className="v-co-bottom">
                  <QtyControl qty={qty} onAdd={() => onAdd(it.id)} onDec={() => onDec(it.id)} />
                  <span className="v-co-line">{money(Number(it.precio) * qty, cur(it))}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="v-section-label">{ui.kitchenNotes}</div>
        <textarea className="v-textarea" value={nota} onChange={(e) => setNota(e.target.value)} placeholder={ui.notesPh} />

        <div className="v-section-label">{ui.tip}</div>
        <div className="v-seg">
          {TIPS.map((t) => (
            <button key={t.pct} className={tipPct === t.pct ? "is-on" : ""} onClick={() => setTipPct(t.pct)}>{t.pct === 0 ? ui.noTip : `${t.pct}%`}</button>
          ))}
        </div>

        <div className="v-section-label">{ui.payment}</div>
        <div className="v-pay">
          <button className={"v-pay-card" + (metodo === "tarjeta" ? " is-on" : "")} onClick={() => setMetodo("tarjeta")}>
            <span className="v-pay-ico"><Icon name="card" size={20} /></span>
            <span><span className="v-pay-t">{ui.payNow}</span><div className="v-pay-s">{ui.payNowSub}</div></span>
            <span className="v-radio">{metodo === "tarjeta" && <Icon name="check" size={13} stroke={3} />}</span>
          </button>
          <button className={"v-pay-card" + (metodo === "efectivo" ? " is-on" : "")} onClick={() => setMetodo("efectivo")}>
            <span className="v-pay-ico"><Icon name="cash" size={20} /></span>
            <span><span className="v-pay-t">{ui.payCash}</span><div className="v-pay-s">{ui.payCashSub}</div></span>
            <span className="v-radio">{metodo === "efectivo" && <Icon name="check" size={13} stroke={3} />}</span>
          </button>
          {metodo === "tarjeta" && (
            <div className="v-card-onfile">
              <span className="v-card-chip" />
              <span style={{ fontWeight: 700, letterSpacing: 2, color: "var(--cocoa-soft)" }}>•••• 4827</span>
              <span style={{ marginLeft: "auto", color: "var(--v-accent)", fontWeight: 800, fontSize: 13 }}>{ui.change}</span>
            </div>
          )}
        </div>

        <div className="v-co-summary">
          <div className="v-co-srow"><span>{ui.subtotal}</span><span>{money(subtotal)}</span></div>
          <div className="v-co-srow"><span>{ui.tip} ({tipPct}%)</span><span>{money(propina)}</span></div>
          <div className="v-co-srow"><span>{ui.tableService}</span><span>{ui.included}</span></div>
          <div className="v-co-stotal"><span>{ui.total}</span><b>{money(total)}</b></div>
        </div>

        <div className="v-co-pay">
          <button className="v-btn" disabled={busy} onClick={() => onConfirm({ nota, propina, metodo })}>
            {busy ? ui.sending : (metodo === "tarjeta" ? `${ui.payConfirm} · ${money(total)}` : `${ui.confirmOrder} · ${money(total)}`)}
          </button>
          <p className="v-co-note">{metodo === "tarjeta" ? ui.payCardNote : ui.payCashNote}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Tracking ---------------- */
const STEP_ORDER: { key: string; icon: string }[] = [
  { key: "nuevo", icon: "receipt" },
  { key: "en_proceso", icon: "spark" },
  { key: "listo", icon: "bell" },
  { key: "entregado", icon: "check" },
];

function TrackingScreen({ order, onReorder, ui }: { order: Pedido; onReorder: () => void; ui: UIStrings }) {
  const idx = STEP_ORDER.findIndex((p) => p.key === order.estado);
  const cancelado = order.estado === "cancelado";
  return (
    <div>
      <div className="v-top"><span className="v-title">{ui.tracking}</span></div>

      <div className="v-eta">
        <div>
          <div className="v-eta__label">{ui.eta}</div>
          <div className="v-eta__big">18 – 22 min</div>
          <div className="v-eta__meta">
            {order.numero} · {order.tipo === "mesa" ? `${ui.table} ${order.mesa_texto || "—"}` : ui.takeout} · {order.nombre_cliente}
          </div>
        </div>
        <div className="v-eta__clock"><Icon name="clock" size={20} /></div>
      </div>

      {cancelado ? (
        <div className="v-tl"><div className="v-track-card">{ui.canceled}</div></div>
      ) : (
        <div className="v-tl">
          {STEP_ORDER.map((p, i) => {
            const state = i < idx ? "done" : i === idx ? "now" : "";
            const step = ui.steps[p.key];
            return (
              <div key={p.key} className={"v-tl-step " + state}>
                <div className="v-tl-dot">{i < idx ? <Icon name="check" size={16} stroke={3} /> : <Icon name={p.icon} size={17} />}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span className="v-tl-title">{step.label}</span>
                    {i === idx && <span className="v-now-badge">{ui.now}</span>}
                  </div>
                  <div className="v-tl-sub">{i === idx ? step.sub : i < idx ? ui.done : ui.pending}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ padding: "4px 18px 0" }}>
        <div className="v-section-label">{ui.orderSummary}</div>
        <div className="v-track-card">
          {order.lineas.map((l) => (
            <div key={l.id} className="v-track-line"><span>{l.cantidad}× {l.nombre}</span><span>{money(Number(l.precio_unitario) * l.cantidad)}</span></div>
          ))}
          <div className="v-track-line" style={{ borderTop: "1px dashed var(--line)", marginTop: 6, paddingTop: 10 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--cocoa-soft)" }}>
              <Icon name={order.metodo_pago === "tarjeta" ? "card" : "cash"} size={16} />
              {order.metodo_pago === "tarjeta" ? ui.paidCard : ui.paidCash}
            </span>
            <b style={{ fontFamily: "var(--v-font)", fontSize: 18 }}>{money(Number(order.total))}</b>
          </div>
        </div>
        <button className="v-btn" onClick={onReorder} style={{ marginBottom: 8 }}>{ui.orderAgain}</button>
      </div>
    </div>
  );
}

/* ---------------- Tab bar ---------------- */
function TabBar({ screen, go, cartCount, ui, vista }: { screen: Screen; go: (s: Screen) => void; cartCount: number; ui: UIStrings; vista: "menu" | "tienda" }) {
  const tabs: { id: Screen; label: string; icon: string }[] = [
    { id: "home", label: ui.tabs.home, icon: "home" },
    { id: "menu", label: vista === "tienda" ? ui.store : ui.tabs.menu, icon: vista === "tienda" ? "box" : "menu" },
    { id: "cart", label: ui.tabs.cart, icon: "cart" },
    { id: "pedido", label: ui.tabs.order, icon: "receipt" },
  ];
  return (
    <nav className="v-tabbar">
      {tabs.map((t) => (
        <button key={t.id} className={"v-tab" + (screen === t.id ? " is-on" : "")} onClick={() => go(t.id)}>
          <span style={{ position: "relative" }}>
            <Icon name={t.icon} size={22} stroke={screen === t.id ? 2.2 : 1.9} />
            {t.id === "cart" && cartCount > 0 && <span className="v-tab__badge">{cartCount}</span>}
          </span>
          {t.label}
        </button>
      ))}
    </nav>
  );
}

/* ---------------- Menú / Tienda tabs ---------------- */
function ViewTabs({ vista, onVista, ui }: { vista: "menu" | "tienda"; onVista: (v: "menu" | "tienda") => void; ui: UIStrings }) {
  return (
    <div className="v-vtabs" role="tablist">
      <button className={"v-vtab" + (vista === "menu" ? " is-on" : "")} role="tab" aria-selected={vista === "menu"} onClick={() => onVista("menu")}>
        <Icon name="menu" size={16} /> {ui.tabs.menu}
      </button>
      <button className={"v-vtab" + (vista === "tienda" ? " is-on" : "")} role="tab" aria-selected={vista === "tienda"} onClick={() => onVista("tienda")}>
        <Icon name="box" size={16} /> {ui.store}
      </button>
    </div>
  );
}

/* ---------------- Product card (grid, store mode) ---------------- */
function ProductCard({ it, qty, onAdd, onDec, onOpen, ui }: { it: PubItem; qty: number; onAdd: () => void; onDec: () => void; onOpen: (it: PubItem) => void; ui: UIStrings }) {
  return (
    <div className="v-prod" onClick={() => onOpen(it)}>
      <div className="v-prod__thumb">
        {it.imagen ? <img src={mediaUrl(it.imagen) ?? ""} alt={it.nombre} /> : <Icon name="box" size={26} />}
        {it.etiqueta && <span className="v-prod__tag">{ui.etiquetas[it.etiqueta] ?? it.etiqueta}</span>}
      </div>
      <div className="v-prod__body">
        <div className="v-prod__name">{it.nombre}</div>
        {it.descripcion && <div className="v-prod__desc">{it.descripcion}</div>}
        <div className="v-prod__bot">
          <span className="v-price">{money(Number(it.precio), cur(it))}</span>
          <QtyControl qty={qty} onAdd={onAdd} onDec={onDec} />
        </div>
      </div>
    </div>
  );
}

/* ---------------- Root ---------------- */
export default function Vitrina() {
  const { slug = "" } = useParams();
  const [data, setData] = useState<PublicMenu | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("home");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<number | null>(null);
  const [openItem, setOpenItem] = useState<PubItem | null>(null);
  const [cart, setCart] = useState<Cart>({});
  const [guest, setGuest] = useState<Guest | null>(null);
  const [order, setOrder] = useState<Pedido | null>(null);
  const [sending, setSending] = useState(false);
  const [lang, setLang] = useState<string>(() => localStorage.getItem(`vd_lang_${slug}`) || "es");
  const secRefs = useRef<Record<number, HTMLElement | null>>({});

  useEffect(() => {
    getPublicMenu(slug).then(setData).catch(() => setError("No encontramos este menú."));
  }, [slug]);

  // guest + pedido guardados
  useEffect(() => {
    const g = localStorage.getItem(`vd_guest_${slug}`);
    if (g) {
      try { setGuest(JSON.parse(g) as Guest); } catch { /* ignore */ }
    } else {
      setScreen("welcome");
    }
    const num = localStorage.getItem(`vd_order_${slug}`);
    if (num) getPedido(slug, num).then(setOrder).catch(() => localStorage.removeItem(`vd_order_${slug}`));
  }, [slug]);

  // Idioma inicial: si el visitante no eligió uno, usa el idioma por defecto del negocio.
  useEffect(() => {
    if (!data) return;
    const stored = localStorage.getItem(`vd_lang_${slug}`);
    if (!stored && data.negocio.idioma_default) setLang(data.negocio.idioma_default);
  }, [data, slug]);

  // Idioma efectivo: el elegido si el negocio lo ofrece; si no, el por defecto.
  const activeLang =
    data && data.negocio.idiomas?.includes(lang)
      ? lang
      : data?.negocio.idioma_default || "es";

  // Menú ya traducido al idioma activo (los componentes pintan estos campos sin saber de i18n).
  const localizedCols = useMemo(() => {
    if (!data) return [];
    return data.colecciones.map((col) => ({
      ...col,
      categorias: col.categorias.map((c) => ({
        ...localizeCategoria(c, activeLang),
        items: c.items.map((it) => localizeItem(it, activeLang)),
      })),
    }));
  }, [data, activeLang]);

  // Separa el contenido por tipo: menú vs tienda (catálogo).
  const menuCats: PubCategoria[] = useMemo(
    () => localizedCols.filter((c) => c.tipo !== "catalogo").flatMap((c) => c.categorias).sort((a, b) => a.orden - b.orden),
    [localizedCols],
  );
  const tiendaCats: PubCategoria[] = useMemo(
    () => localizedCols.filter((c) => c.tipo === "catalogo").flatMap((c) => c.categorias).sort((a, b) => a.orden - b.orden),
    [localizedCols],
  );
  const hasMenu = menuCats.length > 0;
  const hasTienda = tiendaCats.length > 0;
  const [vista, setVista] = useState<"menu" | "tienda">("menu");
  // Si el negocio solo tiene tienda, abre directo en modo tienda.
  useEffect(() => { if (hasTienda && !hasMenu) setVista("tienda"); }, [hasTienda, hasMenu]);

  const cats = useMemo(() => (vista === "tienda" ? tiendaCats : menuCats), [vista, tiendaCats, menuCats]);
  // El índice abarca TODO (el carrito puede tener ítems de ambas vistas).
  const itemIndex = useMemo(() => {
    const m = new Map<number, PubItem>();
    [...menuCats, ...tiendaCats].forEach((c) => c.items.forEach((it) => m.set(it.id, it)));
    return m;
  }, [menuCats, tiendaCats]);
  const favoritos: PubItem[] = useMemo(() => {
    const all = cats.flatMap((c) => c.items);
    const fav = all.filter((i) => i.destacado || i.etiqueta === "Favorito");
    return (fav.length ? fav : all).slice(0, 8);
  }, [cats]);

  // Mantén una categoría activa válida en la vista actual (cubre el cambio de vista).
  useEffect(() => {
    if (cats.length && !cats.some((c) => c.id === active)) setActive(cats[0].id);
  }, [cats, active]);

  useEffect(() => {
    if (!order || order.estado === "entregado" || order.estado === "cancelado") return;
    const t = setInterval(() => { getPedido(slug, order.numero).then(setOrder).catch(() => undefined); }, 5000);
    return () => clearInterval(t);
  }, [order, slug]);

  function chooseLang(l: string) {
    localStorage.setItem(`vd_lang_${slug}`, l);
    setLang(l);
  }

  const addItem = (id: number) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const decItem = (id: number) => setCart((c) => {
    const n = (c[id] ?? 0) - 1; const next = { ...c };
    if (n <= 0) delete next[id]; else next[id] = n;
    return next;
  });
  const removeItem = (id: number) => setCart((c) => { const next = { ...c }; delete next[id]; return next; });
  const qtyOf = (id: number) => cart[id] ?? 0;

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartLines = Object.entries(cart)
    .map(([id, qty]) => ({ it: itemIndex.get(Number(id)), qty }))
    .filter((l): l is { it: PubItem; qty: number } => Boolean(l.it));
  const subtotal = cartLines.reduce((s, l) => s + Number(l.it.precio) * l.qty, 0);

  function goMenu(catId?: number) {
    setScreen("menu");
    if (catId != null) {
      setActive(catId);
      setTimeout(() => secRefs.current[catId]?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } else {
      window.scrollTo({ top: 0 });
    }
  }
  function scrollToCat(id: number) {
    setActive(id);
    secRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function startGuest(g: Guest) {
    localStorage.setItem(`vd_guest_${slug}`, JSON.stringify(g));
    setGuest(g);
    setScreen("home");
  }

  async function confirmar(f: { nota: string; propina: number; metodo: string }) {
    if (!guest) return;
    setSending(true);
    try {
      const items = cartLines.map((l) => ({ item_id: l.it.id, cantidad: l.qty }));
      const ped = await createPedido(slug, {
        nombre_cliente: guest.nombre, tipo: guest.tipo, mesa_texto: guest.mesa,
        nota: f.nota, metodo_pago: f.metodo, propina: f.propina, items,
      });
      localStorage.setItem(`vd_order_${slug}`, ped.numero);
      setOrder(ped);
      setCart({});
      setScreen("pedido");
    } finally {
      setSending(false);
    }
  }

  function nuevoPedido() {
    localStorage.removeItem(`vd_order_${slug}`);
    setOrder(null);
    goMenu();
  }

  if (error) return <div className="vitrina"><div className="v-placeholder">{error}</div></div>;
  if (!data) return <div className="vitrina"><div className="v-placeholder">Cargando menú…</div></div>;

  // Negocio suspendido por el super-admin: vitrina no disponible.
  if (!data.disponible) {
    return (
      <div className="vitrina">
        <div className="v-placeholder">
          <div className="v-emoji">🚧</div>
          <div className="v-title">{data.negocio.nombre}</div>
          <p>Este negocio no está disponible por el momento.</p>
        </div>
      </div>
    );
  }

  const ui = uiFor(activeLang);
  const idiomas = data.negocio.idiomas ?? [];
  const accent = data.tema.color_primario || "#6f4a35";
  const font = FONTS[data.tema.tipografia] ?? FONTS.Editorial;
  const rootStyle = { "--v-accent": accent, "--v-font": font } as CSSProperties;

  // Pantalla de bienvenida (intake) ocupa todo, sin tabbar.
  if (screen === "welcome") {
    return (
      <div className="vitrina" style={rootStyle}>
        <div className="v-app" style={{ paddingBottom: 0 }}>
          <WelcomeScreen nombreNegocio={data.negocio.nombre} onStart={startGuest} ui={ui} />
        </div>
      </div>
    );
  }

  return (
    <div className="vitrina" style={rootStyle}>
      <div className="v-app">
        {screen === "home" && <HomeScreen data={data} cats={cats} favoritos={favoritos} goMenu={goMenu} onOpen={setOpenItem} ui={ui} lang={activeLang} idiomas={idiomas} onLang={chooseLang} vista={vista} hasTabs={hasMenu && hasTienda} onVista={setVista} />}
        {screen === "menu" && (
          <MenuScreen
            cats={cats} query={query} setQuery={setQuery} active={active} scrollToCat={scrollToCat}
            qtyOf={qtyOf} onAdd={addItem} onDec={decItem} onOpen={setOpenItem} secRefs={secRefs}
            goHome={() => setScreen("home")} ui={ui} lang={activeLang} idiomas={idiomas} onLang={chooseLang}
            vista={vista} hasTabs={hasMenu && hasTienda} onVista={setVista}
          />
        )}
        {screen === "cart" && guest && (
          <CheckoutScreen
            lines={cartLines} subtotal={subtotal} guest={guest} busy={sending}
            onAdd={addItem} onDec={decItem} onRemove={removeItem}
            goMenu={() => goMenu()} onConfirm={confirmar} ui={ui}
          />
        )}
        {screen === "pedido" && (
          order ? (
            <TrackingScreen order={order} onReorder={nuevoPedido} ui={ui} />
          ) : (
            <div className="v-placeholder">
              <div className="v-emoji">🧾</div>
              <div className="v-title">{ui.noActiveOrders}</div>
              <p>{ui.noActiveOrdersNote}</p>
              <button className="v-btn" style={{ maxWidth: 200, marginTop: 8 }} onClick={() => goMenu()}>{ui.seeMenu}</button>
            </div>
          )
        )}

        <TabBar screen={screen} go={setScreen} cartCount={cartCount} ui={ui} vista={vista} />
      </div>

      {openItem && (
        <DetailSheet
          it={openItem} qty={qtyOf(openItem.id)}
          onAdd={() => addItem(openItem.id)} onDec={() => decItem(openItem.id)}
          onClose={() => setOpenItem(null)} ui={ui}
        />
      )}
    </div>
  );
}
