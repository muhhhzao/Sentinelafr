import { byId, setText } from './dom.js';
import { degToCardinal, windTravelVector } from '../core/wind.js';

/**
 * Visualização ILUSTRATIVA desenhada em canvas a partir das condições atuais
 * (não é imagem de radar real — o painel avisa isso na tela).
 *
 * Melhorias sobre a versão anterior:
 *  - nitidez em telas retina (devicePixelRatio) e redimensionamento automático;
 *  - animação por requestAnimationFrame com tempo real (pausa sozinha em aba oculta);
 *  - respeita prefers-reduced-motion;
 *  - corrige a cor do ponto central ('var(--accent)' não funciona em canvas);
 *  - corrige a direção das setas da aba VENTO (graus meteorológicos ≠ ângulo do canvas).
 */

const COLORS = { accent: '#00d4ff', text: '#c8dce8', bg: '#040c14', orange: '#ff6b35' };
const MONO = "'JetBrains Mono', monospace";

const TAB_TITLES = {
  precipitacao: 'ACUMULADO DE CHUVA',
  vento: 'CAMPO DE VENTO',
  temperatura: 'CAMPO DE TEMPERATURA',
};

let canvas = null;
let ctx = null;
let width = 0;
let height = 0;
let tab = 'radar';
let weather = null;
let rafId = null;
const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function initRadar(canvasEl) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
  resize();

  new ResizeObserver(() => { resize(); draw(performance.now()); }).observe(canvas.parentElement);

  if (!reducedMotion) {
    const loop = (t) => { draw(t); rafId = requestAnimationFrame(loop); };
    rafId = requestAnimationFrame(loop);
  } else {
    draw(0);
  }
}

export function setRadarTab(next) {
  tab = next;
  updateTitle();
  draw(performance.now());
}

export function setRadarWeather(next) {
  weather = next;
  updateTitle();
  draw(performance.now());
}

export function stopRadar() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
  width = Math.max(1, Math.round(rect.width));
  height = Math.max(1, Math.round(rect.height));
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function updateTitle() {
  if (tab !== 'radar') return setText('radarTitle', TAB_TITLES[tab]);
  const c = weather?.current;
  if (!c) return setText('radarTitle', 'AGUARDANDO DADOS');

  const code = c.weatherCode ?? 0;
  const text = code >= 95 ? 'TEMPESTADE DETECTADA'
    : code >= 80 ? 'PANCADAS EM CURSO'
    : code >= 61 ? 'CHUVA EM CURSO'
    : code >= 51 ? 'GAROA DETECTADA'
    : 'SEM PRECIPITAÇÃO';
  setText('radarTitle', text);
}

/* ------------------------------------------------------------------ desenho */

function draw(now) {
  if (!ctx) return;
  const t = reducedMotion ? 0 : now / 1000; // segundos
  const R = Math.min(width, height) / 2 - 4;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, width, height);
  drawGrid();

  if (tab === 'radar') drawRadar(t, R);
  else if (tab === 'precipitacao') drawPrecip(t, R);
  else if (tab === 'vento') drawWind();
  else if (tab === 'temperatura') drawTemp();
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(26,48,69,0.55)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
  for (let y = 0; y < height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
}

