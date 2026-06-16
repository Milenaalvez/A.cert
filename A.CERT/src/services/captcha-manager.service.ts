import type { CaptchaType } from '../utils/captcha.js';

type CaptchaEntry = {
  resolve: (value: string) => void;
  reject: (err: Error) => void;
  imagem: Uint8Array;
  orgao: string;
  tipo: CaptchaType;
  captchaUrl?: string;
};

export class CaptchaManager {
  private pending = new Map<string, CaptchaEntry>();

  async waitForSolution(
    chave: string,
    orgao: string,
    imagem: Uint8Array,
    tipo: CaptchaType,
    captchaUrl?: string,
  ): Promise<string> {
    const existente = this.pending.get(chave);
    if (existente) {
      existente.reject(new Error('Nova requisição de CAPTCHA substituiu a anterior'));
    }

    return new Promise<string>((resolve, reject) => {
      this.pending.set(chave, { resolve, reject, imagem, orgao, tipo, captchaUrl });
    });
  }

  resolveCaptcha(chave: string, solution: string): boolean {
    const entry = this.pending.get(chave);
    if (!entry) return false;
    entry.resolve(solution);
    this.pending.delete(chave);
    return true;
  }

  getCaptchaImage(chave: string): Uint8Array | undefined {
    return this.pending.get(chave)?.imagem;
  }

  getCaptchaOrgao(chave: string): string | undefined {
    return this.pending.get(chave)?.orgao;
  }

  getCaptchaTipo(chave: string): CaptchaType {
    return this.pending.get(chave)?.tipo ?? null;
  }

  getCaptchaUrl(chave: string): string | undefined {
    return this.pending.get(chave)?.captchaUrl;
  }

  hasPendente(jobId: string): boolean {
    for (const chave of this.pending.keys()) {
      if (chave.startsWith(`${jobId}-`)) return true;
    }
    return false;
  }

  listarPendentes(jobId: string): { orgao: string; chave: string; tipo: CaptchaType; captchaUrl?: string }[] {
    const result: { orgao: string; chave: string; tipo: CaptchaType; captchaUrl?: string }[] = [];
    for (const [chave, entry] of this.pending.entries()) {
      if (chave.startsWith(`${jobId}-`)) {
        result.push({ orgao: entry.orgao, chave, tipo: entry.tipo, captchaUrl: entry.captchaUrl });
      }
    }
    return result;
  }
}
