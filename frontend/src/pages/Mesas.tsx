import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { patchBranding } from "../api/branding";
import Icon from "../ui/Icon";

export default function Mesas({
  slug,
  num,
  onSaved,
}: {
  slug: string;
  num: number;
  onSaved: (n: number) => void;
}) {
  const [count, setCount] = useState(num);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [qrs, setQrs] = useState<string[]>([]);

  // Genera un QR (como imagen) por cada mesa, con la URL que ya trae el número.
  useEffect(() => {
    let cancel = false;
    const urls = Array.from({ length: num }, (_, i) => `${window.location.origin}/v/${slug}?mesa=${i + 1}`);
    void Promise.all(
      urls.map((u) => QRCode.toDataURL(u, { width: 220, margin: 2, color: { dark: "#1f1813", light: "#ffffff" } })),
    ).then((imgs) => {
      if (!cancel) setQrs(imgs);
    });
    return () => {
      cancel = true;
    };
  }, [num, slug]);

  async function guardar() {
    setBusy(true);
    setSaved(false);
    try {
      await patchBranding({ negocio: { num_mesas: count } });
      onSaved(count);
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  function descargar(i: number) {
    const a = document.createElement("a");
    a.href = qrs[i];
    a.download = `mesa-${i + 1}-${slug}.png`;
    a.click();
  }

  return (
    <div className="col" style={{ gap: 16, maxWidth: 920 }}>
      <section className="card panelcard">
        <h3 className="panelcard__h"><Icon name="qr" size={17} /> ¿Cuántas mesas tienes?</h3>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 0 }}>
          Genera un QR por mesa. Al escanearlo, el cliente entra con su mesa <b>ya puesta</b> (no la escribe).
        </p>
        <div className="row" style={{ gap: 10, alignItems: "center" }}>
          <input
            className="field"
            type="number"
            min={0}
            max={200}
            value={count}
            onChange={(e) => setCount(Math.max(0, Math.min(200, Number(e.target.value) || 0)))}
            style={{ width: 120 }}
          />
          <button className="btn btn--primary" onClick={guardar} disabled={busy}>
            {busy ? "Guardando…" : "Guardar"}
          </button>
          {saved && <span className="chip st-ready">Guardado ✓</span>}
        </div>
      </section>

      {num > 0 && (
        <section className="card panelcard">
          <h3 className="panelcard__h"><Icon name="grip" size={16} /> QR por mesa ({num})</h3>
          <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
            Descarga e imprime el QR de cada mesa y pégalo en la mesa correspondiente.
          </p>
          <div className="mesa-grid">
            {qrs.map((src, i) => (
              <div key={i} className="mesa-card">
                <div className="mesa-card__num">Mesa {i + 1}</div>
                <img src={src} alt={`QR Mesa ${i + 1}`} className="mesa-card__qr" />
                <button className="btn btn--ghost btn--sm btn--block" onClick={() => descargar(i)}>
                  <Icon name="qr" size={13} /> Descargar
                </button>
              </div>
            ))}
            {qrs.length === 0 && <div className="mute2" style={{ fontSize: 13 }}>Generando QRs…</div>}
          </div>
        </section>
      )}
    </div>
  );
}
