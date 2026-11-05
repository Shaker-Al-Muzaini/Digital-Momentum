'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { Tools, Icon, useUI, money, useResource, Status } from '../shared';
import { request, demoMode } from '../../lib/api';
import nav from '../../lib/navigation.json';

const Session = createContext(null);
export const useSession = () => useContext(Session);
export default function PanelLayout({ children }) {
  const { t, local } = useUI(),
    router = useRouter(),
    path = usePathname();
  const { data: user, error, refresh } = useResource('/me', 60000);
  const [open, setOpen] = useState(false),
    [mini, setMini] = useState(false),
    [groups, setGroups] = useState([]);
  const [notice, setNotice] = useState('');
  const page = path.split('/').pop(),
    group = nav.find(([, items]) => items.some(([key]) => key === page));
  const forbidden = user && group?.[2] && user.role !== 'admin';
  useEffect(() => {
    setMini(localStorage.getItem('mini') === '1');
    try {
      setGroups(JSON.parse(localStorage.getItem('groups') || '[]'));
    } catch {}
  }, []);
  useEffect(() => {
    setOpen(false);
  }, [path]);
  useEffect(() => {
    if (error?.status === 401) router.replace('/auth/login');
    else if (forbidden) router.replace('/panel/dashboard');
  }, [error, forbidden, router]);
  if (!user || forbidden) return <Status error={error} retry={refresh} />;
  const title = t(group?.[1].find(([key]) => key === page)?.[2] || 'dash');
  function toggleMini() {
    localStorage.setItem('mini', mini ? '0' : '1');
    setMini(!mini);
  }
  function toggleGroup(g) {
    const next = groups.includes(g)
      ? groups.filter((x) => x !== g)
      : [...groups, g];
    setGroups(next);
    localStorage.setItem('groups', JSON.stringify(next));
  }
  async function logout() {
    try {
      await request('/auth/logout', { method: 'POST' });
      router.replace('/auth/login');
    } catch (e) {
      setNotice(e.message);
    }
  }
  return (
    <Session.Provider value={{ user, refresh, logout }}>
      <div className={'app ' + (mini ? 'mini ' : '') + (open ? 'open' : '')}>
        <div className="ov" onClick={() => setOpen(false)} />
        <aside className="sb">
          <Link href="/" className="br">
            <span className="ibx" style={{ background: '#0A84FF' }}>
              <Icon name="bolt" />
            </span>
            <span className="tx">SMM Panel</span>
          </Link>
          {nav
            .filter(([, , admin]) => !admin || user.role === 'admin')
            .map(([g, items]) => (
              <div className="gw" key={g}>
                <button
                  className="gh"
                  aria-expanded={!groups.includes(g)}
                  onClick={() => toggleGroup(g)}
                >
                  <span className="tx">{t(g)}</span>
                  <Icon name="chev" />
                </button>
                <div className={'gp ' + (groups.includes(g) ? 'c' : '')}>
                  <div>
                    {items.map(([id, icon, key, color]) => (
                      <Link
                        key={id}
                        className={'nl ' + (page === id ? 'on' : '')}
                        href={'/panel/' + id}
                        title={t(key)}
                      >
                        <span className="ibx" style={{ background: color }}>
                          <Icon name={icon} />
                        </span>
                        <span className="tx">{t(key)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          <button className="nl cl" onClick={toggleMini}>
            <Icon name="side" />
            <span className="tx">{t('collapse')}</span>
          </button>
        </aside>
        <div className="cn">
          <header className="tp">
            <button
              className="ib mb"
              aria-label="Menu"
              onClick={() => setOpen(!open)}
            >
              <Icon name="menu" />
            </button>
            <button
              className="ib dk"
              aria-label={t('collapse')}
              onClick={toggleMini}
            >
              <Icon name="side" />
            </button>
            <span className="sp">{title}</span>
            <span className="pill">{money(user.balance)}</span>
            <Tools />
            <button className="ib" aria-label={t('logout')} onClick={logout}>
              <Icon name="out" />
            </button>
          </header>
          <main id="pg">
            {demoMode && (
              <p className="note">
                {local([
                  'معاينة محلية · بيانات ودفعات تجريبية',
                  'Local preview · simulated data and payments',
                ])}
              </p>
            )}
            {notice && <p role="alert">{notice}</p>}
            {page !== 'dashboard' && <h1 className="ttl">{title}</h1>}
            {children}
          </main>
        </div>
      </div>
    </Session.Provider>
  );
}
