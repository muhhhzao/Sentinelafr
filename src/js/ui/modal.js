import { byId } from './dom.js';
import { notify } from './notifications.js';
import { attachLocationSearch } from './locationSearch.js';
import { validateLocation } from '../core/location.js';

const FOCUSABLE = 'button:not([disabled]), input:not([disabled])';

/**
 * Modal de localização.
 * @param {{ getDefaults: () => {lat:number, lon:number, name:string},
 *           onSubmit: (loc:{lat:number, lon:number, name:string}) => void,
 *           onDemo: () => void }} handlers
 */
export function initModal({ getDefaults, onSubmit, onDemo }) {
  const overlay = byId('modalOverlay');
  const dialog = overlay.querySelector('.modal');
  const fields = { lat: byId('latInput'), lon: byId('lonInput'), name: byId('cityInput') };
  let opener = null;

  function fill(loc) {
    fields.lat.value = loc.lat;
    fields.lon.value = loc.lon;
    fields.name.value = loc.name;
  }

  function open() {
    opener = document.activeElement;
    fill(getDefaults());
    overlay.classList.add('open');
    byId('citySearch').focus();
  }

  function close() {
    overlay.classList.remove('open');
    opener?.focus?.();
  }

  const search = attachLocationSearch({
    input: byId('citySearch'),
    button: byId('modalSearchBtn'),
    list: byId('modalResults'),
    onSelect: (place) => {
      fill({ lat: place.lat.toFixed(4), lon: place.lon.toFixed(4), name: place.label });
      notify(`Encontrado: ${place.label}`, 'ok');
    },
  });

  byId('openModalBtn').addEventListener('click', open);
  byId('closeModalBtn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  byId('geoBtn').addEventListener('click', () => {
    if (!navigator.geolocation) return notify('Este navegador não oferece geolocalização', 'warn');
    notify('Obtendo sua localização...', 'info');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        fill({ lat: coords.latitude.toFixed(4), lon: coords.longitude.toFixed(4), name: 'Minha localização' });
        notify('Localização obtida', 'ok');
      },
      (err) => notify(err.code === err.PERMISSION_DENIED ? 'Permissão de localização negada' : 'Não foi possível obter a localização', 'warn'),
      { timeout: 10_000, maximumAge: 60_000 },
    );
  });

  byId('startBtn').addEventListener('click', () => {
    const result = validateLocation({ lat: fields.lat.value, lon: fields.lon.value, name: fields.name.value });
    if (!result.ok) return notify(result.error, 'warn');
    search.close();
    close();
    onSubmit(result.location);
  });

  byId('demoBtn').addEventListener('click', () => { close(); onDemo(); });

  // Teclado: Esc fecha, Tab fica preso dentro do modal.
  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') return close();
    if (e.key !== 'Tab') return;

    const items = [...dialog.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  return { open, close };
}
