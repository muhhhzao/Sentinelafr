import { mean } from './format.js';

/**
 * Tendências exibidas sob os mini-gráficos.
 * Cada função devolve { text, tone } onde tone ∈ 'ok' | 'warn' | 'danger' | 'info'.
 */

export function precipTrend(series) {
  const next = series.slice(0, 6);
  const peak = Math.max(0, ...next);
  if (peak === 0 && series.every((v) => v === 0)) return { text: '— sem chuva prevista', tone: 'ok' };
  if (peak > 5) return { text: '▲ chuva forte nas próximas horas', tone: 'danger' };
  if (mean(series.slice(0, 3)) > 0.5) return { text: '→ chuva fraca persistente', tone: 'info' };
  return { text: '▼ diminuindo', tone: 'ok' };
}

export function windTrend(series) {
  if (series.length < 2) return { text: '— sem dados', tone: 'ok' };
  const n = Math.min(4, series.length);
  const first = mean(series.slice(0, n));
  const last = mean(series.slice(-n));
  if (last > first + 10) return { text: '▲ aumentando', tone: 'danger' };
  if (last > first + 5)  return { text: '▲ aumentando', tone: 'warn' };
  if (last < first - 5)  return { text: '▼ diminuindo', tone: 'ok' };
  return { text: '→ estável', tone: 'ok' };
}

export function tempTrend(series) {
  const valid = series.filter(Number.isFinite);
  if (valid.length < 2) return { text: '— sem dados', tone: 'ok' };
  const first = valid[0];
  const last = valid[valid.length - 1];
  const tone = last > 35 ? 'danger' : last < 10 ? 'info' : 'ok';
  if (last > first + 2) return { text: '▲ subindo', tone };
  if (last < first - 2) return { text: '▼ caindo', tone };
  return { text: '→ estável', tone };
}
