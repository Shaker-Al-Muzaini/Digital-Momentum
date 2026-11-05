import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.NEXT_PUBLIC_DATA_MODE = 'api';
const { request } = await import('../lib/api.js');
test('JSON mutations use the backend proxy, cookie and idempotency key', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ id: 7 })
  );
  const body = {
    service_id: 2,
    quantity: 500,
    link: 'https://example.com/post',
  };
  assert.deepEqual(
    await request('/orders', { method: 'POST', body, key: 'attempt' }),
    { id: 7 }
  );
  const [path, init] = fetch.mock.calls[0].arguments;
  assert.equal(path, '/backend/orders');
  assert.equal(init.credentials, 'same-origin');
  assert.equal(init.headers['Idempotency-Key'], 'attempt');
  assert.deepEqual(JSON.parse(init.body), body);
});
test('receipt uploads preserve the file and let the browser set the boundary', async (t) => {
  const fetch = t.mock.method(
    globalThis,
    'fetch',
    async () => new Response(null, { status: 204 })
  );
  const data = new FormData();
  data.set('receipt', new Blob(['image']), 'r.png');
  assert.equal(
    await request('/payments/local', { method: 'POST', body: data }),
    null
  );
  const init = fetch.mock.calls[0].arguments[1];
  assert.equal(init.body, data);
  assert.equal(init.headers['Content-Type'], undefined);
});
test('FastAPI validation details reach the caller', async (t) => {
  t.mock.method(globalThis, 'fetch', async () =>
    Response.json(
      { detail: [{ msg: 'Quantity is too small' }] },
      { status: 422 }
    )
  );
  await assert.rejects(request('/orders'), {
    status: 422,
    message: 'Quantity is too small',
  });
});
