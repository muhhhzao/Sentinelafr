/**
 * Funções puras de formatação e utilidades de texto.
 */

const PLACEHOLDER = '--';

/** Escapa texto antes de inserir em innerHTML (nomes de cidade vêm de uma API externa). */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

/** Número com `digits` casas, ou "--" quando o dado não existe. */
export function num(value, digits = 0) {
  return Number.isFinite(value) ? Number(value).toFixed(digits) : PLACEHOLDER;
}

/** Valor com unidade, ou "--" quando o dado não existe. */
export function withUnit(value, unit, digits = 0) {
  return `${num(value, digits)}${unit}`;
}

/** "2026-10-26T20:00" -> "20:00" (sem passar por Date, evitando erro de fuso). */
export function hhmm(isoLocal) {
  return typeof isoLocal === 'string' && isoLocal.length >= 16 ? isoLocal.slice(11, 16) : PLACEHOLDER;
}

/** Date -> "YYYY-MM-DDTHH:MM" usando o horário local do navegador. */
export function toIsoLocal(date) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}

/** Limita `value` ao intervalo [min, max]. */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** Média de um array de números (0 se vazio). */
export function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}
