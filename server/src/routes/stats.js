import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

/** Revenue = sum(quantity * salePrice) when salePrice set; else 0 for that row */
router.get("/dashboard", requireRole("ADMIN", "FARMER"), async (req, res) => {
  const farmId = req.user.farmId;

  const harvests = await prisma.harvest.findMany({
    where: { culture: { parcel: { farmId } } },
    select: { quantity: true, salePrice: true, date: true, cultureId: true },
  });

  let totalRevenue = 0;
  for (const h of harvests) {
    if (h.salePrice != null) {
      totalRevenue += h.quantity * h.salePrice;
    }
  }

  const expenses = await prisma.expense.findMany({
    where: { farmId },
    select: { amount: true, category: true, date: true, cultureId: true },
  });
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const profit = totalRevenue - totalExpenses;

  const byCategory = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  }

  const cultures = await prisma.culture.findMany({
    where: { parcel: { farmId } },
    include: {
      harvests: { select: { quantity: true, salePrice: true } },
      expenses: { select: { amount: true } },
      parcel: { select: { name: true } },
    },
  });

  const byCulture = cultures.map((c) => {
    let rev = 0;
    for (const h of c.harvests) {
      if (h.salePrice != null) rev += h.quantity * h.salePrice;
    }
    const exp = c.expenses.reduce((s, e) => s + e.amount, 0);
    return {
      cultureId: c.id,
      plantType: c.plantType,
      parcelName: c.parcel.name,
      revenue: rev,
      expenses: exp,
      profit: rev - exp,
    };
  });

  const monthly = {};
  const addMonth = (d, key, field, val) => {
    const m = d.toISOString().slice(0, 7);
    if (!monthly[m]) monthly[m] = { month: m, revenue: 0, expenses: 0 };
    monthly[m][field] += val;
  };

  for (const h of harvests) {
    if (h.salePrice != null) {
      addMonth(h.date, null, "revenue", h.quantity * h.salePrice);
    }
  }
  for (const e of expenses) {
    addMonth(e.date, null, "expenses", e.amount);
  }

  res.json({
    summary: {
      totalRevenue,
      totalExpenses,
      profit,
    },
    expensesByCategory: Object.entries(byCategory).map(([name, value]) => ({
      name,
      value,
    })),
    profitabilityByCulture: byCulture.sort((a, b) => b.profit - a.profit),
    monthly: Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month)),
  });
});

export default router;
