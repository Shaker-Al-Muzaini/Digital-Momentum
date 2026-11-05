'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Tools, Icon, useUI } from '../shared';
export const pages = [
  'home',
  'services',
  'pricing',
  'how',
  'api',
  'faq',
  'contact',
];
export default function SiteLayout({ children }) {
  const { t } = useUI('site'),
    path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main || matchMedia('(prefers-reduced-motion: reduce)').matches)
      return;
    main.classList.add('reveal-ready');
    if (!('IntersectionObserver' in window)) {
      main.querySelectorAll('.rv').forEach((item) =>
        item.classList.add('revealed')
      );
      return () => main.classList.remove('reveal-ready');
    }
    const reveal = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('revealed');
          reveal.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -5% 0px', threshold: 0.08 }
    );
    function observe(node) {
      if (!(node instanceof Element)) return;
      if (node.matches('.rv')) reveal.observe(node);
      node.querySelectorAll('.rv').forEach((item) => reveal.observe(item));
    }
    observe(main);
    const mutations = new MutationObserver((records) => {
      records.forEach((record) =>
        record.addedNodes.forEach((node) => observe(node))
      );
    });
    mutations.observe(main, { childList: true, subtree: true });
    return () => {
      mutations.disconnect();
      reveal.disconnect();
      main.classList.remove('reveal-ready');
    };
  }, [path]);
  const links = pages.map((page) => {
    const href = page === 'home' ? '/' : '/' + page;
    return (
      <Link
        key={page}
        href={href}
        className={path === href ? 'on' : ''}
        aria-current={path === href ? 'page' : undefined}
        onClick={() => setOpen(false)}
      >
        {t(page)}
      </Link>
    );
  });
  return (
    <>
      <header className="nv">
        <Link className="lg" href="/">
          <span className="ibx">
            <Icon name="bolt" />
          </span>
          SMM Panel
        </Link>
        <nav className="nl" aria-label={t('home')}>
          {links}
        </nav>
        <div className="na">
          <Tools />
          <Link className="lk2" href="/auth/login">
            {t('signin')}
          </Link>
          <Link className="bt s" href="/auth/register">
            {t('start')}
          </Link>
          <button
            className="ib mb"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <Icon name="menu" />
          </button>
        </div>
      </header>
      <nav
        className={'mm ' + (open ? 'open' : '')}
        aria-label={t('home')}
      >
        {links}
      </nav>
      <main>{children}</main>
      <footer>
        <div className="wr">
          <b>SMM Panel</b>
          <span>© 2026 {t('rights')}</span>
        </div>
      </footer>
    </>
  );
}
