import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
import { fileURLToPath } from 'node:url';
import { iniciarJob, getJob, getCaptchaManager } from './services/orquestrador.service.js';
import { criarConectores } from './connectors/index.js';
import { gerarDossiePDF } from './services/dossie.service.js';
import { closeBrowser } from './utils/browser.js';
import authRoutes from './routes/auth.js';
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
import trashRoutes from './routes/trash.js';
import companiesRoutes from './routes/companies.js';
import db from './database.js';

const LOG = (msg: string) => console.log(`[Server] ${msg}`);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json());

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
app.use('/api/trash', trashRoutes);
app.use('/api/companies', companiesRoutes);

const uploadsDir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(uploadsDir)) { fs.mkdirSync(uploadsDir, { recursive: true }); }

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Apenas imagens são permitidas'));
  },
});

app.post('/api/upload/avatar', upload.single('avatar'), (req, res) => {
  const userId = req.body.userId;
  if (!userId || !req.file) {
    res.status(400).json({ error: 'userId e avatar são obrigatórios' });
    return;
  }
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatarUrl, userId);
  res.json({ avatarUrl });
});

const publicPath = path.join(__dirname, '..', 'public');
console.log('Sirvindo arquivos estáticos de:', publicPath);
app.use(express.static(publicPath));

const uploadsPublicPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPublicPath));

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

app.post('/api/consultar', (req, res) => {
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

app.get('/api/consultar/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: 'Job não encontrado' });
    return;
  }

  const cm = getCaptchaManager();

  const resultados = job.resultados.map(r => ({
    status: r.status,
    orgao: r.orgao,
    dataConsulta: r.dataConsulta,
    protocolo: r.protocolo,
    error: r.error,
    documentoId: r.documento ? `${job.id}-${r.orgao.replace(/\s+/g, '_')}` : undefined,
  }));

  const captchaPendente = cm.listarPendentes(job.id).map(p => ({
    orgao: p.orgao,
    chave: p.chave,
    tipo: p.tipo,
    captchaUrl: `/api/consultar/${job.id}/captcha/${encodeURIComponent(p.chave)}`,
    paginaUrl: p.captchaUrl || undefined,
  }));

  res.json({
    id: job.id,
    status: job.status,
    dados: job.dados,
    resultados,
    inicio: job.inicio,
    fim: job.fim,
    captchaPendente,
  });
});

app.get('/api/consultar/:jobId/captcha/:chaveEncoded', (req, res) => {
  const cm = getCaptchaManager();
  const chave = decodeURIComponent(req.params.chaveEncoded);
  const img = cm.getCaptchaImage(chave);

  if (!img) {
    res.status(404).json({ error: 'CAPTCHA não encontrado ou já resolvido' });
    return;
  }

  res.setHeader('Content-Type', 'image/png');
  res.send(Buffer.from(img));
});

app.post('/api/consultar/:jobId/captcha', (req, res) => {
  const { chave, solution } = req.body;
  if (!chave) {
    res.status(400).json({ error: 'chave é obrigatória' });
    return;
  }

  const cm = getCaptchaManager();
  const ok = cm.resolveCaptcha(chave, solution);

  res.json({
    resolved: ok,
    message: ok
      ? 'CAPTCHA resolvido, consulta continuando'
      : 'Nenhum CAPTCHA pendente para este órgão',
  });
});

app.post('/api/consultar/:jobId/retry', (req, res) => {
  const job = getJob(req.params.jobId);
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

  const captchaManager = getCaptchaManager();
  const conectores = criarConectores();

  (async () => {
    for (const connector of conectores) {
      if (!falhos.includes(connector.nome)) continue;
      LOG(`>>> Retry conector: ${connector.nome}`);
      try {
        const resultado = await connector.consultar(job.dados, captchaManager, job.id);
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

// Serve frontend (Electron production mode)
const frontendOut = path.join(__dirname, '..', 'frontend', 'out');
app.use(express.static(frontendOut));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendOut, 'index.html'));
});

process.on('SIGINT', async () => {
  await closeBrowser();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`A.CERT rodando em http://localhost:${PORT}`);
});
