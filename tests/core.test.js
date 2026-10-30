import { test } from 'node:test';
import assert from 'node:assert/strict';

import { computeRisk } from '../src/js/core/risk.js';
import { buildAlerts, bannerFor } from '../src/js/core/alerts.js';
import { detectEvents } from '../src/js/core/history.js';
import { degToCardinal, windTravelVector } from '../src/js/core/wind.js';
import { getWmoInfo } from '../src/js/core/wmo.js';
import { precipTrend, windTrend } from '../src/js/core/trends.js';
import { parseCoordinate, validateLocation } from '../src/js/core/location.js';
import { escapeHtml, hhmm, num, withUnit } from '../src/js/core/format.js';

const calm = { temperature: 24, precipitation: 0, windSpeed: 10, windGusts: 15, weatherCode: 1, visibility: 10000 };

/* ----------------------------------------------------------------- risco */

test('risco: rajada fraca NÃO reduz o risco causado pela chuva (bug do termo negativo)', () => {
  const withWeakGust = computeRisk({ precipitation: 10, windGusts: 5, weatherCode: 63 });
  const withNoGust = computeRisk({ precipitation: 10, windGusts: 30, weatherCode: 63 });
  assert.equal(withWeakGust.score, withNoGust.score);
  assert.equal(withWeakGust.score, 28); // 20 (chuva) + 0 (vento) + 8 (código 63)
});

test('risco: cenário de demonstração é MODERADO', () => {
  const r = computeRisk({ precipitation: 8.5, windGusts: 67, weatherCode: 81 });
  assert.equal(r.score, 51);
  assert.equal(r.level, 'moderate');
});

test('risco: tempestade severa fica no teto de 100 e nível alto', () => {
  const r = computeRisk({ precipitation: 50, windGusts: 120, weatherCode: 99 });
  assert.equal(r.score, 95); // 40 + 25 + 30
  assert.equal(r.level, 'high');
  assert.ok(computeRisk({ precipitation: 999, windGusts: 999, weatherCode: 99 }).score <= 100);
});

test('risco: tempo calmo é baixo e nunca negativo', () => {
  const r = computeRisk(calm);
  assert.equal(r.score, 0);
  assert.equal(r.level, 'low');
});

/* --------------------------------------------------------------- alertas */

test('alertas: tempo calmo não gera alertas e o banner some', () => {
  assert.deepEqual(buildAlerts(calm), []);
  assert.equal(bannerFor([]), null);
});

test('alertas: o mais grave vem primeiro, mesmo que tenha sido detectado depois', () => {
  const alerts = buildAlerts({ ...calm, windGusts: 55, precipitation: 25 }); // vento = warn, chuva = danger
  assert.equal(alerts[0].level, 'danger');
  assert.equal(alerts[0].title, 'CHUVA INTENSA');
  assert.equal(bannerFor(alerts).badge, 'NÍVEL 3');
});

test('alertas: título do banner fica COMPLETO (bug do .replace que cortava a 1ª palavra)', () => {
  const banner = bannerFor(buildAlerts({ ...calm, precipitation: 30 }));
  assert.equal(banner.title, 'CHUVA INTENSA');
});

test('alertas: visibilidade ausente (null) não dispara neblina', () => {
  assert.equal(buildAlerts({ ...calm, visibility: null }).length, 0);
  assert.equal(buildAlerts({ ...calm, visibility: 400 })[0].title, 'NEBLINA DENSA');
});

test('alertas: calor, frio e tempestade', () => {
  assert.equal(buildAlerts({ ...calm, temperature: 41 })[0].title, 'CALOR EXTREMO');
  assert.equal(buildAlerts({ ...calm, temperature: 3 })[0].title, 'FRIO INTENSO');
  assert.equal(buildAlerts({ ...calm, weatherCode: 95 })[0].title, 'TEMPESTADE ATIVA');
});

/* ------------------------------------------------------------- histórico */

test('histórico: detecta eventos reais e devolve do mais recente para o mais antigo', () => {
  const history = [
    { time: '2026-10-26T10:00', rain: 0, gust: 20, temp: 25, code: 1 },
    { time: '2026-10-26T11:00', rain: 12, gust: 30, temp: 24, code: 63 },
    { time: '2026-10-26T12:00', rain: 0, gust: 85, temp: 24, code: 3 },
  ];
  const events = detectEvents(history);
  assert.equal(events.length, 2);
  assert.equal(events[0].time, '12:00');
  assert.equal(events[0].level, 'danger');
  assert.match(events[1].text, /Chuva moderada/);
});

