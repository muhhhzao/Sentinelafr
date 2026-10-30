import { CONFIG } from '../config.js';
import { num } from './format.js';

const T = CONFIG.thresholds;

/** Ordem de severidade: o alerta mais grave aparece primeiro (e no banner). */
const SEVERITY = { danger: 2, warn: 1 };

/**
 * Gera a lista de alertas ativos a partir das condições atuais.
 * Função pura: não toca no DOM e não depende do relógio.
 *
 * @param {import('../api/openMeteo.js').CurrentConditions} c
 * @returns {{id:string, level:'danger'|'warn', title:string, desc:string}[]}
 */
export function buildAlerts(c) {
  const alerts = [];

  if (c.windGusts >= T.gustDanger) {
    alerts.push({ id: 'gust', level: 'danger', title: 'RAJADAS EXTREMAS', desc: `Rajadas de ${num(c.windGusts)} km/h detectadas. Risco de danos.` });
  } else if (c.windGusts >= T.gustWarn) {
    alerts.push({ id: 'gust', level: 'warn', title: 'VENTO FORTE', desc: `Rajadas de ${num(c.windGusts)} km/h. Atenção.` });
  }

  if (c.precipitation >= T.rainDanger) {
    alerts.push({ id: 'rain', level: 'danger', title: 'CHUVA INTENSA', desc: `${num(c.precipitation, 1)} mm/h — risco de alagamentos.` });
  } else if (c.precipitation >= T.rainWarn) {
    alerts.push({ id: 'rain', level: 'warn', title: 'CHUVA MODERADA', desc: `${num(c.precipitation, 1)} mm/h em curso.` });
  }

  if (c.weatherCode >= T.stormCode) {
    alerts.push({ id: 'storm', level: 'danger', title: 'TEMPESTADE ATIVA', desc: 'Trovoadas com relâmpagos e granizo possível.' });
  }

  if (c.temperature >= T.heatDanger) {
    alerts.push({ id: 'heat', level: 'danger', title: 'CALOR EXTREMO', desc: `${num(c.temperature)}°C — risco à saúde.` });
  } else if (c.temperature <= T.coldWarn) {
    alerts.push({ id: 'cold', level: 'warn', title: 'FRIO INTENSO', desc: `${num(c.temperature)}°C — risco de hipotermia.` });
  }

  // Só alerta neblina quando a API realmente informou a visibilidade.
  if (Number.isFinite(c.visibility) && c.visibility < T.fogVisibility) {
    alerts.push({ id: 'fog', level: 'warn', title: 'NEBLINA DENSA', desc: `Visibilidade: ${num(c.visibility / 1000, 1)} km.` });
  }

  return alerts.sort((a, b) => SEVERITY[b.level] - SEVERITY[a.level]);
}

/** Dados do banner superior: usa o alerta mais grave. */
export function bannerFor(alerts) {
  if (!alerts.length) return null;
  const top = alerts[0];
  return {
    title: top.title,
    level: top.level,
    badge: top.level === 'danger' ? 'NÍVEL 3' : 'NÍVEL 2',
    extra: alerts.length - 1,
  };
}
