import { CONFIG } from './config.js';

/**
 * Estado global mínimo com assinatura (publish/subscribe).
 * A UI só LÊ o estado e reage a mudanças; quem altera é o serviço `monitor`.
 *
 * mode: 'idle'    → ainda sem dados
 *       'live'    → dados reais e atualizados
 *       'stale'   → dados reais, porém antigos (falha ao atualizar / vindos do cache)
 *       'demo'    → dados de demonstração
 *       'offline' → sem dados e sem conexão
 */
export const state = {
  location: { ...CONFIG.defaultLocation },
  weather: null,
  mode: 'idle',
  loading: false,
  tab: 'radar',
};

const listeners = new Set();

/** @returns {() => void} função para cancelar a assinatura */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setState(patch) {
  Object.assign(state, patch);
  for (const listener of listeners) listener(state, patch);
}
