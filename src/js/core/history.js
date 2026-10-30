import { CONFIG } from '../config.js';
import { hhmm, num } from './format.js';

const T = CONFIG.thresholds;

/**
 * Detecta eventos relevantes nas últimas horas (dados reais da API, via `past_hours`).
 * Devolve do mais recente para o mais antigo.
 *
 * @param {{time:string, rain:number|null, gust:number|null, temp:number|null, code:number|null}[]} history
 */
export function detectEvents(history) {
  const events = [];

  for (const h of history) {
    const found = [];
    if (h.rain >= T.rainDanger)      found.push(`Chuva intensa (${num(h.rain, 1)} mm)`);
    else if (h.rain >= T.rainWarn)   found.push(`Chuva moderada (${num(h.rain, 1)} mm)`);
    if (h.gust >= T.gustDanger)      found.push(`Rajadas extremas (${num(h.gust)} km/h)`);
    else if (h.gust >= T.gustWarn)   found.push(`Vento forte (${num(h.gust)} km/h)`);
    if (h.code >= T.stormCode)       found.push('Tempestade');
    if (h.temp >= T.heatDanger)      found.push(`Calor extremo (${num(h.temp)}°C)`);
    else if (h.temp <= T.coldWarn)   found.push(`Frio intenso (${num(h.temp)}°C)`);

    if (found.length) {
      const severe = h.rain >= T.rainDanger || h.gust >= T.gustDanger || h.code >= T.stormCode || h.temp >= T.heatDanger;
      events.push({ time: hhmm(h.time), text: found.join(' · '), level: severe ? 'danger' : 'warn' });
    }
  }

  return events.reverse();
}
