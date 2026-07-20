import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import net from 'node:net';
import { WebSocketServer, type WebSocket } from 'ws';
import compression from 'compression';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
import { fileURLToPath } from 'node:url';
import { iniciarJob, getJob } from './services/orquestrador.service.js';
import { criarConectores } from './connectors/index.js';
import { gerarDossiePDF } from './services/dossie.service.js';
import { closeBrowser, getCurrentDisplayId, acquireDisplayForJob, releaseDisplayForJob } from './utils/browser.js';
import { displayPool } from './utils/display-pool-manager.js';
import { enviarEmailConfirmacao } from './services/email.service.js';
import authRoutes from './routes/auth.js';
import { authMiddleware } from './middleware/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import peopleRoutes from './routes/people.js';
import dossierRoutes from './routes/dossiers.js';
import { teamRouter, justificationsRouter, timeRecordsRouter, referenceRouter } from './routes/team.js';
import reportsRoutes from './routes/reports.js';
import searchRoutes from './routes/search.js';
import captchaRoutes from './routes/captcha.js';
import propertiesRoutes from './routes/properties.js';
import settingsRoutes from './routes/settings.js';
import supportRoutes from './routes/support.js';
import { notificationsRoutes } from './routes/notifications.js';
import trashRoutes from './routes/trash.js';
import companiesRoutes from './routes/companies.js';
import prisma, { executeRaw, queryRawOne, getSetting } from './lib/prisma.js';

const LOG = (msg: string) => console.log(`[A.CERT] ${msg}`);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

