import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

async function assertParcelFarm(parcelId, farmId) {
  const p = await prisma.parcel.findFirst({
    where: { id: parcelId, farmId },
  });
  return p;
}

router.get("/", async (req, res) => {
  const cultures = await prisma.culture.findMany({
    where: { parcel: { farmId: req.user.farmId } },
    orderBy: { sowingDate: "desc" },
    include: {
      parcel: { select: { id: true, name: true } },
      harvests: { select: { quantity: true, salePrice: true } },
      expenses: { select: { amount: true } },
    },
  });
  res.json(cultures);
});

router.post("/", requireRole("ADMIN", "FARMER"), async (req, res) => {
  const { parcelId, plantType, seedType, sowingDate, notes } = req.body;
  if (!parcelId || !plantType?.trim() || !sowingDate) {
    return res.status(400).json({ error: "Parcelle, type de plante et date de semis requis" });
  }
  const parcel = await assertParcelFarm(parcelId, req.user.farmId);
  if (!parcel) return res.status(400).json({ error: "Parcelle invalide" });
  const c = await prisma.culture.create({
    data: {
      parcelId,
      plantType: plantType.trim(),
      seedType: seedType?.trim() || null,
      sowingDate: new Date(sowingDate),
      notes: notes?.trim() || null,
    },
    include: { parcel: { select: { id: true, name: true } } },
  });
  res.status(201).json(c);
});

router.patch("/:id", requireRole("ADMIN", "FARMER"), async (req, res) => {
  const { plantType, seedType, sowingDate, notes } = req.body;
  const existing = await prisma.culture.findFirst({
    where: { id: req.params.id, parcel: { farmId: req.user.farmId } },
  });
  if (!existing) return res.status(404).json({ error: "Culture introuvable" });
  const c = await prisma.culture.update({
    where: { id: req.params.id },
    data: {
      ...(plantType != null && { plantType: String(plantType).trim() }),
      ...(seedType !== undefined && { seedType: seedType?.trim() || null }),
      ...(sowingDate != null && { sowingDate: new Date(sowingDate) }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
    },
    include: { parcel: { select: { id: true, name: true } } },
  });
  res.json(c);
});

router.delete("/:id", requireRole("ADMIN", "FARMER"), async (req, res) => {
  const existing = await prisma.culture.findFirst({
    where: { id: req.params.id, parcel: { farmId: req.user.farmId } },
  });
  if (!existing) return res.status(404).json({ error: "Culture introuvable" });
  await prisma.culture.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
