'use client';
import { useState } from 'react';
import {
  ActionForm,
  Field,
  Table,
  Badge,
  Icon,
  useUI,
  money,
} from '../shared';
import { request } from '../../lib/api';
import { useSession } from './PanelLayout';
import { Stats } from './Orders';
export function Support({ data, refresh }) {
  const { t, local } = useUI();
  return (
    <div className="g2">
      <ActionForm
        onSave={async (form) => {
          await request('/tickets', {
            method: 'POST',
            body: Object.fromEntries(form),
          });
          refresh();
          return t('tkok');
        }}
      >
        <Field name="subject" label={t('subject')} />
        <label>
          {t('msg')}
          <textarea required name="message" rows="5" />
        </label>
        <button className="bt w">{t('send')}</button>
      </ActionForm>
      <div className="cd">
        <h2>{t('tks')}</h2>
        <Table
          headers={['id', 'subject', 'status'].map(t)}
          rows={data.map((x) => [
            x.id,
            local(x.subject),
            <Badge value={x.status} />,
          ])}
        />
      </div>
    </div>
  );
}
export function Account() {
  const { user, logout } = useSession(),
    { t, lang, language, toggleTheme } = useUI();
  return (
    <div className="g2">
      <div className="cd">
        <div className="sum">
          {t('name')}
          <b>{user.name}</b>
        </div>
        <div className="sum">
          {t('lang')}
          <div className="chips">
            {['ar', 'en'].map((l) => (
              <button
                key={l}
                className={'ch ' + (lang === l ? 'on' : '')}
                onClick={() => language(l)}
              >
                {l === 'ar' ? 'العربية' : 'English'}
              </button>
            ))}
          </div>
        </div>
        <div className="sum">
          {t('theme')}
          <button
            className="ch"
            aria-label={t('theme')}
            onClick={toggleTheme}
          >
            <Icon name="sun" />
          </button>
        </div>
      </div>
      <div className="cd">
        <ActionForm
          className=""
          onSave={async (f) => {
            await request('/account/password', {
              method: 'POST',
              body: Object.fromEntries(f),
            });
            return t('saved');
          }}
        >
          <Field
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            label={t('pwd')}
          />
          <button className="bt w">{t('change')}</button>
        </ActionForm>
        <button className="ch" onClick={logout}>
          {t('logout')}
        </button>
      </div>
    </div>
  );
}
export function KeyPage({ data }) {
  const { t } = useUI(),
    [status, set] = useState('');
  return (
    <div className="cd">
      <div className="row">
        <div>
          <small>{t('apikey')}</small>
          <p dir="ltr">{data.key}</p>
        </div>
        <button
          className="bt"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(data.key);
              set(t('copied'));
            } catch (e) {
              set(e.message);
            }
          }}
        >
          {t('copy')}
        </button>
      </div>
      <p role="status">{status}</p>
      <small>{t('endpoint')}</small>
      <pre dir="ltr">
        {
          'POST /api/v2\nkey=YOUR_API_KEY\naction=add&service=1&link=https://...&quantity=1000'
        }
      </pre>
    </div>
  );
}
export function Referrals({ data }) {
  const { t } = useUI();
  return (
    <>
      <Stats
        items={[
          ['visits', data.visits],
          ['regs', data.signups],
          ['earn', money(data.earnings)],
        ]}
      />
      <div className="cd">
        <label>
          {t('refl')}
          <input readOnly value={data.url} dir="ltr" />
        </label>
      </div>
    </>
  );
}
export function News({ data }) {
  const { local } = useUI();
  return data.map((n) => (
    <article className="cd" key={n.id}>
      <span className="bd b-b">{n.date}</span>
      <h2>{local(n.title)}</h2>
    </article>
  ));
}
export function Faq() {
  const { t } = useUI();
  return (
    <div className="cd">
      {[1, 2, 3].map((i) => (
        <details key={i}>
          <summary>{t('fq' + i)}</summary>
          <p>{t('fa' + i)}</p>
        </details>
      ))}
    </div>
  );
}
