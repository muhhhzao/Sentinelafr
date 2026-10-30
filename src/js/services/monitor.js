import { CONFIG } from '../config.js';
import { fetchWeather } from '../api/openMeteo.js';
import { buildDemoWeather } from '../data/demo.js';
import { sameLocation } from '../core/location.js';
import { state, setState } from '../state.js';
import { notify } from '../ui/notifications.js';
import { readJson, writeJson } from './storage.js';

let timer = null;
let inflight = null;

function stopTimer() {
  if (timer) clearInterval(timer);
  timer = null;
}

function cancelInflight() {
  inflight?.abort();
  inflight = null;
}

/** Último dado real salvo para este local, se ainda for recente. */
function readCache(location) {
  const saved = readJson(CONFIG.storageKeys.cache);
  if (!saved?.weather || !sameLocation(saved.weather.location, location)) return null;
  return Date.now() - saved.weather.fetchedAt <= CONFIG.cacheMaxAgeMs ? saved.weather : null;
}

/**
 * Atualiza os dados do local monitorado.
 *
 * Cadeia de segurança quando a API falha:
 *   1. mantém o que já está na tela (mode 'stale');
 *   2. senão usa o cache do localStorage (mode 'stale');
 *   3. senão, na abertura do app, cai na demonstração — a tela nunca fica vazia;
 *   4. senão, mostra o erro (mode 'offline').
 */
export async function refresh({ initial = false, silent = false } = {}) {
  if (state.mode === 'demo') return loadDemo({ silent: true });

  cancelInflight();
  const controller = new AbortController();
  inflight = controller;
  setState({ loading: true });

  try {
    const weather = await fetchWeather(state.location, { signal: controller.signal });
    writeJson(CONFIG.storageKeys.cache, { weather });
    setState({ weather, mode: 'live', loading: false });
    if (!silent) notify('Dados atualizados', 'ok');
  } catch (err) {
    if (err.kind === 'aborted') return; // outra busca assumiu: ignora esta
    console.error('[Sentinela] falha ao buscar dados:', err);

    const message = err.userMessage ?? 'Erro inesperado ao buscar dados';
    // Dados de demonstração nunca contam como "últimos dados reais", mesmo no mesmo local.
    const onScreen = state.weather?.source === 'open-meteo' && sameLocation(state.weather.location, state.location);
    const current = onScreen ? state.weather : null;
    const cached = current ?? readCache(state.location);

    if (cached) {
      setState({ weather: cached, mode: 'stale', loading: false });
      notify(`${message} — exibindo os últimos dados salvos`, 'warn');
    } else if (initial) {
      notify(`${message} — exibindo dados de demonstração`, 'warn');
      loadDemo({ silent: true });
    } else {
      setState({ mode: 'offline', loading: false });
      notify(message, 'danger');
    }
  } finally {
    if (inflight === controller) inflight = null;
  }
}

/** Começa (ou troca) o monitoramento de um local e agenda a atualização automática. */
export async function startMonitoring(location, options = {}) {
  stopTimer();
  setState({ location: { ...location }, mode: 'idle' });
  writeJson(CONFIG.storageKeys.location, location);

  await refresh(options);
  // Se a abertura caiu na demonstração, não há o que atualizar sozinho.
  if (state.mode !== 'demo') timer = setInterval(() => refresh({ silent: true }), CONFIG.refreshMs);
}

/**
 * Modo demonstração. Para o timer e cancela qualquer busca em andamento
 * (antes o intervalo continuava vivo e sobrescrevia a demo com dados reais).
 */
export function loadDemo({ silent = false } = {}) {
  stopTimer();
  cancelInflight();
  const weather = buildDemoWeather();
  setState({ location: weather.location, weather, mode: 'demo', loading: false });
  if (!silent) notify('Modo demonstração ativado', 'warn');
}

export function getSavedLocation() {
  const saved = readJson(CONFIG.storageKeys.location);
  const valid = saved && Number.isFinite(saved.lat) && Number.isFinite(saved.lon) && typeof saved.name === 'string';
  return valid ? saved : { ...CONFIG.defaultLocation };
}
