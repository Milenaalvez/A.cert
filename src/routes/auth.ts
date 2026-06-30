import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID, randomBytes } from 'node:crypto';
import prisma, { queryRaw, queryRawOne, executeRaw } from '../lib/prisma.js';
import { gerarToken, authMiddleware } from '../middleware/auth.js';
import { enviarEmailConfirmacao, enviarEmailRedefinirSenha } from '../services/email.service.js';
import { validarSenhaForte, validarEmail } from '../utils/validation.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
      return;
    }

    if (!validarEmail(email)) {
      res.status(400).json({ error: 'Email inválido' });
      return;
    }

    const senha = validarSenhaForte(password);
    if (!senha.valida) {
      res.status(400).json({ error: `Senha deve conter: ${senha.erros.join(', ')}` });
      return;
    }

    const existing = await queryRawOne('SELECT id FROM users WHERE email = $1', email);
    if (existing) {
      res.status(409).json({ error: 'Este email já está cadastrado' });
      return;
    }

    const id = randomUUID();
    const password_hash = bcrypt.hashSync(password, 10);
    const confirmation_token = randomBytes(32).toString('hex');
    const created_at = new Date().toISOString();

    await executeRaw(
      'INSERT INTO users (id, name, email, password_hash, confirmation_token, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      id, name.trim(), email.toLowerCase().trim(), password_hash, confirmation_token, created_at
    );

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

