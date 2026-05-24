import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth";
import logo from "../logo.png";

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [pending, setPending] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setPending(true);
    try {
      await login(email, password);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Erreur");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="brand" style={{ marginBottom: "1rem" }}>
          <img src={logo} alt="AgriGestion" className="brand-logo" />
          <span style={{ fontSize: "1.25rem" }}>AgriGestion</span>
        </div>
        <h1 style={{ fontSize: "1.35rem" }}>Connexion</h1>
        <p className="sub">Accédez à la gestion de votre exploitation.</p>
        <form className="form" onSubmit={onSubmit}>
          {err && <p className="error">{err}</p>}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Connexion…" : "Se connecter"}
          </button>
        </form>
        <p className="muted" style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </p>
        <p className="muted" style={{ marginTop: "0.75rem", fontSize: "0.8rem" }}>
          Démo : admin@agrigestion.local / admin123
        </p>
      </div>
    </div>
  );
}
