import { useState } from "react";

import Icon from "./Icon";

/** Vista previa en vivo: carga la vitrina real (/v/slug) dentro de un marco de teléfono.
 *  `version` fuerza la recarga del iframe cuando el menú o la marca cambian. */
export default function PhonePreview({ slug, version }: { slug: string; version: number | string }) {
  const [full, setFull] = useState(false);
  const src = `/v/${slug}`;

  return (
    <>
      <div className="pvphone">
        <div className="pvphone__notch" />
        <div className="pvphone__screen pvphone__screen--live">
          <iframe key={version} src={src} title="Vista previa de la vitrina" className="pvphone__frame" />
        </div>
      </div>

      <div className="pvtools">
        <button type="button" className="btn btn--soft btn--sm" onClick={() => setFull(true)}>
          <Icon name="eye" size={14} /> Pantalla completa
        </button>
        <a className="btn btn--ghost btn--sm" href={src} target="_blank" rel="noreferrer">
          Abrir en pestaña
        </a>
      </div>

      {full && (
        <div className="pvfull" onClick={() => setFull(false)}>
          <div className="pvfull__inner" onClick={(e) => e.stopPropagation()}>
            <div className="pvphone pvphone--big">
              <div className="pvphone__notch" />
              <div className="pvphone__screen pvphone__screen--live">
                <iframe key={version} src={src} title="Vista previa de la vitrina" className="pvphone__frame" />
              </div>
            </div>
            <button type="button" className="pvfull__close" onClick={() => setFull(false)} aria-label="Cerrar">
              <Icon name="x" size={18} /> Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
