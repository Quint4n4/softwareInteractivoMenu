import { type FormEvent, useState } from "react";

import { useConfirm } from "../ui/confirm";

import {
  type Categoria,
  type Coleccion,
  type Item,
  type ItemInput,
  createCategoria,
  createColeccion,
  createItem,
  createVariante,
  deleteCategoria,
  deleteItem,
  deleteVariante,
  setDisponible,
  updateCategoria,
  updateItem,
  uploadItemImagen,
} from "../api/catalog";
import { mediaUrl } from "../api/client";
import Icon from "../ui/Icon";

// Este editor sirve para el MENÚ y para el CATÁLOGO: ambos comparten estructura
// (colección → categorías → ítems → variantes). El 'kind' cambia los textos y
// activa campos propios del catálogo (SKU, stock).
type Kind = "menu" | "catalogo";

interface Labels {
  item: string;
  nuevo: string;
  editar: string;
  guardar: string;
  agregar: string;
  nombrePh: string;
  nombreLabel: string;
  vacioTitulo: string;
  vacioDesc: string;
  crear: string;
  borrarItem: string;
  borrarCat: string;
  sinItems: string;
  vistaEn: string;
}

function labelsFor(kind: Kind): Labels {
  if (kind === "catalogo") {
    return {
      item: "producto",
      nuevo: "Nuevo producto",
      editar: "Editar producto",
      guardar: "Guardar producto",
      agregar: "Agregar producto",
      nombrePh: "Ej. Café en grano 250g",
      nombreLabel: "Nombre del producto",
      vacioTitulo: "Aún no tienes un catálogo",
      vacioDesc: "Créalo para empezar a agregar categorías y productos.",
      crear: "Crear mi catálogo",
      borrarItem: "¿Borrar este producto?",
      borrarCat: "¿Borrar esta categoría y sus productos?",
      sinItems: "Sin productos todavía.",
      vistaEn: "Así se ve en la tienda",
    };
  }
  return {
    item: "platillo",
    nuevo: "Nuevo platillo",
    editar: "Editar platillo",
    guardar: "Guardar platillo",
    agregar: "Agregar platillo",
    nombrePh: "Ej. Cappuccino",
    nombreLabel: "Nombre del platillo",
    vacioTitulo: "Aún no tienes un menú",
    vacioDesc: "Créalo para empezar a agregar categorías y platillos.",
    crear: "Crear mi menú",
    borrarItem: "¿Borrar este platillo?",
    borrarCat: "¿Borrar esta categoría y sus platillos?",
    sinItems: "Sin platillos todavía.",
    vistaEn: "Así se ve en el menú",
  };
}

function money(p: string): string {
  const n = Number(p);
  return "$" + (Number.isInteger(n) ? n.toString() : n.toFixed(2));
}

// Nombre en inglés guardado en el i18n de una categoría (cadena vacía si no hay).
function catEnNombre(cat: Categoria): string {
  const en = (cat.i18n as Record<string, { nombre?: string }>)?.en;
  return en?.nombre ?? "";
}

interface VarDraft {
  id?: number;
  nombre: string;
  precio_extra: string;
}

interface SheetState {
  item: Item | null;
  catId: number;
}

