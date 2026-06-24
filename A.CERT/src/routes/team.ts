import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import db from '../database.js';

/* ─── Helpers ─── */

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

interface UserRow {
  id: string; name: string; email: string; role: string | null;
  department_id: string | null; position_id: string | null; contract_type: string | null;
  weekly_hours: number | null; work_schedule: string | null; hire_date: string | null;
  is_active: number | null; email_verified: number | null; last_access_at: string | null;
  company_id: string | null; avatar: string | null; registration_number: string | null;
  employee_code: string | null; phone: string | null;
  department_name: string | null; position_name: string | null;
}

function enrich(u: UserRow): Record<string, unknown> {
  const todayRec = db.prepare(`
    SELECT clock_in, clock_out, break_start, break_end, total_minutes, review_status
    FROM time_records WHERE user_id = ? AND date = ?
  `).get(u.id, todayStr()) as any;
  const monthTotal = db.prepare(`
    SELECT COALESCE(SUM(total_minutes), 0) as total
    FROM time_records WHERE user_id = ? AND date LIKE ? AND review_status = 'APPROVED'
  `).get(u.id, `${todayStr().slice(0, 7)}%`) as any;
  const pendingJust = db.prepare(`
    SELECT id, reason, start_date, end_date FROM justifications
    WHERE user_id = ? AND status = 'PENDING' LIMIT 1
  `).get(u.id) as any;
  const balance = (u.weekly_hours || 40) * 4.5 - ((monthTotal?.total || 0) / 60);

  return {
    id: u.id, name: u.name, email: u.email, role: u.role || 'EMPLOYEE',
    department: u.department_name, departmentId: u.department_id,
    position: u.position_name, positionId: u.position_id,
    contractType: u.contract_type, registrationNumber: u.registration_number,
    phone: u.phone, avatar: u.avatar, employeeCode: u.employee_code,
    weeklyHours: u.weekly_hours || 40, workSchedule: u.work_schedule || 'Seg-Sex',
    hireDate: u.hire_date, isActive: u.is_active === 1,
    emailVerified: u.email_verified === 1, lastAccessAt: u.last_access_at,
    companyId: u.company_id || 'acert-1',
    todayClockIn: todayRec?.clock_in || null,
    todayClockOut: todayRec?.clock_out || null,
    todayTotalMinutes: todayRec?.total_minutes || null,
    todayStatus: todayRec ? (todayRec.total_minutes && todayRec.total_minutes > 480 ? 'OVERTIME' : 'NORMAL') : null,
    monthTotalMinutes: monthTotal?.total || 0,
    balanceHours: Math.round(balance * 100) / 100,
    isOnline: !!todayRec,
    pendingJustification: pendingJust ? { id: pendingJust.id, reason: pendingJust.reason, startDate: pendingJust.start_date, endDate: pendingJust.end_date } : null,
  };
}

/* ═══════════════════════════════════════
   /api/team/* Router
   ═══════════════════════════════════════ */
export const teamRouter = Router();

// GET /api/team/enriched
teamRouter.get('/enriched', (_req, res) => {
  try {
    const rows = db.prepare(`
      SELECT u.*, d.name as department_name, p.name as position_name
      FROM users u
      LEFT JOIN departments d ON d.id = u.department_id
      LEFT JOIN positions p ON p.id = u.position_id
      ORDER BY u.name ASC
    `).all() as UserRow[];
    res.json(rows.map(enrich));
  } catch (err) {
    console.error('[Team] Erro ao listar:', err);
    res.status(500).json({ error: 'Erro ao carregar equipe' });
  }
});

