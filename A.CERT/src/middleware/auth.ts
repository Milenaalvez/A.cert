import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { executeRaw } from '../lib/prisma.js';

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

export function gerarToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
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

    executeRaw(
      "UPDATE users SET last_access_at = $1 WHERE id = $2",
      new Date().toISOString(), decoded.userId
    ).catch((err: any) => {
      console.error('[Auth] Erro ao atualizar last_access_at:', err?.message);
    });

    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}
