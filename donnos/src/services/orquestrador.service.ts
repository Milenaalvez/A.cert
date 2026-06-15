import { randomUUID } from 'node:crypto';
import type { IConnector, ConsultaJob, DadosProprietario } from '../connectors/index.js';
import { criarConectores } from '../connectors/index.js';
import { CaptchaManager } from './captcha-manager.service.js';

const LOG = (msg: string) => console.log(`[Orquestrador] ${msg}`);

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