// GET /api/team/metrics
teamRouter.get('/metrics', (_req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as c FROM users').get() as any;
    const active = db.prepare('SELECT COUNT(*) as c FROM users WHERE is_active = 1').get() as any;
    const inactive = db.prepare('SELECT COUNT(*) as c FROM users WHERE is_active = 0').get() as any;
    const verified = db.prepare('SELECT COUNT(*) as c FROM users WHERE email_verified = 1').get() as any;
    const todayRecs = db.prepare(`
      SELECT DISTINCT user_id FROM time_records WHERE date = ?
    `).all(todayStr()) as { user_id: string }[];
    const pendingJustsCount = db.prepare('SELECT COUNT(*) as c FROM justifications WHERE status = \'PENDING\'').get() as any;
    const hiresThisMonth = db.prepare(`
      SELECT COUNT(*) as c FROM users WHERE hire_date LIKE ? AND is_active = 1
    `).get(`${todayStr().slice(0, 7)}%`) as any;
    const lastMonthHires = db.prepare(`
      SELECT COUNT(*) as c FROM users WHERE hire_date LIKE ? AND is_active = 1
    `).get(`${new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7)}%`) as any;

    res.json({
      total: total.c, active: active.c, inactive: inactive.c, verified: verified.c,
      presentToday: todayRecs.length,
      lateToday: 0, absentToday: 0,
      pendingJustifications: pendingJustsCount.c,
      hiresThisMonth: hiresThisMonth.c,
      deactivationsThisMonth: 0,
      hiresTrend: (hiresThisMonth.c || 0) >= (lastMonthHires.c || 0) ? 'up' as const : 'down' as const,
      deactivationsTrend: 'stable' as const,
    });
  } catch (err) {
    console.error('[Team] Erro nas métricas:', err);
    res.status(500).json({ error: 'Erro ao carregar métricas' });
  }
});

// GET /api/team/activities
teamRouter.get('/activities', (_req, res) => {
  try {
    const acts = db.prepare(`
      SELECT * FROM team_activities ORDER BY timestamp DESC LIMIT 50
    `).all() as any[];
    res.json(acts.map((a: any) => ({
      id: a.id, action: a.action, description: a.description,
      entityType: a.entity_type, entityId: a.entity_id,
      metadata: null, timestamp: a.timestamp,
      userId: a.user_id, targetUserId: a.target_user_id,
      user: { id: a.user_id, name: a.user_name, avatar: null, role: '' },
      targetUser: a.target_user_name ? { id: a.target_user_id, name: a.target_user_name, avatar: null } : null,
    })));
  } catch (err) {
    console.error('[Team] Erro nas atividades:', err);
    res.status(500).json({ error: 'Erro ao carregar atividades' });
  }
});

// POST /api/team
teamRouter.post('/', (req, res) => {
  try {
    const { name, email, role, departmentId, positionId, contractType, weeklyHours, workSchedule, hireDate, phone } = req.body;
    if (!name || !email) {
      res.status(400).json({ error: 'Nome e email são obrigatórios' });
      return;
    }
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      res.status(409).json({ error: 'Email já cadastrado' });
      return;
    }
    const id = randomUUID();
    const tempPassword = randomUUID().slice(0, 8);
    const password_hash = bcrypt.hashSync(tempPassword, 10);
    const regNum = String((db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c + 1001);

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, department_id, position_id, contract_type, weekly_hours, work_schedule, hire_date, phone, registration_number, is_active, email_verified, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, datetime('now'))
    `).run(id, name.trim(), email.toLowerCase().trim(), password_hash, role || 'EMPLOYEE', departmentId || null, positionId || null, contractType || 'CLT', weeklyHours || 40, workSchedule || 'Seg-Sex', hireDate || null, phone || null, regNum);

    db.prepare(`
      INSERT INTO team_activities (id, user_id, user_name, action, description, entity_type, entity_id, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(randomUUID(), id, name.trim(), 'CREATE_USER', `Criou o colaborador ${name.trim()}`, 'user', id);

    res.status(201).json({
      tempPassword,
      user: { id, name: name.trim(), email: email.toLowerCase().trim(), registrationNumber: regNum },
    });
  } catch (err) {
    console.error('[Team] Erro ao criar:', err);
    res.status(500).json({ error: 'Erro ao criar colaborador' });
  }
});

// PUT /api/team/:id
teamRouter.put('/:id', (req, res) => {
  try {
    const { name, role, departmentId, positionId, contractType, weeklyHours, workSchedule, phone } = req.body;
    db.prepare(`
      UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role), department_id = COALESCE(?, department_id), position_id = COALESCE(?, position_id), contract_type = COALESCE(?, contract_type), weekly_hours = COALESCE(?, weekly_hours), work_schedule = COALESCE(?, work_schedule), phone = COALESCE(?, phone)
      WHERE id = ?
    `).run(name || null, role || null, departmentId || null, positionId || null, contractType || null, weeklyHours != null ? weeklyHours : null, workSchedule || null, phone || null, req.params.id);

    res.json({ success: true });
  } catch (err) {
    console.error('[Team] Erro ao atualizar:', err);
    res.status(500).json({ error: 'Erro ao atualizar colaborador' });
  }
});

