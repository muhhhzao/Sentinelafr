/**
 * Tabela de códigos meteorológicos WMO usados pela Open-Meteo.
 * https://open-meteo.com/en/docs (seção "Weather variable documentation")
 */

const WMO = Object.freeze({
  0:  { icon: '☀️', name: 'CÉU LIMPO',              desc: 'Sem nuvens' },
  1:  { icon: '🌤', name: 'PREDOMINANTE LIMPO',     desc: 'Poucas nuvens' },
  2:  { icon: '⛅', name: 'PARCIALMENTE NUBLADO',   desc: 'Nuvens parciais' },
  3:  { icon: '☁️', name: 'NUBLADO',                desc: 'Cobertura total' },
  45: { icon: '🌫', name: 'NEBLINA',                desc: 'Visibilidade reduzida' },
  48: { icon: '🌫', name: 'NEBLINA COM GEADA',      desc: 'Névoa com deposição de gelo' },
  51: { icon: '🌦', name: 'GAROA LEVE',             desc: 'Garoa fraca' },
  53: { icon: '🌦', name: 'GAROA',                  desc: 'Garoa moderada' },
  55: { icon: '🌧', name: 'GAROA INTENSA',          desc: 'Garoa densa' },
  56: { icon: '🌧', name: 'GAROA CONGELANTE',       desc: 'Garoa leve que congela' },
  57: { icon: '🌧', name: 'GAROA CONGELANTE FORTE', desc: 'Garoa densa que congela' },
  61: { icon: '🌧', name: 'CHUVA LEVE',             desc: 'Precipitação fraca' },
  63: { icon: '🌧', name: 'CHUVA',                  desc: 'Precipitação moderada' },
  65: { icon: '🌧', name: 'CHUVA FORTE',            desc: 'Precipitação intensa' },
  66: { icon: '🌧', name: 'CHUVA CONGELANTE',       desc: 'Chuva leve que congela' },
  67: { icon: '🌧', name: 'CHUVA CONGELANTE FORTE', desc: 'Chuva forte que congela' },
  71: { icon: '🌨', name: 'NEVE LEVE',              desc: 'Queda de neve fraca' },
  73: { icon: '🌨', name: 'NEVE',                   desc: 'Queda de neve' },
  75: { icon: '❄️', name: 'NEVE INTENSA',           desc: 'Queda de neve forte' },
  77: { icon: '🌨', name: 'GRÃOS DE NEVE',          desc: 'Precipitação granular' },
  80: { icon: '🌦', name: 'PANCADAS LEVES',         desc: 'Pancadas de chuva fracas' },
  81: { icon: '⛈', name: 'PANCADAS',               desc: 'Pancadas de chuva moderadas' },
  82: { icon: '⛈', name: 'PANCADAS FORTES',        desc: 'Pancadas de chuva violentas' },
  85: { icon: '🌨', name: 'PANCADAS DE NEVE',       desc: 'Neve em pancadas' },
  86: { icon: '❄️', name: 'NEVE EM PANCADAS',       desc: 'Neve intensa em pancadas' },
  95: { icon: '⛈', name: 'TEMPESTADE',             desc: 'Trovoadas e relâmpagos' },
  96: { icon: '⛈', name: 'TEMPESTADE C/ GRANIZO',  desc: 'Trovoadas com granizo leve' },
  99: { icon: '🌩', name: 'TEMPESTADE SEVERA',      desc: 'Trovoadas com granizo intenso' },
});

const UNKNOWN = Object.freeze({ icon: '🌡', name: 'DADO INDISPONÍVEL', desc: 'Código não mapeado' });

/** @param {number|null|undefined} code */
export function getWmoInfo(code) {
  return WMO[code] ?? UNKNOWN;
}
