const LOG = (msg: string) => console.log(`[RetryManager] ${msg}`);

export async function wait(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  label?: string;
  onRetry?: (attempt: number, error: Error) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 2000,
    maxDelayMs = 30000,
    label = 'operação',
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      LOG(`${label} — tentativa ${attempt}/${maxAttempts} falhou: ${lastError.message}`);

      if (attempt < maxAttempts) {
        const jitter = Math.random() * 500;
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1) + jitter, maxDelayMs);
        LOG(`Aguardando ${Math.round(delay)}ms antes de tentar novamente...`);
        await wait(delay);
      }
    }
  }

  throw lastError ?? new Error(`${label} falhou após ${maxAttempts} tentativas`);
}

export function criarRateLimit(delayMs: number) {
  let ultimaChamada = 0;

  return async function throttle(): Promise<void> {
    const agora = Date.now();
    const desdeUltima = agora - ultimaChamada;
    if (desdeUltima < delayMs) {
      await wait(delayMs - desdeUltima);
    }
    ultimaChamada = Date.now();
  };
}
