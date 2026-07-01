import type { DadosProprietario, ConnectorResult } from './types.js';

export interface IConnector {
  readonly nome: string;
  consultar(
    dados: DadosProprietario,
    jobId?: string,
    certKeys?: string[],
  ): Promise<ConnectorResult>;
}
