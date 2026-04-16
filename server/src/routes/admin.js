import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);
router.use(requireRole("ADMIN"));

router.get("/users", async (req, res) => {
  const users = await prisma.user.findMany({
    where: { farmId: req.user.farmId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
});

router.post("/users", async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Email, mot de passe et nom requis" });
  }
  const r = role === "WORKER" || role === "FARMER" ? role : "FARMER";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: "Cet email est déjà utilisé" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: r,
      farmId: req.user.farmId,
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  res.status(201).json(user);
});

router.patch("/users/:id", async (req, res) => {
  const { name, role } = req.body;
  const target = await prisma.user.findFirst({
    where: { id: req.params.id, farmId: req.user.farmId },
  });
  if (!target) return res.status(404).json({ error: "Utilisateur introuvable" });
  if (target.id === req.user.id && role && role !== "ADMIN") {
    return res.status(400).json({ error: "Vous ne pouvez pas retirer votre propre rôle admin" });
  }
  const r =
    role === "WORKER" || role === "FARMER" || role === "ADMIN" ? role : target.role;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      ...(name != null && { name: String(name).trim() }),
      ...(role != null && { role: r }),
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  res.json(user);
});

router.delete("/users/:id", async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: "Impossible de supprimer votre propre compte" });
  }
  const target = await prisma.user.findFirst({
    where: { id: req.params.id, farmId: req.user.farmId },
  });
  if (!target) return res.status(404).json({ error: "Utilisateur introuvable" });
  await prisma.user.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
