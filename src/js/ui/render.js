import { renderStatus } from './statusPanel.js';
import { renderAlerts } from './alertsPanel.js';
import { renderForecast } from './forecast.js';
import { renderCharts } from './charts.js';
import { setRadarWeather } from './radar.js';

/** Se um painel falhar, os demais continuam funcionando. */
function safely(name, fn) {
  try {
    fn();
  } catch (err) {
    console.error(`[Sentinela] falha ao renderizar "${name}":`, err);
  }
}

/**
 * Pinta o dashboard inteiro a partir de um objeto `Weather`.
 * @param {import('../api/openMeteo.js').Weather} weather
 * @param {string} mode
 */
export function renderWeather(weather, mode) {
  safely('condição atual', () => renderStatus(weather, mode));
  safely('alertas', () => renderAlerts(weather));
  safely('previsão', () => renderForecast(weather.forecast));
  safely('gráficos', () => renderCharts(weather.forecast));
  safely('radar', () => setRadarWeather(weather));
}
