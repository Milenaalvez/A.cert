import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import prisma, { queryRaw, queryRawOne, executeRaw } from '../lib/prisma.js';

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
  employee_code: string | null; phone: string | null; birth_date: string | null;
  city: string | null; address: string | null; uf: string | null;
  department_name: string | null; position_name: string | null;
}

async function enrich(u: UserRow): Promise<Record<string, unknown>> {
  const todayRec = await queryRawOne(`
    SELECT clock_in, clock_out, break_start, break_end, total_minutes, review_status
    FROM time_records WHERE user_id = $1 AND date = $2
  `, u.id, todayStr());
  const monthTotal = await queryRawOne(`
    SELECT COALESCE(SUM(total_minutes), 0) as total
    FROM time_records WHERE user_id = $1 AND date LIKE $2 || '%' AND review_status = 'APPROVED'
  `, u.id, todayStr().slice(0, 7));
  const pendingJust = await queryRawOne(`
    SELECT id, reason, start_date, end_date FROM justifications
    WHERE user_id = $1 AND status = 'PENDING' LIMIT 1
  `, u.id);
  const balance = (u.weekly_hours || 40) * 4.5 - ((monthTotal?.total || 0) / 60);

  // Per-user stats
  const totalDossiers = await queryRawOne(`
    SELECT COUNT(*) as c FROM dossiers WHERE created_by = $1
  `, u.name);
  const completedDossiers = await queryRawOne(`
    SELECT COUNT(*) as c FROM dossiers WHERE created_by = $1 AND status = 'Concluído'
  `, u.name);
  const totalPersons = await queryRawOne(`SELECT COUNT(*) as c FROM persons`);
  const totalProperties = await queryRawOne(`SELECT COUNT(*) as c FROM properties`);

  return {
    id: u.id, name: u.name, email: u.email, role: u.role || 'EMPLOYEE',
    department: u.department_name, departmentId: u.department_id,
    position: u.position_name, positionId: u.position_id,
    contractType: u.contract_type, registrationNumber: u.registration_number,
    phone: u.phone, avatar: u.avatar, employeeCode: u.employee_code,
    weeklyHours: u.weekly_hours || 40, workSchedule: u.work_schedule || 'Seg-Sex',
    hireDate: u.hire_date, isActive: u.is_active === 1,
    emailVerified: u.email_verified === 1, lastAccessAt: u.last_access_at,
    birthDate: u.birth_date, city: u.city, address: u.address, uf: u.uf,
    companyId: u.company_id || 'acert-1',
    todayClockIn: todayRec?.clock_in || null,
    todayClockOut: todayRec?.clock_out || null,
    todayTotalMinutes: todayRec?.total_minutes || null,
    todayStatus: todayRec ? (todayRec.total_minutes && todayRec.total_minutes > 480 ? 'OVERTIME' : 'NORMAL') : null,
    monthTotalMinutes: monthTotal?.total || 0,
    balanceHours: Math.round(balance * 100) / 100,
    isOnline: !!todayRec,
    pendingJustification: pendingJust ? { id: pendingJust.id, reason: pendingJust.reason, startDate: pendingJust.start_date, endDate: pendingJust.end_date } : null,
    stats: {
      dossiersCreated: totalDossiers?.c || 0,
      dossiersCompleted: completedDossiers?.c || 0,
      clientsRegistered: totalPersons?.c || 0,
      propertiesLinked: totalProperties?.c || 0,
    },
    lastSession: {
      date: u.last_access_at || null,
      ip: '189.xxx.xxx.xx',
      device: 'Desktop',
      browser: 'Chrome 126',
      os: 'Windows 11',
    },
  };
}

/* ═══════════════════════════════════════
   /api/team/* Router
   ═══════════════════════════════════════ */
export const teamRouter = Router();

// GET /api/team/enriched
teamRouter.get('/enriched', async (_req, res) => {
  try {
    const rows = await queryRaw(`
      SELECT u.*, d.name as department_name, p.name as position_name
      FROM users u
      LEFT JOIN departments d ON d.id = u.department_id
      LEFT JOIN positions p ON p.id = u.position_id
      WHERE u.deleted_at IS NULL
      ORDER BY u.name ASC
    `);
    res.json(await Promise.all(rows.map(enrich)));
  } catch (err) {
    console.error('[Team] Erro ao listar:', err);
    res.status(500).json({ error: 'Erro ao carregar equipe' });
  }
});

