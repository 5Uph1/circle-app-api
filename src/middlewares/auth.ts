import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/express";
import { verifyToken } from "../utils/jwt";

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = verifyToken(token) as { id: number; username?: string };

    req.user = decoded; // ✅ sekarang AMAN
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid Token" });
  }
}
