import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

router.get("/", requireRole("ADMIN", "FARMER"), async (req, res) => {
  const expenses = await prisma.expense.findMany({
    where: { farmId: req.user.farmId },
    orderBy: { date: "desc" },
    include: {
      culture: {
        select: {
          id: true,
          plantType: true,
          parcel: { select: { name: true } },
        },
      },
    },
  });
  res.json(expenses);
});

router.post("/", requireRole("ADMIN", "FARMER"), async (req, res) => {
  const { label, category, amount, date, cultureId } = req.body;
  if (!label?.trim() || !category?.trim() || amount == null || !date) {
    return res.status(400).json({ error: "Libellé, catégorie, montant et date requis" });
  }
  const a = Number(amount);
  if (Number.isNaN(a) || a < 0) {
    return res.status(400).json({ error: "Montant invalide" });
  }
  let cultureConnect = undefined;
  if (cultureId) {
    const c = await prisma.culture.findFirst({
      where: { id: cultureId, parcel: { farmId: req.user.farmId } },
    });
    if (!c) return res.status(400).json({ error: "Culture invalide" });
    cultureConnect = { connect: { id: cultureId } };
  }
  const e = await prisma.expense.create({
    data: {
      farmId: req.user.farmId,
      label: label.trim(),
      category: category.trim(),
      amount: a,
      date: new Date(date),
      ...(cultureConnect && { culture: cultureConnect }),
    },
    include: {
      culture: {
        select: {
          id: true,
          plantType: true,
          parcel: { select: { name: true } },
        },
      },
    },
  });
  res.status(201).json(e);
});

router.patch("/:id", requireRole("ADMIN", "FARMER"), async (req, res) => {
  const existing = await prisma.expense.findFirst({
    where: { id: req.params.id, farmId: req.user.farmId },
  });
  if (!existing) return res.status(404).json({ error: "Dépense introuvable" });
  const { label, category, amount, date, cultureId } = req.body;
  let cultureData = undefined;
  if (cultureId === null || cultureId === "") {
    cultureData = { disconnect: true };
  } else if (cultureId) {
    const c = await prisma.culture.findFirst({
      where: { id: cultureId, parcel: { farmId: req.user.farmId } },
    });
    if (!c) return res.status(400).json({ error: "Culture invalide" });
    cultureData = { connect: { id: cultureId } };
  }
  const e = await prisma.expense.update({
    where: { id: req.params.id },
    data: {
      ...(label != null && { label: String(label).trim() }),
      ...(category != null && { category: String(category).trim() }),
      ...(amount != null && { amount: Number(amount) }),
      ...(date != null && { date: new Date(date) }),
      ...(cultureData !== undefined && { culture: cultureData }),
    },
    include: {
      culture: {
        select: {
          id: true,
          plantType: true,
          parcel: { select: { name: true } },
        },
      },
    },
  });
  res.json(e);
});

router.delete("/:id", requireRole("ADMIN", "FARMER"), async (req, res) => {
  const existing = await prisma.expense.findFirst({
    where: { id: req.params.id, farmId: req.user.farmId },
  });
  if (!existing) return res.status(404).json({ error: "Dépense introuvable" });
  await prisma.expense.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
