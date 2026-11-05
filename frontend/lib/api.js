export const demoMode = process.env.NEXT_PUBLIC_DATA_MODE !== 'api';

export async function request(
  path,
  { method = 'GET', body, key, signal } = {}
) {
  if (demoMode) {
    const { simulate } = await import('./demo.js');
    return simulate(path, { method, body, key });
  }
  const multipart = body instanceof FormData;
  const headers = { Accept: 'application/json' };
  if (body && !multipart) headers['Content-Type'] = 'application/json';
  if (key) headers['Idempotency-Key'] = key;
  const response = await fetch('/backend' + path, {
    method,
    headers,
    signal,
    credentials: 'same-origin',
    cache: 'no-store',
    body: multipart ? body : JSON.stringify(body),
  });
  const data =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const detail = data?.detail;
    const message = Array.isArray(detail)
      ? detail.map((x) => x.msg).join(', ')
      : detail;
    throw Object.assign(new Error(message || response.statusText), {
      status: response.status,
    });
  }
  return data;
}
