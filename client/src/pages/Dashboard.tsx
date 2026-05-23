import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  Line,
  LineChart,
} from "recharts";
import { api } from "../api";

type DashboardData = {
  summary: { totalRevenue: number; totalExpenses: number; profit: number };
  expensesByCategory: { name: string; value: number }[];
  profitabilityByCulture: {
    cultureId: string;
    plantType: string;
    parcelName: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
  monthly: { month: string; revenue: number; expenses: number }[];
};

const COLORS = ["#6ee7a0", "#4ade80", "#22c55e", "#86efac", "#bbf7d0", "#fcd34d"];

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api<DashboardData>("/api/stats/dashboard")
      .then(setData)
      .catch((e) => setErr(e instanceof Error ? e.message : "Erreur"));
  }, []);

  if (err) {
    return (
      <>
        <h1>Tableau de bord</h1>
        <p className="error">{err}</p>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <h1>Tableau de bord</h1>
        <p className="muted">Chargement des statistiques…</p>
      </>
    );
  }

  const { summary, expensesByCategory, profitabilityByCulture, monthly } = data;

  return (
    <>
      <h1>Tableau de bord</h1>
      <p className="sub">
        Vue d’ensemble des revenus (prix de vente × quantité), des dépenses et de la marge par culture.
      </p>

      <div className="grid cols-3" style={{ marginBottom: "1rem" }}>
        <div className="card kpi">
          <span className="label">Revenus estimés</span>
          <span className="value positive">{fmt(summary.totalRevenue)}</span>
        </div>
        <div className="card kpi">
          <span className="label">Dépenses</span>
          <span className="value">{fmt(summary.totalExpenses)}</span>
        </div>
        <div className="card kpi">
          <span className="label">Résultat</span>
          <span className={`value ${summary.profit >= 0 ? "positive" : "negative"}`}>
            {fmt(summary.profit)}
          </span>
        </div>
      </div>

      <div className="grid cols-2" style={{ marginBottom: "1rem" }}>
        <div className="card">
          <h2>Dépenses par catégorie</h2>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {expensesByCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h2>Rentabilité par culture</h2>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart
                data={profitabilityByCulture.map((c) => ({
                  name: `${c.plantType}`,
                  profit: c.profit,
                }))}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3b32" />
                <XAxis dataKey="name" tick={{ fill: "#9cb0a3", fontSize: 11 }} />
                <YAxis tick={{ fill: "#9cb0a3", fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} cursor={false} />
                <Legend />
                <Bar
                  dataKey="profit"
                  name="Marge (MAD)"
                  fill="#6ee7a0"
                  radius={[6, 6, 0, 0]}
                  activeBar={{ fill: "#a7f3d0" }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2>Revenus et dépenses par mois</h2>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={monthly} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3b32" />
              <XAxis dataKey="month" tick={{ fill: "#9cb0a3", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9cb0a3", fontSize: 11 }} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" name="Revenus" stroke="#6ee7a0" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="expenses" name="Dépenses" stroke="#fbbf24" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2>Détail par culture</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Culture</th>
                <th>Parcelle</th>
                <th>Revenus</th>
                <th>Dépenses</th>
                <th>Marge</th>
              </tr>
            </thead>
            <tbody>
              {profitabilityByCulture.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    Aucune donnée — ajoutez des récoltes avec prix de vente et des dépenses.
                  </td>
                </tr>
              ) : (
                profitabilityByCulture.map((c) => (
                  <tr key={c.cultureId}>
                    <td>{c.plantType}</td>
                    <td>{c.parcelName}</td>
                    <td>{fmt(c.revenue)}</td>
                    <td>{fmt(c.expenses)}</td>
                    <td className={c.profit >= 0 ? "positive" : undefined} style={{ color: c.profit < 0 ? "var(--danger)" : "var(--accent)" }}>
                      {fmt(c.profit)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