app.get('/novnc/view', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.sendFile(path.join(__dirname, '..', 'public', 'novnc', 'viewer.html'));
});
app.get('/novnc/viewer.html', (req, res) => {
  res.redirect(302, req.originalUrl.replace('/novnc/viewer.html', '/novnc/view'));
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/dossiers', dossierRoutes);
app.use('/api/team', teamRouter);
app.use('/api/justifications', justificationsRouter);
app.use('/api/time-records', timeRecordsRouter);
app.use('/api/reference', referenceRouter);
app.use('/api/reports', reportsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/captcha', captchaRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/trash', trashRoutes);
app.use('/api/companies', companiesRoutes);

app.get('/api/test-email', async (req, res) => {
  const to = (req.query.to as string) || 'contato@acert.tech';
  try {
    await enviarEmailConfirmacao(to, 'Teste A.CERT', 'test-token');
    res.json({ success: true, message: `Email enviado para ${to}. Verifique a caixa de entrada e o spam.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, code: err.code, response: err.response });
  }
});

const uploadsDir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(uploadsDir)) { fs.mkdirSync(uploadsDir, { recursive: true }); }

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

async function getUploadLimitBytes(): Promise<number> {
  const limitMB = parseInt((await getSetting('upload_limit', '10')) || '10', 10);
  return limitMB * 1024 * 1024;
}

app.post('/api/upload/avatar', async (req, res) => {
  const fileSize = await getUploadLimitBytes();
  const upload = multer({
    storage,
    limits: { fileSize },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Apenas imagens são permitidas'));
    },
  });
  upload.single('avatar')(req as any, res as any, async (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    const userId = (req as any).body.userId;
    if (!userId || !(req as any).file) {
      res.status(400).json({ error: 'userId e avatar são obrigatórios' });
      return;
    }
    const avatarUrl = `/uploads/avatars/${(req as any).file.filename}`;
    await executeRaw('UPDATE users SET avatar = $1 WHERE id = $2', avatarUrl, userId);
    res.json({ avatarUrl });
  });
});

const logosDir = path.join(__dirname, '..', 'uploads', 'company-logos');
if (!fs.existsSync(logosDir)) { fs.mkdirSync(logosDir, { recursive: true }); }

const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, logosDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `logo-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

app.post('/api/upload/company-logo', async (req, res) => {
  const fileSize = await getUploadLimitBytes();
  const upload = multer({
    storage: logoStorage,
    limits: { fileSize },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Apenas imagens são permitidas'));
    },
  });
  upload.single('logotipo')(req as any, res as any, async (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    const companyId = (req as any).body.companyId;
    if (!companyId || !(req as any).file) {
      res.status(400).json({ error: 'companyId e logotipo são obrigatórios' });
      return;
    }
    const logoUrl = `/uploads/company-logos/${(req as any).file.filename}`;
    await executeRaw('UPDATE companies SET logo_url = $1 WHERE id = $2', logoUrl, companyId);
    res.json({ logoUrl });
  });
});

// Upload de documentos para dossiês
const docsDir = path.join(__dirname, '..', 'uploads', 'documents');
if (!fs.existsSync(docsDir)) { fs.mkdirSync(docsDir, { recursive: true }); }

const docStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, docsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `doc-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

app.post('/api/dossiers/:id/documents', authMiddleware, async (req, res) => {
  const fileSize = await getUploadLimitBytes();
  const upload = multer({
    storage: docStorage,
    limits: { fileSize },
  });
  upload.single('file')(req as any, res as any, async (err) => {
    if (err) { res.status(400).json({ error: err.message }); return; }
    const file = (req as any).file;
    const { personId, name, description } = (req as any).body;
    const dossierId = req.params.id;

    if (!file) { res.status(400).json({ error: 'Arquivo é obrigatório' }); return; }
    if (!name) { res.status(400).json({ error: 'Nome do documento é obrigatório' }); return; }

    try {
      const userRow = await queryRawOne(`SELECT name FROM users WHERE id = $1`, req.user!.userId);
      const userName = userRow?.name || req.user!.email;

      const maxOrder = await queryRawOne(
        `SELECT COALESCE(MAX(sort_order), 0) as max_order FROM dossier_documents WHERE dossier_id = $1`,
        dossierId
      );
      const sortOrder = ((maxOrder as any)?.max_order || 0) + 1;

      const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const filePath = `uploads/documents/${file.filename}`;
      await executeRaw(
        `INSERT INTO dossier_documents (id, dossier_id, person_id, name, label, file_path, file_type, file_size, description, sort_order, uploaded_by, uploaded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
        docId, dossierId, personId || null, name.trim(), file.originalname, filePath, file.mimetype, file.size,
        description?.trim() || null, sortOrder, userName
      );
      await executeRaw(
        `INSERT INTO activities (id, user_name, action, reference, dossier_ref, created_at) VALUES ($1, $2, $3, $4, $5, NOW())`,
        `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userName, `Anexou o documento "${name.trim()}"`, name.trim(), dossierId
      );
      res.json({
        id: docId, name: name.trim(), label: file.originalname,
        file_path: `uploads/documents/${file.filename}`, person_id: personId || null,
        file_type: file.mimetype, file_size: file.size,
        description: description?.trim() || null, sort_order: sortOrder,
        uploaded_by: userName, uploaded_at: new Date().toISOString()
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
});

app.get('/api/documents/:docId/download', async (req, res) => {
  try {
    const doc = await queryRawOne(
      `SELECT file_path, label FROM dossier_documents WHERE id = $1`,
      req.params.docId
    );
    if (!doc || !doc.file_path) { res.status(404).json({ error: 'Documento não encontrado' }); return; }

    const absPath = path.join(__dirname, '..', doc.file_path);
    if (!fs.existsSync(absPath)) { res.status(404).json({ error: 'Arquivo não encontrado' }); return; }

    const safeName = (doc.label || 'documento').replace(/[^a-zA-Z0-9._-]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    res.sendFile(absPath);
  } catch (error) {
    console.error('[Docs Download] Erro:', error);
    res.status(500).json({ error: 'Erro ao baixar documento' });
  }
});

// Serve frontend (Next.js static export)
const frontendOut = path.join(__dirname, '..', 'frontend', 'out');

const publicPath = path.join(__dirname, '..', 'public');
console.log('Sirvindo arquivos estáticos de:', publicPath);
app.use(express.static(publicPath, { maxAge: '30d' }));

const uploadsPublicPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPublicPath, { maxAge: '30d' }));

const srv = express.static(frontendOut);
function serveHtmlFile(p: string, res: any) {
  const fp = path.join(frontendOut, p + '.html');
  try {
    if (fs.existsSync(fp)) { res.sendFile(fp); return true; }
  } catch {}
  return false;
}
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  const p = req.path === '/' ? '/index' : req.path.endsWith('/') ? req.path.slice(0, -1) : req.path;
  if (serveHtmlFile(p, res)) return;
  srv(req as any, res as any, next);
});

// Dynamic routes — serve generated placeholder HTML
app.get('/confirmar-email/:token', (_req, res) => {
  const fp = path.join(__dirname, '..', 'frontend', 'out', 'confirmar-email', '_.html');
  if (fs.existsSync(fp)) res.sendFile(fp); else res.status(404).send('Not found');
});
app.get('/dashboard/usuarios/:id', (_req, res) => {
  const fp = path.join(__dirname, '..', 'frontend', 'out', 'dashboard', 'usuarios', '_.html');
  if (fs.existsSync(fp)) res.sendFile(fp); else res.status(404).send('Not found');
});
app.get('/dashboard/dossies/:id', (_req, res) => {
  const dossierFp = path.join(__dirname, '..', 'frontend', 'out', 'dashboard', 'dossies', '_.html');
  if (fs.existsSync(dossierFp)) res.sendFile(dossierFp); else res.status(404).send('Not found');
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/ws/')) return next();
  res.sendFile(path.join(__dirname, '..', 'frontend', 'out', 'index.html'));
});

const documentos = new Map<string, Uint8Array>();

function checkDocsLoop(jobId: string): void {
  let attempts = 0;
  const interval = setInterval(() => {
    const job = getJob(jobId);
    attempts++;
    if (!job || job.status === 'complete' || attempts > 120) {
      clearInterval(interval);
      if (job) {
        for (const r of job.resultados) {
          if (r.documento) {
            const docId = `${job.id}-${r.orgao.replace(/\s+/g, '_')}`;
            documentos.set(docId, r.documento);
          }
        }
      }
    }
  }, 500);
}

app.post('/api/consultar', authMiddleware, (req, res) => {
  try {
    console.log('[CONSULTAR] body recebido:', JSON.stringify(req.body).slice(0, 300));
    const { nome, cpf, dataNascimento, nomeMae, nomePai, email, personId, dossierId, organs, certKeys } = req.body;

    if (!nome || !cpf || !dataNascimento || !nomeMae || !email) {
      res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
      return;
    }

    const cpfDigits = cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      res.status(400).json({ error: 'CPF inválido.' });
      return;
    }

    const job = iniciarJob({ nome, cpf: cpfDigits, dataNascimento, nomeMae, nomePai: nomePai || undefined, email, personId, dossierId, certKeys }, organs);
    checkDocsLoop(job.id);
    res.json({ jobId: job.id });
  } catch (error) {
    console.error('Erro na consulta:', error);
    res.status(500).json({ error: 'Erro interno ao processar consulta' });
  }
});

app.get('/api/consultar/:jobId', authMiddleware, (req, res) => {
  const job = getJob(req.params.jobId as string);
  if (!job) {
    res.status(404).json({ error: 'Job não encontrado' });
    return;
  }

  const displayInfo = displayPool.getDisplayByJob(job.id);

  const resultados = job.resultados.map(r => ({
    status: r.status,
    orgao: r.orgao,
    dataConsulta: r.dataConsulta,
    protocolo: r.protocolo,
    error: r.error,
    documentoId: r.documento ? `${job.id}-${r.orgao.replace(/\s+/g, '_')}` : undefined,
  }));

  res.json({
    id: job.id,
    status: job.status,
    dados: job.dados,
    resultados,
    inicio: job.inicio,
    fim: job.fim,
    displayId: displayInfo?.id ?? null,
    displayPort: displayInfo?.port ?? null,
  });
});

app.post('/api/consultar/:jobId/retry', authMiddleware, (req, res) => {
  const job = getJob(req.params.jobId as string);
  if (!job) {
    res.status(404).json({ error: 'Job não encontrado' });
    return;
  }

  if (job.status === 'processing') {
    res.status(400).json({ error: 'Job ainda está em processamento' });
    return;
  }

  const falhos = job.resultados.filter(r => r.status !== 'success').map(r => r.orgao);
  if (falhos.length === 0) {
    res.status(400).json({ error: 'Não há órgãos com falha para tentar novamente' });
    return;
  }

  LOG(`Retry solicitado para: ${falhos.join(', ')}`);

  job.status = 'processing';
  job.resultados = job.resultados.filter(r => r.status === 'success');
  job.fim = undefined;

  const conectores = criarConectores();

  const CONNECTOR_TIMEOUT_MS = parseInt(process.env.CONNECTOR_TIMEOUT_MS || '90000', 10);

  (async () => {
    const displayId = await acquireDisplayForJob(job.id, falhos[0]);
    if (displayId) {
      LOG(`Display ${displayId} alocado para retry do job ${job.id}`);
    }

    for (const connector of conectores) {
      if (!falhos.includes(connector.nome)) continue;
      LOG(`>>> Retry conector: ${connector.nome}`);
      try {
        const resultado = await Promise.race([
          connector.consultar(job.dados, job.id),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout (${CONNECTOR_TIMEOUT_MS}ms): ${connector.nome}`)), CONNECTOR_TIMEOUT_MS)
          ),
        ]);
        job.resultados.push(resultado);
        LOG(`<<< Retry finalizado: ${connector.nome} → ${resultado.status}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        LOG(`<<< Retry abortado: ${connector.nome} → ${msg}`);
        job.resultados.push({
          status: 'error',
          orgao: connector.nome,
          dataConsulta: new Date().toISOString(),
          error: msg,
        });
      }
    }

    if (displayId) {
      await releaseDisplayForJob(job.id);
      LOG(`Display ${displayId} liberado do retry ${job.id}`);
    }

    job.status = 'complete';
    job.fim = new Date().toISOString();

    checkDocsLoop(job.id);
  })();

  res.json({ jobId: job.id, orgaos: falhos });
});

function buscarDocumento(docId: string): Uint8Array | undefined {
  const cached = documentos.get(docId);
  if (cached) return cached;

  const sepIndex = docId.lastIndexOf('-');
  if (sepIndex === -1) return undefined;
  const jobId = docId.slice(0, sepIndex);
  const orgao = docId.slice(sepIndex + 1);

  const job = getJob(jobId);
  if (!job) return undefined;

  for (const r of job.resultados) {
    if (r.orgao.replace(/\s+/g, '_') === orgao && r.documento) {
      documentos.set(docId, r.documento);
      return r.documento;
    }
  }
  return undefined;
}

app.get('/api/documentos/:docId', (req, res) => {
  const data = buscarDocumento(req.params.docId);
  if (!data) {
    res.status(404).json({ error: 'Documento não encontrado' });
    return;
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${req.params.docId}.pdf"`);
  res.send(Buffer.from(data));
});

