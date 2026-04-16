import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { signToken, authMiddleware } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password, name, farmName } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, mot de passe et nom requis" });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Cet email est déjà utilisé" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const farm = await prisma.farm.create({
      data: { name: farmName?.trim() || `Ferme de ${name}` },
    });
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: "FARMER",
        farmId: farm.id,
      },
    });
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      farmId: user.farmId,
    });
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        farmId: user.farmId,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      farmId: user.farmId,
    });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        farmId: user.farmId,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true, role: true, farmId: true },
  });
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
  res.json(user);
});

export default router;
