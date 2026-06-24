import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { IConnector, ConsultaJob, DadosProprietario, ConnectorResult } from '../connectors/index.js';
import { criarConectores } from '../connectors/index.js';
import { CaptchaManager } from './captcha-manager.service.js';
import db from '../database.js';

const LOG = (msg: string) => console.log(`[Orquestrador] ${msg}`);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCUMENTS_DIR = path.join(__dirname, '..', '..', 'data', 'documents');

const CERT_NAME_MAP: Record<string, string> = {
  'Receita Federal': 'Certidão de Débitos Relativos a Créditos Tributários Federais',
  'TRF1': 'Certidão de Ações Cíveis e Criminais (TRF1)',
  'TJDFT': 'Certidão de Ações Cíveis e Criminais (TJDFT)',
  'TRT': 'Certidão Trabalhista (TRT)',
  'TST': 'Certidão Trabalhista (TST)',
  'SEFAZ-DF': 'Certidão de Débitos Fiscais (SEFAZ-DF)',
  'Certidão de Ônus (ONR)': 'Certidão de Ônus Reais (ONR)',
};

function nomeCertidao(orgao: string): string {
  return CERT_NAME_MAP[orgao] || `Certidão - ${orgao}`;
}

async function salvarDocumento(jobId: string, orgao: string, documento: Uint8Array): Promise<string | null> {
  try {
    await fs.mkdir(DOCUMENTS_DIR, { recursive: true });
    const nomeArquivo = `${jobId}-${orgao.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const caminho = path.join(DOCUMENTS_DIR, nomeArquivo);
    await fs.writeFile(caminho, Buffer.from(documento));
    LOG(`Documento salvo: ${caminho}`);
    return caminho;
  } catch (err) {
    LOG(`Erro ao salvar documento: ${err}`);
    return null;
  }
}

async function persistirResultado(
  personId: string,
  resultado: ConnectorResult,
  jobId: string,
): Promise<void> {
  if (resultado.status !== 'success') return;

  try {
    let dossierId: string;

    const dossierExistente = db.prepare(
      'SELECT id FROM dossiers WHERE person_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(personId) as { id: string } | undefined;

    if (dossierExistente) {
      dossierId = dossierExistente.id;
    } else {
      dossierId = randomUUID();
      const now = new Date().toISOString();
      db.prepare(
        'INSERT INTO dossiers (id, identifier, person_id, status, priority, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(dossierId, `#AUTO-${now.slice(0, 10)}-${dossierId.slice(0, 6)}`, personId, 'Em andamento', 'Regular', now, now);
      LOG(`Dossie auto-criado: ${dossierId}`);
    }

    const certId = randomUUID();
    const certName = nomeCertidao(resultado.orgao);
    const now = new Date().toISOString();

    let docPath: string | null = null;
    if (resultado.documento) {
      docPath = await salvarDocumento(jobId, resultado.orgao, resultado.documento);
    }

    db.prepare(
      'INSERT INTO certificates (id, dossier_id, name, organ, status, protocol, obtained_at, document_path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(certId, dossierId, certName, resultado.orgao, 'Obtida', resultado.protocolo || null, now, docPath, now);

    db.prepare('UPDATE dossiers SET updated_at = ? WHERE id = ?').run(now, dossierId);

    LOG(`Certificado salvo: ${certName} (${resultado.orgao}) → dossie ${dossierId}`);
  } catch (err) {
    LOG(`Erro ao persistir: ${err}`);
  }
}

const JOBS = new Map<string, ConsultaJob>();
const CAPTCHA_MANAGER = new CaptchaManager();

export function getJob(jobId: string): ConsultaJob | undefined {
  return JOBS.get(jobId);
}

export function getCaptchaManager(): CaptchaManager {
  return CAPTCHA_MANAGER;
}

export function iniciarJob(dados: DadosProprietario): ConsultaJob {
  const jobId = randomUUID();

  const job: ConsultaJob = {
    id: jobId,
    dados,
    status: 'processing',
    resultados: [],
    inicio: new Date().toISOString(),
  };

  JOBS.set(jobId, job);

  const conectores = criarConectores();

  (async () => {
    for (const connector of conectores) {
      LOG(`>>> Iniciando conector: ${connector.nome}`);
      try {
        const resultado = await connector.consultar(dados, CAPTCHA_MANAGER, jobId);
        job.resultados.push(resultado);
        LOG(`<<< Conector finalizado: ${connector.nome} → ${resultado.status}`);

        if (resultado.status === 'success' && dados.personId) {
          await persistirResultado(dados.personId, resultado, jobId);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        LOG(`<<< Conector abortado: ${connector.nome} → ${msg}`);
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
  })();

  return job;
}
