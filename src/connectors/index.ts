import type { IConnector } from './connector.interface.js';
import { ReceitaFederalConnector } from './receita-federal.connector.js';
import { TRF1Connector } from './trf1.connector.js';
import { TJDFTConnector } from './tjdft.connector.js';

export function criarConectores(): IConnector[] {
  return [
    new ReceitaFederalConnector(),
    new TRF1Connector(),
    new TJDFTConnector(),
  ];
}

export type { IConnector } from './connector.interface.js';
export type { ConnectorResult, DadosProprietario, ConsultaJob } from './types.js';
