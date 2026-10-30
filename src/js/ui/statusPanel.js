import { byId, setText } from './dom.js';
import { getWmoInfo } from '../core/wmo.js';
import { degToCardinal } from '../core/wind.js';
import { num, withUnit, hhmm } from '../core/format.js';
import { computeRisk } from '../core/risk.js';

const SOURCE_LABEL = {
  live:  (w) => `FONTE: OPEN-METEO — ${w.location.name}`,
  stale: (w) => `FONTE: OPEN-METEO (CACHE ${new Date(w.fetchedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}) — ${w.location.name}`,
  demo:  (w) => `FONTE: DADOS DE DEMONSTRAÇÃO — ${w.location.name}`,
};

/** Painel "Condição atual" + valores grandes dos mini-gráficos + selo de horário do radar. */
export function renderStatus(weather, mode) {
  const c = weather.current;
  const wmo = getWmoInfo(c.weatherCode);

  setText('condIcon', wmo.icon);
  setText('condName', wmo.name);
  setText('condDesc', wmo.desc);

  setText('tempVal',   withUnit(c.temperature, '°C'));
  setText('feelsVal',  withUnit(c.apparent, '°C'));
  setText('humVal',    withUnit(c.humidity, '%'));
  setText('windVal',   withUnit(c.windSpeed, ' km/h'));
  setText('gustVal',   withUnit(c.windGusts, ' km/h'));
  setText('rainVal',   withUnit(c.precipitation, ' mm', 1));
  setText('pressVal',  withUnit(c.pressure, ' hPa'));
  setText('visVal',    Number.isFinite(c.visibility) ? `${num(c.visibility / 1000, 1)} km` : '-- km');
  setText('regionVal', weather.location.name);

  setText('precipBig', num(c.precipitation, 1));
  setText('windBig',   num(c.windSpeed));
  setText('tempBig',   num(c.temperature));

  setText('radarTime', `ATUALIZADO: ${hhmm(c.time)}`);
  setText('dataSource', (SOURCE_LABEL[mode] ?? SOURCE_LABEL.live)(weather));

  renderCompass(c.windDirection);
  renderRisk(computeRisk(c));
}

function renderCompass(deg) {
  const arrow = byId('compassArrow');
  if (!Number.isFinite(deg)) {
    setText('windDirLabel', '---');
    return;
  }
  arrow.style.transform = `translateX(-50%) translateY(-100%) rotate(${deg}deg)`;
  setText('windDirLabel', `${Math.round(deg)}° — ${degToCardinal(deg)}`);
}

function renderRisk(risk) {
  byId('riskDisplay').dataset.level = risk.level;
  setText('riskValue', String(risk.score));
  setText('riskLabel', risk.label);
  byId('riskBarFill').style.width = `${risk.score}%`;
}