test('histórico: sem eventos → lista vazia (e não texto fixo)', () => {
  assert.deepEqual(detectEvents([{ time: '2026-10-26T10:00', rain: 0, gust: 10, temp: 22, code: 0 }]), []);
});

/* ------------------------------------------------------------- vento/wmo */

test('vento: pontos cardeais, incluindo negativos e acima de 360', () => {
  assert.equal(degToCardinal(0), 'N');
  assert.equal(degToCardinal(90), 'L');
  assert.equal(degToCardinal(135), 'SE');
  assert.equal(degToCardinal(270), 'O');
  assert.equal(degToCardinal(-90), 'O');
  assert.equal(degToCardinal(361), 'N');
  assert.equal(degToCardinal(null), '--');
});

test('vento: seta aponta PARA ONDE o vento vai (oposto da origem)', () => {
  const fromNorth = windTravelVector(0); // vento do Norte → vai para o Sul (y positivo no canvas)
  assert.ok(Math.abs(fromNorth.x) < 1e-9);
  assert.ok(fromNorth.y > 0.99);
  const fromWest = windTravelVector(270); // vento do Oeste → vai para o Leste (x positivo)
  assert.ok(fromWest.x > 0.99);
  assert.ok(Math.abs(fromWest.y) < 1e-9);
});

test('wmo: códigos congelantes (56, 57, 66, 67) agora existem', () => {
  for (const code of [56, 57, 66, 67]) assert.notEqual(getWmoInfo(code).name, 'DADO INDISPONÍVEL');
  assert.equal(getWmoInfo(1234).name, 'DADO INDISPONÍVEL');
  assert.equal(getWmoInfo(null).name, 'DADO INDISPONÍVEL');
});

/* ------------------------------------------------------------ tendências */

test('tendências: sem chuva prevista não diz "diminuindo"', () => {
  assert.equal(precipTrend(Array(24).fill(0)).text, '— sem chuva prevista');
  assert.equal(precipTrend([0, 0, 9, 0, 0, 0, 0]).tone, 'danger');
});

test('tendências: série curta não quebra (bug da divisão fixa por 3/4)', () => {
  assert.doesNotThrow(() => precipTrend([1]));
  assert.doesNotThrow(() => windTrend([5]));
  assert.equal(windTrend([10, 10, 10, 10, 30, 30, 30, 30]).tone, 'danger');
});

/* -------------------------------------------------------------- location */

test('coordenadas: 0 é válido (antes `|| -23.55` trocava por São Paulo)', () => {
  const r = validateLocation({ lat: '0', lon: '0', name: '' });
  assert.equal(r.ok, true);
  assert.equal(r.location.lat, 0);
  assert.equal(r.location.name, '0.00, 0.00');
});

test('coordenadas: aceita vírgula decimal e rejeita lixo/fora do intervalo', () => {
  assert.equal(parseCoordinate('-23,55'), -23.55);
  assert.ok(Number.isNaN(parseCoordinate('abc')));
  assert.ok(Number.isNaN(parseCoordinate('')));
  assert.equal(validateLocation({ lat: '91', lon: '0' }).ok, false);
  assert.equal(validateLocation({ lat: '0', lon: '181' }).ok, false);
  assert.equal(validateLocation({ lat: 'x', lon: '0' }).ok, false);
});

/* ---------------------------------------------------------------- format */

test('format: escapeHtml neutraliza HTML vindo de APIs externas', () => {
  assert.equal(escapeHtml('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
  assert.equal(escapeHtml(null), '');
});

test('format: dados ausentes viram "--" (e 0 continua sendo 0)', () => {
  assert.equal(num(null), '--');
  assert.equal(num(0), '0');
  assert.equal(withUnit(undefined, '°C'), '--°C');
  assert.equal(withUnit(0, ' mm', 1), '0.0 mm');
  assert.equal(hhmm('2026-10-26T20:00'), '20:00');
  assert.equal(hhmm(undefined), '--');
});