app.get('/api/certificates/:id/download', async (req, res) => {
  try {
    const cert = await queryRawOne(
      'SELECT document_path, name FROM certificates WHERE id = $1',
      req.params.id
    );
    if (!cert || !cert.document_path) {
      res.status(404).json({ error: 'Certidão não encontrada ou sem documento' });
      return;
    }
    // document_path já é absoluto (ex: /var/www/acert/data/documents/abc.pdf)
    const absPath = path.isAbsolute(cert.document_path)
      ? cert.document_path
      : path.join(__dirname, '..', cert.document_path);
    if (!fs.existsSync(absPath)) {
      res.status(404).json({ error: 'Arquivo não encontrado no servidor' });
      return;
    }
    const pdfBuffer = fs.readFileSync(absPath);
    const safeName = (cert.name || 'certidao').replace(/[^a-zA-Z0-9]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('[CertDownload] Erro:', error);
    res.status(500).json({ error: 'Erro ao baixar certidão' });
  }
});

// POST /api/certificates/:id/upload — upload manual de PDF para certidão
const certUploadDir = path.join(__dirname, '..', 'uploads', 'certificates');
if (!fs.existsSync(certUploadDir)) { fs.mkdirSync(certUploadDir, { recursive: true }); }

const certStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, certUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `cert-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

app.post('/api/certificates/:id/upload', authMiddleware, async (req, res) => {
  const upload = multer({
    storage: certStorage,
    limits: { fileSize: await getUploadLimitBytes() },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
        cb(null, true);
      } else {
        cb(new Error('Apenas arquivos PDF são aceitos'));
      }
    },
  });
  upload.single('file')(req as any, res as any, async (err) => {
    if (err) { res.status(400).json({ error: err.message }); return; }
    const file = (req as any).file;
    if (!file) { res.status(400).json({ error: 'Arquivo é obrigatório' }); return; }

    try {
      const cert = await queryRawOne(
        'SELECT id, dossier_id, name FROM certificates WHERE id = $1',
        req.params.id
      );
      if (!cert) { res.status(404).json({ error: 'Certidão não encontrada' }); return; }

      const now = new Date().toISOString();
      const filePath = `uploads/certificates/${file.filename}`;
      await executeRaw(
        'UPDATE certificates SET status = $1, document_path = $2, obtained_at = $3, updated_at = $4 WHERE id = $5',
        'Obtida', filePath, now, now, req.params.id
      );

      if (cert.dossier_id) {
        await executeRaw('UPDATE dossiers SET updated_at = $1 WHERE id = $2', now, cert.dossier_id);
        const userRow = await queryRawOne('SELECT name FROM users WHERE id = $1', req.user!.userId);
        const userName = userRow?.name || req.user!.email;
        await executeRaw(
          'INSERT INTO activities (id, user_name, action, reference, dossier_ref, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
          `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          userName,
          `Fez upload manual da certidão ${cert.name}`,
          cert.name,
          cert.dossier_id
        );
      }

      res.json({ success: true, status: 'Obtida', obtained_at: now, document_path: filePath });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
});

