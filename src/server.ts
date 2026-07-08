import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
import { fileURLToPath } from 'node:url';
import { iniciarJob, getJob } from './services/orquestrador.service.js';
import { criarConectores } from './connectors/index.js';
import { gerarDossiePDF } from './services/dossie.service.js';
import { closeBrowser } from './utils/browser.js';
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
  if (fs.existsSync(fp)) { res.sendFile(fp); return true; }
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
  res.sendFile(path.join(__dirname, '..', 'frontend', 'out', 'confirmar-email', '_.html'));
});
app.get('/dashboard/usuarios/:id', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'out', 'dashboard', 'usuarios', '_.html'));
});
app.get('/dashboard/dossies/:id', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'out', 'dashboard', 'dossiers', '_.html'));
});

app.get('*', (_req, res) => {
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

  (async () => {
    for (const connector of conectores) {
      if (!falhos.includes(connector.nome)) continue;
      LOG(`>>> Retry conector: ${connector.nome}`);
      try {
        const resultado = await connector.consultar(job.dados, job.id);
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
    if (!fs.existsSync(cert.document_path)) {
      res.status(404).json({ error: 'Arquivo não encontrado no servidor' });
      return;
    }
    const pdfBuffer = fs.readFileSync(cert.document_path);
    const safeName = (cert.name || 'certidao').replace(/[^a-zA-Z0-9]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('[CertDownload] Erro:', error);
    res.status(500).json({ error: 'Erro ao baixar certidão' });
  }
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

process.on('SIGINT', async () => {
  await closeBrowser();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`A.CERT rodando em http://localhost:${PORT}`);
});
