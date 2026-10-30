/**
 * Acesso seguro ao localStorage: pode lançar erro (janela anônima, dados de site
 * bloqueados) ou estar vazio, e o app precisa funcionar do mesmo jeito.
 */

export function readJson(key) {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeJson(key, value) {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