// PUT /api/team/:id/role
teamRouter.put('/:id/role', (req, res) => {
  try {
    const { role } = req.body;
    if (!role) { res.status(400).json({ error: 'Role é obrigatório' }); return; }
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[Team] Erro ao alterar cargo:', err);
    res.status(500).json({ error: 'Erro ao alterar cargo' });
  }
});

// POST /api/team/:id/resend-verification
teamRouter.post('/:id/resend-verification', (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, email_verified FROM users WHERE id = ?').get(req.params.id) as any;
    if (!user) { res.status(404).json({ error: 'Usuário não encontrado' }); return; }
    if (user.email_verified) { res.status(400).json({ error: 'Email já verificado' }); return; }
    // In a real app, send email here
    res.json({ success: true, message: 'Email de verificação reenviado' });
  } catch (err) {
    console.error('[Team] Erro ao reenviar verificação:', err);
    res.status(500).json({ error: 'Erro ao reenviar verificação' });
  }
});

// PATCH /api/team/:id/status
teamRouter.patch('/:id/status', (req, res) => {
  try {
    const { active } = req.body;
    db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(active ? 1 : 0, req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[Team] Erro ao alterar status:', err);
    res.status(500).json({ error: 'Erro ao alterar status' });
  }
});

// POST /api/team/:id/reset-password
teamRouter.post('/:id/reset-password', (req, res) => {
  try {
    const user = db.prepare('SELECT id, name FROM users WHERE id = ?').get(req.params.id) as any;
    if (!user) { res.status(404).json({ error: 'Usuário não encontrado' }); return; }
    const tempPassword = randomUUID().slice(0, 8);
    const password_hash = bcrypt.hashSync(tempPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(password_hash, user.id);
    res.json({ tempPassword });
  } catch (err) {
    console.error('[Team] Erro ao resetar senha:', err);
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
});

// DELETE /api/team/:id
teamRouter.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM user_permissions WHERE user_id = ?').run(req.params.id);
    db.prepare('DELETE FROM justifications WHERE user_id = ?').run(req.params.id);
    db.prepare('DELETE FROM time_records WHERE user_id = ?').run(req.params.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[Team] Erro ao excluir:', err);
    res.status(500).json({ error: 'Erro ao excluir colaborador' });
  }
});

// GET /api/team/:id/permissions
teamRouter.get('/:id/permissions', (req, res) => {
  try {
    const perms = db.prepare('SELECT permission FROM user_permissions WHERE user_id = ?').all(req.params.id) as { permission: string }[];
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.params.id) as any;
    res.json({ permissions: perms.map(p => p.permission), role: user?.role || 'EMPLOYEE' });
  } catch (err) {
    console.error('[Team] Erro ao carregar permissões:', err);
    res.status(500).json({ error: 'Erro ao carregar permissões' });
  }
});

// PUT /api/team/:id/permissions
teamRouter.put('/:id/permissions', (req, res) => {
  try {
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) { res.status(400).json({ error: 'permissions deve ser um array' }); return; }
    const del = db.prepare('DELETE FROM user_permissions WHERE user_id = ?');
    const ins = db.prepare('INSERT OR IGNORE INTO user_permissions (user_id, permission) VALUES (?, ?)');
    const transaction = db.transaction(() => {
      del.run(req.params.id);
      for (const p of permissions) ins.run(req.params.id, p);
    });
    transaction();
    res.json({ success: true, permissions });
  } catch (err) {
    console.error('[Team] Erro ao salvar permissões:', err);
    res.status(500).json({ error: 'Erro ao salvar permissões' });
  }
});

/* ═══════════════════════════════════════
   /api/justifications/* Router
   ═══════════════════════════════════════ */
export const justificationsRouter = Router();

