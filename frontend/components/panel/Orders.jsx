'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ActionForm, Field, Table, Badge, Icon, useUI, money } from '../shared';
import { useSession } from './PanelLayout';
import { request } from '../../lib/api';
import { parseBatch, validateOrder } from '../../lib/orders';
export function Stats({ items }) {
  const { t } = useUI();
  return (
    <div className="g4">
      {items.map(([key, value, icon, color]) => (
        <div key={key} className="cd st">
          <>
            {icon && (
              <span className="ibx" style={{ background: color }}>
                <Icon name={icon} />
              </span>
            )}
          </>
          <small>{t(key)}</small>
          <b>{value}</b>
        </div>
      ))}
    </div>
  );
}
export function OrdersTable({ orders }) {
  const { t, local } = useUI();
  return (
    <Table
      headers={['id', 'service', 'qty', 'price', 'status'].map(t)}
      rows={orders.map((o) => [
        '#' + o.id,
        local(o.name),
        o.quantity,
        money(o.charge),
        <Badge value={o.status} />,
      ])}
    />
  );
}
export function Dashboard({ data }) {
  const { user } = useSession(),
    { t, lang } = useUI();
  return (
    <>
      <div className="hero2">
        <div>
          <h1 className="ttl">
            {t('hi')}
            {lang === 'ar' ? '،' : ','} {user.name}
          </h1>
          <p className="sub">{t('dsub')}</p>
        </div>
        <div className="chips">
          <Link className="bt" href="/panel/new">
            <Icon name="plus" />
            {t('new')}
          </Link>
          <Link className="bt sec" href="/panel/funds">
            <Icon name="wallet" />
            {t('funds')}
          </Link>
        </div>
      </div>
      <Stats
        items={[
          ['bal', money(user.balance), 'wallet', '#34C759'],
          ['tot', data.total, 'list', '#FF9F0A'],
          ['act', data.active, 'layers', '#0A84FF'],
          ['spent', money(data.spent), 'chart', '#BF5AF2'],
        ]}
      />
      <div className="g3">
        <div className="cd">
          <h2>{t('recent')}</h2>
          <OrdersTable orders={data.recent} />
        </div>
        <div className="cd">
          <h2>{t('week')}</h2>
          <div className="bars">
            {data.week.map((v, i) => (
              <i
                key={i}
                title={String(v)}
                style={{ height: (100 * v) / Math.max(1, ...data.week) + '%' }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
export function Orders({ data }) {
  const { t, local } = useUI(),
    [filter, set] = useState('all');
  return (
    <>
      <div className="chips">
        {['all', 'pending', 'prog', 'done', 'canc', 'partial', 'failed'].map(
          (k) => (
            <button
              key={k}
              className={'ch ' + (filter === k ? 'on' : '')}
              onClick={() => set(k)}
            >
              {{
                partial: local(['جزئي', 'Partial']),
                failed: local(['فشل', 'Failed']),
              }[k] || t(k)}
            </button>
          )
        )}
      </div>
      <div className="cd">
        <OrdersTable
          orders={data.filter((o) => filter === 'all' || o.status === filter)}
        />
      </div>
    </>
  );
}
export function ServiceList({ data }) {
  const { t, local } = useUI(),
    [q, set] = useState('');
  return (
    <div className="cd">
      <label>
        {t('search')}
        <input type="search" value={q} onChange={(e) => set(e.target.value)} />
      </label>
      <Table
        headers={['id', 'service', 'p1k', 'minmax'].map(t)}
        rows={data
          .filter((s) =>
            (s.id + ' ' + s.platform + ' ' + local(s.label))
              .toLowerCase()
              .includes(q.trim().toLowerCase())
          )
          .map((s) => [
            s.id,
            s.platform + ' – ' + local(s.label),
            money(s.rate),
            s.min + ' – ' + s.max,
          ])}
      />
    </div>
  );
}
export function OrderForm({ data, mass = false }) {
  const { t, local } = useUI(),
    { refresh, notify } = useSession(),
    router = useRouter();
  const [id, select] = useState(null),
    [q, setQty] = useState(1000);
  const service = data.find((x) => x.id === id) || data[0];
  if (!service)
    return <p>{local(['لا توجد خدمات', 'No services available'])}</p>;
  async function submit(form, key) {
    const body = mass
      ? { orders: parseBatch(form.get('lines'), data) }
      : validateOrder(
          {
            service_id: service.id,
            quantity: Number(q),
            link: form.get('link'),
          },
          data
        );
    const result = await request(mass ? '/orders/batch' : '/orders', {
      method: 'POST',
      body,
      key,
    });
    refresh();
    const ids = Array.isArray(result) ? result.map((order) => '#' + order.id).join(', ') : '';
    notify(local([
      `${mass ? 'تم إنشاء الطلبات' : 'تم إنشاء الطلب'} ${ids} بنجاح`,
      `${mass ? 'Orders' : 'Order'} ${ids} created successfully`,
    ]));
    router.push('/panel/orders');
  }
  return (
    <div style={{ maxWidth: mass ? 720 : 560 }}>
      <ActionForm reset={false} onSave={submit}>
        {mass ? (
          <label>
            {t('massh')}
            <textarea
              name="lines"
              rows="8"
              dir="ltr"
              placeholder="1 | https://example.com/post | 1000"
              required
            />
          </label>
        ) : (
          <>
            <label>
              {t('svc')}
              <select
                name="service_id"
                value={service.id}
                onChange={(e) => {
                  const s = data.find((x) => x.id === Number(e.target.value));
                  select(s.id);
                  setQty(Math.max(s.min, Math.min(s.max, Number(q))));
                }}
              >
                {data.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.platform} – {local(s.label)}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label={t('link')}
              type="url"
              name="link"
              dir="ltr"
              placeholder="https://"
            />
            <Field
              label={t('qty')}
              name="quantity"
              type="number"
              min={service.min}
              max={service.max}
              value={q}
              onChange={(e) => setQty(e.target.value)}
            />
            {[
              ['p1k', money(service.rate)],
              ['minmax', service.min + ' – ' + service.max],
              ['eta', t('etav')],
              ['total', money((service.rate * Number(q)) / 1000)],
            ].map(([k, v]) => (
              <div className="sum" key={k}>
                <span>{t(k)}</span>
                <b>{v}</b>
              </div>
            ))}
          </>
        )}
        <button className="bt w">{t(mass ? 'run' : 'confirm')}</button>
      </ActionForm>
    </div>
  );
}
