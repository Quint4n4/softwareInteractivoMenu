import { type Me } from "../api/auth";

export default function Dashboard({ me, onLogout }: { me: Me; onLogout: () => void }) {
  return (
    <div className="shell">
      <header className="topbar">
        <img src="/qito.png" alt="" aria-hidden="true" style={{ width: 32, height: 32, objectFit: "contain" }} />
        <strong>Qarta</strong>
        <button className="link" style={{ marginLeft: "auto" }} onClick={onLogout}>
          Salir
        </button>
      </header>

      <main className="center">
        <div className="card">
          <h2>¡Hola, {me.user.username}! 👋</h2>
          {me.tenant ? (
            <>
              <p className="muted">Estás en el panel de tu negocio:</p>
              <ul className="facts">
                <li><span>Negocio</span><b>{me.tenant.nombre}</b></li>
                <li><span>Subdominio</span><b>{me.tenant.slug}.vitrina.app</b></li>
                <li><span>Modo</span><b>{me.tenant.modo_vitrina}</b></li>
                <li><span>Rol</span><b>{me.rol}</b></li>
              </ul>
              <p className="muted small">
                Cimientos listos (Módulo 0). El editor de menú llega en el Módulo 1.
              </p>
            </>
          ) : (
            <p className="muted">Tu usuario aún no tiene un negocio asociado.</p>
          )}
        </div>
      </main>
    </div>
  );
}
