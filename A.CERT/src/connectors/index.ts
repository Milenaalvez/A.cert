import type { IConnector } from './connector.interface.js';
import { ReceitaFederalConnector } from './receita-federal.connector.js';
import { TRF1Connector } from './trf1.connector.js';
import { TJDFTConnector } from './tjdft.connector.js';
import { TRTConnector } from './trt.connector.js';
import { TSTConnector } from './tst.connector.js';
import { SefazDFConnector } from './sefaz-df.connector.js';
import { ONRConnector } from './onr.connector.js';

export function criarConectores(): IConnector[] {
  return [
    new ReceitaFederalConnector(),
    new TRF1Connector(),
    new TJDFTConnector(),
    new TRTConnector(),
    new TSTConnector(),
    new SefazDFConnector(),
    new ONRConnector(),
  ];
}

export type { IConnector } from './connector.interface.js';
export type { ConnectorResult, DadosProprietario, ConsultaJob } from './types.js';
