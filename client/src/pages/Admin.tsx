import { FormEvent, useEffect, useState } from "react";
import { api } from "../api";

type U = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
};

export default function Admin() {
  const [users, setUsers] = useState<U[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"FARMER" | "WORKER">("FARMER");

  async function load() {
    const data = await api<U[]>("/api/admin/users");
    setUsers(data);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    await api("/api/admin/users", {
      method: "POST",
      json: { email, password, name, role },
    });
    setEmail("");
    setPassword("");
    setName("");
    await load();
  }

  async function setUserRole(id: string, r: string) {
    await api(`/api/admin/users/${id}`, { method: "PATCH", json: { role: r } });
    await load();
  }

  async function del(id: string) {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    await api(`/api/admin/users/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <>
      <h1>Administration</h1>
      <p className="sub">Comptes utilisateurs (agriculteurs, ouvriers) pour la ferme.</p>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2>Inviter un utilisateur</h2>
        <form className="form" onSubmit={onCreate}>
          <label>
            Nom
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Mot de passe temporaire
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>
          <label>
            Rôle
            <select value={role} onChange={(e) => setRole(e.target.value as "FARMER" | "WORKER")}>
              <option value="FARMER">Agriculteur</option>
              <option value="WORKER">Ouvrier (consultation)</option>
            </select>
          </label>
          <button className="btn" type="submit">
            Créer le compte
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Utilisateurs</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role.toLowerCase()}`}>{u.role}</span>
                  </td>
                  <td className="row-actions">
                    <select
                      value={u.role}
                      onChange={(e) => setUserRole(u.id, e.target.value)}
                      style={{
                        padding: "0.35rem",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--surface2)",
                        color: "var(--text)",
                      }}
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="FARMER">FARMER</option>
                      <option value="WORKER">WORKER</option>
                    </select>
                    <button type="button" className="btn danger" onClick={() => del(u.id)}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
