/**
 * Configurações centrais do Sentinela.
 * Qualquer "número mágico" do projeto deve morar aqui.
 */

export const CONFIG = Object.freeze({
  defaultLocation: Object.freeze({
    lat: -23.5505,
    lon: -46.6333,
    name: 'São Paulo, SP, BR',
  }),

  /** Intervalo de atualização automática (ms). */
  refreshMs: 10 * 60 * 1000,

  /** Quanto tempo um dado em cache continua útil quando a API falha (ms). */
  cacheMaxAgeMs: 3 * 60 * 60 * 1000,

  http: Object.freeze({
    timeoutMs: 10_000,
    retries: 2,
    backoffMs: 600,
  }),

  api: Object.freeze({
    forecast: 'https://api.open-meteo.com/v1/forecast',
    geocoding: 'https://geocoding-api.open-meteo.com/v1/search',
  }),

  /** Quantas horas de previsão e de histórico exibir. */
  forecastHours: 24,
  historyHours: 24,

  storageKeys: Object.freeze({
    location: 'sentinela:location',
    cache: 'sentinela:last-weather',
  }),

  /** Limiares usados nos alertas (unidades: mm/h, km/h, °C, m). */
  thresholds: Object.freeze({
    gustWarn: 50,
    gustDanger: 80,
    rainWarn: 5,
    rainDanger: 20,
    heatDanger: 40,
    coldWarn: 5,
    fogVisibility: 1000,
    stormCode: 95,
  }),
});
