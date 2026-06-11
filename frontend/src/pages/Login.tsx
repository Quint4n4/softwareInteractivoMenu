import { type FormEvent, useState } from "react";
import { AxiosError } from "axios";

import { getMe, login, register, type Me } from "../api/auth";
import Icon from "../ui/Icon";

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
  const [showPw, setShowPw] = useState(false);

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
        <h1>{mode === "login" ? "Bienvenido" : "Crea tu negocio"}</h1>
        <p className="auth__sub">
          {mode === "login" ? "Entra a tu panel" : "Empieza tu vitrina digital"}
        </p>

        {mode === "register" && (
          <div className="auth-field">
            <input
              className="auth-input"
              placeholder="Nombre del negocio"
              aria-label="Nombre del negocio"
              value={negocio}
              onChange={(e) => setNegocio(e.target.value)}
              required
            />
          </div>
        )}

        <div className="auth-field">
          <input
            className="auth-input"
            placeholder="Usuario"
            aria-label="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        {mode === "register" && (
          <div className="auth-field">
            <input
              className="auth-input"
              type="email"
              placeholder="Correo"
              aria-label="Correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        )}

        <div className="auth-field">
          <input
            className="auth-input"
            type={showPw ? "text" : "password"}
            placeholder="Contraseña"
            aria-label="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <button
            type="button"
            className="auth-eye"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
            title={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <Icon name={showPw ? "eyeoff" : "eye"} size={18} />
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <button type="submit" className="auth__submit" disabled={busy}>
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