app.get('/api/dossie/:jobId', async (req, res) => {
  try {
    const job = getJob(req.params.jobId);
    if (!job) {
      res.status(404).json({ error: 'Job não encontrado' });
      return;
    }

    const pdfBuffer = await gerarDossiePDF(job);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="dossie_${job.dados.nome.split(' ')[0].toLowerCase()}.pdf"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('Erro ao gerar dossiê:', error);
    res.status(500).json({ error: 'Erro ao gerar dossiê' });
  }
});

// ============ Display Pool & VNC ============

app.get('/api/displays', authMiddleware, (_req, res) => {
  res.json({
    displays: displayPool.getAllDisplays(),
    poolSize: displayPool.poolSize,
    available: displayPool.availableCount,
    busy: displayPool.busyCount,
  });
});

app.get('/api/displays/status/:jobId', authMiddleware, (req, res) => {
  const displayInfo = displayPool.getDisplayByJob(req.params.jobId as string);
  if (!displayInfo) {
    res.json({ displayId: null, displayPort: null, status: 'no_display' });
    return;
  }
  res.json(displayInfo);
});

app.get('/api/displays/novnc-url/:displayId', authMiddleware, (req, res) => {
  const info = displayPool.getDisplayInfo(req.params.displayId as string);
  if (!info) {
    res.status(404).json({ error: 'Display não encontrado' });
    return;
  }
  res.json({
    displayId: info.id,
    novncUrl: `/novnc/view?displayId=${info.id}&port=${info.port}`,
  });
});

