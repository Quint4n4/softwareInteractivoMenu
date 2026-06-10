import { useState } from "react";

import { deleteLogo, patchBranding, uploadLogo } from "../api/branding";
import { mediaUrl } from "../api/client";
import Icon from "../ui/Icon";
import { PALETTES } from "../ui/brandOptions";
import type { Brand } from "./Panel";

export default function Branding({
  brand,
  setBrand,
}: {
  brand: Brand;
  setBrand: (b: Brand) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoBusy, setLogoBusy] = useState(false);

  async function subirLogo(file: File | null) {
    if (!file) return;
    setLogoBusy(true);
    setError(null);
    try {
      const tema = await uploadLogo(file);
      setBrand({ ...brand, logoUrl: tema.logo });
    } catch {
      setError("No se pudo subir el logo.");
    } finally {
      setLogoBusy(false);
    }
  }

  async function quitarLogo() {
    setLogoBusy(true);
    setError(null);
    try {
      await deleteLogo();
      setBrand({ ...brand, logoUrl: null });
    } catch {
      setError("No se pudo quitar el logo.");
    } finally {
      setLogoBusy(false);
    }
  }

  async function guardar() {
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      await patchBranding({
        negocio: {
          nombre: brand.nombre,
          modo_vitrina: brand.modo,
          idiomas: brand.idiomas.length ? brand.idiomas : ["es"],
          idioma_default: "es",
        },
        tema: { color_primario: brand.accentHex, tipografia: brand.fontLabel },
      });
      setSaved(true);
    } catch {
      setError("No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="col" style={{ gap: 16, maxWidth: 640 }}>
      <section className="card panelcard">
        <h3 className="panelcard__h"><Icon name="coffee" size={17} /> Identidad</h3>
        <div className="row wrap" style={{ gap: 16, alignItems: "flex-start" }}>
          <div className="col" style={{ gap: 6, alignItems: "center" }}>
            <label
              className="asied__logo logo-up"
              style={{ width: 84, height: 84, borderRadius: "50%", flexDirection: "column", gap: 2 }}
              title={brand.logoUrl ? "Cambiar logo" : "Subir logo"}
            >
              {brand.logoUrl ? (
                <img src={mediaUrl(brand.logoUrl) ?? ""} alt="Logo del negocio" />
              ) : (
                <Icon name="coffee" size={26} />
              )}
              {logoBusy && <span className="logo-up__busy">…</span>}
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  void subirLogo(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
            </label>
            <span className="mute2" style={{ fontSize: 10.5 }}>
              {brand.logoUrl ? "Cambiar logo" : "Sube tu logo"}
            </span>
            {brand.logoUrl && (
              <button type="button" className="logo-quitar" onClick={quitarLogo} disabled={logoBusy}>
                <Icon name="trash" size={12} /> Quitar
              </button>
            )}
          </div>
          <div className="grow" style={{ minWidth: 200 }}>
            <label className="flabel">Nombre del negocio</label>
            <input
              className="field"
              value={brand.nombre}
              onChange={(e) => setBrand({ ...brand, nombre: e.target.value })}
            />
            <div className="fhint">Aparece en la cabecera de tu vitrina y en el QR.</div>
          </div>
        </div>
      </section>

      <section className="card panelcard">
        <h3 className="panelcard__h"><Icon name="palette" size={17} /> Color de acento</h3>
        <div className="swatches">
          {Object.entries(PALETTES).map(([name, hex]) => {
            const on = brand.accentHex === hex;
            return (
              <button
                key={name}
                className={"swatch" + (on ? " is-on" : "")}
                onClick={() => setBrand({ ...brand, accentHex: hex })}
              >
                <span className="swatch__dot" style={{ background: hex }}>
                  {on && <Icon name="check" size={14} color="#fff" stroke={3} />}
                </span>
                {name}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card panelcard">
        <h3 className="panelcard__h"><Icon name="globe" size={17} /> Idiomas de la vitrina</h3>
        <div className="row" style={{ gap: 8, alignItems: "center" }}>
          <span className="chip chip--line">Español · base</span>
        </div>
        <div className="spread" style={{ marginTop: 14, alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Inglés (English)</div>
            <div className="fhint" style={{ margin: "2px 0 0" }}>
              Muestra a tus clientes un botón ES/EN y traduce el menú para turistas.
            </div>
          </div>
          <button
            type="button"
            className="switch"
            data-on={brand.idiomas.includes("en")}
            onClick={() =>
              setBrand({ ...brand, idiomas: brand.idiomas.includes("en") ? ["es"] : ["es", "en"] })
            }
            aria-label="Activar inglés"
          ><i /></button>
        </div>
        {brand.idiomas.includes("en") && (
          <div className="fhint" style={{ marginTop: 12 }}>
            Para traducir cada platillo, ve a <b>Menú</b> → edita el platillo → sección “Traducción al inglés”. Guarda aquí para activar el idioma.
          </div>
        )}
      </section>

      <div className="spread">
        <span>
          {saved && <span className="chip st-ready">Guardado ✓</span>}
          {error && <span className="chip st-new">{error}</span>}
        </span>
        <button className="btn btn--primary" onClick={guardar} disabled={busy}>
          {busy ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
