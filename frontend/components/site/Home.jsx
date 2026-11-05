'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Icon, SplitText, useUI } from '../shared';
import catalog from '../../lib/catalog.json';

function Preview() {
  const { t } = useUI('site');
  const ref = useRef(null);
  useEffect(() => {
    const stage = ref.current;
    const resize = new ResizeObserver(() => {
      const scale = Math.min(1, stage.clientWidth / 900);
      stage.style.setProperty('--k', scale);
      stage.style.height = 460 * scale * 0.9 + 'px';
    });
    resize.observe(stage);
    function tilt(e) {
      if (
        e.pointerType === 'touch' ||
        matchMedia('(prefers-reduced-motion: reduce)').matches
      )
        return;
      const bounds = stage.getBoundingClientRect();
      const x = (e.clientX - bounds.left) / bounds.width - 0.5;
      const y = (e.clientY - bounds.top) / bounds.height - 0.5;
      stage.style.setProperty('--tilt-x', 10 - y * 8 + 'deg');
      stage.style.setProperty('--tilt-y', -6 + x * 10 + 'deg');
    }
    function resetTilt() {
      stage.style.setProperty('--tilt-x', '10deg');
      stage.style.setProperty('--tilt-y', '-6deg');
    }
    const hero = stage.closest('section');
    hero.addEventListener('pointermove', tilt);
    hero.addEventListener('pointerleave', resetTilt);
    return () => {
      resize.disconnect();
      hero.removeEventListener('pointermove', tilt);
      hero.removeEventListener('pointerleave', resetTilt);
    };
  }, []);
  return (
    <div className="stage" ref={ref}>
      <div className="tlt">
        <div className="dev">
          <div className="win" aria-hidden="true">
            <aside>
              {['#0A84FF', '#30D158', '#BF5AF2', '#FF9F0A', '#8E8E93'].map(
                (c) => (
                  <i key={c} style={{ background: c }} />
                )
              )}
            </aside>
            <div className="wm">
              <div className="wh">
                <b>{t('ord')}</b>
                <span>$48.20</span>
              </div>
              <div className="ws">
                {[
                  ['bal', '$48.20'],
                  ['ord', '128'],
                  ['act', '14'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <small>{t(k)}</small>
                    <b>{v}</b>
                  </div>
                ))}
              </div>
              <div className="wc">
                <div>
                  {[
                    ['10482', 'Instagram', 'prog', '#2997FF'],
                    ['10481', 'YouTube', 'done', '#30D158'],
                    ['10480', 'TikTok', 'pend', '#FF9F0A'],
                  ].map(([id, name, status, color]) => (
                    <div className="or" key={id}>
                      <span>
                        #{id} · {name}
                      </span>
                      <span
                        className="sb2"
                        style={{ color, background: color + '26' }}
                      >
                        {t(status)}
                      </span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="wbar">
                    {[40, 65, 30, 80, 55, 90, 70].map((v) => (
                      <i key={v} style={{ height: v + '%' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {[
          ['wallet', 'bal', '$48.20'],
          ['check', '#10481', t('done')],
          ['refresh', 'refd', '$1.10'],
        ].map(([icon, label, v], i) => (
          <div key={icon} className={'fc float-' + i}>
            <Icon name={icon} />
            <span>
              <small>{label.startsWith('#') ? label : t(label)}</small>
              <b>{v}</b>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
export default function Home() {
  const { t } = useUI('site');
  return (
    <>
      <section className="hr">
        <div className="hi">
          <h1 className="big sw rv">
            <SplitText>{t('h1')}</SplitText>
          </h1>
          <p className="lead rv">{t('hs')}</p>
          <div className="cta rv">
            <Link className="bt" href="/auth/register">
              {t('start')}
            </Link>
            <Link className="bt ln" href="/services">
              {t('explore')}
            </Link>
          </div>
        </div>
        <Preview />
      </section>
      <div className="mq" aria-hidden="true">
        <div>
          {[...catalog, ...catalog].map((s, i) => (
            <span key={i}>{s.platform}</span>
          ))}
        </div>
      </div>
      <section className="sc">
        <div className="wr">
          <div className="ct">
            <h2 className="big rv">{t('bh')}</h2>
          </div>
          <div className="bento">
            {[
              ['refresh', '#0A84FF'],
              ['wallet', '#30D158'],
              ['code', '#BF5AF2'],
              ['globe', '#FF9F0A'],
              ['shield', '#FF453A'],
            ].map(([icon, color], i) => (
              <div
                key={icon}
                className={'bn rv ' + (!i ? 'a' : '')}
                style={{ '--reveal-delay': `${i * 70}ms` }}
              >
                <span className="ibx" style={{ background: color }}>
                  <Icon name={icon} />
                </span>
                <h3>{t('b' + (i + 1))}</h3>
                <p>{t('b' + (i + 1) + 'd')}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="sc" style={{ paddingTop: 0 }}>
        <div className="wr">
          <div className="cta2 rv">
            <div>
              <h2>{t('ct')}</h2>
              <p>{t('cs')}</p>
            </div>
            <Link className="bt" href="/auth/register">
              {t('start')} <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
