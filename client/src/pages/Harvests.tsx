import { FormEvent, useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";

type CultureOpt = { id: string; plantType: string; parcel: { name: string } };
type Harvest = {
  id: string;
  date: string;
  quantity: number;
  unit: string;
  quality: string | null;
  salePrice: number | null;
  culture: CultureOpt;
};

export default function Harvests() {
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN" || user?.role === "FARMER";

  const [cultures, setCultures] = useState<CultureOpt[]>([]);
  const [list, setList] = useState<Harvest[]>([]);
  const [cultureId, setCultureId] = useState("");
  const [date, setDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [quality, setQuality] = useState("");
  const [salePrice, setSalePrice] = useState("");

  async function load() {
    const [cs, hs] = await Promise.all([
      api<{ id: string; plantType: string; parcel: { name: string } }[]>("/api/cultures"),
      api<Harvest[]>("/api/harvests"),
    ]);
    setCultures(cs.map((c) => ({ id: c.id, plantType: c.plantType, parcel: c.parcel })));
    setList(hs);
    if (!cultureId && cs[0]) setCultureId(cs[0].id);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    await api("/api/harvests", {
      method: "POST",
      json: {
        cultureId,
        date,
        quantity: Number(quantity),
        unit,
        quality: quality || undefined,
        salePrice: salePrice === "" ? undefined : Number(salePrice),
      },
    });
    setQuantity("");
    setQuality("");
    setSalePrice("");
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette récolte ?")) return;
    await api(`/api/harvests/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <>
      <h1>Récoltes</h1>
      <p className="sub">Quantité, qualité, date ; prix de vente unitaire pour le chiffre d’affaires.</p>

      {canEdit && cultures.length > 0 && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h2>Enregistrer une récolte</h2>
          <form className="form" onSubmit={onCreate} style={{ maxWidth: "100%" }}>
            <label>
              Culture
              <select value={cultureId} onChange={(e) => setCultureId(e.target.value)} required>
                {cultures.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.plantType} — {c.parcel.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid cols-2">
              <label>
                Date *
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </label>
              <label>
                Qualité
                <input value={quality} onChange={(e) => setQuality(e.target.value)} placeholder="A, B…" />
              </label>
            </div>
            <div className="grid cols-3">
              <label>
                Quantité *
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </label>
              <label>
                Unité
                <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                  <option value="kg">kg</option>
                  <option value="tonnes">tonnes</option>
                  <option value="sacs">sacs</option>
                </select>
              </label>
              <label>
                Prix vente / unité (MAD)
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="Optionnel"
                />
              </label>
            </div>
            <button className="btn" type="submit">
              Enregistrer
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>Historique</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Culture</th>
                <th>Quantité</th>
                <th>Prix / u.</th>
                {canEdit && <th></th>}
              </tr>
            </thead>
            <tbody>
              {list.map((h) => (
                <tr key={h.id}>
                  <td>{h.date.slice(0, 10)}</td>
                  <td>
                    {h.culture.plantType} <span className="muted">({h.culture.parcel.name})</span>
                  </td>
                  <td>
                    {h.quantity} {h.unit}
                  </td>
                  <td>{h.salePrice != null ? `${h.salePrice} MAD` : "—"}</td>
                  {canEdit && (
                    <td>
                      <button type="button" className="btn danger" onClick={() => remove(h.id)}>
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
