import { type FormEvent, useState } from "react";
import { AxiosError } from "axios";

import { getMe, login, register, type Me } from "../api/auth";

type Mode = "login" | "register";

function extractError(err: unknown): string {
  if (err instanceof AxiosError && err.response) {
    const data = err.response.data as Record<string, unknown>;
    if (typeof data?.detail === "string") return data.detail;
    const first = Object.values(data ?? {})[0];
    if (Array.isArray(first) && first.length) return String(first[0]);
    if (err.response.status === 401) return "Usuario o contraseña incorrectos.";
  }
  return "Ocurrió un error. Revisa que el backend esté corriendo.";
}

export default function Login({ onAuthed }: { onAuthed: (me: Me) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [negocio, setNegocio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await register({ username, email, password, nombre_negocio: negocio });
      }
      onAuthed(await getMe());
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center login-root">
      <form className="authcard auth" onSubmit={submit}>
        <div className="brandmark">V</div>
        <h1>Vitrina Digital</h1>
        <p className="muted">
          {mode === "login" ? "Entra a tu panel" : "Crea tu negocio"}
        </p>

        {mode === "register" && (
          <label>
            Nombre del negocio
            <input value={negocio} onChange={(e) => setNegocio(e.target.value)} required />
          </label>
        )}

        <label>
          Usuario
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>

        {mode === "register" && (
          <label>
            Correo
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
        )}

        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={busy}>
          {busy ? "…" : mode === "login" ? "Entrar" : "Crear negocio"}
        </button>

        <button
          type="button"
          className="link"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
        >
          {mode === "login" ? "¿No tienes cuenta? Crea tu negocio" : "Ya tengo cuenta, entrar"}
        </button>
      </form>
    </div>
  );
}
