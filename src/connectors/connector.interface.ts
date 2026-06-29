import type { DadosProprietario, ConnectorResult } from './types.js';
import type { CaptchaManager } from '../services/captcha-manager.service.js';

export interface IConnector {
  readonly nome: string;
  consultar(
    dados: DadosProprietario,
    captchaManager?: CaptchaManager,
    jobId?: string,
    certKeys?: string[],
  ): Promise<ConnectorResult>;
}
