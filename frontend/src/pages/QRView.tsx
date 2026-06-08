import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

import Icon from "../ui/Icon";

export default function QRView({ slug }: { slug: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/v/${slug}`;

  useEffect(() => {
    if (canvasRef.current) {
      void QRCode.toCanvas(canvasRef.current, url, {
        width: 240,
        margin: 2,
        color: { dark: "#1f1813", light: "#ffffff" },
      });
    }
  }, [url]);

  function descargar() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `qr-${slug}.png`;
    a.click();
  }

  async function copiar() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="col" style={{ gap: 16, maxWidth: 520 }}>
      <section className="card panelcard">
        <h3 className="panelcard__h"><Icon name="qr" size={17} /> Código QR de tu vitrina</h3>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 0 }}>
          Imprímelo y ponlo en tus mesas. Al escanearlo, tus clientes ven tu menú.
        </p>
        <div className="row" style={{ gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ background: "#fff", padding: 10, borderRadius: 14, border: "1px solid var(--line)" }}>
            <canvas ref={canvasRef} />
          </div>
          <div className="col" style={{ gap: 10, minWidth: 220, flex: 1 }}>
            <div>
              <div className="flabel">Enlace de tu vitrina</div>
              <div className="field" style={{ fontWeight: 600, fontSize: 13, wordBreak: "break-all" }}>{url}</div>
            </div>
            <div className="row" style={{ gap: 9 }}>
              <button className="btn btn--primary" onClick={descargar}><Icon name="qr" size={16} /> Descargar PNG</button>
              <button className="btn btn--ghost" onClick={copiar}>{copied ? "¡Copiado!" : "Copiar enlace"}</button>
            </div>
            <a className="navitem" href={url} target="_blank" rel="noreferrer" style={{ padding: "8px 0" }}>
              <Icon name="eye" size={16} /> Abrir vitrina
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