function drawRadar(t, R) {
  const cx = width / 2, cy = height / 2;

  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(0,212,255,0.12)';
  for (const k of [1 / 3, 2 / 3, 1]) { ctx.beginPath(); ctx.arc(cx, cy, R * k, 0, Math.PI * 2); ctx.stroke(); }

  const c = weather?.current;
  if (c && ((c.precipitation ?? 0) > 0 || (c.weatherCode ?? 0) >= 51)) drawRainCells(c, t, cx, cy, R);

  // Varredura: uma volta a cada 6 s.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(((t / 6) % 1) * Math.PI * 2);
  const g = ctx.createLinearGradient(0, 0, R, 0);
  g.addColorStop(0, 'rgba(0,212,255,0.35)');
  g.addColorStop(0.3, 'rgba(0,212,255,0.08)');
  g.addColorStop(1, 'rgba(0,212,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, R, -Math.PI / 8, Math.PI / 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.accent; // antes: 'var(--accent)' → inválido no canvas (ponto saía preto)
  ctx.shadowBlur = 8;
  ctx.shadowColor = COLORS.accent;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawRainCells(c, t, cx, cy, R) {
  const s = R / 110;
  const intensity = Math.min(1, (c.precipitation ?? 0) / 20);
  const code = c.weatherCode ?? 0;
  const color = code >= 95 ? [255, 51, 85] : code >= 80 ? [255, 107, 53] : code >= 61 ? [255, 214, 10] : [0, 255, 136];

  const cells = [
    { x: -30, y: 20,  r: 35 + intensity * 25, a: 0.25 + intensity * 0.3,  dx: 5, dy: 5, sp: 0.6 },
    { x: 40,  y: -30, r: 25 + intensity * 15, a: 0.15 + intensity * 0.2,  dx: 8, dy: 6, sp: 0.4 },
    { x: -60, y: -10, r: 20 + intensity * 12, a: 0.12 + intensity * 0.15, dx: 6, dy: 8, sp: 0.5 },
  ];

  for (const b of cells) {
    const x = cx + (b.x + Math.sin(t * b.sp) * b.dx) * s;
    const y = cy + (b.y + Math.cos(t * b.sp * 0.8) * b.dy) * s;
    const r = b.r * s;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${color},${b.a})`);
    g.addColorStop(0.6, `rgba(${color},${b.a * 0.4})`);
    g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPrecip(t, R) {
  const cx = width / 2, cy = height / 2;
  const mm = weather?.current?.precipitation ?? 0;
  const color = mm > 10 ? [255, 51, 85] : mm > 2 ? [255, 214, 10] : [0, 212, 255];
  const radius = Math.min(R, 30 + mm * 3 + Math.sin(t * 2) * 5);

  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(radius, 1));
  g.addColorStop(0, `rgba(${color},0.5)`);
  g.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(radius, 1), 0, Math.PI * 2);
  ctx.fill();

  centeredText(`${mm.toFixed(1)} mm`, cx, cy + 4, `12px ${MONO}`, COLORS.text);
}

function drawWind() {
  const cx = width / 2, cy = height / 2;
  const c = weather?.current;
  const speed = c?.windSpeed ?? 0;
  const { x: ux, y: uy } = windTravelVector(c?.windDirection ?? 0);
  const len = 14 + Math.min(speed, 80) * 0.5;

  ctx.strokeStyle = `rgba(255,107,53,${Math.min(1, 0.35 + speed / 100)})`;
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.2;

  // Grade de setas apontando PARA ONDE o vento vai (a API informa DE ONDE ele vem).
  const stepX = 70, stepY = 52;
  for (let gx = stepX / 2; gx < width; gx += stepX) {
    for (let gy = stepY / 2; gy < height - 24; gy += stepY) {
      const x1 = gx - (ux * len) / 2, y1 = gy - (uy * len) / 2;
      const x2 = gx + (ux * len) / 2, y2 = gy + (uy * len) / 2;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      const a = Math.atan2(uy, ux);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 6 * Math.cos(a - 0.45), y2 - 6 * Math.sin(a - 0.45));
      ctx.lineTo(x2 - 6 * Math.cos(a + 0.45), y2 - 6 * Math.sin(a + 0.45));
      ctx.closePath();
      ctx.fill();
    }
  }

  centeredText(`${Math.round(speed)} km/h de ${degToCardinal(c?.windDirection)}`, cx, height - 10, `11px ${MONO}`, COLORS.orange);
}

function drawTemp() {
  const cx = width / 2, cy = height / 2;
  const temp = weather?.current?.temperature ?? 20;

  // Frio (azul, hue 220) → calor (vermelho, hue 0), de 0 °C a 40 °C.
  const hue = 220 - Math.min(40, Math.max(0, temp)) * (220 / 40);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) / 2);
  g.addColorStop(0, `hsla(${hue},85%,55%,0.5)`);
  g.addColorStop(1, `hsla(${hue},85%,55%,0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  centeredText(`${Math.round(temp)}°C`, cx, cy + 8, `26px 'Bebas Neue', sans-serif`, COLORS.text);
}

function centeredText(text, x, y, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}
