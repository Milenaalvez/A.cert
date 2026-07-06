import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getSetting } from '../lib/prisma.js';

const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error('JWT_SECRET não definido nas variáveis de ambiente');
}
const JWT_SECRET: string = secret;

export interface AuthPayload {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export async function gerarToken(payload: AuthPayload): Promise<string> {
  const sessionMax = await getSetting('session_max', '10080');
  const minutes = parseInt(sessionMax || '10080', 10);
  const days = Math.max(1, Math.ceil(minutes / 1440));
  return jwt.sign(payload, JWT_SECRET, { expiresIn: `${days}d` });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token não fornecido' });
    return;
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}
