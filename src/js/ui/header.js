import { byId } from './dom.js';

const BADGES = {
  idle:    'CONECTANDO',
  live:    'AO VIVO',
  stale:   'DESATUALIZADO',
  demo:    'DEMONSTRAÇÃO',
  offline: 'SEM CONEXÃO',
};

export function startClock() {
  const clock = byId('clock');
  const tick = () => { clock.textContent = new Date().toLocaleTimeString('pt-BR', { hour12: false }); };
  tick();
  setInterval(tick, 1000);
}

/** O selo "AO VIVO" só aparece quando os dados são de fato ao vivo. */
export function renderMode(mode) {
  const badge = byId('liveBadge');
  badge.dataset.mode = mode;
  byId('liveText').textContent = BADGES[mode] ?? BADGES.idle;
}

export function renderLoading(loading) {
  byId('statusLoading').classList.toggle('hidden', !loading);
  const btn = byId('refreshBtn');
  btn.disabled = loading;
  btn.setAttribute('aria-busy', String(loading));
}