const httpServer = http.createServer(app);

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws: WebSocket, _req) => {
  ws.on('error', (err: Error) => console.error('[WS] Client error:', err.message));
});

httpServer.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  const match = url.pathname.match(/^\/ws\/display\/(.+)$/);

  if (!match) {
    socket.destroy();
    return;
  }

  const displayId = match[1];
  const displayInfo = displayPool.getDisplayInfo(displayId);

  if (!displayInfo) {
    socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
    LOG(`[WebSocket] noVNC proxy: ${displayId} → localhost:${displayInfo.port}`);

    const vncSocket = new net.Socket();

    vncSocket.connect(displayInfo.port, '127.0.0.1', () => {
      LOG(`[WebSocket] VNC connected to port ${displayInfo.port}`);
    });

    vncSocket.on('data', (data: Buffer) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(data);
      }
    });

    ws.on('message', (data: Buffer | ArrayBuffer | Buffer[]) => {
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
      if (!vncSocket.destroyed) {
        vncSocket.write(buf);
      }
    });

    ws.on('close', () => {
      if (!vncSocket.destroyed) vncSocket.end();
      LOG(`[WebSocket] Client disconnected from display ${displayId}`);
    });

    vncSocket.on('close', () => {
      if (ws.readyState === ws.OPEN) ws.close();
    });

    vncSocket.on('error', (err) => {
      LOG(`[WebSocket] VNC socket error for ${displayId}: ${err.message}`);
      if (ws.readyState === ws.OPEN) ws.close();
    });
  });
});

process.on('SIGINT', async () => {
  await displayPool.shutdown();
  await closeBrowser();
  process.exit(0);
});

displayPool.initialize().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`A.CERT rodando em http://localhost:${PORT}`);
    console.log(`[DisplayPool] ${displayPool.poolSize} displays prontos (available: ${displayPool.availableCount})`);
  });
});
