import { type Item } from "../api/catalog";
import Icon from "../ui/Icon";

// Métricas con datos de muestra derivados del menú (placeholder visual del M4).
export default function Metrics({ items }: { items: Item[] }) {
  const top = items
    .map((it, i) => ({
      name: it.nombre,
      views: 320 - i * 17 + (it.destacado || it.etiqueta === "Favorito" ? 120 : 0) + (it.id % 30),
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);
  const max = top.length ? top[0].views : 1;

  const week = [180, 240, 210, 300, 360, 520, 470];
  const days = ["L", "M", "M", "J", "V", "S", "D"];
  const weekMax = Math.max(...week);
  const totalViews = week.reduce((a, b) => a + b, 0);

  const stats = [
    { label: "Vistas del menú", value: totalViews.toLocaleString("es-MX"), sub: "últimos 7 días", icon: "eye", up: "+18%" },
    { label: "Clientes que vieron tu menú", value: "1,204", sub: "esta semana", icon: "user", up: "+9%" },
    { label: "Platillos activos", value: String(items.filter((i) => i.disponible).length), sub: `${items.length} en total`, icon: "box", up: null },
    { label: "Escaneos de QR", value: "892", sub: "esta semana", icon: "qr", up: "+12%" },
  ];

  return (
    <div className="col" style={{ gap: 16, maxWidth: 920 }}>
      <div className="statgrid">
        {stats.map((s) => (
          <div key={s.label} className="card statcard">
            <div className="statcard__ico"><Icon name={s.icon} size={18} /></div>
            <div className="statcard__val tnum">{s.value}</div>
            <div className="statcard__lbl">{s.label}</div>
            <div className="spread" style={{ marginTop: 2 }}>
              <span className="mute2" style={{ fontSize: 11.5 }}>{s.sub}</span>
              {s.up && <span className="statcard__up">{s.up}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="metrics2">
        <section className="card panelcard">
          <h3 className="panelcard__h"><Icon name="chart" size={17} /> Vistas por día</h3>
          <div className="bars">
            {week.map((v, i) => (
              <div key={i} className="bars__col">
                <div className="bars__track">
                  <div className="bars__fill" style={{ height: (v / weekMax) * 100 + "%" }} title={v + " vistas"} />
                </div>
                <span className="bars__lbl">{days[i]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card panelcard">
          <h3 className="panelcard__h"><Icon name="star" size={16} /> Platillos más vistos</h3>
          <div className="col" style={{ gap: 11 }}>
            {top.map((t, i) => (
              <div key={i} className="toprow">
                <span className="toprow__rank">{i + 1}</span>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="spread" style={{ marginBottom: 5 }}>
                    <span className="toprow__name">{t.name}</span>
                    <span className="mute2 tnum" style={{ fontSize: 12.5 }}>{t.views}</span>
                  </div>
                  <div className="toprow__track"><div className="toprow__fill" style={{ width: (t.views / max) * 100 + "%" }} /></div>
                </div>
              </div>
            ))}
            {top.length === 0 && <div className="mute2" style={{ fontSize: 13 }}>Aún no hay platillos.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
