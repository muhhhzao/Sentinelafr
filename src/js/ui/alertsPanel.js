import { byId, setText } from './dom.js';
import { buildAlerts, bannerFor } from '../core/alerts.js';
import { detectEvents } from '../core/history.js';
import { escapeHtml, hhmm } from '../core/format.js';

const MAX_HISTORY_ROWS = 6;

/** Banner superior, cartões de alerta e histórico das últimas 24 h. */
export function renderAlerts(weather) {
  const alerts = buildAlerts(weather.current);
  renderBanner(alerts);
  renderCards(alerts, weather);
  renderHistory(weather.history);
}

function renderBanner(alerts) {
  const banner = byId('alertBanner');
  const info = bannerFor(alerts);

  banner.classList.toggle('active', !!info);
  if (!info) return;

  // Antes: title.replace(/^\S+\s/, '') cortava a 1ª palavra ("CHUVA INTENSA" virava "INTENSA").
  setText('alertText', info.extra > 0 ? `${info.title}  +${info.extra}` : info.title);
  setText('alertLevelBadge', info.badge);
  banner.dataset.level = info.level;
}

function renderCards(alerts, weather) {
  const stamp = `Atualizado às ${hhmm(weather.current.time)}`;

  if (!alerts.length) {
    byId('alertsContainer').innerHTML = `
      <div class="alert-card ok">
        <div class="alert-card-title">✅ SEM ALERTAS ATIVOS</div>
        <div class="alert-card-desc">Condições normais para ${escapeHtml(weather.location.name)}.</div>
        <div class="alert-card-time">${stamp}</div>
      </div>`;
    return;
  }

  byId('alertsContainer').innerHTML = alerts.map((a) => `
    <div class="alert-card ${a.level}">
      <div class="alert-card-title">${escapeHtml(a.title)}</div>
      <div class="alert-card-desc">${escapeHtml(a.desc)}</div>
      <div class="alert-card-time">${stamp}</div>
    </div>`).join('');
}

/**
 * Histórico com dados REAIS da API (parâmetro past_days).
 * Antes mostrava sempre "Sem eventos registrados", independentemente do que tinha ocorrido.
 */
function renderHistory(history) {
  const box = byId('historyContainer');

  if (!history.length) {
    box.textContent = '-- Sem dados de histórico disponíveis';
    return;
  }

  const events = detectEvents(history).slice(0, MAX_HISTORY_ROWS);
  if (!events.length) {
    box.innerHTML = '<div class="history-row history-ok">✓ Sem eventos relevantes nas últimas 24 h</div>';
    return;
  }

  box.innerHTML = events.map((e) => `
    <div class="history-row ${e.level}"><span class="history-time">${escapeHtml(e.time)}</span> ${escapeHtml(e.text)}</div>`).join('');
}
