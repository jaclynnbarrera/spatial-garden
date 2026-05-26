const SESSION_FLAG = 'sg-admin';
const SESSION_KEY = 'sg-admin-key';
const QUERY_PARAM = 'admin';

export function initAdminMode() {
  const expectedKey = import.meta.env.VITE_ADMIN_KEY;
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get(QUERY_PARAM);

  if (!expectedKey || !fromUrl || fromUrl !== expectedKey) return;

  sessionStorage.setItem(SESSION_FLAG, '1');
  sessionStorage.setItem(SESSION_KEY, fromUrl);

  params.delete(QUERY_PARAM);
  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', nextUrl);
}

export function isAdminMode() {
  if (import.meta.env.VITE_ADMIN === 'true') return true;
  if (sessionStorage.getItem(SESSION_FLAG) === '1') return true;
  if (import.meta.env.DEV) return true;
  return false;
}

export function getAdminKey() {
  return sessionStorage.getItem(SESSION_KEY) || import.meta.env.VITE_ADMIN_KEY || '';
}
