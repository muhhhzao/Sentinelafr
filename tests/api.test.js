import { test } from 'node:test';
import assert from 'node:assert/strict';

import { fetchJson, ApiError } from '../src/js/api/http.js';
import { buildForecastUrl, normalizeForecast, fetchWeather } from '../src/js/api/openMeteo.js';
import { parsePlaces, searchPlaces, buildGeocodingUrl } from '../src/js/api/geocoding.js';
import { buildDemoWeather } from '../src/js/data/demo.js';
import { computeRisk } from '../src/js/core/risk.js';
import { buildAlerts } from '../src/js/core/alerts.js';

const LOC = { lat: -8.05, lon: -34.88, name: 'Recife, PE, BR' };

/** Resposta no formato real da Open-Meteo (fuso do PONTO: Recife, UTC-3). */
function rawResponse(overrides = {}) {
  // 72 horas: 25/10 00h → 27/10 23h (past_days=1 + forecast_days=2)
  const hourly = { time: [], temperature_2m: [], precipitation: [], wind_speed_10m: [], wind_gusts_10m: [], weather_code: [] };
  for (let d = 25; d <= 27; d++) {
    for (let h = 0; h < 24; h++) {
      hourly.time.push(`2026-10-${d}T${String(h).padStart(2, '0')}:00`);
      hourly.temperature_2m.push(25);
      hourly.precipitation.push(0);
      hourly.wind_speed_10m.push(12);
      hourly.wind_gusts_10m.push(20);
      hourly.weather_code.push(1);
    }
  }
  return {
    timezone: 'America/Recife',
    current: {
      time: '2026-10-26T20:15', temperature_2m: 27.4, relative_humidity_2m: 80, apparent_temperature: 30,
      precipitation: 0, weather_code: 3, wind_speed_10m: 14, wind_direction_10m: 90, wind_gusts_10m: 25,
      surface_pressure: 1010, visibility: 24140,
    },
    hourly,
    ...overrides,
  };
}

const okResponse = (body) => ({ ok: true, status: 200, json: async () => body });
const errResponse = (status, body = {}) => ({ ok: false, status, json: async () => body });

/* --------------------------------------------------------------- URL */

test('URL: fuso automático e histórico de 1 dia (não fixa America/Sao_Paulo)', () => {
  const url = new URL(buildForecastUrl(LOC));
  assert.equal(url.origin, 'https://api.open-meteo.com');
  assert.equal(url.searchParams.get('timezone'), 'auto');
  assert.equal(url.searchParams.get('past_days'), '1');
  assert.equal(url.searchParams.get('forecast_days'), '2');
  assert.equal(url.searchParams.get('latitude'), '-8.05');
  assert.match(url.searchParams.get('current'), /wind_gusts_10m/);
  assert.match(url.searchParams.get('hourly'), /wind_gusts_10m/);
});

test('URL da geocodificação codifica o nome', () => {
  const url = new URL(buildGeocodingUrl('São Paulo'));
  assert.equal(url.searchParams.get('name'), 'São Paulo');
  assert.equal(url.searchParams.get('language'), 'pt');
});

/* --------------------------------------------------------- normalização */

test('normalização: separa passado e futuro pelo horário do PONTO, não do navegador', () => {
  const w = normalizeForecast(rawResponse(), LOC);
  assert.equal(w.current.time, '2026-10-26T20:15');
  assert.equal(w.history.length, 24);
  assert.equal(w.history.at(-1).time, '2026-10-26T20:00'); // última hora fechada
  assert.equal(w.forecast.length, 24);
  assert.equal(w.forecast[0].time, '2026-10-26T21:00');
  assert.equal(w.forecast.at(-1).time, '2026-10-27T20:00');
  assert.equal(w.timezone, 'America/Recife');
});

test('normalização: campos opcionais ausentes viram null, sem quebrar', () => {
  const raw = rawResponse();
  delete raw.current.visibility;
  delete raw.current.wind_gusts_10m;
  delete raw.current.surface_pressure;
  const w = normalizeForecast(raw, LOC);
  assert.equal(w.current.visibility, null);
  assert.equal(w.current.pressure, null);
  assert.equal(w.current.windGusts, 14); // cai para a velocidade do vento
  assert.deepEqual(buildAlerts(w.current), []); // visibilidade null não gera neblina
});

test('normalização: resposta incompleta vira ApiError("invalid")', () => {
  for (const bad of [null, {}, { current: {} }, { current: { time: 'x', temperature_2m: 1, wind_speed_10m: 1 } }, rawResponse({ hourly: { time: [] } })]) {
    assert.throws(() => normalizeForecast(bad, LOC), (e) => e instanceof ApiError && e.kind === 'invalid');
  }
});

/* ----------------------------------------------------------------- HTTP */

