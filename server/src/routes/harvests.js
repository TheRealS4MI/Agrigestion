import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

async function assertCultureFarm(cultureId, farmId) {
  return prisma.culture.findFirst({
    where: { id: cultureId, parcel: { farmId } },
  });
}

router.get("/", async (req, res) => {
  const harvests = await prisma.harvest.findMany({
    where: { culture: { parcel: { farmId: req.user.farmId } } },
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
  res.json(harvests);
});

router.post("/", requireRole("ADMIN", "FARMER"), async (req, res) => {
  const { cultureId, date, quantity, unit, quality, salePrice } = req.body;
  if (!cultureId || quantity == null || !date) {
    return res.status(400).json({ error: "Culture, quantité et date requis" });
  }
  const q = Number(quantity);
  if (Number.isNaN(q) || q < 0) {
    return res.status(400).json({ error: "Quantité invalide" });
  }
  const cult = await assertCultureFarm(cultureId, req.user.farmId);
  if (!cult) return res.status(400).json({ error: "Culture invalide" });
  const h = await prisma.harvest.create({
    data: {
      cultureId,
      date: new Date(date),
      quantity: q,
      unit: unit?.trim() || "kg",
      quality: quality?.trim() || null,
      salePrice: salePrice != null && salePrice !== "" ? Number(salePrice) : null,
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
  res.status(201).json(h);
});

router.patch("/:id", requireRole("ADMIN", "FARMER"), async (req, res) => {
  const existing = await prisma.harvest.findFirst({
    where: { id: req.params.id, culture: { parcel: { farmId: req.user.farmId } } },
  });
  if (!existing) return res.status(404).json({ error: "Récolte introuvable" });
  const { date, quantity, unit, quality, salePrice } = req.body;
  const h = await prisma.harvest.update({
    where: { id: req.params.id },
    data: {
      ...(date != null && { date: new Date(date) }),
      ...(quantity != null && { quantity: Number(quantity) }),
      ...(unit !== undefined && { unit: unit?.trim() || "kg" }),
      ...(quality !== undefined && { quality: quality?.trim() || null }),
      ...(salePrice !== undefined && {
        salePrice: salePrice != null && salePrice !== "" ? Number(salePrice) : null,
      }),
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
  res.json(h);
});

router.delete("/:id", requireRole("ADMIN", "FARMER"), async (req, res) => {
  const existing = await prisma.harvest.findFirst({
    where: { id: req.params.id, culture: { parcel: { farmId: req.user.farmId } } },
  });
  if (!existing) return res.status(404).json({ error: "Récolte introuvable" });
  await prisma.harvest.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
