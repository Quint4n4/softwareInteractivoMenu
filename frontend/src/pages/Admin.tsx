import { type FormEvent, useEffect, useState } from "react";

import {
  type AdminNegocio,
  type AdminPlan,
  type ModuloCatalog,
  type ModuloOverview,
  type PlatformStats,
  actualizarPlan,
  asignarPlan,
  crearNegocio,
  crearPlan,
  eliminarPlan,
  getPlatformStats,
  listModulosCatalog,
  listModulosDe,
  listNegocios,
  listPlanes,
  reactivarNegocio,
  registrarPago,
  resetPassword,
  setModulo,
  setProximoCobro,
  suspenderNegocio,
} from "../api/admin";
import { type Me } from "../api/auth";
import Icon from "../ui/Icon";
import { useConfirm } from "../ui/confirm";

function apiError(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: Record<string, unknown> } }).response?.data;
  if (data) {
    const first = Object.values(data)[0];
    if (Array.isArray(first) && first.length) return String(first[0]);
    if (typeof first === "string") return first;
  }
  return fallback;
}

const money = (s: string): string =>
  "$" + Number(s).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ---------------- Tarjeta de un negocio ---------------- */
function NegocioCard({
  negocio,
  planes,
  onChange,
}: {
  negocio: AdminNegocio;
  planes: AdminPlan[];
  onChange: (n: AdminNegocio) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [openMods, setOpenMods] = useState(false);
  const [mods, setMods] = useState<ModuloOverview[] | null>(null);
  const [modBusy, setModBusy] = useState<string | null>(null);
  const [resetPw, setResetPw] = useState<string | null>(null);
  const confirm = useConfirm();

  async function toggleEstado() {
    setBusy(true);
    try {
      const updated = negocio.activo
        ? await suspenderNegocio(negocio.id)
        : await reactivarNegocio(negocio.id);
      onChange(updated);
    } finally {
      setBusy(false);
    }
  }

  async function cambiarPlan(planId: number | null) {
    setBusy(true);
    try {
      onChange(await asignarPlan(negocio.id, planId));
    } finally {
      setBusy(false);
    }
  }

  async function cobrar() {
    setBusy(true);
    try {
      onChange(await registrarPago(negocio.id));
    } finally {
      setBusy(false);
    }
  }

  async function cambiarFecha(fecha: string | null) {
    setBusy(true);
    try {
      onChange(await setProximoCobro(negocio.id, fecha));
    } finally {
      setBusy(false);
    }
  }

  async function resetear() {
    const ok = await confirm({
      title: "Resetear contraseña",
      message: `¿Resetear la contraseña del dueño de ${negocio.nombre}? Se generará una nueva.`,
      confirmLabel: "Resetear",
    });
    if (!ok) return;
    setBusy(true);
    try {
      const { password } = await resetPassword(negocio.id);
      setResetPw(password);
    } finally {
      setBusy(false);
    }
  }

  async function abrirModulos() {
    const next = !openMods;
    setOpenMods(next);
    if (next && mods === null) {
      try {
        setMods(await listModulosDe(negocio.id));
      } catch {
        setMods([]);
      }
    }
  }

  async function toggleModulo(clave: string, activo: boolean) {
    setModBusy(clave);
    try {
      setMods(await setModulo(negocio.id, clave, activo));
    } finally {
      setModBusy(null);
    }
  }

  const pagoCls = negocio.estado_pago === "al_corriente" ? "st-ready" : negocio.estado_pago === "vencido" ? "st-new" : "chip--line";
  const pagoLabel = negocio.estado_pago === "al_corriente" ? "Al corriente" : negocio.estado_pago === "vencido" ? "Vencido" : "Prueba";
  const planActual = planes.find((p) => p.id === negocio.plan);
  const plugins = negocio.modulos_activos ?? [];

  return (
    <section className="card panelcard">
      {/* Encabezado: nombre + estado + pago de un vistazo */}
      <div className="neg-head">
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="neg-badges">
            <span style={{ fontWeight: 800, fontSize: 16 }}>{negocio.nombre}</span>
            <span className={"chip " + (negocio.activo ? "st-ready" : "st-new")}>
              {negocio.activo ? "Activo" : "Suspendido"}
            </span>
            <span className={"chip " + pagoCls}>{pagoLabel}</span>
          </div>
          <div className="mute2" style={{ fontSize: 12.5, marginTop: 4 }}>
            {negocio.slug}.vitrina.app · {negocio.owner_email ?? "sin dueño"}
          </div>
        </div>
      </div>

      {/* Cuerpo: 3 secciones (Plan · Cobro · Plugins) */}
      <div className="neg-body">
        <div className="neg-col">
          <div className="neg-lbl">Plan</div>
          <select
            className="field"
            value={negocio.plan ?? ""}
            disabled={busy}
            onChange={(e) => cambiarPlan(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Sin plan</option>
            {planes.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
          {planActual && (
            <div className="mute2" style={{ fontSize: 12.5, marginTop: 7 }}>
              ${Number(planActual.precio_base).toLocaleString("es-MX")}{planActual.ciclo === "anual" ? " / año" : " · 3 meses"}
            </div>
          )}
        </div>

        <div className="neg-col">
          <div className="neg-lbl">Cobro</div>
          <input
            type="date"
            className="field"
            style={{ padding: "6px 10px" }}
            value={negocio.proximo_cobro ?? ""}
            disabled={busy}
            onChange={(ev) => cambiarFecha(ev.target.value || null)}
          />
          <button className="btn btn--soft btn--sm" style={{ marginTop: 8 }} disabled={busy} onClick={cobrar}>
            <Icon name="cash" size={14} /> Registrar pago
          </button>
        </div>

        <div className="neg-col">
          <div className="neg-lbl">Plugins activos · {plugins.length}</div>
          {plugins.length > 0 ? (
            <div className="neg-chips">
              {plugins.map((m) => (
                <span key={m.clave} className="neg-chip"><span className="neg-dot" /> {m.nombre}</span>
              ))}
            </div>
          ) : (
            <div className="mute2" style={{ fontSize: 13, padding: "2px 0" }}>Ninguno todavía</div>
          )}
          <button className="btn btn--ghost btn--sm" style={{ marginTop: 10 }} onClick={abrirModulos}>
            <Icon name="box" size={14} /> Gestionar
          </button>
        </div>
      </div>

      {/* Barra de acciones secundarias */}
      <div className="neg-foot">
        <a className="btn btn--ghost btn--sm" href={`/v/${negocio.slug}`} target="_blank" rel="noreferrer">
          <Icon name="eye" size={15} /> Ver vitrina
        </a>
        <button className="btn btn--ghost btn--sm" disabled={busy} onClick={resetear} title="Resetear contraseña del dueño">
          <Icon name="user" size={15} /> Contraseña
        </button>
        <div className="grow" />
        <button
          className={"btn btn--sm " + (negocio.activo ? "btn--ghost" : "btn--primary")}
          disabled={busy}
          onClick={toggleEstado}
        >
          {negocio.activo ? "Suspender" : "Activar"}
        </button>
      </div>

      {openMods && (
        <div style={{ marginTop: 6 }}>
          <div className="mute2" style={{ fontSize: 11.5, padding: "2px 0 8px" }}>Los del plan ya vienen activos. Aquí puedes activar <b>extras</b> adicionales (se reinician si cambias el plan).</div>
          {mods === null && <div className="muted" style={{ fontSize: 13, padding: "8px 0" }}>Cargando módulos…</div>}
          {mods?.map((m) => (
            <div key={m.clave} className="pmodrow">
              <div className="grow" style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                  {m.nombre}
                  {Number(m.precio_addon) > 0 && (
                    <span className="mute2" style={{ fontWeight: 600 }}> · ${Number(m.precio_addon).toLocaleString("es-MX")}/año</span>
                  )}
                </div>
                <div className="mute2" style={{ fontSize: 12 }}>{m.descripcion}</div>
              </div>
              <button
                className="switch"
                data-on={m.activo}
                disabled={modBusy === m.clave}
                onClick={() => toggleModulo(m.clave, !m.activo)}
                aria-label={"Activar " + m.nombre}
              ><i /></button>
            </div>
          ))}
        </div>
      )}

      {resetPw && (
        <div className="overlay" onClick={() => setResetPw(null)}>
          <div className="sheet" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <div className="sheet__head spread">
              <span className="display" style={{ fontSize: 17 }}>Nueva contraseña</span>
              <button type="button" className="iconbtn iconbtn--xs" onClick={() => setResetPw(null)} aria-label="Cerrar"><Icon name="x" size={16} /></button>
            </div>
            <div className="sheet__body col" style={{ gap: 10 }}>
              <p className="mute2" style={{ fontSize: 13 }}>Compártela con el dueño de <b>{negocio.nombre}</b>. Podrá cambiarla al entrar.</p>
              <div className="field" style={{ fontWeight: 800, fontSize: 16, textAlign: "center", letterSpacing: "0.05em" }}>{resetPw}</div>
              <button className="btn btn--primary btn--block" onClick={() => void navigator.clipboard.writeText(resetPw)}>
                <Icon name="check" size={15} /> Copiar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------------- Modal: nuevo negocio ---------------- */
function NuevoNegocioModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [nombre, setNombre] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await crearNegocio({
        nombre_negocio: nombre.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
      });
      onCreated();
    } catch (err) {
      setError(apiError(err, "No se pudo crear el negocio."));
    } finally {
      setBusy(false);
    }
  }

  const valido = nombre.trim() && username.trim() && email.trim() && password.length >= 8;

  return (
    <div className="overlay" onClick={onClose}>
      <form className="sheet" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="sheet__head spread">
          <span className="display" style={{ fontSize: 18 }}>Nuevo negocio</span>
          <button type="button" className="iconbtn iconbtn--xs" onClick={onClose} aria-label="Cerrar"><Icon name="x" size={16} /></button>
        </div>
        <div className="sheet__body col" style={{ gap: 12 }}>
          <div>
            <label className="flabel">Nombre del negocio</label>
            <input className="field" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Café del Centro" required />
          </div>
          <div>
            <label className="flabel">Usuario del dueño</label>
            <input className="field" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ej. cafecentro" required />
          </div>
          <div>
            <label className="flabel">Correo del dueño</label>
            <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dueño@correo.com" required />
          </div>
          <div>
            <label className="flabel">Contraseña inicial</label>
            <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 8 caracteres" required minLength={8} />
            <div className="fhint">El dueño podrá cambiarla después al entrar.</div>
          </div>
          {error && <div className="chip st-new">{error}</div>}
        </div>
        <div className="sheet__foot spread">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn--primary" disabled={busy || !valido}>
            {busy ? "Creando…" : "Crear negocio"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------------- Gráfica de ventas por mes (SVG) ---------------- */
function VentasChart({ data }: { data: { mes: string; total: string }[] }) {
  const vals = data.map((d) => Number(d.total));
  const max = Math.max(1, ...vals);
  const W = 520, H = 150, pad = 10;
  const n = Math.max(1, vals.length);
  const xx = (i: number) => pad + (i * (W - 2 * pad)) / Math.max(1, n - 1);
  const yy = (v: number) => H - pad - (v / max) * (H - 2 * pad);
  const line = vals.map((v, i) => `${xx(i).toFixed(1)},${yy(v).toFixed(1)}`).join(" ");
  const area = `${pad},${H - pad} ${line} ${(W - pad).toFixed(1)},${H - pad}`;
  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="vchart" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#vchart)" />
      <polyline points={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {vals.map((v, i) => <circle key={i} cx={xx(i)} cy={yy(v)} r="3" fill="var(--accent)" />)}
      {data.map((d, i) => <text key={i} x={xx(i)} y={H + 16} textAnchor="middle" fontSize="9.5" fill="var(--ink-mute)">{d.mes}</text>)}
    </svg>
  );
}

/* ---------------- Calendario de cobros ---------------- */
function CobrosCalendar({ negocios, onCobrar }: { negocios: AdminNegocio[]; onCobrar: (n: AdminNegocio) => void }) {
  const [ym, setYm] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const pd = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

  const byDate = new Map<string, AdminNegocio[]>();
  for (const n of negocios) {
    if (n.proximo_cobro) {
      const arr = byDate.get(n.proximo_cobro) ?? [];
      arr.push(n);
      byDate.set(n.proximo_cobro, arr);
    }
  }

  const first = new Date(ym.y, ym.m, 1);
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const monthLabel = first.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  const ds = (d: number) => `${ym.y}-${String(ym.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const shift = (delta: number) => setYm((s) => { const dd = new Date(s.y, s.m + delta, 1); return { y: dd.getFullYear(), m: dd.getMonth() }; });

  const due = negocios
    .filter((n) => n.proximo_cobro && (n.estado_pago === "vencido" || (pd(n.proximo_cobro).getFullYear() === ym.y && pd(n.proximo_cobro).getMonth() === ym.m)))
    .sort((a, b) => (a.proximo_cobro! < b.proximo_cobro! ? -1 : 1));

  return (
    <section className="card panelcard">
      <div className="cal-head">
        <span style={{ fontWeight: 800, fontSize: 15, textTransform: "capitalize" }}>{monthLabel}</span>
        <div className="row" style={{ gap: 6 }}>
          <button className="btn btn--ghost btn--sm" onClick={() => shift(-1)} aria-label="Mes anterior"><Icon name="back" size={14} /></button>
          <button className="btn btn--ghost btn--sm" onClick={() => shift(1)} aria-label="Mes siguiente"><Icon name="chevron" size={14} /></button>
        </div>
      </div>
      <div className="cal-grid">
        {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => <div key={i} className="cal-dow">{d}</div>)}
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="cal-day is-empty" />;
          const list = byDate.get(ds(d));
          const cellDate = new Date(ym.y, ym.m, d);
          const overdue = !!list && cellDate < today;
          const isToday = cellDate.getTime() === today.getTime();
          const cls = "cal-day" + (list ? (overdue ? " is-overdue" : " has-cobro") : "") + (isToday ? " is-today" : "");
          return (
            <div key={i} className={cls} title={list ? list.map((n) => n.nombre).join(", ") : undefined}>
              {d}{list && <span className="cal-dot" />}
            </div>
          );
        })}
      </div>
      {due.length > 0 ? (
        <div className="cob-list">
          {due.slice(0, 5).map((n) => (
            <div key={n.id} className="cob-item">
              <span className={"chip " + (n.estado_pago === "vencido" ? "st-new" : "chip--line")} style={{ fontSize: 10.5 }}>{n.proximo_cobro}</span>
              <span style={{ fontWeight: 700, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.nombre}</span>
              <button className="btn btn--soft btn--sm" onClick={() => onCobrar(n)}>Cobrar</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mute2" style={{ fontSize: 12.5, marginTop: 12 }}>Sin cobros este mes.</div>
      )}
    </section>
  );
}

/* ---------------- Modal: planes ---------------- */
function PlanesModal({ planes, onClose, onChanged }: { planes: AdminPlan[]; onClose: () => void; onChanged: () => void }) {
  const [editId, setEditId] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ciclo, setCiclo] = useState("anual");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<ModuloCatalog[]>([]);
  const [modSel, setModSel] = useState<string[]>([]);
  const confirm = useConfirm();

  useEffect(() => { listModulosCatalog().then(setCatalog).catch(() => undefined); }, []);

  function reset() { setEditId(null); setNombre(""); setPrecio(""); setDescripcion(""); setCiclo("anual"); setModSel([]); setError(null); }
  function editar(p: AdminPlan) { setEditId(p.id); setNombre(p.nombre); setPrecio(p.precio_base); setDescripcion(p.descripcion); setCiclo(p.ciclo); setModSel(p.modulos); setError(null); }
  function toggleMod(clave: string) { setModSel((s) => (s.includes(clave) ? s.filter((c) => c !== clave) : [...s, clave])); }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || precio === "") return;
    setBusy(true);
    setError(null);
    try {
      if (editId) await actualizarPlan(editId, { nombre: nombre.trim(), precio_base: precio, descripcion, ciclo, modulos: modSel });
      else await crearPlan({ nombre: nombre.trim(), precio_base: precio, descripcion, ciclo, modulos: modSel });
      reset();
      onChanged();
    } catch (err) {
      setError(apiError(err, "No se pudo guardar el plan."));
    } finally {
      setBusy(false);
    }
  }

  async function borrar(p: AdminPlan) {
    const ok = await confirm({ title: "Borrar plan", message: `¿Borrar el plan "${p.nombre}"? Los negocios que lo tengan quedarán sin plan.`, confirmLabel: "Borrar", danger: true });
    if (!ok) return;
    try {
      await eliminarPlan(p.id);
      if (editId === p.id) reset();
      onChanged();
    } catch (err) {
      setError(apiError(err, "No se pudo borrar el plan."));
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form className="sheet" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
        <div className="sheet__head spread">
          <span className="display" style={{ fontSize: 18 }}>Planes</span>
          <button type="button" className="iconbtn iconbtn--xs" onClick={onClose} aria-label="Cerrar"><Icon name="x" size={16} /></button>
        </div>
        <div className="sheet__body col" style={{ gap: 12 }}>
          {planes.length === 0 && <div className="mute2" style={{ fontSize: 13 }}>Aún no hay planes. Crea el primero abajo.</div>}
          {planes.map((p) => (
            <div key={p.id} className="venta-row">
              <div className="grow" style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800 }}>{p.nombre} · <span className="tnum">${Number(p.precio_base).toLocaleString("es-MX")}</span>{p.ciclo === "anual" ? "/año" : " · 3 meses"}</div>
                {p.descripcion && <div className="mute2" style={{ fontSize: 12 }}>{p.descripcion}</div>}
                {p.modulos.length > 0 && <div className="mute2" style={{ fontSize: 11.5, marginTop: 2 }}>Incluye: {p.modulos.map((c) => catalog.find((m) => m.clave === c)?.nombre ?? c).join(", ")}</div>}
              </div>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => editar(p)} aria-label="Editar"><Icon name="edit" size={13} /></button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => borrar(p)} aria-label="Borrar"><Icon name="trash" size={13} /></button>
            </div>
          ))}

          <div className="varbox" style={{ marginTop: 4 }}>
            <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 10 }}>{editId ? "Editar plan" : "Nuevo plan"}</div>
            <label className="flabel">Nombre</label>
            <input className="field" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Básico" required />
            <label className="flabel" style={{ marginTop: 8 }}>Tipo de cobro</label>
            <div className="row wrap" style={{ gap: 8 }}>
              <button type="button" className={"opt-tog" + (ciclo === "prueba" ? " is-on" : "")} onClick={() => setCiclo("prueba")}>Prueba · 3 meses</button>
              <button type="button" className={"opt-tog" + (ciclo === "anual" ? " is-on" : "")} onClick={() => setCiclo("anual")}>Anual</button>
            </div>
            <label className="flabel" style={{ marginTop: 8 }}>{ciclo === "anual" ? "Precio anual (MXN)" : "Precio (MXN) — la prueba suele ir en 0"}</label>
            <input className="field" type="number" min={0} step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder={ciclo === "anual" ? "Ej. 1990" : "Ej. 0"} required />
            <label className="flabel" style={{ marginTop: 8 }}>Descripción (opcional)</label>
            <input className="field" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Qué incluye el plan" />
            <label className="flabel" style={{ marginTop: 12 }}>Módulos incluidos (plugins)</label>
            <div className="row wrap" style={{ gap: 8 }}>
              {catalog.map((m) => {
                const on = modSel.includes(m.clave);
                return (
                  <button type="button" key={m.clave} className={"opt-tog" + (on ? " is-on" : "")} onClick={() => toggleMod(m.clave)}>
                    <Icon name={on ? "check" : "plus"} size={13} /> {m.nombre}
                  </button>
                );
              })}
              {catalog.length === 0 && <span className="mute2" style={{ fontSize: 12.5 }}>Cargando módulos…</span>}
            </div>
          </div>
          {error && <div className="chip st-new">{error}</div>}
        </div>
        <div className="sheet__foot spread">
          {editId ? <button type="button" className="btn btn--ghost" onClick={reset}>Cancelar edición</button> : <span />}
          <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? "Guardando…" : editId ? "Guardar cambios" : "Crear plan"}</button>
        </div>
      </form>
    </div>
  );
}

/* ---------------- Panel raíz ---------------- */
export default function Admin({ me, onLogout }: { me: Me; onLogout: () => void }) {
  const [negocios, setNegocios] = useState<AdminNegocio[]>([]);
  const [planes, setPlanes] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showPlanes, setShowPlanes] = useState(false);
  const [stats, setStats] = useState<PlatformStats | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [ns, ps, st] = await Promise.all([listNegocios(), listPlanes(), getPlatformStats().catch(() => null)]);
      setNegocios(ns);
      setPlanes(ps);
      setStats(st);
    } catch (err) {
      setError(apiError(err, "No se pudieron cargar los negocios."));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, []);

  function patchNegocio(n: AdminNegocio) {
    setNegocios((list) => list.map((x) => (x.id === n.id ? n : x)));
  }

  const activos = negocios.filter((n) => n.activo).length;

  async function onCobrar(n: AdminNegocio) {
    const updated = await registrarPago(n.id);
    patchNegocio(updated);
    getPlatformStats().then(setStats).catch(() => undefined);
  }

  return (
    <div className="padmin">
      <header className="padmin__top">
        <div className="padmin__mark">V</div>
        <div className="grow" style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Plataforma · Vitrina Digital</div>
          <div className="mute2" style={{ fontSize: 12 }}>Administración de negocios</div>
        </div>
        <span className="muted hide-sm" style={{ fontSize: 13 }}>{me.user.email}</span>
        <button className="btn btn--ghost btn--sm" onClick={onLogout}><Icon name="logout" size={16} /> Salir</button>
      </header>

      <div className="padmin__wrap">
        {stats && (
          <>
            <div className="statgrid" style={{ marginBottom: 16 }}>
              <div className="card statcard">
                <div className="statcard__ico"><Icon name="box" size={18} /></div>
                <div className="statcard__val tnum">{stats.negocios_total}</div>
                <div className="statcard__lbl">Negocios</div>
                <div className="mute2" style={{ fontSize: 11.5, marginTop: 2 }}>{stats.negocios_activos} activos · {stats.negocios_vencidos} vencidos</div>
              </div>
              <div className="card statcard">
                <div className="statcard__ico"><Icon name="cash" size={18} /></div>
                <div className="statcard__val tnum">{money(stats.mrr)}</div>
                <div className="statcard__lbl">Ingreso mensual (MRR)</div>
                <div className="mute2" style={{ fontSize: 11.5, marginTop: 2 }}>planes + add-ons activos</div>
              </div>
              <div className="card statcard">
                <div className="statcard__ico"><Icon name="receipt" size={18} /></div>
                <div className="statcard__val tnum">{money(stats.ventas_total)}</div>
                <div className="statcard__lbl">Ventas de la plataforma</div>
                <div className="mute2" style={{ fontSize: 11.5, marginTop: 2 }}>{stats.pedidos_total} pedidos</div>
              </div>
              <div className="card statcard">
                <div className="statcard__ico"><Icon name="clock" size={18} /></div>
                <div className="statcard__val tnum">{money(stats.por_cobrar_mes)}</div>
                <div className="statcard__lbl">Por cobrar este mes</div>
                <div className="mute2" style={{ fontSize: 11.5, marginTop: 2 }}>vencidos + del mes</div>
              </div>
            </div>
            <div className="padmin-grid2">
              <section className="card panelcard">
                <div className="padmin-card-h"><span className="t">Ventas de la plataforma</span><span className="mute2" style={{ fontSize: 12 }}>últimos 6 meses</span></div>
                <VentasChart data={stats.ventas_por_mes} />
              </section>
              <CobrosCalendar negocios={negocios} onCobrar={onCobrar} />
            </div>
          </>
        )}
        <div className="spread">
          <div>
            <div className="display" style={{ fontSize: 22 }}>Negocios</div>
            <div className="muted" style={{ fontSize: 13 }}>{negocios.length} en total · {activos} activos</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn--ghost" onClick={() => setShowPlanes(true)}>
              <Icon name="box" size={16} /> Planes
            </button>
            <button className="btn btn--primary" onClick={() => setShowNew(true)}>
              <Icon name="plus" size={16} /> Nuevo negocio
            </button>
          </div>
        </div>

        {loading && <div className="muted">Cargando…</div>}
        {error && <div className="chip st-new">{error}</div>}
        {!loading && !error && negocios.length === 0 && (
          <div className="muted">Aún no hay negocios. Crea el primero con “Nuevo negocio”.</div>
        )}

        {negocios.map((n) => (
          <NegocioCard key={n.id} negocio={n} planes={planes} onChange={patchNegocio} />
        ))}
      </div>

      {showNew && (
        <NuevoNegocioModal onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); void load(); }} />
      )}
      {showPlanes && (
        <PlanesModal planes={planes} onClose={() => setShowPlanes(false)} onChanged={() => void load()} />
      )}
    </div>
  );
}
