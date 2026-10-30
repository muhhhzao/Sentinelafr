import { byId, setText, setTone } from './dom.js';
import { hhmm } from '../core/format.js';
import { precipTrend, windTrend, tempTrend } from '../core/trends.js';

/** Chart.js vem de vendor/chart.umd.min.js e fica global. */
const instances = {};

const BASE_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(5,10,15,0.95)',
      borderColor: '#1a3045',
      borderWidth: 1,
      titleColor: '#c8dce8',
      bodyColor: '#c8dce8',
      displayColors: false,
      titleFont: { family: 'JetBrains Mono, monospace', size: 10 },
      bodyFont: { family: 'JetBrains Mono, monospace', size: 11 },
    },
  },
  scales: { x: { display: false }, y: { display: false } },
  elements: { point: { radius: 0, hoverRadius: 3 } },
  animation: { duration: 400 },
};

/** Cria o gráfico na 1ª vez e só atualiza os dados nas seguintes (sem destruir/recriar). */
function upsert(key, canvasId, { type, labels, data, unit, style, scale }) {
  const existing = instances[key];

  if (existing) {
    existing.data.labels = labels;
    existing.data.datasets[0].data = data;
    existing.update();
    return;
  }

  instances[key] = new window.Chart(byId(canvasId).getContext('2d'), {
    type,
    data: { labels, datasets: [{ data, ...style }] },
    options: {
      ...BASE_OPTIONS,
      plugins: {
        ...BASE_OPTIONS.plugins,
        tooltip: { ...BASE_OPTIONS.plugins.tooltip, callbacks: { label: (item) => `${item.formattedValue} ${unit}` } },
      },
      scales: { x: { display: false }, y: { display: false, ...scale } },
    },
  });
}

export function renderCharts(forecast) {
  if (typeof window.Chart === 'undefined') {
    console.warn('[Sentinela] Chart.js não carregou; gráficos desativados.');
    return;
  }

  const labels = forecast.map((h) => hhmm(h.time));
  const precip = forecast.map((h) => h.rain ?? 0);
  const wind = forecast.map((h) => h.wind ?? 0);
  const temp = forecast.map((h) => h.temp);

  upsert('precip', 'precipChart', {
    type: 'bar', labels, data: precip, unit: 'mm',
    style: { backgroundColor: 'rgba(0,212,255,0.4)', borderColor: 'rgba(0,212,255,0.8)', borderWidth: 1 },
    scale: { beginAtZero: true, suggestedMax: 2 },
  });
  upsert('wind', 'windChart', {
    type: 'line', labels, data: wind, unit: 'km/h',
    style: { borderColor: 'rgba(255,107,53,0.8)', backgroundColor: 'rgba(255,107,53,0.1)', borderWidth: 1.5, fill: true, tension: 0.4 },
    scale: { beginAtZero: true },
  });
  // Temperatura NÃO começa no zero: com beginAtZero a curva ficava achatada no topo do gráfico.
  upsert('temp', 'tempChart', {
    type: 'line', labels, data: temp, unit: '°C',
    style: { borderColor: 'rgba(255,214,10,0.8)', backgroundColor: 'rgba(255,214,10,0.08)', borderWidth: 1.5, fill: true, tension: 0.4 },
    scale: { grace: '10%' },
  });

  for (const [id, trend] of [
    ['precipTrend', precipTrend(precip)],
    ['windTrend', windTrend(wind)],
    ['tempTrend', tempTrend(temp)],
  ]) {
    setText(id, trend.text);
    setTone(id, trend.tone);
  }
}
