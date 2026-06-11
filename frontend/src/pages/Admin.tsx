import { type FormEvent, useEffect, useState } from "react";

import {
  type AdminNegocio,
  type AdminPlan,
  type ModuloOverview,
  type PlatformStats,
  asignarPlan,
  crearNegocio,
  getPlatformStats,
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

function apiError(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: Record<string, unknown> } }).response?.data;
  if (data) {
    const first = Object.values(data)[0];
    if (Array.isArray(first) && first.length) return String(first[0]);
    if (typeof first === "string") return first;
  }
  return fallback;
}

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
    if (!window.confirm(`¿Resetear la contraseña del dueño de ${negocio.nombre}? Se generará una nueva.`)) return;
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

  return (
    <section className="card panelcard">
      <div className="pneg__row">
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="row" style={{ gap: 8, alignItems: "center" }}>
            <span style={{ fontWeight: 800, fontSize: 16 }}>{negocio.nombre}</span>
            <span className={"chip " + (negocio.activo ? "st-ready" : "st-new")}>
              {negocio.activo ? "Activo" : "Suspendido"}
            </span>
          </div>
          <div className="mute2" style={{ fontSize: 12.5 }}>
            {negocio.slug}.vitrina.app · {negocio.owner_email ?? "sin dueño"}
          </div>
        </div>
        <button className="btn btn--ghost btn--sm" disabled={busy} onClick={resetear} title="Resetear contraseña del dueño">
          <Icon name="user" size={15} /> Contraseña
        </button>
        <a className="btn btn--ghost btn--sm" href={`/v/${negocio.slug}`} target="_blank" rel="noreferrer">
          <Icon name="eye" size={15} /> Vitrina
        </a>
      </div>

      <div className="pneg__row" style={{ marginTop: 12 }}>
        <div>
          <label className="flabel">Plan</label>
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
        </div>
        <div className="grow" />
        <button className="btn btn--soft btn--sm" onClick={abrirModulos}>
          <Icon name="box" size={15} /> Módulos
        </button>
        <button
          className={"btn btn--sm " + (negocio.activo ? "btn--ghost" : "btn--primary")}
          disabled={busy}
          onClick={toggleEstado}
        >
          {negocio.activo ? "Suspender" : "Activar"}
        </button>
      </div>

      <div className="pneg__row" style={{ marginTop: 10, gap: 8, alignItems: "center" }}>
        <span className={"chip " + pagoCls}>{pagoLabel}</span>
        <span className="mute2" style={{ fontSize: 12 }}>Próx. cobro</span>
        <input
          type="date"
          className="field"
          style={{ width: 150, padding: "6px 10px" }}
          value={negocio.proximo_cobro ?? ""}
          disabled={busy}
          onChange={(ev) => cambiarFecha(ev.target.value || null)}
        />
        <div className="grow" />
        <button className="btn btn--soft btn--sm" disabled={busy} onClick={cobrar}>
          <Icon name="cash" size={14} /> Registrar pago
        </button>
      </div>

      {openMods && (
        <div style={{ marginTop: 6 }}>
          {mods === null && <div className="muted" style={{ fontSize: 13, padding: "8px 0" }}>Cargando módulos…</div>}
          {mods?.map((m) => (
            <div key={m.clave} className="pmodrow">
              <div className="grow" style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                  {m.nombre}
                  {Number(m.precio_addon) > 0 && (
                    <span className="mute2" style={{ fontWeight: 600 }}> · ${m.precio_addon}/mes</span>
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

/* ---------------- Panel raíz ---------------- */
export default function Admin({ me, onLogout }: { me: Me; onLogout: () => void }) {
  const [negocios, setNegocios] = useState<AdminNegocio[]>([]);
  const [planes, setPlanes] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
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
  const money = (s: string) => "$" + Number(s).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
          <div className="statgrid" style={{ marginBottom: 18 }}>
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
          </div>
        )}
        <div className="spread">
          <div>
            <div className="display" style={{ fontSize: 22 }}>Negocios</div>
            <div className="muted" style={{ fontSize: 13 }}>{negocios.length} en total · {activos} activos</div>
          </div>
          <button className="btn btn--primary" onClick={() => setShowNew(true)}>
            <Icon name="plus" size={16} /> Nuevo negocio
          </button>
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
    </div>
  );
}
