'use client';
import { useState } from 'react';
import { ActionForm, Field, Table, Badge, useUI, money } from '../shared';
import { useSession } from './PanelLayout';
import { demoMode, request } from '../../lib/api';

export function Transactions({ data }) {
  const { t, local } = useUI();
  return (
    <div className="cd">
      <Table
        headers={['date', 'method', 'amount', 'status'].map(t)}
        rows={data.map((x) => [
          x.date,
          local(x.label),
          money(x.amount),
          <Badge value={x.status} />,
        ])}
      />
    </div>
  );
}
export function Funds({ data, refresh }) {
  const { t, local } = useUI(),
    session = useSession();
  const [tab, setTab] = useState('card'),
    [amount, setAmount] = useState('25');
  async function submit(form, key) {
    const result = await request('/payments/' + tab, {
      method: 'POST',
      key,
      body: tab === 'card' ? { amount: Number(amount) } : form,
    });
    if (tab === 'card' && !demoMode) {
      const url = new URL(result.checkout_url);
      if (url.protocol !== 'https:') throw Error('Invalid checkout URL');
      location.assign(url.href);
    }
    refresh();
    session.refresh();
    return tab === 'local'
      ? t('review')
      : local(['دفعة تجريبية مكتملة', 'Demo payment completed']);
  }
  return (
    <div className="g2">
      <div className="cd">
        <div className="chips">
          {['card', 'local'].map((k) => (
            <button
              key={k}
              className={'ch ' + (tab === k ? 'on' : '')}
              onClick={() => setTab(k)}
            >
              {t(k)}
            </button>
          ))}
        </div>
        <ActionForm key={tab} className="" onSave={submit} reset={false}>
          {tab === 'card' ? (
            <div className="chips">
              {[10, 25, 50, 100].map((v) => (
                <button
                  type="button"
                  key={v}
                  className="ch"
                  onClick={() => setAmount(String(v))}
                >
                  ${v}
                </button>
              ))}
            </div>
          ) : (
            <>
              <p className="sub">{t('bank')}</p>
              <p dir="auto">{local(data.instructions)}</p>
            </>
          )}
          <Field
            name="amount"
            type="number"
            min="5"
            step=".01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            label={t('amount') + ' (USD)'}
          />
          {tab === 'local' && (
            <>
              <Field name="reference" label={t('txref')} />
              <Field
                name="receipt"
                type="file"
                accept="image/*"
                label={t('receipt')}
              />
            </>
          )}
          <button className="bt w">
            {t(tab === 'card' ? 'pay' : 'submit')}
          </button>
        </ActionForm>
      </div>
      <div className="cd">
        <h2>{t('hist')}</h2>
        <Table
          headers={['date', 'method', 'amount', 'status'].map(t)}
          rows={data.history.map((x) => [
            x.date,
            t(x.method),
            money(x.amount),
            <Badge value={x.status} />,
          ])}
        />
      </div>
    </div>
  );
}
