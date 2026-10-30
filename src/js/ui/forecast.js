import { byId } from './dom.js';
import { getWmoInfo } from '../core/wmo.js';
import { escapeHtml, hhmm, num } from '../core/format.js';

/** Faixa de previsão horária. */
export function renderForecast(forecast) {
  const strip = byId('forecastStrip');

  if (!forecast.length) {
    strip.innerHTML = '<div class="placeholder placeholder-left">Sem dados de previsão</div>';
    return;
  }

  strip.innerHTML = forecast.map((h, i) => {
    const wmo = getWmoInfo(h.code);
    return `
      <div class="forecast-item ${i === 0 ? 'active' : ''}" title="${escapeHtml(wmo.name)}">
        <div class="forecast-time">${hhmm(h.time)}</div>
        <div class="forecast-icon">${wmo.icon}</div>
        <div class="forecast-temp">${num(h.temp)}°</div>
        <div class="forecast-rain">${num(h.rain, 1)}mm</div>
        <div class="forecast-wind">${num(h.wind)}km/h</div>
      </div>`;
  }).join('');
}
