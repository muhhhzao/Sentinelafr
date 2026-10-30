import { searchPlaces } from '../api/geocoding.js';
import { notify } from './notifications.js';

/**
 * Busca de cidades reutilizada pela barra superior E pelo modal
 * (antes eram duas funções quase idênticas, `geocodeCity` e `searchLocation`).
 *
 * - 0 resultados → avisa; 1 → seleciona direto; vários → lista para o usuário escolher.
 * - Uma nova busca cancela a anterior (evita resposta antiga sobrescrevendo a nova).
 *
 * @param {{input:HTMLInputElement, button:HTMLButtonElement, list:HTMLElement,
 *          onSelect:(place:import('../api/geocoding.js').Place)=>void}} opts
 */
export function attachLocationSearch({ input, button, list, onSelect }) {
  let controller = null;

  const close = () => {
    list.hidden = true;
    list.replaceChildren();
  };

  const choose = (place) => {
    close();
    onSelect(place);
  };

  function renderList(places) {
    list.replaceChildren(...places.map((place) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'suggestion';
      btn.textContent = place.label; // textContent: o nome vem de API externa
      btn.addEventListener('click', () => choose(place));
      li.appendChild(btn);
      return li;
    }));
    list.hidden = false;
  }

  async function run() {
    const query = input.value.trim();
    if (query.length < 2) {
      notify('Digite ao menos 2 letras para buscar', 'warn');
      return;
    }

    controller?.abort();
    const mine = new AbortController();
    controller = mine;
    button.disabled = true;

    try {
      const places = await searchPlaces(query, { signal: mine.signal });
      if (mine.signal.aborted) return;

      if (!places.length) {
        close();
        notify('Cidade não encontrada', 'warn');
      } else if (places.length === 1) {
        choose(places[0]);
      } else {
        renderList(places);
      }
    } catch (err) {
      if (err.kind === 'aborted') return;
      console.error('[Sentinela] erro na geocodificação:', err);
      notify(err.userMessage ?? 'Erro na busca', 'danger');
    } finally {
      if (controller === mine) {
        controller = null;
        button.disabled = false;
      }
    }
  }

  button.addEventListener('click', run);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); run(); }
    if (e.key === 'Escape') close();
  });
  document.addEventListener('click', (e) => {
    if (!list.hidden && !list.contains(e.target) && e.target !== input && e.target !== button) close();
  });

  return { close };
}