router.get('/confirmar/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await queryRawOne(
      'SELECT id, email_confirmed FROM users WHERE confirmation_token = $1', token
    );

    if (!user) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?confirmacao=invalido`);
      return;
    }

    if (user.email_confirmed === 1) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?confirmacao=ja_confirmado`);
      return;
    }

    await executeRaw('UPDATE users SET email_confirmed = 1, confirmation_token = NULL WHERE id = $1', user.id);

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?confirmacao=ok`);
  } catch (error) {
    console.error('[Auth] Erro na confirmação:', error);
    res.status(500).json({ error: 'Erro interno ao confirmar email' });
  }
});

router.post('/reenviar-confirmacao', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email é obrigatório' });
      return;
    }

    const user = await queryRawOne(
      'SELECT id, name, email_confirmed FROM users WHERE email = $1', email.toLowerCase().trim()
    );

    if (!user) {
      res.status(404).json({ error: 'Email não encontrado' });
      return;
    }

    if (user.email_confirmed === 1) {
      res.status(400).json({ error: 'Email já está confirmado' });
      return;
    }

    const confirmation_token = randomBytes(32).toString('hex');
    await executeRaw('UPDATE users SET confirmation_token = $1 WHERE id = $2', confirmation_token, user.id);

    enviarEmailConfirmacao(email.trim(), user.name, confirmation_token);

    res.json({ success: true, message: 'Email de confirmação reenviado!' });
  } catch (error) {
    console.error('[Auth] Erro ao reenviar:', error);
    res.status(500).json({ error: 'Erro interno ao reenviar email' });
  }
});

router.post('/esqueci-senha', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email é obrigatório' });
      return;
    }

    const user = await queryRawOne(
      'SELECT id, name FROM users WHERE email = $1', email.toLowerCase().trim()
    );

    // Não revela se o email existe ou não (segurança)
    if (!user) {
      res.json({ success: true, message: 'Se o email existir, enviaremos um link de redefinição.' });
      return;
    }

    const reset_token = randomBytes(32).toString('hex');
    const reset_token_expires = new Date(Date.now() + 3600000).toISOString(); // 1h

    await executeRaw('UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      reset_token, reset_token_expires, user.id);

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

router.post('/verificar-token-redefinir', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Token é obrigatório' });
      return;
    }

    const user = await queryRawOne(
      'SELECT id, reset_token_expires FROM users WHERE reset_token = $1', token
    );

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

router.post('/redefinir-senha', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
      return;
    }

    const senha = validarSenhaForte(password);
    if (!senha.valida) {
      res.status(400).json({ error: `Senha deve conter: ${senha.erros.join(', ')}` });
      return;
    }

    const user = await queryRawOne(
      'SELECT id, reset_token_expires FROM users WHERE reset_token = $1', token
    );

    if (!user) {
      res.status(400).json({ error: 'Link inválido ou já utilizado.' });
      return;
    }

    if (new Date(user.reset_token_expires) < new Date()) {
      res.status(400).json({ error: 'Link expirado. Solicite uma nova redefinição.' });
      return;
    }

    const password_hash = bcrypt.hashSync(password, 10);
    await executeRaw('UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      password_hash, user.id);

    res.json({ success: true, message: 'Senha atualizada com sucesso!' });
  } catch (error) {
    console.error('[Auth] Erro ao redefinir senha:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email e senha são obrigatórios' });
      return;
    }

    const user = await queryRawOne(
      'SELECT id, name, email, password_hash, email_confirmed, avatar, password_change_required FROM users WHERE email = $1', email.toLowerCase().trim()
    );

    if (!user) {
      res.status(401).json({ error: 'Email ou senha incorretos' });
      return;
    }

    if (!user.email_confirmed && process.env.BYPASS_EMAIL_CONFIRM !== 'true') {
      res.status(403).json({ error: 'Confirme seu email antes de acessar. Verifique sua caixa de entrada.', precisaConfirmar: true });
      return;
    }

    const senhaValida = bcrypt.compareSync(password, user.password_hash);
    if (!senhaValida) {
      res.status(401).json({ error: 'Email ou senha incorretos' });
      return;
    }

    await executeRaw("UPDATE users SET last_access_at = NOW() WHERE id = $1", user.id);

    if (user.password_change_required) {
      const changeToken = gerarToken({ userId: user.id, email: user.email });
      res.json({
        precisaTrocarSenha: true,
        changeToken,
        user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
      });
      return;
    }

    const token = gerarToken({ userId: user.id, email: user.email });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (error) {
    console.error('[Auth] Erro no login:', error);
    res.status(500).json({ error: 'Erro interno ao fazer login' });
  }
});

router.post('/trocar-senha', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword) {
      res.status(400).json({ error: 'Nova senha é obrigatória' });
      return;
    }

    const senha = validarSenhaForte(newPassword);
    if (!senha.valida) {
      res.status(400).json({ error: `Senha deve conter: ${senha.erros.join(', ')}` });
      return;
    }

    const user = await queryRawOne(
      'SELECT password_hash, password_change_required FROM users WHERE id = $1', req.user!.userId
    );

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    if (!user.password_change_required && currentPassword) {
      const senhaAtualValida = bcrypt.compareSync(currentPassword, user.password_hash);
      if (!senhaAtualValida) {
        res.status(401).json({ error: 'Senha atual incorreta' });
        return;
      }
    }

    const password_hash = bcrypt.hashSync(newPassword, 10);
    await executeRaw('UPDATE users SET password_hash = $1, password_change_required = 0 WHERE id = $2',
      password_hash, req.user!.userId);

    const token = gerarToken({ userId: req.user!.userId, email: req.user!.email });

    res.json({ success: true, token, message: 'Senha atualizada com sucesso!' });
  } catch (error) {
    console.error('[Auth] Erro ao trocar senha:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await queryRawOne(
      `SELECT id, name, email, phone, avatar, role, registration_number, created_at, last_access_at
       FROM users WHERE id = $1`, req.user!.userId
    );

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

router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { phone, avatar } = req.body;
    const updates: string[] = [];
    const params: unknown[] = [];

    let idx = 1;
    if (phone !== undefined) { updates.push(`phone = $${idx}`); params.push(phone); idx++; }
    if (avatar !== undefined) { updates.push(`avatar = $${idx}`); params.push(avatar); idx++; }

    if (updates.length === 0) {
      res.status(400).json({ error: 'Nenhum campo para atualizar' });
      return;
    }

    params.push(req.user!.userId);
    await executeRaw(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, ...params);

    const user = await queryRawOne(
      `SELECT id, name, email, phone, avatar, role, registration_number, created_at, last_access_at
       FROM users WHERE id = $1`, req.user!.userId
    );

    res.json({ success: true, user });
  } catch (error) {
    console.error('[Auth] Erro no put /me:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

const ROLES_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  ANALYST: 'Analista Documental',
  EMPLOYE: 'Corretor',
};

router.get('/me/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const dossiersEmAndamento = (await queryRawOne(
      "SELECT COUNT(*) as count FROM dossiers WHERE created_by = $1 AND status = 'Em andamento' AND deleted_at IS NULL", userId
    ) as { count: number }).count;

    const dossiersConcluidos = (await queryRawOne(
      "SELECT COUNT(*) as count FROM dossiers WHERE created_by = $1 AND status = 'Concluído' AND deleted_at IS NULL", userId
    ) as { count: number }).count;

    const totalCertidoes = (await queryRawOne(
      `SELECT COUNT(*) as count FROM certificates c
       JOIN dossiers d ON c.dossier_id = d.id
       WHERE d.created_by = $1 AND c.status = 'Emitida'`, userId
    ) as { count: number }).count;

    const recentActivities = await queryRaw(
      `SELECT id, action, reference, dossier_ref, created_at
       FROM activities WHERE user_name = (SELECT name FROM users WHERE id = $1)
       ORDER BY created_at DESC LIMIT 15`, userId
    ) as any[];

    res.json({
      dossiersEmAndamento,
      dossiersConcluidos,
      totalCertidoes,
      recentActivities,
    });
  } catch (error) {
    console.error('[Auth] Erro no me/stats:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
