import jwt from "jsonwebtoken";
import { prisma } from "../prisma/client.js";
import { unauthorized } from "../utils/httpError.js";

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      throw unauthorized("Missing auth token");
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user) {
      throw unauthorized("Invalid auth token");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error.status ? error : unauthorized("Invalid auth token"));
  }
}
