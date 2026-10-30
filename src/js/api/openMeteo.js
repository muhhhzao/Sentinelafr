import { CONFIG } from '../config.js';
import { fetchJson, ApiError } from './http.js';

/**
 * @typedef {Object} CurrentConditions
 * @property {string} time            horário local do ponto monitorado ("YYYY-MM-DDTHH:MM")
 * @property {number} temperature     °C
 * @property {number|null} apparent   °C
 * @property {number|null} humidity   %
 * @property {number} precipitation   mm
 * @property {number|null} weatherCode
 * @property {number} windSpeed       km/h
 * @property {number|null} windDirection graus (origem do vento)
 * @property {number} windGusts       km/h
 * @property {number|null} pressure   hPa
 * @property {number|null} visibility metros
 *
 * @typedef {Object} HourPoint
 * @property {string} time
 * @property {number|null} temp
 * @property {number|null} rain
 * @property {number|null} wind
 * @property {number|null} gust
 * @property {number|null} code
 *
 * @typedef {Object} Weather
 * @property {{lat:number, lon:number, name:string}} location
 * @property {string|null} timezone
 * @property {number} fetchedAt       epoch ms
 * @property {'open-meteo'|'demo'} source
 * @property {CurrentConditions} current
 * @property {HourPoint[]} forecast   próximas horas
 * @property {HourPoint[]} history    últimas horas (dado real, não simulado)
 */

const CURRENT_VARS = [
  'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'precipitation',
  'weather_code', 'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
  'surface_pressure', 'visibility',
];

const HOURLY_VARS = ['temperature_2m', 'precipitation', 'wind_speed_10m', 'wind_gusts_10m', 'weather_code'];

export function buildForecastUrl({ lat, lon }) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: CURRENT_VARS.join(','),
    hourly: HOURLY_VARS.join(','),
    // "auto" usa o fuso do PONTO monitorado — o código antigo fixava America/Sao_Paulo
    // e comparava os horários com o relógio do navegador, errando fora do fuso de SP.
    timezone: 'auto',
    past_days: '1',
    forecast_days: '2',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
    temperature_unit: 'celsius',
  });
  return `${CONFIG.api.forecast}?${params}`;
}

const finite = (v) => (Number.isFinite(v) ? v : null);

/**
 * Converte a resposta crua da Open-Meteo no modelo interno e VALIDA o formato.
 * Lança ApiError('invalid') se faltar o essencial.
 *
 * Os horários da API vêm no fuso do ponto ("2026-10-26T20:00"). Como têm o formato
 * ISO, a ordem alfabética é a ordem cronológica: comparamos strings, sem Date.
 *
 * @returns {Weather}
 */
export function normalizeForecast(raw, location, { source = 'open-meteo', now = Date.now() } = {}) {
  const c = raw?.current;
  const h = raw?.hourly;

  if (!c || typeof c.time !== 'string' || !Number.isFinite(c.temperature_2m) || !Number.isFinite(c.wind_speed_10m)) {
    throw new ApiError('invalid', 'Resposta sem o bloco "current" esperado');
  }
  if (!h || !Array.isArray(h.time) || h.time.length === 0) {
    throw new ApiError('invalid', 'Resposta sem o bloco "hourly" esperado');
  }

  /** @type {HourPoint[]} */
  const points = h.time.map((time, i) => ({
    time,
    temp: finite(h.temperature_2m?.[i]),
    rain: finite(h.precipitation?.[i]),
    wind: finite(h.wind_speed_10m?.[i]),
    gust: finite(h.wind_gusts_10m?.[i]),
    code: finite(h.weather_code?.[i]),
  }));

  const history = points.filter((p) => p.time <= c.time).slice(-CONFIG.historyHours);
  const forecast = points.filter((p) => p.time > c.time).slice(0, CONFIG.forecastHours);

  /** @type {CurrentConditions} */
  const current = {
    time: c.time,
    temperature: c.temperature_2m,
    apparent: finite(c.apparent_temperature),
    humidity: finite(c.relative_humidity_2m),
    precipitation: finite(c.precipitation) ?? 0,
    weatherCode: finite(c.weather_code),
    windSpeed: c.wind_speed_10m,
    windDirection: finite(c.wind_direction_10m),
    windGusts: finite(c.wind_gusts_10m) ?? c.wind_speed_10m,
    pressure: finite(c.surface_pressure),
    visibility: finite(c.visibility),
  };

  return {
    location: { lat: location.lat, lon: location.lon, name: location.name },
    timezone: raw.timezone ?? null,
    fetchedAt: now,
    source,
    current,
    forecast,
    history,
  };
}

/**
 * Busca o tempo atual, a previsão e as últimas 24 h de um ponto.
 * @param {{lat:number, lon:number, name:string}} location
 * @param {{signal?:AbortSignal, fetchImpl?:Function}} [options]
 * @returns {Promise<Weather>}
 */
export async function fetchWeather(location, options = {}) {
  const raw = await fetchJson(buildForecastUrl(location), options);
  return normalizeForecast(raw, location);
}
