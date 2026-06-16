import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID, randomBytes } from 'node:crypto';
import db from '../database.js';
import { gerarToken, authMiddleware } from '../middleware/auth.js';
import { enviarEmailConfirmacao, enviarEmailRedefinirSenha } from '../services/email.service.js';

const router = Router();

router.post('/register', (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
      return;
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      res.status(409).json({ error: 'Este email já está cadastrado' });
      return;
    }

    const id = randomUUID();
    const password_hash = bcrypt.hashSync(password, 10);
    const confirmation_token = randomBytes(32).toString('hex');
    const created_at = new Date().toISOString();

    db.prepare(
      'INSERT INTO users (id, name, email, password_hash, confirmation_token, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, name.trim(), email.toLowerCase().trim(), password_hash, confirmation_token, created_at);

    const smtpConfigurado = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    enviarEmailConfirmacao(email.trim(), name.trim(), confirmation_token);

    const response: Record<string, unknown> = {
      success: true,
      message: smtpConfigurado
        ? 'Cadastro realizado! Enviamos um email de confirmação para ' + email.trim()
        : 'Cadastro realizado! (modo dev)',
    };

    if (!smtpConfigurado) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      response.confirmationLink = `${frontendUrl}/api/auth/confirmar/${confirmation_token}`;
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('[Auth] Erro no register:', error);
    res.status(500).json({ error: 'Erro interno ao criar conta' });
  }
});

router.get('/confirmar/:token', (req, res) => {
  try {
    const { token } = req.params;

    const user = db.prepare(
      'SELECT id, email_confirmed FROM users WHERE confirmation_token = ?'
    ).get(token) as { id: string; email_confirmed: number } | undefined;

    if (!user) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?confirmacao=invalido`);
      return;
    }

    if (user.email_confirmed === 1) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?confirmacao=ja_confirmado`);
      return;
    }

    db.prepare('UPDATE users SET email_confirmed = 1, confirmation_token = NULL WHERE id = ?').run(user.id);

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?confirmacao=ok`);
  } catch (error) {
    console.error('[Auth] Erro na confirmação:', error);
    res.status(500).json({ error: 'Erro interno ao confirmar email' });
  }
});

router.post('/reenviar-confirmacao', (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email é obrigatório' });
      return;
    }

    const user = db.prepare(
      'SELECT id, name, email_confirmed FROM users WHERE email = ?'
    ).get(email.toLowerCase().trim()) as { id: string; name: string; email_confirmed: number } | undefined;

    if (!user) {
      res.status(404).json({ error: 'Email não encontrado' });
      return;
    }

    if (user.email_confirmed === 1) {
      res.status(400).json({ error: 'Email já está confirmado' });
      return;
    }

    const confirmation_token = randomBytes(32).toString('hex');
    db.prepare('UPDATE users SET confirmation_token = ? WHERE id = ?').run(confirmation_token, user.id);

    enviarEmailConfirmacao(email.trim(), user.name, confirmation_token);

    res.json({ success: true, message: 'Email de confirmação reenviado!' });
  } catch (error) {
    console.error('[Auth] Erro ao reenviar:', error);
    res.status(500).json({ error: 'Erro interno ao reenviar email' });
  }
});

router.post('/esqueci-senha', (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email é obrigatório' });
      return;
    }

    const user = db.prepare(
      'SELECT id, name FROM users WHERE email = ?'
    ).get(email.toLowerCase().trim()) as { id: string; name: string } | undefined;

    // Não revela se o email existe ou não (segurança)
    if (!user) {
      res.json({ success: true, message: 'Se o email existir, enviaremos um link de redefinição.' });
      return;
    }

    const reset_token = randomBytes(32).toString('hex');
    const reset_token_expires = new Date(Date.now() + 3600000).toISOString(); // 1h

    db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?')
      .run(reset_token, reset_token_expires, user.id);

    enviarEmailRedefinirSenha(email.trim(), user.name, reset_token);

    const smtpConfigurado = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    const response: Record<string, unknown> = {
      success: true,
      message: 'Se o email existir, enviaremos um link de redefinição.',
    };

    if (!smtpConfigurado) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      response.resetLink = `${frontendUrl}/redefinir-senha?token=${reset_token}`;
    }

    res.json(response);
  } catch (error) {
    console.error('[Auth] Erro no esqueci-senha:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/verificar-token-redefinir', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Token é obrigatório' });
      return;
    }

    const user = db.prepare(
      'SELECT id, reset_token_expires FROM users WHERE reset_token = ?'
    ).get(token) as { id: string; reset_token_expires: string } | undefined;

    if (!user) {
      res.status(400).json({ error: 'Link inválido ou já utilizado.' });
      return;
    }

    if (new Date(user.reset_token_expires) < new Date()) {
      res.status(400).json({ error: 'Link expirado. Solicite uma nova redefinição.' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Auth] Erro ao verificar token:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/redefinir-senha', (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
      return;
    }

    const user = db.prepare(
      'SELECT id, reset_token_expires FROM users WHERE reset_token = ?'
    ).get(token) as { id: string; reset_token_expires: string } | undefined;

    if (!user) {
      res.status(400).json({ error: 'Link inválido ou já utilizado.' });
      return;
    }

    if (new Date(user.reset_token_expires) < new Date()) {
      res.status(400).json({ error: 'Link expirado. Solicite uma nova redefinição.' });
      return;
    }

    const password_hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?')
      .run(password_hash, user.id);

    res.json({ success: true, message: 'Senha atualizada com sucesso!' });
  } catch (error) {
    console.error('[Auth] Erro ao redefinir senha:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email e senha são obrigatórios' });
      return;
    }

    const user = db.prepare(
      'SELECT id, name, email, password_hash, email_confirmed FROM users WHERE email = ?'
    ).get(email.toLowerCase().trim()) as { id: string; name: string; email: string; password_hash: string; email_confirmed: number } | undefined;

    if (!user) {
      res.status(401).json({ error: 'Email ou senha incorretos' });
      return;
    }

    if (!user.email_confirmed) {
      res.status(403).json({ error: 'Confirme seu email antes de acessar. Verifique sua caixa de entrada.', precisaConfirmar: true });
      return;
    }

    const senhaValida = bcrypt.compareSync(password, user.password_hash);
    if (!senhaValida) {
      res.status(401).json({ error: 'Email ou senha incorretos' });
      return;
    }

    const token = gerarToken({ userId: user.id, email: user.email });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('[Auth] Erro no login:', error);
    res.status(500).json({ error: 'Erro interno ao fazer login' });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id, name, email, phone, created_at FROM users WHERE id = ?'
    ).get(req.user!.userId) as { id: string; name: string; email: string; phone: string | null; created_at: string } | undefined;

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('[Auth] Erro no me:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
