import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { simulate } from '../lib/demo.js';
import { parseBatch } from '../lib/orders.js';
import catalog from '../lib/catalog.json' with { type: 'json' };

function storage() {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
}
beforeEach(() => {
  globalThis.localStorage = storage();
  globalThis.sessionStorage = storage();
});
const post = (path, body, key) => simulate(path, { method: 'POST', body, key });
const login = (email = 'demo@smm.app') =>
  post('/auth/login', { email, password: 'demo1234' });
const sample = {
  service_id: 1,
  quantity: 1000,
  link: 'https://example.org/post',
};
test('replayed purchase does not debit twice', async () => {
  await login();
  const before = await simulate('/me');
  const first = await post('/orders', sample, 'unique-order');
  assert.deepEqual(await post('/orders', sample, 'unique-order'), first);
  assert.equal(
    (await simulate('/me')).balance,
    Number((before.balance - 2.4).toFixed(2))
  );
});
test('invalid lines or unaffordable batch leave wallet and orders intact', async () => {
  await login();
  const before = await simulate('/orders');
  assert.throws(() =>
    parseBatch('1 | https://example.org | 1000\n1 | - | 100', catalog)
  );
  await assert.rejects(
    post('/orders/batch', { orders: [sample, { ...sample, quantity: 50000 }] })
  );
  assert.deepEqual(await simulate('/orders'), before);
  assert.equal((await simulate('/me')).balance, 48.2);
});
test('a local transfer is credited only after approval and only once', async () => {
  await login();
  const f = new FormData();
  f.set('amount', '10');
  f.set('reference', 'ref-001');
  f.set('receipt', new Blob(['preview'], { type: 'image/png' }), 'r.png');
  const { id } = await post('/payments/local', f, 'transfer-1');
  assert.equal((await simulate('/me')).balance, 48.2);
  await assert.rejects(simulate('/admin/payments'), { status: 403 });
  await login('admin@smm.app');
  const path = '/admin/payments/' + id + '/review';
  await post(path, { status: 'done' });
  await post(path, { status: 'done' });
  await login();
  assert.equal((await simulate('/me')).balance, 58.2);
});
test('registration, password change, logout and role isolation', async () => {
  const email = 'admin-new@example.org';
  await post('/auth/register', { name: 'New user', email, password: '123456' });
  assert.equal((await simulate('/me')).role, 'customer');
  await post('/account/password', { password: 'new-secret' });
  await post('/auth/logout');
  await assert.rejects(simulate('/me'), { status: 401 });
  await assert.rejects(post('/auth/login', { email, password: '123456' }), {
    status: 401,
  });
  await post('/auth/login', { email, password: 'new-secret' });
  assert.deepEqual(await simulate('/orders'), []);
});
