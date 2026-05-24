import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import Layout from "./Layout";
import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";
import Parcels from "./pages/Parcels";
import Cultures from "./pages/Cultures";
import Harvests from "./pages/Harvests";
import Expenses from "./pages/Expenses";
import Admin from "./pages/Admin";

function Private({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="auth-page">
        <p className="muted">Chargement…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== "ADMIN") return <Navigate to="/" replace />;
  return <>{children}</>;
}

function FarmerDash({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role === "WORKER") return <Navigate to="/cultures" replace />;
  return <>{children}</>;
}

function NotWorker({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role === "WORKER") return <Navigate to="/cultures" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Private>
            <Layout />
          </Private>
        }
      >
        <Route
          index
          element={
            <FarmerDash>
              <Dashboard />
            </FarmerDash>
          }
        />
        <Route path="parcels" element={<Parcels />} />
        <Route path="cultures" element={<Cultures />} />
        <Route path="harvests" element={<Harvests />} />
        <Route
          path="expenses"
          element={
            <NotWorker>
              <Expenses />
            </NotWorker>
          }
        />
        <Route
          path="admin"
          element={
            <AdminOnly>
              <Admin />
            </AdminOnly>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
