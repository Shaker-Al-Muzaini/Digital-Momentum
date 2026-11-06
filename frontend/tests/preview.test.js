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

test('preview survives refresh but a new browser session starts clean', async () => {
  localStorage.setItem('smm-preview-v1', '{"old":"persistent data"}');
  await login();
  await post('/payments/card', { amount: 25 }, 'card-1');
  await post('/orders', sample);
  assert.equal((await simulate('/orders')).length, 5);
  assert.equal(localStorage.getItem('smm-preview-v1'), null);
  // Re-importing simulates a reload; sessionStorage is retained.
  const fresh = await import('../lib/demo.js?reload');
  assert.equal((await fresh.simulate('/orders')).length, 5);
  globalThis.sessionStorage = storage();
  await assert.rejects(simulate('/me'), { status: 401 });
  await login();
  assert.equal((await simulate('/orders')).length, 4);
  assert.equal((await simulate('/me')).balance, 48.2);
});
test('concurrent purchases preserve both debits, and replayed card credit is idempotent', async () => {
  await login();
  await Promise.all([
    post('/payments/card', { amount: 10 }, 'card-1'),
    post('/payments/card', { amount: 10 }, 'card-1'),
    post('/orders', sample, 'order-a'),
    post('/orders', sample, 'order-b'),
  ]);
  assert.equal((await simulate('/me')).balance, 53.4);
  assert.equal((await simulate('/orders')).length, 6);
  assert.equal((await simulate('/payments')).history.filter(p => p.method === 'card').length, 1);
});
test('new orders progress to completion and update ledger and dashboard', async (t) => {
  await login();
  const now = Date.now();
  t.mock.method(Date, 'now', () => now);
  const [created] = await post('/orders', sample);
  assert.equal(created.status, 'pending');
  Date.now.mock.mockImplementation(() => now + 6000);
  assert.equal((await simulate('/orders'))[0].status, 'prog');
  Date.now.mock.mockImplementation(() => now + 21000);
  assert.equal((await simulate('/orders'))[0].status, 'done');
  assert.equal((await simulate('/transactions'))[0].status, 'done');
  assert.equal((await simulate('/dashboard')).active, 2);
});
test('batch purchase, tickets and admin statistics reflect session activity', async () => {
  await login();
  await post('/payments/card', { amount: 25 });
  const orders = await post('/orders/batch', { orders: [sample, sample] });
  assert.equal(orders.length, 2);
  await post('/tickets', { subject: 'Demo question', message: 'Help with my order' }, 'ticket-1');
  await post('/tickets', { subject: 'Demo question', message: 'Help with my order' }, 'ticket-1');
  assert.equal((await simulate('/tickets')).length, 2);
  await login('admin@smm.app');
  const dashboard = await simulate('/admin/dashboard');
  assert.equal(dashboard.revenue, 25);
  assert.equal(dashboard.active, 6);
  assert.equal(dashboard.pending, 1);
  assert.match((await post('/admin/generate', { prompt: 'Coffee' })).text, /Coffee/);
});