test('http: HTTP 400 com motivo NÃO repete e traz a razão da API', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; return errResponse(400, { error: true, reason: 'Latitude must be in range of -90 to 90' }); };
  await assert.rejects(fetchJson('https://x', { fetchImpl, retries: 2, backoffMs: 1 }), (e) => {
    assert.equal(e.kind, 'http');
    assert.equal(e.status, 400);
    assert.match(e.message, /Latitude must be/);
    return true;
  });
  assert.equal(calls, 1);
});

test('http: 503 é repetido até dar certo', async () => {
  let calls = 0;
  const fetchImpl = async () => (++calls < 3 ? errResponse(503) : okResponse({ ok: 1 }));
  assert.deepEqual(await fetchJson('https://x', { fetchImpl, retries: 2, backoffMs: 1 }), { ok: 1 });
  assert.equal(calls, 3);
});

test('http: 429 tem mensagem própria e esgota as tentativas', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; return errResponse(429); };
  await assert.rejects(fetchJson('https://x', { fetchImpl, retries: 1, backoffMs: 1 }), (e) => {
    assert.match(e.userMessage, /Limite de requisições/);
    return true;
  });
  assert.equal(calls, 2);
});

test('http: queda de rede vira ApiError("network")', async () => {
  const fetchImpl = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(fetchJson('https://x', { fetchImpl, retries: 0 }), (e) => e.kind === 'network');
});

test('http: timeout vira ApiError("timeout")', async () => {
  const fetchImpl = (_url, { signal }) => new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('abortado', 'AbortError')));
  });
  await assert.rejects(fetchJson('https://x', { fetchImpl, retries: 0, timeoutMs: 20 }), (e) => e.kind === 'timeout');
});

test('http: cancelamento externo vira "aborted" e não é repetido', async () => {
  const controller = new AbortController();
  let calls = 0;
  const fetchImpl = (_url, { signal }) => new Promise((_, reject) => {
    calls++;
    signal.addEventListener('abort', () => reject(new DOMException('abortado', 'AbortError')));
  });
  const pending = fetchJson('https://x', { fetchImpl, signal: controller.signal, retries: 3, backoffMs: 1, timeoutMs: 5000 });
  controller.abort();
  await assert.rejects(pending, (e) => e.kind === 'aborted');
  assert.equal(calls, 1);
});

test('http: corpo que não é JSON vira ApiError("invalid")', async () => {
  const fetchImpl = async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token <'); } });
  await assert.rejects(fetchJson('https://x', { fetchImpl, retries: 0 }), (e) => e.kind === 'invalid');
});

test('fetchWeather: ponta a ponta com fetch simulado', async () => {
  const fetchImpl = async (url) => {
    assert.match(url, /api\.open-meteo\.com/);
    return okResponse(rawResponse());
  };
  const w = await fetchWeather(LOC, { fetchImpl });
  assert.equal(w.source, 'open-meteo');
  assert.equal(w.location.name, 'Recife, PE, BR');
  assert.equal(w.current.temperature, 27.4);
});

/* ---------------------------------------------------------- geocodificação */

test('geocodificação: devolve várias opções com rótulo legível', () => {
  const places = parsePlaces({
    results: [
      { name: 'Santa Cruz', admin1: 'Rio Grande do Norte', country_code: 'BR', latitude: -6.22, longitude: -36.02 },
      { name: 'Santa Cruz', admin1: 'Santa Cruz', country_code: 'BO', latitude: -17.78, longitude: -63.18 },
      { name: 'Sem coordenadas' },
    ],
  });
  assert.equal(places.length, 2);
  assert.equal(places[0].label, 'Santa Cruz, Rio Grande do Norte, BR');
});

test('geocodificação: sem `results` (cidade inexistente) → lista vazia', async () => {
  assert.deepEqual(parsePlaces({ generationtime_ms: 0.4 }), []);
  assert.deepEqual(await searchPlaces('x'), []); // curto demais: nem consulta a API
  const fetchImpl = async () => okResponse({ generationtime_ms: 0.4 });
  assert.deepEqual(await searchPlaces('Xyzzyx', { fetchImpl }), []);
});

/* ------------------------------------------------------------------- demo */

test('demo: passa pelo mesmo pipeline e dá risco moderado com 2 alertas', () => {
  const w = buildDemoWeather(new Date(2026, 9, 26, 20, 15));
  assert.equal(w.source, 'demo');
  assert.equal(w.forecast.length, 24);
  assert.equal(w.history.length, 24);
  assert.equal(computeRisk(w.current).level, 'moderate');
  const titles = buildAlerts(w.current).map((a) => a.title);
  assert.deepEqual(titles.sort(), ['CHUVA MODERADA', 'VENTO FORTE']);
});

test('demo: é determinística (mesma hora → mesmos números) e tem evento no histórico', () => {
  const a = buildDemoWeather(new Date(2026, 9, 26, 20, 15));
  const b = buildDemoWeather(new Date(2026, 9, 26, 20, 15));
  assert.deepEqual(a.forecast, b.forecast);
  assert.ok(a.history.some((h) => h.rain >= 5));
});