// GET /api/team/metrics
teamRouter.get('/metrics', async (_req, res) => {
  try {
    const total = await queryRawOne('SELECT COUNT(*) as c FROM users WHERE deleted_at IS NULL');
    const active = await queryRawOne('SELECT COUNT(*) as c FROM users WHERE is_active = 1 AND deleted_at IS NULL');
    const inactive = await queryRawOne('SELECT COUNT(*) as c FROM users WHERE is_active = 0 AND deleted_at IS NULL');
    const verified = await queryRawOne('SELECT COUNT(*) as c FROM users WHERE email_verified = 1 AND deleted_at IS NULL');
    const todayRecs = await queryRaw(`
      SELECT DISTINCT user_id FROM time_records WHERE date = $1
    `, todayStr());
    const pendingJustsCount = await queryRawOne('SELECT COUNT(*) as c FROM justifications WHERE status = \'PENDING\'');
    const hiresThisMonth = await queryRawOne(`
      SELECT COUNT(*) as c FROM users WHERE hire_date LIKE $1 || '%' AND is_active = 1
    `, todayStr().slice(0, 7));
    const lastMonthHires = await queryRawOne(`
      SELECT COUNT(*) as c FROM users WHERE hire_date LIKE $1 || '%' AND is_active = 1
    `, new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7));

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
teamRouter.get('/activities', async (_req, res) => {
  try {
    const acts = await queryRaw(`
      SELECT * FROM team_activities ORDER BY timestamp DESC LIMIT 50
    `);
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
teamRouter.post('/', async (req, res) => {
  try {
    const { name, email, role, departmentId, positionId, contractType, weeklyHours, workSchedule, hireDate, phone } = req.body;
    if (!name || !email) {
      res.status(400).json({ error: 'Nome e email são obrigatórios' });
      return;
    }
    const existing = await queryRawOne('SELECT id FROM users WHERE email = $1', email.toLowerCase().trim());
    if (existing) {
      res.status(409).json({ error: 'Email já cadastrado' });
      return;
    }
    const id = randomUUID();
    const tempPassword = randomUUID().slice(0, 8);
    const password_hash = bcrypt.hashSync(tempPassword, 10);
    const regNum = String((await queryRawOne('SELECT COUNT(*) as c FROM users')).c + 1001);

    await executeRaw(`
      INSERT INTO users (id, name, email, password_hash, role, department_id, position_id, contract_type, weekly_hours, work_schedule, hire_date, phone, registration_number, is_active, email_verified, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 1, 0, NOW())
    `, id, name.trim(), email.toLowerCase().trim(), password_hash, role || 'EMPLOYEE', departmentId || null, positionId || null, contractType || 'CLT', weeklyHours || 40, workSchedule || 'Seg-Sex', hireDate || null, phone || null, regNum);

    await executeRaw(`
      INSERT INTO team_activities (id, user_id, user_name, action, description, entity_type, entity_id, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, randomUUID(), id, name.trim(), 'CREATE_USER', `Criou o colaborador ${name.trim()}`, 'user', id);

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
teamRouter.put('/:id', async (req, res) => {
  try {
    const { name, role, departmentId, positionId, contractType, weeklyHours, workSchedule, phone } = req.body;
    await executeRaw(`
      UPDATE users SET name = COALESCE($1, name), role = COALESCE($2, role), department_id = COALESCE($3, department_id), position_id = COALESCE($4, position_id), contract_type = COALESCE($5, contract_type), weekly_hours = COALESCE($6, weekly_hours), work_schedule = COALESCE($7, work_schedule), phone = COALESCE($8, phone)
      WHERE id = $9
    `, name || null, role || null, departmentId || null, positionId || null, contractType || null, weeklyHours != null ? weeklyHours : null, workSchedule || null, phone || null, req.params.id);

    res.json({ success: true });
  } catch (err) {
    console.error('[Team] Erro ao atualizar:', err);
    res.status(500).json({ error: 'Erro ao atualizar colaborador' });
  }
});

// PUT /api/team/:id/role
teamRouter.put('/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) { res.status(400).json({ error: 'Role é obrigatório' }); return; }
    await executeRaw('UPDATE users SET role = $1 WHERE id = $2', role, req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[Team] Erro ao alterar cargo:', err);
    res.status(500).json({ error: 'Erro ao alterar cargo' });
  }
});

// POST /api/team/:id/resend-verification
teamRouter.post('/:id/resend-verification', async (req, res) => {
  try {
    const user = await queryRawOne('SELECT id, name, email, email_verified FROM users WHERE id = $1', req.params.id);
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
teamRouter.patch('/:id/status', async (req, res) => {
  try {
    const { active } = req.body;
    await executeRaw('UPDATE users SET is_active = $1 WHERE id = $2', active ? 1 : 0, req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[Team] Erro ao alterar status:', err);
    res.status(500).json({ error: 'Erro ao alterar status' });
  }
});

// POST /api/team/:id/reset-password
teamRouter.post('/:id/reset-password', async (req, res) => {
  try {
    const user = await queryRawOne('SELECT id, name FROM users WHERE id = $1', req.params.id);
    if (!user) { res.status(404).json({ error: 'Usuário não encontrado' }); return; }
    const tempPassword = randomUUID().slice(0, 8);
    const password_hash = bcrypt.hashSync(tempPassword, 10);
    await executeRaw('UPDATE users SET password_hash = $1 WHERE id = $2', password_hash, user.id);
    res.json({ tempPassword });
  } catch (err) {
    console.error('[Team] Erro ao resetar senha:', err);
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
});

// DELETE /api/team/:id (soft-delete: move para lixeira)
teamRouter.delete('/:id', async (req, res) => {
  try {
    await executeRaw('UPDATE users SET is_active = 0, deleted_at = NOW() WHERE id = $1', req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[Team] Erro ao excluir:', err);
    res.status(500).json({ error: 'Erro ao excluir colaborador' });
  }
});

// GET /api/team/:id/permissions
teamRouter.get('/:id/permissions', async (req, res) => {
  try {
    const perms = await queryRaw('SELECT permission FROM user_permissions WHERE user_id = $1', req.params.id) as { permission: string }[];
    const user = await queryRawOne('SELECT role FROM users WHERE id = $1', req.params.id);
    res.json({ permissions: perms.map(p => p.permission), role: user?.role || 'EMPLOYEE' });
  } catch (err) {
    console.error('[Team] Erro ao carregar permissões:', err);
    res.status(500).json({ error: 'Erro ao carregar permissões' });
  }
});

// PUT /api/team/:id/permissions
teamRouter.put('/:id/permissions', async (req, res) => {
  try {
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) { res.status(400).json({ error: 'permissions deve ser um array' }); return; }
    await executeRaw('DELETE FROM user_permissions WHERE user_id = $1', req.params.id);
    for (const p of permissions) {
      await executeRaw('INSERT OR IGNORE INTO user_permissions (user_id, permission) VALUES ($1, $2)', req.params.id, p);
    }
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
justificationsRouter.get('/', async (_req, res) => {
  try {
    const rows = await queryRaw(`
      SELECT j.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar, d.name as user_department
      FROM justifications j
      LEFT JOIN users u ON u.id = j.user_id
      LEFT JOIN departments d ON d.id = u.department_id
      ORDER BY j.created_at DESC
    `);
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
justificationsRouter.post('/:id/approve', async (req, res) => {
  try {
    await executeRaw('UPDATE justifications SET status = \'APPROVED\' WHERE id = $1', req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[Just] Erro ao aprovar:', err);
    res.status(500).json({ error: 'Erro ao aprovar justificativa' });
  }
});

// POST /api/justifications/:id/reject
justificationsRouter.post('/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    await executeRaw('UPDATE justifications SET status = \'REJECTED\', rh_response = $1 WHERE id = $2', reason || null, req.params.id);
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
timeRecordsRouter.get('/pending-reviews', async (_req, res) => {
  try {
    const rows = await queryRaw(`
      SELECT tr.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar, u.role as user_role, d.name as user_department, p.name as user_position
      FROM time_records tr
      LEFT JOIN users u ON u.id = tr.user_id
      LEFT JOIN departments d ON d.id = u.department_id
      LEFT JOIN positions p ON p.id = u.position_id
      WHERE tr.review_status = 'PENDING'
      ORDER BY tr.date DESC, tr.clock_in ASC
    `);
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
timeRecordsRouter.post('/:id/approve', async (req, res) => {
  try {
    await executeRaw('UPDATE time_records SET review_status = \'APPROVED\', notes = $1 WHERE id = $2', req.body.note || null, req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[TR] Erro ao aprovar:', err);
    res.status(500).json({ error: 'Erro ao aprovar registro' });
  }
});

// POST /api/time-records/:id/reject
timeRecordsRouter.post('/:id/reject', async (req, res) => {
  try {
    await executeRaw('UPDATE time_records SET review_status = \'REJECTED\', notes = $1 WHERE id = $2', req.body.note || null, req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[TR] Erro ao recusar:', err);
    res.status(500).json({ error: 'Erro ao recusar registro' });
  }
});

// GET /api/team/audit-logs
teamRouter.get('/audit-logs', async (_req, res) => {
  try {
    const rows = await queryRaw(`
      SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 200
    `);
    res.json(rows);
  } catch (err) {
    console.error('[Team] Erro nos audit logs:', err);
    res.status(500).json({ error: 'Erro ao carregar logs de auditoria' });
  }
});

// GET /api/team/user-dossiers/:userId
teamRouter.get('/user-dossiers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await queryRawOne('SELECT name FROM users WHERE id = $1', userId);
    if (!user) { res.status(404).json({ error: 'Usuário não encontrado' }); return; }
    const dossiers = await queryRaw(`
      SELECT id, identifier, status, priority, created_at, updated_at,
        (SELECT COUNT(*) FROM certificates WHERE dossier_id = dossiers.id) as certificateCount,
        (SELECT COUNT(*) FROM certificates WHERE dossier_id = dossiers.id AND status = 'Obtida') as certificatesObtidas
      FROM dossiers WHERE created_by = $1 ORDER BY updated_at DESC LIMIT 50
    `, user.name);
    res.json(dossiers);
  } catch (err) {
    console.error('[Team] Erro nos dossiers do usuário:', err);
    res.status(500).json({ error: 'Erro ao carregar dossiers' });
  }
});

// GET /api/team/user-activities/:userId
teamRouter.get('/user-activities/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await queryRawOne('SELECT name FROM users WHERE id = $1', userId);
    if (!user) { res.status(404).json({ error: 'Usuário não encontrado' }); return; }
    const auditLogs = await queryRaw(`
      SELECT * FROM audit_log WHERE user_name = $1 ORDER BY created_at DESC LIMIT 100
    `, user.name);
    const teamActivities = await queryRaw(`
      SELECT * FROM team_activities WHERE user_name = $1 ORDER BY timestamp DESC LIMIT 100
    `, user.name);
    res.json({ auditLogs, teamActivities });
  } catch (err) {
    console.error('[Team] Erro nas atividades do usuário:', err);
    res.status(500).json({ error: 'Erro ao carregar atividades' });
  }
});

/* ═══════════════════════════════════════
   /api/reference/* Router
   ═══════════════════════════════════════ */
export const referenceRouter = Router();

// GET /api/reference/departments
referenceRouter.get('/departments', async (_req, res) => {
  try {
    res.json(await queryRaw('SELECT * FROM departments ORDER BY name'));
  } catch (err) {
    console.error('[Ref] Erro nos departamentos:', err);
    res.status(500).json({ error: 'Erro ao carregar departamentos' });
  }
});

// GET /api/reference/positions?departmentId=...
referenceRouter.get('/positions', async (req, res) => {
  try {
    const deptId = req.query.departmentId as string;
    if (deptId) {
      res.json(await queryRaw('SELECT * FROM positions WHERE department_id = $1 ORDER BY name', deptId));
    } else {
      res.json(await queryRaw('SELECT * FROM positions ORDER BY name'));
    }
  } catch (err) {
    console.error('[Ref] Erro nos cargos:', err);
    res.status(500).json({ error: 'Erro ao carregar cargos' });
  }
});