// GET /api/justifications
justificationsRouter.get('/', (_req, res) => {
  try {
    const rows = db.prepare(`
      SELECT j.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar, d.name as user_department
      FROM justifications j
      LEFT JOIN users u ON u.id = j.user_id
      LEFT JOIN departments d ON d.id = u.department_id
      ORDER BY j.created_at DESC
    `).all() as any[];
    res.json(rows.map((j: any) => ({
      id: j.id, reason: j.reason, description: j.description,
      status: j.status, rhResponse: j.rh_response,
      startDate: j.start_date, endDate: j.end_date, createdAt: j.created_at,
      userId: j.user_id,
      user: { id: j.user_id, name: j.user_name, email: j.user_email, avatar: j.user_avatar, department: j.user_department },
    })));
  } catch (err) {
    console.error('[Just] Erro ao listar:', err);
    res.status(500).json({ error: 'Erro ao carregar justificativas' });
  }
});

// POST /api/justifications/:id/approve
justificationsRouter.post('/:id/approve', (req, res) => {
  try {
    db.prepare('UPDATE justifications SET status = \'APPROVED\' WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[Just] Erro ao aprovar:', err);
    res.status(500).json({ error: 'Erro ao aprovar justificativa' });
  }
});

// POST /api/justifications/:id/reject
justificationsRouter.post('/:id/reject', (req, res) => {
  try {
    const { reason } = req.body;
    db.prepare('UPDATE justifications SET status = \'REJECTED\', rh_response = ? WHERE id = ?').run(reason || null, req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[Just] Erro ao recusar:', err);
    res.status(500).json({ error: 'Erro ao recusar justificativa' });
  }
});

/* ═══════════════════════════════════════
   /api/time-records/* Router
   ═══════════════════════════════════════ */
export const timeRecordsRouter = Router();

// GET /api/time-records/pending-reviews
timeRecordsRouter.get('/pending-reviews', (_req, res) => {
  try {
    const rows = db.prepare(`
      SELECT tr.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar, u.role as user_role, d.name as user_department, p.name as user_position
      FROM time_records tr
      LEFT JOIN users u ON u.id = tr.user_id
      LEFT JOIN departments d ON d.id = u.department_id
      LEFT JOIN positions p ON p.id = u.position_id
      WHERE tr.review_status = 'PENDING'
      ORDER BY tr.date DESC, tr.clock_in ASC
    `).all() as any[];
    res.json(rows.map((r: any) => ({
      id: r.id, clockIn: r.clock_in, clockOut: r.clock_out, date: r.date,
      breakStart: r.break_start, breakEnd: r.break_end,
      totalMinutes: r.total_minutes, reviewStatus: r.review_status,
      user: { id: r.user_id, name: r.user_name, email: r.user_email, avatar: r.user_avatar, role: r.user_role, department: r.user_department, position: r.user_position },
    })));
  } catch (err) {
    console.error('[TR] Erro ao listar pendentes:', err);
    res.status(500).json({ error: 'Erro ao carregar análises' });
  }
});

// POST /api/time-records/:id/approve
timeRecordsRouter.post('/:id/approve', (req, res) => {
  try {
    db.prepare('UPDATE time_records SET review_status = \'APPROVED\', notes = ? WHERE id = ?').run(req.body.note || null, req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[TR] Erro ao aprovar:', err);
    res.status(500).json({ error: 'Erro ao aprovar registro' });
  }
});

// POST /api/time-records/:id/reject
timeRecordsRouter.post('/:id/reject', (req, res) => {
  try {
    db.prepare('UPDATE time_records SET review_status = \'REJECTED\', notes = ? WHERE id = ?').run(req.body.note || null, req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[TR] Erro ao recusar:', err);
    res.status(500).json({ error: 'Erro ao recusar registro' });
  }
});

/* ═══════════════════════════════════════
   /api/reference/* Router
   ═══════════════════════════════════════ */
export const referenceRouter = Router();

// GET /api/reference/departments
referenceRouter.get('/departments', (_req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM departments ORDER BY name').all());
  } catch (err) {
    console.error('[Ref] Erro nos departamentos:', err);
    res.status(500).json({ error: 'Erro ao carregar departamentos' });
  }
});

// GET /api/reference/positions?departmentId=...
referenceRouter.get('/positions', (req, res) => {
  try {
    const deptId = req.query.departmentId as string;
    if (deptId) {
      res.json(db.prepare('SELECT * FROM positions WHERE department_id = ? ORDER BY name').all(deptId));
    } else {
      res.json(db.prepare('SELECT * FROM positions ORDER BY name').all());
    }
  } catch (err) {
    console.error('[Ref] Erro nos cargos:', err);
    res.status(500).json({ error: 'Erro ao carregar cargos' });
  }
});
