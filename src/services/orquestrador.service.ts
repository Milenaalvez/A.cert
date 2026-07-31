import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { IConnector, ConsultaJob, DadosProprietario, ConnectorResult } from '../connectors/index.js';
import { criarConectores } from '../connectors/index.js';
import prisma, { executeRaw, queryRawOne } from '../lib/prisma.js';
import { acquireDisplayForJob, releaseDisplayForJob, getCurrentDisplayId } from '../utils/browser.js';
import { wait } from '../utils/retry-manager.service.js';
import { createNotification } from '../routes/notifications.js';

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

async function salvarDocumento(jobId: string, orgao: string, documento: Uint8Array, dossierId?: string): Promise<string | null> {
  try {
    if (documento.length < 500) {
      LOG(`Documento ${orgao} invalido: apenas ${documento.length} bytes`);
      return null;
    }
    const header = String.fromCharCode(...documento.slice(0, 5));
    if (header !== '%PDF-') {
      LOG(`Documento ${orgao} invalido: header "${header}" nao eh PDF (${documento.length} bytes)`);
      return null;
    }

    const pasta = path.join(DOCUMENTS_DIR, dossierId || '');
    await fs.mkdir(pasta, { recursive: true });
    const nomeArquivo = dossierId
      ? `${orgao.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      : `${jobId}-${orgao.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const caminho = path.join(pasta, nomeArquivo);
    await fs.writeFile(caminho, Buffer.from(documento));
    LOG(`Documento salvo: ${caminho} (${documento.length} bytes)`);
    return caminho;
  } catch (err) {
    LOG(`Erro ao salvar documento: ${err}`);
    return null;
  }
}

async function persistirResultado(
  personId: string,
  dossierId: string | null,
  resultado: ConnectorResult,
  jobId: string,
): Promise<void> {
  if (resultado.status !== 'success') return;

  try {
    // Auto-link: se nao tem dossierId, busca o dossie mais recente da pessoa
    let effectiveDossierId = dossierId;
    if (!effectiveDossierId) {
      const recent = await queryRawOne(
        `SELECT dp.dossier_id 
         FROM dossier_participants dp 
         JOIN dossiers d ON dp.dossier_id = d.id 
         WHERE dp.person_id = $1 
         ORDER BY d.created_at DESC 
         LIMIT 1`,
        personId
      );
      if (recent) {
        effectiveDossierId = (recent as any).dossier_id;
        LOG(`Auto-link: certificado associado ao dossie ${effectiveDossierId}`);
      }
    }

    if (effectiveDossierId) {
      await executeRaw(
        'INSERT INTO dossier_participants (dossier_id, person_id, role) VALUES ($1, $2, $3) ON CONFLICT (dossier_id, person_id) DO NOTHING',
        effectiveDossierId, personId, 'proprietario'
      );
    }

    const certId = randomUUID();
    const certName = nomeCertidao(resultado.orgao);
    const now = new Date().toISOString();

    let docPath: string | null = null;
    if (resultado.documento) {
      docPath = await salvarDocumento(jobId, resultado.orgao, resultado.documento, effectiveDossierId || undefined);
    }

    // Upsert: se ja existe certidao do mesmo orgao para a mesma pessoa/dossie, atualiza
    const existing = await queryRawOne(
      'SELECT id FROM certificates WHERE person_id = $1 AND organ = $2 AND name = $3 AND ($4::text IS NULL OR dossier_id::text = $4::text)',
      personId, resultado.orgao, certName, effectiveDossierId || null
    );
    if (existing) {
      await executeRaw(
        'UPDATE certificates SET status = $1, protocol = $2, obtained_at = $3, document_path = $4, updated_at = $5 WHERE id = $6',
        'Obtida', resultado.protocolo || null, now, docPath, now, (existing as any).id
      );
    } else {
      await executeRaw(
        'INSERT INTO certificates (id, dossier_id, person_id, name, organ, status, protocol, obtained_at, document_path, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        certId, effectiveDossierId || null, personId, certName, resultado.orgao, 'Obtida', resultado.protocolo || null, now, docPath, now
      );
    }

    if (effectiveDossierId) {
      await executeRaw('UPDATE dossiers SET updated_at = $1 WHERE id = $2', now, effectiveDossierId);
    }

    LOG(`Certificado salvo: ${certName} (${resultado.orgao}) → pessoa ${personId}`);
  } catch (err) {
    LOG(`Erro ao persistir: ${err}`);
  }
}

const CONNECTOR_TIMEOUT_MS = parseInt(process.env.CONNECTOR_TIMEOUT_MS || '60000', 10);

const JOBS = new Map<string, ConsultaJob>();

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout (${ms}ms): ${label}`)), ms)
    ),
  ]);
}

export function getJob(jobId: string): ConsultaJob | undefined {
  return JOBS.get(jobId);
}

export function iniciarJob(dados: DadosProprietario, onlyOrgans?: string[]): ConsultaJob {
  const jobId = randomUUID();

  const job: ConsultaJob = {
    id: jobId,
    dados,
    status: 'processing',
    resultados: [],
    inicio: new Date().toISOString(),
  };

  JOBS.set(jobId, job);

  const conectores = criarConectores().filter(c => {
    if (!onlyOrgans || onlyOrgans.length === 0) return true;
    return onlyOrgans.includes(c.nome);
  });

  (async () => {
    const displayId = await acquireDisplayForJob(jobId, conectores[0]?.nome);
    if (displayId) {
      LOG(`Display ${displayId} alocado para job ${jobId}`);
    }

    for (let i = 0; i < conectores.length; i++) {
      const connector = conectores[i];
      if (i > 0) {
        LOG(`Pausa de 5s entre conectores...`);
        await wait(2000);
      }
      LOG(`>>> Iniciando conector: ${connector.nome}`);
      try {
        const resultado = await withTimeout(
          connector.consultar(dados, jobId, dados.certKeys),
          CONNECTOR_TIMEOUT_MS,
          connector.nome
        );
        job.resultados.push(resultado);
        LOG(`<<< Conector finalizado: ${connector.nome} → ${resultado.status}`);

        if (resultado.status === 'success' && dados.personId) {
          await persistirResultado(dados.personId, dados.dossierId || null, resultado, jobId);
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

    if (displayId) {
      await releaseDisplayForJob(jobId);
      LOG(`Display ${displayId} liberado do job ${jobId}`);
    }

    job.status = 'complete';
    job.fim = new Date().toISOString();

    // Notificacao de job concluido
    if (job.dados.userId) {
      const sucessos = job.resultados.filter(r => r.status === 'success');
      const erros = job.resultados.filter(r => r.status === 'error');
      const partes: string[] = [];
      if (sucessos.length > 0) partes.push(`${sucessos.length} certidão(ões) obtida(s)`);
      if (erros.length > 0) partes.push(`${erros.length} falha(s)`);
      const msg = partes.length > 0 ? partes.join(', ') : 'Nenhum resultado';

      const nomesSucesso = sucessos.map(r => r.orgao).join(', ') || 'nenhuma';
      const nomesErro = erros.map(r => r.orgao).join(', ') || 'nenhuma';
      const fullMsg = `${msg}. Certidões obtidas: ${nomesSucesso}. ${
        erros.length > 0 ? `Falhas: ${nomesErro}. ` : ''
      }Acesse o dossiê ou a página da pessoa para visualizar os PDFs.`;

      const link = job.dados.dossierId
        ? `/dashboard/dossies/${job.dados.dossierId}`
        : job.dados.personId
          ? `/dashboard/pessoas/${job.dados.personId}`
          : undefined;

      await createNotification(
        job.dados.userId,
        'Consulta concluída',
        fullMsg,
        erros.length === 0 ? 'success' : erros.length < sucessos.length ? 'warning' : 'error',
        link,
        job.id,
      );
    }
  })();

  return job;
}
