import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "./auth";

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden>
            🌾
          </div>
          <span>AgriGestion</span>
        </div>
        <nav className="nav">
          {user?.role !== "WORKER" && (
            <NavLink to="/" end>
              Tableau de bord
            </NavLink>
          )}
          <NavLink to="/parcels">Parcelles</NavLink>
          <NavLink to="/cultures">Cultures</NavLink>
          <NavLink to="/harvests">Récoltes</NavLink>
          {user?.role !== "WORKER" && <NavLink to="/expenses">Dépenses</NavLink>}
          {user?.role === "ADMIN" && <NavLink to="/admin">Administration</NavLink>}
        </nav>
        <div className="row-actions">
          <span className="muted" style={{ fontSize: "0.9rem" }}>
            {user?.name}
            <span className="badge" style={{ marginLeft: "0.5rem" }}>
              {user?.role}
            </span>
          </span>
          <button type="button" className="btn secondary" onClick={logout}>
            Déconnexion
          </button>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}
