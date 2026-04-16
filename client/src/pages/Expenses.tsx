import { FormEvent, useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";

const CATEGORIES = [
  "Engrais",
  "Eau",
  "Main d'œuvre",
  "Matériel",
  "Semences",
  "Phytosanitaire",
  "Autre",
];

type CultureOpt = { id: string; plantType: string; parcel: { name: string } };
type Expense = {
  id: string;
  label: string;
  category: string;
  amount: number;
  date: string;
  culture: (CultureOpt & { id: string }) | null;
};

export default function Expenses() {
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN" || user?.role === "FARMER";

  const [cultures, setCultures] = useState<CultureOpt[]>([]);
  const [list, setList] = useState<Expense[]>([]);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [cultureId, setCultureId] = useState("");

  async function load() {
    const [cs, es] = await Promise.all([
      api<CultureOpt[]>("/api/cultures"),
      api<Expense[]>("/api/expenses"),
    ]);
    setCultures(cs);
    setList(es);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    await api("/api/expenses", {
      method: "POST",
      json: {
        label,
        category,
        amount: Number(amount),
        date,
        cultureId: cultureId || undefined,
      },
    });
    setLabel("");
    setAmount("");
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette dépense ?")) return;
    await api(`/api/expenses/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <>
      <h1>Dépenses</h1>
      <p className="sub">Catégories (engrais, eau, main-d’œuvre, matériel…) et lien optionnel à une culture.</p>

      {canEdit && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h2>Nouvelle dépense</h2>
          <form className="form" onSubmit={onCreate} style={{ maxWidth: "100%" }}>
            <label>
              Libellé *
              <input value={label} onChange={(e) => setLabel(e.target.value)} required />
            </label>
            <div className="grid cols-2">
              <label>
                Catégorie *
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Montant (MAD) *
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </label>
            </div>
            <div className="grid cols-2">
              <label>
                Date *
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </label>
              <label>
                Culture (optionnel)
                <select value={cultureId} onChange={(e) => setCultureId(e.target.value)}>
                  <option value="">— Général / ferme —</option>
                  {cultures.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.plantType} — {c.parcel.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
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
                <th>Date</th>
                <th>Libellé</th>
                <th>Catégorie</th>
                <th>Montant</th>
                <th>Culture</th>
                {canEdit && <th></th>}
              </tr>
            </thead>
            <tbody>
              {list.map((x) => (
                <tr key={x.id}>
                  <td>{x.date.slice(0, 10)}</td>
                  <td>{x.label}</td>
                  <td>{x.category}</td>
                  <td>
                    {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "MAD" }).format(x.amount)}
                  </td>
                  <td>
                    {x.culture ? `${x.culture.plantType} (${x.culture.parcel.name})` : "—"}
                  </td>
                  {canEdit && (
                    <td>
                      <button type="button" className="btn danger" onClick={() => remove(x.id)}>
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
