import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/client.js";
import { badRequest, unauthorized } from "../utils/httpError.js";
import { toSafeUser } from "../utils/userResponse.js";

const SALT_ROUNDS = 12;

function signToken(user) {
  return jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

export async function register(req, res) {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;
  const name = req.body.name?.trim();
  const avatarUrl = req.body.avatarUrl?.trim() || null;

  if (!email || !password || !name) {
    throw badRequest("Name, email and password are required");
  }

  if (password.length < 6) {
    throw badRequest("Password must be at least 6 characters");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw badRequest("Email is already registered");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      avatarUrl,
      password: hashedPassword,
    },
  });

  res.status(201).json({
    token: signToken(user),
    user: toSafeUser(user),
  });
}

export async function login(req, res) {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (!email || !password) {
    throw badRequest("Email and password are required");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const isValid = user ? await bcrypt.compare(password, user.password) : false;

  if (!isValid) {
    throw unauthorized("Invalid email or password");
  }

  res.json({
    token: signToken(user),
    user: toSafeUser(user),
  });
}

export async function me(req, res) {
  const memberships = await prisma.journeyMember.findMany({
    where: { userId: req.user.id },
    include: { journey: true },
    orderBy: { createdAt: "desc" },
  });

  res.json({
    user: toSafeUser(req.user),
    journeys: memberships.map((membership) => membership.journey),
  });
}
