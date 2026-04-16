import { FormEvent, useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";

type Parcel = { id: string; name: string };
type Culture = {
  id: string;
  plantType: string;
  seedType: string | null;
  sowingDate: string;
  notes: string | null;
  parcel: { id: string; name: string };
};

export default function Cultures() {
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN" || user?.role === "FARMER";

  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [list, setList] = useState<Culture[]>([]);
  const [parcelId, setParcelId] = useState("");
  const [plantType, setPlantType] = useState("");
  const [seedType, setSeedType] = useState("");
  const [sowingDate, setSowingDate] = useState("");
  const [notes, setNotes] = useState("");

  async function load() {
    const [ps, cs] = await Promise.all([
      api<Parcel[]>("/api/parcels"),
      api<Culture[]>("/api/cultures"),
    ]);
    setParcels(ps);
    setList(cs);
    if (!parcelId && ps[0]) setParcelId(ps[0].id);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    await api("/api/cultures", {
      method: "POST",
      json: { parcelId, plantType, seedType, sowingDate, notes },
    });
    setPlantType("");
    setSeedType("");
    setNotes("");
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette culture ?")) return;
    await api(`/api/cultures/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <>
      <h1>Cycles de culture</h1>
      <p className="sub">Type de plante, semence, date de semis et parcelle.</p>

      {canEdit && parcels.length > 0 && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h2>Nouvelle culture</h2>
          <form className="form" onSubmit={onCreate} style={{ maxWidth: "100%" }}>
            <label>
              Parcelle
              <select value={parcelId} onChange={(e) => setParcelId(e.target.value)} required>
                {parcels.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid cols-2">
              <label>
                Type de plante *
                <input value={plantType} onChange={(e) => setPlantType(e.target.value)} required />
              </label>
              <label>
                Type de semence
                <input value={seedType} onChange={(e) => setSeedType(e.target.value)} />
              </label>
            </div>
            <label>
              Date de semis *
              <input
                type="date"
                value={sowingDate}
                onChange={(e) => setSowingDate(e.target.value)}
                required
              />
            </label>
            <label>
              Notes
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <button className="btn" type="submit">
              Enregistrer
            </button>
          </form>
        </div>
      )}

      {canEdit && parcels.length === 0 && (
        <p className="muted">Créez d’abord une parcelle dans l’onglet Parcelles.</p>
      )}

      <div className="card">
        <h2>Suivi</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Plante</th>
                <th>Parcelle</th>
                <th>Semis</th>
                <th>Semence</th>
                {canEdit && <th></th>}
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td>{c.plantType}</td>
                  <td>{c.parcel.name}</td>
                  <td>{c.sowingDate.slice(0, 10)}</td>
                  <td>{c.seedType || "—"}</td>
                  {canEdit && (
                    <td>
                      <button type="button" className="btn danger" onClick={() => remove(c.id)}>
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
