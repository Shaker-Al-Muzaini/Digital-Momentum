// Isolated local preview. No payment, email or provider is contacted.
import catalog from './catalog.json' with { type: 'json' };
import { validateOrder } from './orders.js';
import { news, providers, proxies, health } from './fixtures.js';

const storageKey = 'smm-preview-session-v2';
let pending = Promise.resolve();
const date = () => new Date().toISOString().slice(0, 10);
const cents = (n) => Math.round(n * 100) / 100;
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
const signature = async (text) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    ),
    (v) => v.toString(16).padStart(2, '0')
  ).join('');
const serviceName = (s) => s.label.map((v) => s.platform + ' – ' + v);
function account(name, role = 'customer', seed = false) {
  const orders = seed
    ? [
        [10482, 0, 1000, 'prog'],
        [10481, 1, 5000, 'done'],
        [10480, 2, 2000, 'pending'],
        [10479, 3, 500, 'canc'],
      ].map(([id, index, quantity, status]) => {
        const s = catalog[index];
        return {
          id,
          name: serviceName(s),
          service_id: s.id,
          quantity,
          status,
          charge: status === 'canc' ? 0 : cents((quantity * s.rate) / 1000),
          date: date(),
        };
      })
    : [];
  return {
    name,
    role,
    balance: seed ? 48.2 : 0,
    orders,
    payments: [],
    tickets: [],
    ledger: orders.map((o) => ({
      date: o.date,
      label: o.name,
      amount: -o.charge,
      status: o.status,
    })),
    attempts: {},
    key: 'smm_demo_' + crypto.randomUUID(),
  };
}
function initial() {
  const demo = account('demo', 'customer', true),
    admin = account('admin', 'admin', true);
  demo.payments.push({
    id: 100,
    date: date(),
    amount: 25,
    reference: 'TX-88213',
    method: 'local',
    status: 'review',
  });
  demo.tickets.push({
    id: 201,
    subject: ['تأخر في طلب', 'Delayed order'],
    status: 'pending',
  });
  return {
    users: { 'demo@smm.app': demo, 'admin@smm.app': admin },
    next: 10500,
    contact: [],
  };
}
function createOrders(db, user, orders) {
  if (!Array.isArray(orders) || !orders.length) fail('Empty batch');
  const items = orders.map((raw) => {
    const o = validateOrder(raw, catalog),
      s = catalog.find((x) => x.id === o.service_id);
    return {
      ...o,
      name: serviceName(s),
      charge: cents((o.quantity * s.rate) / 1000),
      date: date(),
      createdAt: Date.now(),
      status: 'pending',
    };
  });
  const total = cents(items.reduce((n, o) => n + o.charge, 0));
  if (total > user.balance) fail('الرصيد غير كافٍ / Insufficient balance');
  user.balance = cents(user.balance - total);
  for (const o of items) {
    o.id = db.next++;
    user.orders.unshift(o);
    user.ledger.unshift({
      orderId: o.id,
      date: o.date,
      label: o.name,
      amount: -o.charge,
      status: o.status,
    });
  }
  return items;
}
function paymentsFor(db) {
  return Object.entries(db.users).flatMap(([email, u]) =>
    u.payments
      .filter((p) => p.method === 'local')
      .map((p) => ({ ...p, email, name: u.name }))
  );
}
async function dispatch(db, path, { method, body }, email) {
  const user = db.users[email],
    post = method === 'POST';
  if (path === '/services') return catalog;
  if (path === '/contact' && post) {
    db.contact.push(body);
    return {};
  }
  if (path === '/auth/forgot' && post) return {};
  if (path === '/auth/logout' && post) {
    sessionStorage.removeItem('smm-session');
    return {};
  }
  if (post && ['/auth/login', '/auth/register'].includes(path)) {
    const address = body.email.trim().toLowerCase();
    const password = await signature(address + '|' + body.password);
    if (path.endsWith('register')) {
      if (Object.hasOwn(db.users, address))
        fail('البريد مستخدم / Email in use');
      db.users[address] = { ...account(body.name), password };
    } else {
      const u = db.users[address],
        seed = ['demo@smm.app', 'admin@smm.app'].includes(address);
      if (
        !u ||
        (u.password
          ? u.password !== password
          : !seed || body.password !== 'demo1234')
      )
        fail('بيانات دخول غير صحيحة / Invalid credentials', 401);
    }
    sessionStorage.setItem('smm-session', address);
    return {};
  }
  if (!user) fail('تسجيل الدخول مطلوب / Sign in required', 401);
  if (path.startsWith('/admin/') && user.role !== 'admin')
    fail('Forbidden', 403);
  if (post) {
    if (path === '/orders' || path === '/orders/batch')
      return createOrders(
        db,
        user,
        path.endsWith('batch') ? body.orders : [body]
      );
    if (path === '/tickets') {
      user.tickets.unshift({ id: db.next++, ...body, status: 'pending' });
      return {};
    }
    if (path === '/account/password') {
      user.password = await signature(email + '|' + body.password);
      return {};
    }
    if (path === '/admin/generate') {
      const prompt = String(body.prompt || '').trim();
      if (!prompt) fail('أدخل موضوع المحتوى / Enter a content topic');
      const arabic = /[\u0600-\u06ff]/.test(prompt);
      return { text: arabic
        ? `محتوى تجريبي — ${prompt}\n\nخطوتك القادمة تبدأ بفكرة واضحة. اكتشف كيف يمكن لـ ${prompt} أن يضيف قيمة إلى يومك.\n\n• حدّد هدفك.\n• ابدأ بخطوة بسيطة.\n• تابع النتائج وطوّر تجربتك.\n\nشاركنا رأيك أو تواصل معنا لمعرفة المزيد.\n#تسويق_رقمي #DigitalMomentum`
        : `Demo content — ${prompt}\n\nYour next step starts with a clear idea. Explore how ${prompt} can bring value to your day.\n\n• Define your goal.\n• Start with one simple step.\n• Track results and improve.\n\nShare your thoughts or contact us to learn more.\n#DigitalMarketing #DigitalMomentum` };
    }
    if (path === '/payments/card' || path === '/payments/local') {
      const local = path.endsWith('local'),
        fields = local ? Object.fromEntries(body) : body,
        amount = cents(Number(fields.amount));
      if (!Number.isFinite(amount) || amount < 5) fail('Invalid amount');
      if (local && (!fields.receipt?.size || !fields.reference))
        fail('Receipt and reference required');
      const p = {
        id: db.next++,
        date: date(),
        amount,
        reference: fields.reference || '',
        method: local ? 'local' : 'card',
        status: local ? 'review' : 'done',
      };
      user.payments.unshift(p);
      if (!local) {
        user.balance = cents(user.balance + amount);
        user.ledger.unshift({
          date: p.date,
          label: ['بطاقة', 'Card'],
          amount,
          status: 'done',
        });
      }
      return { id: p.id };
    }
    if (/^\/admin\/payments\/\d+\/review$/.test(path)) {
      const record = paymentsFor(db).find(
        (p) => p.id === Number(path.split('/')[3])
      );
      if (!record) fail('Unknown payment', 404);
      const owner = db.users[record.email],
        p = owner.payments.find((x) => x.id === record.id);
      if (!['done', 'rej'].includes(body.status)) fail('Invalid status');
      if (p.status !== 'review') {
        if (p.status === body.status) return {};
        fail('Already reviewed', 409);
      }
      p.status = body.status;
      if (p.status === 'done') {
        owner.balance = cents(owner.balance + p.amount);
        owner.ledger.unshift({
          date: date(),
          label: ['تحويل محلي', 'Local transfer'],
          amount: p.amount,
          status: 'done',
        });
      }
      return {};
    }
  } else {
    switch (path) {
      case '/me':
        return {
          name: user.name,
          role: user.role,
          email,
          balance: user.balance,
        };
      case '/dashboard':
        return {
          total: user.orders.length,
          active: user.orders.filter((o) =>
            ['pending', 'prog'].includes(o.status)
          ).length,
          spent: cents(user.orders.reduce((n, o) => n + o.charge, 0)),
          recent: user.orders.slice(0, 4),
          week: Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setUTCDate(d.getUTCDate() - 6 + i);
            return user.orders.filter(
              (o) => o.date === d.toISOString().slice(0, 10)
            ).length;
          }),
        };
      case '/orders':
        return user.orders;
      case '/payments':
        return {
          instructions: [
            'بيانات تحويل تجريبية فقط',
            'Demo transfer instructions only',
          ],
          history: user.payments,
        };
      case '/transactions':
        return user.ledger;
      case '/referrals':
        return {
          url: location.origin + '/?ref=' + encodeURIComponent(email),
          visits: 128,
          signups: 14,
          earnings: 8.4,
        };
      case '/account/api-key':
        return { key: user.key };
      case '/news':
        return news;
      case '/tickets':
        return user.tickets;
      case '/admin/users':
        return Object.entries(db.users).map(([email, u]) => ({
          email,
          name: u.name,
          balance: u.balance,
          status: 'up',
        }));
      case '/admin/payments':
        return paymentsFor(db);
      case '/admin/providers':
        return providers;
      case '/admin/proxies':
        return proxies;
      case '/admin/health':
        return health;
      case '/admin/dashboard': {
        const payments = paymentsFor(db);
        return {
          revenue: cents(Object.values(db.users).flatMap((u) => u.payments)
            .filter((p) => p.status === 'done').reduce((n, p) => n + p.amount, 0)),
          active: Object.values(db.users).flatMap((u) => u.orders)
            .filter((o) => ['pending', 'prog'].includes(o.status)).length,
          pending: payments.filter((p) => p.status === 'review').length,
          providers: providers.filter((p) => p.status === 'up').length,
          payments,
        };
      }
    }
  }
  fail('Unknown demo endpoint: ' + path, 404);
}
// Advance only newly submitted demo orders; seeded examples retain their status.
function advanceOrders(db) {
  for (const user of Object.values(db.users)) {
    for (const order of user.orders) {
      if (!order.createdAt || !['pending', 'prog'].includes(order.status)) continue;
      const elapsed = Date.now() - order.createdAt;
      order.status = elapsed >= 20000 ? 'done' : elapsed >= 5000 ? 'prog' : 'pending';
      const entry = user.ledger.find((item) => item.orderId === order.id);
      if (entry) entry.status = order.status;
    }
  }
}
export async function simulate(path, options = {}) {
  async function run() {
    // Retire the old persistent preview without importing its accounts or payments.
    localStorage.removeItem('smm-preview-v1');
    const saved = sessionStorage.getItem(storageKey);
    let db;
    try { db = saved ? JSON.parse(saved) : initial(); }
    catch { db = initial(); }
    advanceOrders(db);
    const email = sessionStorage.getItem('smm-session'),
      user = db.users[email];
    const id = options.key && user ? path + '|' + options.key : null;
    if (id && Object.hasOwn(user.attempts, id)) return user.attempts[id];
    const result = await dispatch(db, path, options, email);
    if (id) user.attempts[id] = result;
    sessionStorage.setItem(storageKey, JSON.stringify(db));
    return result;
  }
  // Serialize read-modify-write operations even in browsers without Web Locks.
  const result = pending.then(run, run);
  pending = result.catch(() => {});
  return result;
}
