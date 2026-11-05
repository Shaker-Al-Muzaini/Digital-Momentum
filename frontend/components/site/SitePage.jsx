'use client';
import { useState } from 'react';
import {
  useUI,
  useResource,
  Status,
  ActionForm,
  Field,
  money,
  Icon,
  SplitText,
} from '../shared';
import { request, demoMode } from '../../lib/api';

function Catalog({ pricing }) {
  const { t, local } = useUI('site');
  const { data, error, refresh } = useResource('/services');
  const [id, select] = useState(null),
    [quantity, setQuantity] = useState(1000);
  if (!data) return <Status error={error} retry={refresh} />;
  if (!data.length)
    return <p>{local(['لا توجد خدمات متاحة', 'No services available'])}</p>;
  if (!pricing)
    return (
      <div className="g">
        {data.map((s, index) => (
          <article
            className="cd h rv"
            key={s.id}
            style={{ '--reveal-delay': `${index * 70}ms` }}
          >
            <span className="ibx" style={{ background: s.color }}>
              {s.platform[0]}
            </span>
            <h3>{s.platform}</h3>
            <p>{local(s.label)}</p>
            <div className="row">
              <span>{t('from')}</span>
              <b className="pr">{money(s.rate)}</b>
            </div>
            <div className="row">
              <span>{t('mm')}</span>
              <b dir="ltr">
                {s.min} – {s.max}
              </b>
            </div>
          </article>
        ))}
      </div>
    );
  const s = data.find((x) => x.id === id) || data[0],
    q = Math.min(s.max, Math.max(s.min, quantity));
  return (
    <>
      <div className="cd">
        <label>
          {t('svc')}
          <select value={s.id} onChange={(e) => select(Number(e.target.value))}>
            {data.map((x) => (
              <option key={x.id} value={x.id}>
                {x.platform} – {local(x.label)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('qty')} <b>{q.toLocaleString()}</b>
          <input
            type="range"
            min={s.min}
            max={s.max}
            value={q}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </label>
        <div className="row">
          {t('p1k')}
          <b>{money(s.rate)}</b>
        </div>
        <div className="row">{t('total')}</div>
        <div className="tot" dir="ltr">
          {money((q * s.rate) / 1000)}
        </div>
      </div>
      <div className="cd" style={{ marginTop: 20 }}>
        <div className="row">
          {t('pm')}
          <b>{t('pmv')}</b>
        </div>
      </div>
    </>
  );
}
const heading = {
  services: ['svh', 'svs'],
  pricing: ['prh', 'prs'],
  how: ['hwh', 'hws'],
  api: ['apih', 'apis'],
  faq: ['fqh'],
  contact: ['cth', 'cts'],
};
export default function SitePage({ page }) {
  const { t, local } = useUI('site'),
    [title, subtitle] = heading[page];
  return (
    <section className="sc inner">
      <div
        className="wr"
        style={{
          maxWidth: { contact: 640, faq: 760, pricing: 760, api: 820 }[page],
        }}
      >
        <div className="ct">
          <h1 className="big sw rv">
            <SplitText>{t(title)}</SplitText>
          </h1>
          {subtitle && <p className="lead rv">{t(subtitle)}</p>}
        </div>
        {['services', 'pricing'].includes(page) && (
          <Catalog pricing={page === 'pricing'} />
        )}
        {page === 'how' && (
          <div className="tl">
            <div className="ln2">
              <i />
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div className="stx rv" key={i}>
                <span className="dot">{i}</span>
                <h2>{t('s' + i)}</h2>
                <p>{t('d' + i)}</p>
              </div>
            ))}
          </div>
        )}
        {page === 'faq' &&
          [1, 2, 3].map((i) => (
            <details className="rv" key={i}>
              <summary>
                {t('q' + i)}
                <Icon name="plus" />
              </summary>
              <p>{t('a' + i)}</p>
            </details>
          ))}
        {page === 'api' && (
          <pre className="rv" dir="ltr">
            <b>POST</b> /api/v2
            {'\nkey=YOUR_API_KEY\naction='}
            <b>add</b>
            {'&service=1&link=https://...&quantity=1000\n\n'}
            <b>POST</b> /api/v2
            {'\nkey=YOUR_API_KEY\naction='}
            <b>status</b>
            {'&order=10482'}
          </pre>
        )}
        {page === 'contact' && (
          <ActionForm
            onSave={async (form) => {
              await request('/contact', {
                method: 'POST',
                body: Object.fromEntries(form),
              });
              return demoMode
                ? local([
                    'حُفظت الرسالة في المعاينة المحلية',
                    'Saved locally in preview',
                  ])
                : t('sent');
            }}
          >
            <Field label={t('name')} name="name" />
            <Field label={t('email')} name="email" type="email" />
            <label>
              {t('msg')}
              <textarea name="message" rows="5" required />
            </label>
            <button className="bt" style={{ width: '100%' }}>
              <Icon name="send" className="ar" />
              {t('send')}
            </button>
          </ActionForm>
        )}
      </div>
    </section>
  );
}
