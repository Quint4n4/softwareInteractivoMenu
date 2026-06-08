import { useEffect, useState } from "react";

import { getMe, logout as doLogout, type Me } from "./api/auth";
import { getAccess } from "./api/client";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Panel from "./pages/Panel";

export default function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getAccess()) {
      setLoading(false);
      return;
    }
    getMe()
      .then(setMe)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="center muted">Cargando…</div>;
  if (!me) return <Login onAuthed={setMe} />;

  const handleLogout = () => {
    doLogout();
    setMe(null);
  };

  // El super-admin de plataforma ve el panel de negocios; los dueños, su panel.
  if (me.is_platform_admin) return <Admin me={me} onLogout={handleLogout} />;
  return <Panel me={me} onLogout={handleLogout} />;
}
