const MAX_VISIBLE = 4;
const LIFETIME_MS = 4500;

/**
 * Mostra uma notificação temporária.
 * Correção: o tipo precisa ser minúsculo ('ok'), igual à classe CSS — o código
 * antigo passava 'OK' e a notificação de sucesso aparecia sem estilo.
 *
 * @param {string} message
 * @param {'info'|'ok'|'warn'|'danger'} [type]
 */
export function notify(message, type = 'info') {
  const stack = document.getElementById('notifStack');
  if (!stack) return;

  while (stack.children.length >= MAX_VISIBLE) stack.firstElementChild.remove();

  const item = document.createElement('div');
  item.className = `notif ${type}`;
  item.textContent = message;
  stack.appendChild(item);

  setTimeout(() => {
    item.style.opacity = '0';
    setTimeout(() => item.remove(), 300);
  }, LIFETIME_MS);
}