function ItemSheet({
  state,
  cats,
  onClose,
  onSaved,
  enActive,
  kind,
  L,
}: {
  state: SheetState;
  cats: Categoria[];
  onClose: () => void;
  onSaved: () => Promise<void>;
  enActive: boolean;
  kind: Kind;
  L: Labels;
}) {
  const it = state.item;
  const [nombre, setNombre] = useState(it?.nombre ?? "");
  const [precio, setPrecio] = useState(it?.precio ?? "");
  const [catId, setCatId] = useState<number>(it?.categoria_id ?? state.catId);
  const [descripcion, setDescripcion] = useState(it?.descripcion ?? "");
  const [destacado, setDestacado] = useState((it?.destacado || it?.etiqueta === "Favorito") ?? false);
  const [agotado, setAgotado] = useState(it ? !it.disponible : false);
  const [paquete, setPaquete] = useState(it?.es_paquete ?? false);
  const [incluye, setIncluye] = useState<string[]>(it?.incluye ?? []);
  const [sku, setSku] = useState(it?.sku ?? "");
  const [stock, setStock] = useState<string>(it?.stock != null ? String(it.stock) : "");
  const [tiempoPrep, setTiempoPrep] = useState<string>(it?.tiempo_preparacion != null ? String(it.tiempo_preparacion) : "");
  const [limiteDiario, setLimiteDiario] = useState<string>(it?.limite_diario != null ? String(it.limite_diario) : "");
  const [vars, setVars] = useState<VarDraft[]>(
    it?.variantes.map((v) => ({ id: v.id, nombre: v.nombre, precio_extra: v.precio_extra })) ?? [],
  );
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  // Traducción al inglés (si el negocio tiene el idioma activo).
  const enInit = ((it?.i18n ?? {}) as Record<string, { nombre?: string; descripcion?: string; incluye?: string[] }>).en ?? {};
  const [nombreEn, setNombreEn] = useState(enInit.nombre ?? "");
  const [descEn, setDescEn] = useState(enInit.descripcion ?? "");
  const [incluyeEn, setIncluyeEn] = useState<string[]>(enInit.incluye ?? []);
  const preview = file ? URL.createObjectURL(file) : mediaUrl(it?.imagen ?? null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload: ItemInput = {
        categoria_id: catId,
        nombre,
        precio,
        descripcion,
        es_paquete: paquete,
        incluye: paquete ? incluye.map((s) => s.trim()).filter(Boolean) : [],
        etiqueta: destacado ? "Favorito" : "",
        tiempo_preparacion: tiempoPrep.trim() === "" ? null : Number(tiempoPrep),
        limite_diario: limiteDiario.trim() === "" ? null : Number(limiteDiario),
      };
      if (kind === "catalogo") {
        payload.sku = sku.trim();
        payload.stock = stock.trim() === "" ? null : Number(stock);
      }
      if (enActive) {
        // Solo guardamos campos con texto; vacío => se respeta el español (fallback).
        const en: Record<string, unknown> = {};
        if (nombreEn.trim()) en.nombre = nombreEn.trim();
        if (descEn.trim()) en.descripcion = descEn.trim();
        if (paquete) {
          const inc = incluyeEn.map((s) => s.trim()).filter(Boolean);
          if (inc.length) en.incluye = inc;
        }
        const i18n: Record<string, unknown> = { ...(it?.i18n ?? {}) };
        if (Object.keys(en).length) i18n.en = en;
        else delete i18n.en;
        payload.i18n = i18n;
      }
      const saved = it ? await updateItem(it.id, payload) : await createItem(payload);

      if (file) {
        await uploadItemImagen(saved.id, file);
      }

      if (saved.disponible === agotado) {
        await setDisponible(saved.id, !agotado);
      }

      // Variantes: borrar las existentes y recrear desde el formulario.
      if (it) {
        for (const v of it.variantes) await deleteVariante(v.id);
      }
      for (const v of vars) {
        if (v.nombre.trim()) {
          await createVariante({ item_id: saved.id, nombre: v.nombre.trim(), precio_extra: v.precio_extra || "0" });
        }
      }

      await onSaved();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form className="sheet sheet--wide" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="sheet__head spread">
          <span className="display" style={{ fontSize: 18 }}>{it ? L.editar : L.nuevo}</span>
          <button type="button" className="iconbtn iconbtn--xs" onClick={onClose} aria-label="Cerrar"><Icon name="x" size={16} /></button>
        </div>

        <div className="sheet__cols">
        <div className="sheet__body col" style={{ gap: 14 }}>
          <div className="row" style={{ gap: 14, alignItems: "flex-start" }}>
            <label
              className="irow__thumb"
              style={{ width: 84, height: 84, borderRadius: 14, flexDirection: "column", gap: 2, cursor: "pointer", overflow: "hidden", position: "relative" }}
              title="Subir foto"
            >
              {preview ? (
                <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <>
                  <Icon name="image" size={22} />
                  <span style={{ fontSize: 9, fontWeight: 700 }}>Foto</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <div className="grow">
              <label className="flabel">{L.nombreLabel}</label>
              <input className="field" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={L.nombrePh} required />
            </div>
          </div>

          <div className="row" style={{ gap: 12, alignItems: "flex-end" }}>
            <div style={{ width: 130 }}>
              <label className="flabel">Precio</label>
              <div className="field-money">
                <span>$</span>
                <input className="field" type="number" step="0.01" min="0" value={precio} onChange={(e) => setPrecio(e.target.value)} required style={{ border: 0, padding: "12px 4px" }} />
              </div>
            </div>
            <div className="grow">
              <label className="flabel">Categoría</label>
              <select className="field" value={catId} onChange={(e) => setCatId(Number(e.target.value))}>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="flabel">Descripción</label>
            <textarea className="field" rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ingredientes, notas…" />
          </div>

          <div className="row" style={{ gap: 12, alignItems: "flex-end" }}>
            <div className="grow">
              <label className="flabel">Tiempo de preparación (min)</label>
              <input className="field" type="number" min="0" value={tiempoPrep} onChange={(e) => setTiempoPrep(e.target.value)} placeholder="Ej. 15" />
            </div>
            <div className="grow">
              <label className="flabel">Límite por día</label>
              <input className="field" type="number" min="0" value={limiteDiario} onChange={(e) => setLimiteDiario(e.target.value)} placeholder="Sin límite" />
            </div>
          </div>

          {kind === "catalogo" && (
            <div className="row" style={{ gap: 12, alignItems: "flex-end" }}>
              <div className="grow">
                <label className="flabel">SKU / código (opcional)</label>
                <input className="field" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Ej. CAFE-250" />
              </div>
              <div style={{ width: 130 }}>
                <label className="flabel">Stock (opcional)</label>
                <input className="field" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="—" />
              </div>
            </div>
          )}

          <div className="row wrap" style={{ gap: 9 }}>
            <button type="button" className={"opt-tog" + (destacado ? " is-on" : "")} onClick={() => setDestacado(!destacado)}>
              <Icon name="star" size={15} /> Destacado
            </button>
            <button type="button" className={"opt-tog" + (agotado ? " is-on is-sold" : "")} onClick={() => setAgotado(!agotado)}>
              <Icon name="alert" size={15} /> Agotado
            </button>
            <button type="button" className={"opt-tog" + (paquete ? " is-on" : "")} onClick={() => setPaquete(!paquete)}>
              <Icon name="box" size={15} /> Paquete
            </button>
          </div>

          {paquete && (
            <div className="varbox">
              <div className="spread" style={{ marginBottom: 8 }}>
                <span className="flabel" style={{ margin: 0 }}>Incluye</span>
                <button type="button" className="btn btn--soft btn--sm" onClick={() => setIncluye([...incluye, ""])}>
                  <Icon name="plus" size={14} /> Añadir
                </button>
              </div>
              {incluye.length === 0 && <div className="fhint" style={{ margin: 0 }}>Agrega lo que incluye el paquete.</div>}
              <div className="col" style={{ gap: 7 }}>
                {incluye.map((line, i) => (
                  <div key={i} className="row" style={{ gap: 7 }}>
                    <input className="field" value={line} onChange={(e) => setIncluye(incluye.map((x, j) => (j === i ? e.target.value : x)))} placeholder="Ej. Café americano" />
                    <button type="button" className="iconbtn iconbtn--xs" onClick={() => setIncluye(incluye.filter((_, j) => j !== i))}><Icon name="trash" size={15} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {enActive && (
            <div className="varbox">
              <div className="row" style={{ gap: 7, alignItems: "center", marginBottom: 10 }}>
                <Icon name="globe" size={15} />
                <span className="flabel" style={{ margin: 0 }}>Traducción al inglés (English)</span>
              </div>
              <label className="flabel">Nombre (EN)</label>
              <input className="field" value={nombreEn} onChange={(e) => setNombreEn(e.target.value)} placeholder="Name in English" />
              <label className="flabel" style={{ marginTop: 10 }}>Descripción (EN)</label>
              <textarea className="field" rows={2} value={descEn} onChange={(e) => setDescEn(e.target.value)} placeholder="Description in English" />
              {paquete && (
                <div style={{ marginTop: 10 }}>
                  <div className="spread" style={{ marginBottom: 8 }}>
                    <span className="flabel" style={{ margin: 0 }}>Incluye (EN)</span>
                    <button type="button" className="btn btn--soft btn--sm" onClick={() => setIncluyeEn([...incluyeEn, ""])}>
                      <Icon name="plus" size={14} /> Añadir
                    </button>
                  </div>
                  <div className="col" style={{ gap: 7 }}>
                    {incluyeEn.map((line, i) => (
                      <div key={i} className="row" style={{ gap: 7 }}>
                        <input className="field" value={line} onChange={(e) => setIncluyeEn(incluyeEn.map((x, j) => (j === i ? e.target.value : x)))} placeholder="e.g. Americano coffee" />
                        <button type="button" className="iconbtn iconbtn--xs" onClick={() => setIncluyeEn(incluyeEn.filter((_, j) => j !== i))}><Icon name="trash" size={15} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="fhint" style={{ marginTop: 8 }}>Si dejas un campo vacío, se muestra el texto en español.</div>
            </div>
          )}

          <div className="varbox">
            <div className="spread" style={{ marginBottom: 8 }}>
              <div>
                <span className="flabel" style={{ margin: 0 }}>Variantes / opciones</span>
                <div className="fhint" style={{ margin: "2px 0 0" }}>Útil para tamaños (250g/500g/1kg) o extras.</div>
              </div>
              <button type="button" className="btn btn--soft btn--sm" onClick={() => setVars([...vars, { nombre: "", precio_extra: "0" }])}>
                <Icon name="plus" size={14} /> Añadir
              </button>
            </div>
            <div className="col" style={{ gap: 7 }}>
              {vars.map((v, i) => (
                <div key={i} className="row" style={{ gap: 7 }}>
                  <input className="field" value={v.nombre} placeholder="Nombre (ej. 500g)" onChange={(e) => setVars(vars.map((x, j) => (j === i ? { ...x, nombre: e.target.value } : x)))} />
                  <div className="field-money" style={{ width: 110 }}>
                    <span>+$</span>
                    <input className="field" type="number" step="0.01" value={v.precio_extra} onChange={(e) => setVars(vars.map((x, j) => (j === i ? { ...x, precio_extra: e.target.value } : x)))} style={{ border: 0, padding: "10px 4px" }} />
                  </div>
                  <button type="button" className="iconbtn iconbtn--xs" onClick={() => setVars(vars.filter((_, j) => j !== i))}><Icon name="trash" size={15} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="pv">
          <div className="pv__title">Vista previa</div>

          <div className="pv__hint">{L.vistaEn}</div>
          <div className="pv-card">
            <div className="pv-thumb">
              {preview ? <img src={preview} alt="" /> : <Icon name={paquete ? "box" : "image"} size={20} />}
            </div>
            <div className="pv-card__body">
              <div className="pv-row">
                <span className="pv-name">{nombre || L.nombreLabel}</span>
                {paquete && <span className="pv-chip pv-chip--pack"><Icon name="box" size={10} /> Paquete</span>}
                {destacado && !paquete && <Icon name="star" size={12} fill="var(--accent)" stroke="none" />}
              </div>
              {paquete && incluye.filter((s) => s.trim()).length > 0 ? (
                <div className="pv-desc">{incluye.filter((s) => s.trim()).join(" · ")}</div>
              ) : (
                descripcion && <div className="pv-desc">{descripcion}</div>
              )}
              <div className="pv-price-row">
                <span className="pv-price">{money(precio || "0")}</span>
                <span className="pv-plus"><Icon name="plus" size={14} /></span>
              </div>
            </div>
          </div>

          <div className="pv__hint">Al tocar el {L.item}</div>
          <div className="pv-sheet">
            <div className="pv-sheet__grip" />
            <div className="pv-sheet__photo">
              {preview ? <img src={preview} alt="" /> : <Icon name={paquete ? "box" : "image"} size={30} />}
            </div>
            <div className="pv-sheet__top">
              <div>
                <div className="pv-sheet__name">{nombre || L.nombreLabel}</div>
                {(paquete || destacado) && (
                  <span className="pv-chip pv-chip--tag">{paquete ? "Paquete" : "Favorito"}</span>
                )}
              </div>
              <span className="pv-sheet__price">{money(precio || "0")}</span>
            </div>
            {descripcion && <p className="pv-sheet__desc">{descripcion}</p>}
            {paquete && incluye.filter((s) => s.trim()).length > 0 && (
              <div className="pv-incluye">
                <div className="pv-incluye__t">Incluye</div>
                {incluye.filter((s) => s.trim()).map((p, i) => (
                  <div key={i} className="pv-incluye__r">
                    <span className="pv-check"><Icon name="check" size={10} stroke={3} /></span>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="pv-btn"><Icon name="plus" size={14} /> Agregar al carrito</div>
          </div>

          <div className="pv__note">
            La foto se recorta igual que aquí: usa imágenes horizontales o cuadradas con el {L.item} al centro.
          </div>
        </aside>
        </div>

        <div className="sheet__foot spread">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn--primary" disabled={busy || !nombre || !precio}>
            {busy ? "Guardando…" : L.guardar}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function MenuEditor({
  coleccion,
  cats,
  items,
  reload,
  idiomas,
  kind = "menu",
}: {
  coleccion: Coleccion | null;
  cats: Categoria[];
  items: Item[];
  reload: () => Promise<void>;
  idiomas: string[];
  kind?: Kind;
}) {
  const L = labelsFor(kind);
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const enActive = idiomas.includes("en");
  // Arrastrar para reordenar ítems dentro de su categoría.
  const [drag, setDrag] = useState<{ catId: number; index: number } | null>(null);
  const [over, setOver] = useState<number | null>(null);

  async function crearColeccion() {
    await createColeccion({ tipo: kind, nombre: kind === "catalogo" ? "Catálogo" : "Menú" });
    await reload();
  }

  async function addCategoria() {
    if (!coleccion) return;
    await createCategoria({ coleccion_id: coleccion.id, nombre: "Nueva categoría", orden: cats.length });
    await reload();
  }

  async function renameCategoria(cat: Categoria, nombre: string) {
    if (nombre.trim() && nombre !== cat.nombre) {
      await updateCategoria(cat.id, { nombre: nombre.trim() });
      await reload();
    }
  }

  async function renameCategoriaEn(cat: Categoria, nombreEn: string) {
    const v = nombreEn.trim();
    if (v === catEnNombre(cat)) return;
    const i18n: Record<string, unknown> = { ...(cat.i18n ?? {}) };
    if (v) i18n.en = { nombre: v };
    else delete i18n.en;
    await updateCategoria(cat.id, { i18n });
    await reload();
  }

  async function moveCategoria(idx: number, dir: number) {
    const j = idx + dir;
    if (j < 0 || j >= cats.length) return;
    const a = cats[idx];
    const b = cats[j];
    await Promise.all([
      updateCategoria(a.id, { orden: b.orden }),
      updateCategoria(b.id, { orden: a.orden }),
    ]);
    await reload();
  }

  const confirm = useConfirm();

  async function removeCategoria(id: number) {
    if (!(await confirm({ title: "Borrar categoría", message: L.borrarCat, confirmLabel: "Borrar", danger: true }))) return;
    await deleteCategoria(id);
    await reload();
  }

  async function moveItem(catItems: Item[], idx: number, dir: number) {
    const j = idx + dir;
    if (j < 0 || j >= catItems.length) return;
    const a = catItems[idx];
    const b = catItems[j];
    await Promise.all([
      updateItem(a.id, { orden: b.orden }),
      updateItem(b.id, { orden: a.orden }),
    ]);
    await reload();
  }

  // Mueve un ítem de una posición a otra (arrastrar y soltar) y reasigna el orden.
  async function reorderItems(catItems: Item[], from: number, to: number) {
    if (from === to) return;
    const arr = [...catItems];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    const updates = arr
      .map((it, idx) => [it, idx] as const)
      .filter(([it, idx]) => it.orden !== idx)
      .map(([it, idx]) => updateItem(it.id, { orden: idx }));
    if (updates.length) {
      await Promise.all(updates);
      await reload();
    }
  }

  async function toggleAgotado(it: Item) {
    await setDisponible(it.id, !it.disponible);
    await reload();
  }

  async function removeItem(id: number) {
    if (!(await confirm({ title: "Borrar platillo", message: L.borrarItem, confirmLabel: "Borrar", danger: true }))) return;
    await deleteItem(id);
    await reload();
  }

  if (!coleccion) {
    return (
      <div className="card panelcard" style={{ maxWidth: 460, textAlign: "center" }}>
        <h3 className="display" style={{ fontSize: 20 }}>{L.vacioTitulo}</h3>
        <p className="muted" style={{ fontSize: 14 }}>{L.vacioDesc}</p>
        <button className="btn btn--primary" onClick={crearColeccion}><Icon name="plus" size={16} /> {L.crear}</button>
      </div>
    );
  }

  return (
    <div className="meditor">
      <div className="spread" style={{ marginBottom: 16 }}>
        <div className="row" style={{ gap: 9 }}>
          <button
            className="btn btn--primary"
            disabled={cats.length === 0}
            onClick={() => setSheet({ item: null, catId: cats[0]?.id ?? 0 })}
          >
            <Icon name="plus" size={16} /> {L.agregar}
          </button>
          <button className="btn btn--ghost" onClick={addCategoria}><Icon name="plus" size={16} /> Categoría</button>
        </div>
        <span className="mute2 hide-sm" style={{ fontSize: 12 }}>Arrastra o usa ↑ ↓ para reordenar</span>
      </div>

      <div className="col" style={{ gap: 14 }}>
        {cats.map((cat, ci) => {
          const catItems = items.filter((i) => i.categoria_id === cat.id).sort((a, b) => a.orden - b.orden);
          return (
            <section key={cat.id} className="catblock">
              <div className="catblock__head">
                <span className="grip"><Icon name="grip" size={18} /></span>
                <input
                  className="catname"
                  defaultValue={cat.nombre}
                  onBlur={(e) => renameCategoria(cat, e.target.value)}
                />
                <span className="chip chip--line">{catItems.length}</span>
                <span className="grow" />
                <button className="iconbtn iconbtn--xs" onClick={() => moveCategoria(ci, -1)} disabled={ci === 0}><Icon name="chevron" size={15} style={{ transform: "rotate(-90deg)" }} /></button>
                <button className="iconbtn iconbtn--xs" onClick={() => moveCategoria(ci, 1)} disabled={ci === cats.length - 1}><Icon name="chevron" size={15} style={{ transform: "rotate(90deg)" }} /></button>
                <button className="iconbtn iconbtn--xs" onClick={() => removeCategoria(cat.id)}><Icon name="trash" size={15} /></button>
              </div>

              {enActive && (
                <div className="row" style={{ gap: 7, alignItems: "center", margin: "0 0 8px", paddingLeft: 26 }}>
                  <Icon name="globe" size={14} />
                  <input
                    className="field"
                    defaultValue={catEnNombre(cat)}
                    onBlur={(e) => renameCategoriaEn(cat, e.target.value)}
                    placeholder="Nombre de la categoría en inglés"
                    style={{ maxWidth: 300, fontSize: 13, padding: "8px 12px" }}
                  />
                </div>
              )}

              {catItems.length === 0 && <div className="catblock__empty">{L.sinItems}</div>}

              <div className="col" style={{ gap: 8 }}>
                {catItems.map((it, ii) => (
                  <div
                    key={it.id}
                    className={
                      "irow" +
                      (it.disponible ? "" : " is-sold") +
                      (drag?.catId === cat.id && drag.index === ii ? " is-drag" : "") +
                      (drag?.catId === cat.id && over === ii && drag.index !== ii ? " is-over" : "")
                    }
                    draggable
                    onDragStart={(e) => {
                      setDrag({ catId: cat.id, index: ii });
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", String(it.id));
                    }}
                    onDragOver={(e) => {
                      if (drag && drag.catId === cat.id) {
                        e.preventDefault();
                        setOver(ii);
                      }
                    }}
                    onDragLeave={() => setOver((o) => (o === ii ? null : o))}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (drag && drag.catId === cat.id) void reorderItems(catItems, drag.index, ii);
                      setDrag(null);
                      setOver(null);
                    }}
                    onDragEnd={() => { setDrag(null); setOver(null); }}
                  >
                    <span className="grip"><Icon name="grip" size={16} /></span>
                    <div className="irow__thumb">
                      {it.imagen
                        ? <img src={mediaUrl(it.imagen) ?? ""} alt={it.nombre} />
                        : <Icon name={it.es_paquete ? "box" : "image"} size={18} />}
                    </div>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="row wrap" style={{ gap: 6 }}>
                        <span className="irow__name">{it.nombre}</span>
                        {it.es_paquete && <span className="chip" style={{ fontSize: 10.5 }}><Icon name="box" size={11} /> Paquete</span>}
                        {(it.destacado || it.etiqueta === "Favorito") && <Icon name="star" size={13} fill="var(--accent)" stroke="none" />}
                        {kind === "catalogo" && it.stock != null && <span className="chip chip--line" style={{ fontSize: 10.5 }}>{it.stock} en stock</span>}
                        {it.es_paquete && it.incluye.length > 0 && <span className="chip chip--line" style={{ fontSize: 10.5 }}>{it.incluye.length} incluidos</span>}
                      </div>
                      {it.descripcion && <div className="irow__desc mute2">{it.descripcion}</div>}
                    </div>
                    <span className="irow__price">{money(it.precio)}</span>
                    <div className="irow__acts">
                      <div className="mini-tog only-wide">
                        <span className="mini-tog__lbl">Agotado</span>
                        <button type="button" className="switch" data-on={!it.disponible} onClick={() => toggleAgotado(it)}><i /></button>
                      </div>
                      <button className="iconbtn iconbtn--xs" onClick={() => setSheet({ item: it, catId: cat.id })}><Icon name="edit" size={15} /></button>
                      <button className="iconbtn iconbtn--xxs" onClick={() => moveItem(catItems, ii, -1)} disabled={ii === 0}><Icon name="chevron" size={13} style={{ transform: "rotate(-90deg)" }} /></button>
                      <button className="iconbtn iconbtn--xxs" onClick={() => moveItem(catItems, ii, 1)} disabled={ii === catItems.length - 1}><Icon name="chevron" size={13} style={{ transform: "rotate(90deg)" }} /></button>
                      <button className="iconbtn iconbtn--xs" onClick={() => removeItem(it.id)}><Icon name="trash" size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>

              <button className="additem" onClick={() => setSheet({ item: null, catId: cat.id })}>
                <Icon name="plus" size={16} /> {L.agregar}
              </button>
            </section>
          );
        })}
      </div>

      {sheet && (
        <ItemSheet
          state={sheet}
          cats={cats}
          onClose={() => setSheet(null)}
          onSaved={reload}
          enActive={enActive}
          kind={kind}
          L={L}
        />
      )}
    </div>
  );
}
