/** Helpers mínimos de DOM. Falhar alto quando um id some evita bugs silenciosos. */

export function byId(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`[Sentinela] elemento #${id} não encontrado no HTML`);
  return el;
}

export function setText(id, text) {
  byId(id).textContent = text;
}

/** Aplica um tom ('ok' | 'warn' | 'danger' | 'info') via data-attribute (as cores moram no CSS). */
export function setTone(id, tone) {
  byId(id).dataset.tone = tone;
}
