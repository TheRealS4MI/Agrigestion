import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req, res) => {
  const parcels = await prisma.parcel.findMany({
    where: { farmId: req.user.farmId },
    orderBy: { name: "asc" },
    include: { _count: { select: { cultures: true } } },
  });
  res.json(parcels);
});

router.post("/", requireRole("ADMIN", "FARMER"), async (req, res) => {
  const { name, city, soilType } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Nom de parcelle requis" });
  const p = await prisma.parcel.create({
    data: {
      name: name.trim(),
      city: city?.trim() || null,
      soilType: soilType?.trim() || null,
      farmId: req.user.farmId,
    },
  });
  res.status(201).json(p);
});

router.patch("/:id", requireRole("ADMIN", "FARMER"), async (req, res) => {
  const { name, city, soilType } = req.body;
  const existing = await prisma.parcel.findFirst({
    where: { id: req.params.id, farmId: req.user.farmId },
  });
  if (!existing) return res.status(404).json({ error: "Parcelle introuvable" });
  const p = await prisma.parcel.update({
    where: { id: req.params.id },
    data: {
      ...(name != null && { name: String(name).trim() }),
      ...(city !== undefined && { city: city?.trim() || null }),
      ...(soilType !== undefined && { soilType: soilType?.trim() || null }),
    },
  });
  res.json(p);
});

router.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  const existing = await prisma.parcel.findFirst({
    where: { id: req.params.id, farmId: req.user.farmId },
  });
  if (!existing) return res.status(404).json({ error: "Parcelle introuvable" });
  await prisma.parcel.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
