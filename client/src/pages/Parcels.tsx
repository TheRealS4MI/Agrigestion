import { FormEvent, useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";

type Parcel = {
  id: string;
  name: string;
  city: string | null;
  soilType: string | null;
  _count?: { cultures: number };
};

export default function Parcels() {
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN" || user?.role === "FARMER";
  const isAdmin = user?.role === "ADMIN";

  const [list, setList] = useState<Parcel[]>([]);
  const [err, setErr] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [soilType, setSoilType] = useState("");

  async function load() {
    setErr("");
    try {
      const data = await api<Parcel[]>("/api/parcels");
      setList(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      await api("/api/parcels", { method: "POST", json: { name, city, soilType } });
      setName("");
      setCity("");
      setSoilType("");
      await load();
    } catch (ex) {
      alert(ex instanceof Error ? ex.message : "Erreur");
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette parcelle ?")) return;
    try {
      await api(`/api/parcels/${id}`, { method: "DELETE" });
      await load();
    } catch (ex) {
      alert(ex instanceof Error ? ex.message : "Erreur");
    }
  }

  return (
    <>
      <h1>Parcelles</h1>
      <p className="sub">Référentiel des parcelles (ville, type de sol).</p>
      {err && <p className="error">{err}</p>}

      {canEdit && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h2>Nouvelle parcelle</h2>
          <form className="form" onSubmit={onCreate} style={{ maxWidth: "100%" }}>
            <div className="grid cols-2">
              <label>
                Nom *
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label>
                Ville
                <input value={city} onChange={(e) => setCity(e.target.value)} />
              </label>
            </div>
            <label>
              Type de sol
              <input value={soilType} onChange={(e) => setSoilType(e.target.value)} placeholder="Ex. Limoneux" />
            </label>
            <button className="btn" type="submit">
              Enregistrer
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>Liste</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Ville</th>
                <th>Sol</th>
                <th>Cultures</th>
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.city || "—"}</td>
                  <td>{p.soilType || "—"}</td>
                  <td>{p._count?.cultures ?? "—"}</td>
                  {isAdmin && (
                    <td>
                      <button type="button" className="btn danger" onClick={() => remove(p.id)}>
                        Supprimer
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
