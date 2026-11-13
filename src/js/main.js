import { state, subscribe, setState } from './state.js';
import { getSavedLocation, startMonitoring, refresh, loadDemo } from './services/monitor.js';
import { byId } from './ui/dom.js';
import { startClock, renderMode, renderLoading } from './ui/header.js';
import { initModal } from './ui/modal.js';
import { attachLocationSearch } from './ui/locationSearch.js';
import { initRadar, setRadarTab } from './ui/radar.js';
import { renderWeather } from './ui/render.js';

function init() {
  startClock();
  initRadar(byId('radarCanvas'));

  subscribe((s, patch) => {
    if ('mode' in patch) renderMode(s.mode);
    if ('loading' in patch) renderLoading(s.loading);
    if ('weather' in patch && s.weather) renderWeather(s.weather, s.mode);
  });

  initModal({
    getDefaults: () => (state.mode === 'demo' ? getSavedLocation() : state.location),
    onSubmit: (location) => startMonitoring(location),
    onDemo: () => loadDemo(),
  });

  attachLocationSearch({
    input: byId('searchCity'),
    button: byId('topSearchBtn'),
    list: byId('topResults'),
    onSelect: (place) => {
      byId('searchCity').value = '';
      startMonitoring({ lat: place.lat, lon: place.lon, name: place.label });
    },
  });

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => {
        const active = t === tab;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', String(active));
      });
      setState({ tab: tab.dataset.tab });
      setRadarTab(tab.dataset.tab);
    });
  });

  byId('refreshBtn').addEventListener('click', () => refresh());

  startMonitoring(getSavedLocation(), { initial: true, silent: true });
}

init();
