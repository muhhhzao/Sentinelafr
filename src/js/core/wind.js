/**
 * Utilidades de direção do vento.
 *
 * Convenção meteorológica: `deg` é a direção DE ONDE o vento sopra,
 * medida em graus no sentido horário a partir do Norte.
 */

const CARDINALS = ['N', 'NNE', 'NE', 'ENE', 'L', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];

export function degToCardinal(deg) {
  if (!Number.isFinite(deg)) return '--';
  const normalized = ((deg % 360) + 360) % 360;
  return CARDINALS[Math.round(normalized / 22.5) % 16];
}

/**
 * Vetor unitário (x → leste, y → sul, como no canvas) apontando PARA ONDE o vento vai.
 * É o oposto da direção de origem.
 */
export function windTravelVector(deg) {
  const toward = (((deg ?? 0) + 180) * Math.PI) / 180;
  return { x: Math.sin(toward), y: -Math.cos(toward) };
}
