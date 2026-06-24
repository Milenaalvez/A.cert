export interface DadosProprietario {
  personId?: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  nomeMae: string;
  nomePai?: string;
  email: string;
}

export interface ConnectorResult {
  status: 'success' | 'error' | 'captcha_required';
  orgao: string;
  dataConsulta: string;
  protocolo?: string;
  documento?: Uint8Array;
  error?: string;
}

export interface ConsultaJob {
  id: string;
  dados: DadosProprietario;
  status: 'processing' | 'complete' | 'partial';
  resultados: ConnectorResult[];
  inicio: string;
  fim?: string;
}
