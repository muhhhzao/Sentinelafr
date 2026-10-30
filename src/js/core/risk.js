import { clamp } from './format.js';

/**
 * Índice de risco geral (0–100) combinando chuva, rajadas e tipo de tempo.
 *
 * Correção: o termo do vento usava `(rajada - 30) * 0.5` sem limite inferior,
 * então rajadas fracas (< 30 km/h) geravam valor NEGATIVO e "descontavam"
 * o risco causado pela chuva. Agora cada parcela fica entre 0 e o seu teto.
 */
export function computeRisk(current) {
  const rain = clamp((current.precipitation ?? 0) * 2, 0, 40);
  const wind = clamp(((current.windGusts ?? 0) - 30) * 0.5, 0, 25);

  const code = current.weatherCode ?? 0;
  let weather = 0;
  if (code >= 95) weather = 30;
  else if (code >= 80) weather = 15;
  else if (code >= 61) weather = 8;

  const score = clamp(Math.round(rain + wind + weather), 0, 100);

  if (score >= 70) return { score, level: 'high',     label: 'ALTO RISCO',     color: 'var(--danger)' };
  if (score >= 40) return { score, level: 'moderate', label: 'RISCO MODERADO', color: 'var(--warn)' };
  return                  { score, level: 'low',      label: 'BAIXO RISCO',    color: 'var(--ok)' };
}
