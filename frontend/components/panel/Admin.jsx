'use client';
import { useState } from 'react';
import { ActionForm, Table, Badge, useUI, money } from '../shared';
import { Stats } from './Orders';
import { request } from '../../lib/api';
import { useSession } from './PanelLayout';

function PaymentReview({ data, refresh }) {
  const { t } = useUI(),
    session = useSession();
  return (
    <div className="cd">
      <h2>{t('pq')}</h2>
      <Table
        headers={['name', 'amount', 'txref', 'status'].map(t).concat('')}
        rows={data.map((p) => [
          p.name,
          money(p.amount),
          p.reference,
          <Badge value={p.status} />,
          p.status === 'review' ? (
            <ActionForm
              className=""
              onSave={async (form) => {
                await request('/admin/payments/' + p.id + '/review', {
                  method: 'POST',
                  body: { status: form.get('decision') },
                });
                refresh();
                session.refresh();
                return t('saved');
              }}
            >
              <label>
                <select aria-label={t('status')} name="decision">
                  <option value="done">{t('appr')}</option>
                  <option value="rej">{t('rjct')}</option>
                </select>
              </label>
              <button className="ch">{t('submit')}</button>
            </ActionForm>
          ) : null,
        ])}
      />
    </div>
  );
}
export default function Admin({ page, data, refresh }) {
  const { t, local } = useUI(),
    [output, setOutput] = useState('');
  if (page === 'adm')
    return (
      <>
        <Stats
          items={[
            ['rev', money(data.revenue), 'chart', '#BF5AF2'],
            ['act', data.active, 'layers', '#0A84FF'],
            ['pq', data.pending, 'receipt', '#FF9F0A'],
            ['prov', data.providers, 'link', '#34C759'],
          ]}
        />
        <PaymentReview data={data.payments} refresh={refresh} />
      </>
    );
  if (page === 'apay') return <PaymentReview data={data} refresh={refresh} />;
  if (page === 'users')
    return (
      <div className="cd">
        <Table
          headers={['name', 'email', 'bal', 'status'].map(t)}
          rows={data.map((u) => [
            u.name,
            u.email,
            money(u.balance),
            <Badge value={u.status} />,
          ])}
        />
      </div>
    );
  if (page === 'prov')
    return (
      <div className="cd">
        <Table
          headers={['name', 'lat', 'bal', 'status'].map(t)}
          rows={data.map((p) => [
            p.name,
            p.latency,
            p.balance === null ? '—' : money(p.balance),
            <Badge value={p.status} />,
          ])}
        />
      </div>
    );
  if (page === 'net')
    return (
      <div className="g2">
        <div className="cd">
          <h2>{local(['البروكسيات', 'Proxies'])}</h2>
          <Table
            headers={['IP:Port', t('lat'), t('status')]}
            rows={data.map((p) => [
              p.address,
              p.latency,
              <Badge value={p.status} />,
            ])}
          />
        </div>
        <ActionForm
          reset={false}
          onSave={async (f) => {
            setOutput('');
            const result = await request('/admin/generate', {
              method: 'POST',
              body: { prompt: f.get('prompt') },
            });
            setOutput(result.text);
          }}
        >
          <label>
            {t('ai')}
            <textarea name="prompt" required rows="4" />
          </label>
          <button className="bt w">{t('gen')}</button>
          <p style={{ whiteSpace: 'pre-wrap' }}>{output}</p>
        </ActionForm>
      </div>
    );
  return (
    <div className="g2">
      <div className="cd">
        {['cpu', 'ram', 'disk'].map((k) => (
          <div key={k}>
            <div className="sum">
              {t(k)}
              <b>{data[k]}%</b>
            </div>
            <div className="mt">
              <i style={{ width: data[k] + '%' }} />
            </div>
          </div>
        ))}
        <span className="bd b-b">
          {data.telegram
            ? t('tg')
            : local(['تنبيهات تيليجرام متوقفة', 'Telegram alerts off'])}
        </span>
      </div>
      <div className="cd">
        <Table
          headers={[t('service'), t('status')]}
          rows={data.services.map((s) => [s.name, <Badge value={s.status} />])}
        />
      </div>
    </div>
  );
}
