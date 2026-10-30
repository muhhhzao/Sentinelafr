import { normalizeForecast } from '../api/openMeteo.js';
import { toIsoLocal } from '../core/format.js';

export const DEMO_LOCATION = Object.freeze({ lat: -23.5505, lon: -46.6333, name: 'DEMONSTRAÇÃO — São Paulo, SP' });

/** Pseudo-aleatório determinístico: a demo fica igual a cada execução (bom para apresentar). */
const noise = (i) => Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1);

/**
 * Gera uma resposta no MESMO formato da Open-Meteo e a passa pelo mesmo
 * `normalizeForecast` usado em produção — assim a demo exercita o pipeline real.
 * Cenário: pancadas de chuva com rajadas fortes (risco moderado, 2 alertas ativos).
 */
export function buildDemoWeather(now = new Date()) {
  const base = new Date(now);
  base.setMinutes(0, 0, 0);

  const range = Array.from({ length: 72 }, (_, k) => k - 24); // -24h … +47h
  const at = (offset) => { const d = new Date(base); d.setHours(d.getHours() + offset); return d; };

  const hourly = {
    time: range.map((o) => toIsoLocal(at(o))),
    temperature_2m: range.map((o) => +(22 + Math.sin(o * 0.26) * 7 + noise(o) * 2).toFixed(1)),
    precipitation: range.map((o) => {
      if (o >= -4 && o <= -2) return +(10 + noise(o) * 8).toFixed(1); // evento recente no histórico
      if (o >= 0 && o < 6) return +(noise(o) * 12).toFixed(1);
      if (o >= 6 && o < 12) return +(noise(o) * 3).toFixed(1);
      return 0;
    }),
    wind_speed_10m: range.map((o) => +(20 + Math.sin(o * 0.3) * 15 + noise(o) * 5).toFixed(1)),
    wind_gusts_10m: range.map((o) => +(32 + Math.sin(o * 0.3) * 18 + noise(o) * 10 + (o >= -4 && o <= -2 ? 20 : 0)).toFixed(1)),
    weather_code: range.map((o) => (o < 0 ? (o >= -4 && o <= -2 ? 82 : 3) : o < 6 ? 81 : o < 12 ? 63 : o < 18 ? 3 : 1)),
  };

  const raw = {
    timezone: 'America/Sao_Paulo',
    current: {
      time: toIsoLocal(now),
      temperature_2m: 27.4,
      relative_humidity_2m: 82,
      apparent_temperature: 31.2,
      precipitation: 8.5,
      weather_code: 81,
      wind_speed_10m: 42,
      wind_direction_10m: 135,
      wind_gusts_10m: 67,
      surface_pressure: 1008,
      visibility: 4200,
    },
    hourly,
  };

  return normalizeForecast(raw, DEMO_LOCATION, { source: 'demo', now: now.getTime() });
}
