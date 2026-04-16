import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function Register() {
  const { user, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [farmName, setFarmName] = useState("");
  const [err, setErr] = useState("");
  const [pending, setPending] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setPending(true);
    try {
      await register({ name, email, password, farmName: farmName || undefined });
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
          <div className="brand-mark">🌾</div>
          <span style={{ fontSize: "1.25rem" }}>AgriGestion</span>
        </div>
        <h1 style={{ fontSize: "1.35rem" }}>Créer un compte</h1>
        <p className="sub">Nouvelle exploitation — vous serez enregistré comme agriculteur.</p>
        <form className="form" onSubmit={onSubmit}>
          {err && <p className="error">{err}</p>}
          <label>
            Nom
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </label>
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
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          <label>
            Nom de la ferme (optionnel)
            <input
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              placeholder="Ex. Ferme du Soleil"
            />
          </label>
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Création…" : "S'inscrire"}
          </button>
        </form>
        <p className="muted" style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
          Déjà un compte ? <Link to="/login">Connexion</Link>
        </p>
      </div>
    </div>
  );
}
