import { type CSSProperties, useEffect, useState } from "react";

import { type Me } from "../api/auth";
import { getBranding } from "../api/branding";
import { mediaUrl } from "../api/client";
import {
  type Categoria,
  type Coleccion,
  type Item,
  listCategorias,
  listColecciones,
  listItems,
} from "../api/catalog";
import Icon from "../ui/Icon";
import PhonePreview from "../ui/PhonePreview";
import { PALETTES } from "../ui/brandOptions";
import Branding from "./Branding";
import Cocina from "./Cocina";
import MenuEditor from "./MenuEditor";
import Metrics from "./Metrics";
import Ventas from "./Ventas";
import Mesas from "./Mesas";
import QRView from "./QRView";

export interface Brand {
  nombre: string;
  modo: string;
  accentHex: string;
  fontLabel: string;
  logoUrl: string | null;
  idiomas: string[];
  num_mesas: number;
}

type Section = "menu" | "catalogo" | "brand" | "qr" | "cocina" | "pedidos" | "ventas" | "metrics";

export default function Panel({ me, onLogout }: { me: Me; onLogout: () => void }) {
  const [section, setSection] = useState<Section>("menu");
  const [navOpen, setNavOpen] = useState(false);
  const [wide, setWide] = useState(window.innerWidth >= 1180);

  const [brand, setBrand] = useState<Brand>({
    nombre: me.tenant?.nombre ?? "Mi negocio",
    modo: me.tenant?.modo_vitrina ?? "menu",
    accentHex: PALETTES["Tomate"],
    fontLabel: "Editorial",
    logoUrl: null,
    idiomas: [],
    num_mesas: 0,
  });

  const [menuCol, setMenuCol] = useState<Coleccion | null>(null);
  const [catalogCol, setCatalogCol] = useState<Coleccion | null>(null);
  const [allCats, setAllCats] = useState<Categoria[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [pvVersion, setPvVersion] = useState(0);

  useEffect(() => {
    const onR = () => setWide(window.innerWidth >= 1180);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  async function reload() {
    const cols = await listColecciones();
    setMenuCol(cols.find((c) => c.tipo === "menu") ?? null);
    setCatalogCol(cols.find((c) => c.tipo === "catalogo") ?? null);
    const [cs, its] = await Promise.all([listCategorias(), listItems()]);
    setAllCats(cs);
    setItems(its);
    setPvVersion((v) => v + 1);
  }

  useEffect(() => {
    void reload();
    getBranding()
      .then((b) =>
        setBrand({
          nombre: b.negocio.nombre,
          modo: b.negocio.modo_vitrina,
          accentHex: b.tema.color_primario || PALETTES["Tomate"],
          fontLabel: b.tema.tipografia || "Editorial",
          logoUrl: b.tema.logo,
          idiomas: b.negocio.idiomas ?? [],
          num_mesas: b.negocio.num_mesas ?? 0,
        }),
      )
      .catch(() => undefined);
  }, []);

  const accent = brand.accentHex;
  const cssVars = { "--accent": accent, "--accent-2": accent } as CSSProperties;

  // Categorías e ítems de cada colección (el editor filtra por estas categorías).
  const menuCats = allCats.filter((c) => menuCol && c.coleccion_id === menuCol.id).sort((a, b) => a.orden - b.orden);
  const catalogCats = allCats.filter((c) => catalogCol && c.coleccion_id === catalogCol.id).sort((a, b) => a.orden - b.orden);
  const menuCatIds = new Set(menuCats.map((c) => c.id));
  const catalogCatIds = new Set(catalogCats.map((c) => c.id));
  const menuItems = items.filter((i) => menuCatIds.has(i.categoria_id));
  const catalogItems = items.filter((i) => catalogCatIds.has(i.categoria_id));

  const catalogActive = me.modulos?.includes("catalogo") ?? false;

  const nav: { id: Section; label: string; icon: string }[] = (
    [
      { id: "menu", label: "Menú", icon: "menu" },
      { id: "catalogo", label: "Catálogo", icon: "box" },
      { id: "brand", label: "Marca", icon: "palette" },
      { id: "qr", label: "QR y Mesas", icon: "qr" },
      { id: "cocina", label: "Cocina", icon: "bell" },
      { id: "pedidos", label: "Pedidos", icon: "receipt" },
      { id: "ventas", label: "Ventas", icon: "cash" },
      { id: "metrics", label: "Métricas", icon: "chart" },
    ] as { id: Section; label: string; icon: string }[]
  ).filter((n) => (n.id !== "catalogo" && n.id !== "pedidos") || catalogActive);

  const sectionTitle = {
    menu: "Editor de menú",
    catalogo: "Editor de catálogo",
    brand: "Marca y apariencia",
    qr: "Códigos QR",
    cocina: "Cocina",
    pedidos: "Pedidos del catálogo",
    ventas: "Ventas",
    metrics: "Métricas",
  }[section];
  const sectionSub = {
    menu: `${menuItems.length} platillos · ${menuItems.filter((i) => !i.disponible).length} agotados`,
    catalogo: `${catalogItems.length} productos`,
    brand: "Logo, colores y tipografía de tu vitrina",
    qr: "QR general (para llevar/compartir) y un QR por cada mesa",
    cocina: "Pedidos entrantes en tiempo real",
    pedidos: "Empaque y entrega de productos",
    ventas: "Ventas realizadas, tickets e impresión",
    metrics: "Cómo se comporta tu menú esta semana",
  }[section];

  const showPreview = wide && (section === "menu" || section === "brand");
  const slug = me.tenant?.slug ?? "";

  return (
    <div className="admin" style={cssVars}>
      <aside className={"asied" + (navOpen ? " is-open" : "")}>
        <div className="asied__brand">
          <div className="brand__mark">V</div>
          <div className="col">
            <div className="brand__name">Vitrina Digital</div>
            <div className="brand__sub">Panel del negocio</div>
          </div>
          <button className="iconbtn aclose" style={{ marginLeft: "auto" }} onClick={() => setNavOpen(false)} aria-label="Cerrar">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="asied__biz">
          <div className="asied__logo">
            {brand.logoUrl ? <img src={mediaUrl(brand.logoUrl) ?? ""} alt="" /> : <Icon name="coffee" size={20} />}
          </div>
          <div className="col grow" style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {brand.nombre}
            </div>
            <div className="mute2" style={{ fontSize: 11.5 }}>{slug}.vitrina.app</div>
          </div>
        </div>

        <nav className="asied__nav">
          {nav.map((n) => (
            <button
              key={n.id}
              className={"navitem" + (section === n.id ? " is-active" : "")}
              onClick={() => { setSection(n.id); setNavOpen(false); }}
            >
              <Icon name={n.icon} size={19} /> {n.label}
              {n.id === "menu" && <span className="navitem__n">{menuItems.length}</span>}
              {n.id === "catalogo" && <span className="navitem__n">{catalogItems.length}</span>}
            </button>
          ))}
        </nav>

        <div className="asied__foot">
          <a href={`/v/${slug}`} target="_blank" rel="noreferrer" className="navitem">
            <Icon name="eye" size={18} /> Ver vitrina
          </a>
          <button className="navitem" onClick={onLogout}>
            <Icon name="logout" size={18} /> Salir
          </button>
        </div>
      </aside>
      {navOpen && <div className="ascrim" onClick={() => setNavOpen(false)} />}

      <div className="amain">
        <header className="atop">
          <button className="iconbtn aburger" onClick={() => setNavOpen(true)} aria-label="Menú"><Icon name="menu" size={20} /></button>
          <div className="col grow" style={{ minWidth: 0 }}>
            <div className="display" style={{ fontSize: 19, lineHeight: 1.1 }}>{sectionTitle}</div>
            <div className="mute2 hide-sm" style={{ fontSize: 12 }}>{sectionSub}</div>
          </div>
        </header>

        <div className="abody thin-scroll">
          <div className="acontent">
            {section === "menu" && <MenuEditor coleccion={menuCol} cats={menuCats} items={items} reload={reload} idiomas={brand.idiomas} kind="menu" />}
            {section === "catalogo" && <MenuEditor coleccion={catalogCol} cats={catalogCats} items={items} reload={reload} idiomas={brand.idiomas} kind="catalogo" />}
            {section === "brand" && <Branding brand={brand} setBrand={setBrand} />}
            {section === "qr" && (
              <div className="col" style={{ gap: 16 }}>
                <QRView slug={slug} />
                <Mesas slug={slug} num={brand.num_mesas} onSaved={(n) => setBrand({ ...brand, num_mesas: n })} />
              </div>
            )}
            {section === "cocina" && <Cocina kind="cocina" negocio={brand.nombre} />}
            {section === "pedidos" && <Cocina kind="pedidos" negocio={brand.nombre} />}
            {section === "ventas" && <Ventas negocio={brand.nombre} />}
            {section === "metrics" && <Metrics items={menuItems} />}
          </div>

          {showPreview && (
            <div className="apreview">
              <div className="apreview__label eyebrow"><Icon name="eye" size={13} /> Vista previa en vivo</div>
              <PhonePreview slug={slug} version={`${pvVersion}-${brand.logoUrl ?? ""}`} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
