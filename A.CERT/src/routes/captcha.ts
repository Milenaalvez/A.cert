import { Router } from 'express';

const router = Router();

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY || '';
const VERIFIED_TOKENS = new Set<string>();

router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ valid: false, error: 'Token é obrigatório' });
      return;
    }

    const formData = new URLSearchParams();
    formData.append('secret', TURNSTILE_SECRET);
    formData.append('response', token);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json() as { success: boolean; 'error-codes'?: string[] };

    if (data.success) {
      VERIFIED_TOKENS.add(token);
      setTimeout(() => VERIFIED_TOKENS.delete(token), 120_000);
      res.json({ valid: true });
    } else {
      res.json({ valid: false, error: (data['error-codes'] || ['verification-failed']).join(', ') });
    }
  } catch (err) {
    console.error('[Turnstile] Erro na verificação:', err);
    res.status(500).json({ valid: false, error: 'Erro ao verificar CAPTCHA' });
  }
});

export function checkCaptchaVerified(token: string | undefined): boolean {
  if (!token) return false;
  const exists = VERIFIED_TOKENS.has(token);
  if (exists) VERIFIED_TOKENS.delete(token);
  return exists;
}

export default router;
