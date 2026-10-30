import { CONFIG } from '../config.js';
import { fetchJson } from './http.js';

/**
 * @typedef {Object} Place
 * @property {string} label   "Cidade, Estado, PAÍS"
 * @property {number} lat
 * @property {number} lon
 * @property {string|null} timezone
 */

export function buildGeocodingUrl(query, count = 5) {
  const params = new URLSearchParams({ name: query, count: String(count), language: 'pt', format: 'json' });
  return `${CONFIG.api.geocoding}?${params}`;
}

/** Converte a resposta crua em lista de lugares. Sem resultados, a API omite `results`. */
export function parsePlaces(raw) {
  if (!Array.isArray(raw?.results)) return [];
  return raw.results
    .filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude))
    .map((r) => ({
      label: [r.name, r.admin1, r.country_code].filter(Boolean).join(', '),
      lat: r.latitude,
      lon: r.longitude,
      timezone: r.timezone ?? null,
    }));
}

/**
 * Busca cidades pelo nome. Devolve até `count` opções para o usuário escolher
 * (o código antigo pegava só a primeira, o que errava em nomes repetidos como "Santa Cruz").
 *
 * @returns {Promise<Place[]>}
 */
export async function searchPlaces(query, { count = 5, signal, fetchImpl } = {}) {
  const q = query.trim();
  if (q.length < 2) return [];
  const raw = await fetchJson(buildGeocodingUrl(q, count), { signal, fetchImpl });
  return parsePlaces(raw);
}
