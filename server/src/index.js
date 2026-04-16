import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import parcelRoutes from "./routes/parcels.js";
import cultureRoutes from "./routes/cultures.js";
import harvestRoutes from "./routes/harvests.js";
import expenseRoutes from "./routes/expenses.js";
import statsRoutes from "./routes/stats.js";
import adminRoutes from "./routes/admin.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/parcels", parcelRoutes);
app.use("/api/cultures", cultureRoutes);
app.use("/api/harvests", harvestRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/admin", adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Erreur serveur" });
});

app.listen(PORT, () => {
  console.log(`AgriGestion API http://localhost:${PORT}`);
});
