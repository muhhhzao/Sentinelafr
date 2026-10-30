/**
 * Validação de coordenadas digitadas no modal.
 *
 * Correção: o código antigo fazia `parseFloat(x) || -23.5505`, o que trocava
 * silenciosamente por São Paulo qualquer valor inválido — e também o valor 0
 * (que é falsy), quebrando pontos sobre a linha do Equador ou de Greenwich.
 */

/** Aceita vírgula decimal ("-23,55"). Devolve NaN se não for um número. */
export function parseCoordinate(text) {
  const normalized = String(text ?? '').trim().replace(',', '.');
  if (normalized === '') return NaN;
  return Number(normalized);
}

/**
 * @returns {{ok:true, location:{lat:number, lon:number, name:string}} | {ok:false, error:string}}
 */
export function validateLocation({ lat, lon, name }) {
  const la = parseCoordinate(lat);
  const lo = parseCoordinate(lon);

  if (!Number.isFinite(la) || la < -90 || la > 90) return { ok: false, error: 'Latitude inválida (use um valor entre -90 e 90)' };
  if (!Number.isFinite(lo) || lo < -180 || lo > 180) return { ok: false, error: 'Longitude inválida (use um valor entre -180 e 180)' };

  const label = String(name ?? '').trim() || `${la.toFixed(2)}, ${lo.toFixed(2)}`;
  return { ok: true, location: { lat: la, lon: lo, name: label } };
}

export function sameLocation(a, b) {
  return !!a && !!b && Math.abs(a.lat - b.lat) < 0.01 && Math.abs(a.lon - b.lon) < 0.01;
}
