import { CONFIG } from '../config.js';

/**
 * Erro padronizado para qualquer falha de API.
 * `kind`: 'network' | 'timeout' | 'http' | 'invalid' | 'aborted'
 */
export class ApiError extends Error {
  constructor(kind, message, { status, cause } = {}) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.cause = cause;
  }

  /** Mensagem amigável para mostrar ao usuário. */
  get userMessage() {
    switch (this.kind) {
      case 'timeout': return 'A API demorou demais para responder';
      case 'network': return 'Sem conexão com a API — verifique a internet';
      case 'http':    return this.status === 429 ? 'Limite de requisições da API atingido — aguarde um pouco' : `A API recusou a requisição (HTTP ${this.status})`;
      case 'invalid': return 'A API devolveu dados incompletos';
      default:        return 'Falha ao consultar a API';
    }
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Vale a pena tentar de novo? (queda de rede, timeout, 429 e 5xx — nunca 4xx de validação). */
function isRetryable(err) {
  return err.kind === 'network' || err.kind === 'timeout' || (err.kind === 'http' && (err.status === 429 || err.status >= 500));
}

/** Uma única tentativa, com timeout próprio e respeitando um `signal` externo. */
async function attempt(url, { timeoutMs, signal, fetchImpl }) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener('abort', onExternalAbort, { once: true });

  try {
    const res = await fetchImpl(url, { signal: controller.signal, headers: { Accept: 'application/json' } });

    if (!res.ok) {
      // A Open-Meteo explica o erro no corpo: { error: true, reason: "..." }
      let reason = '';
      try { reason = (await res.json())?.reason ?? ''; } catch { /* corpo não é JSON */ }
      throw new ApiError('http', `HTTP ${res.status}${reason ? ` — ${reason}` : ''}`, { status: res.status });
    }

    try {
      return await res.json();
    } catch (cause) {
      throw new ApiError('invalid', 'Resposta não é um JSON válido', { cause });
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (signal?.aborted) throw new ApiError('aborted', 'Requisição cancelada', { cause: err });
    if (timedOut) throw new ApiError('timeout', `Tempo esgotado após ${timeoutMs} ms`, { cause: err });
    throw new ApiError('network', err?.message || 'Falha de rede', { cause: err });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onExternalAbort);
  }
}

/**
 * GET JSON com timeout, novas tentativas (com espera crescente) e erros padronizados.
 * Corrige o comportamento antigo, que lia o corpo sem checar `res.ok` e
 * quebrava o dashboard quando a API devolvia um erro.
 */
export async function fetchJson(url, options = {}) {
  const {
    timeoutMs = CONFIG.http.timeoutMs,
    retries = CONFIG.http.retries,
    backoffMs = CONFIG.http.backoffMs,
    signal,
    fetchImpl = (...args) => globalThis.fetch(...args),
  } = options;

  let lastError;
  for (let i = 0; i <= retries; i++) {
    try {
      return await attempt(url, { timeoutMs, signal, fetchImpl });
    } catch (err) {
      lastError = err;
      if (!isRetryable(err) || i === retries) break;
      await sleep(backoffMs * (i + 1));
    }
  }
  throw lastError;
}
