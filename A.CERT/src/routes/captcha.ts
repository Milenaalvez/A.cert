import { Router } from 'express';
import svgCaptcha from 'svg-captcha';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const store = new Map<string, { solution: string; expiresAt: number }>();

const TTL = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of store) {
    if (entry.expiresAt < now) store.delete(token);
  }
}, 60_000);

router.post('/generate', (_req, res) => {
  const captcha = svgCaptcha.createMathExpr({
    mathMin: 1,
    mathMax: 20,
    mathOperator: '+',
    noise: 3,
    color: true,
  });

  const token = uuidv4();
  store.set(token, { solution: captcha.text, expiresAt: Date.now() + TTL });

  res.json({ svg: captcha.data, token });
});

router.post('/verify', (req, res) => {
  const { token, answer } = req.body;

  if (!token || !answer) {
    res.status(400).json({ valid: false, error: 'Token e resposta são obrigatórios' });
    return;
  }

  const entry = store.get(token);
  if (!entry) {
    res.status(400).json({ valid: false, error: 'CAPTCHA expirado ou já utilizado' });
    return;
  }

  if (entry.solution !== String(answer).trim()) {
    res.json({ valid: false, error: 'Resposta incorreta' });
    return;
  }

  store.delete(token);

  const verifiedToken = uuidv4();
  store.set(verifiedToken, { solution: '__verified__', expiresAt: Date.now() + 120_000 });

  res.json({ valid: true, verifiedToken });
});

export function checkCaptchaVerified(token: string | undefined): boolean {
  if (!token) return false;
  const entry = store.get(token);
  if (!entry || entry.solution !== '__verified__') return false;
  store.delete(token);
  return true;
}

export default router;
