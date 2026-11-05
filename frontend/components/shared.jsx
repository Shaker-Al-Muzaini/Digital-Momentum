'use client';
import {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { request } from '../lib/api';
import siteText from '../lib/site-strings.json';
import panelText from '../lib/panel-strings.json';
import siteIcons from '../lib/site-icons.json';
import panelIcons from '../lib/panel-icons.json';

const UI = createContext(null);
export function Preferences({ children }) {
  const [lang, setLang] = useState('ar');
  const [theme, setTheme] = useState('');
  useEffect(() => {
    setLang(
      localStorage.getItem('lang') ||
        (navigator.language.startsWith('ar') ? 'ar' : 'en')
    );
    setTheme(localStorage.getItem('theme') || '');
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dataset.theme = theme;
  }, [lang, theme]);
  function language(next) {
    localStorage.setItem('lang', next);
    setLang(next);
  }
  function toggleTheme() {
    const dark = theme
      ? theme === 'dark'
      : matchMedia('(prefers-color-scheme:dark)').matches;
    const next = dark ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    setTheme(next);
  }
  return (
    <UI.Provider value={{ lang, language, toggleTheme }}>
      {children}
    </UI.Provider>
  );
}
export function useUI(scope = 'panel') {
  const ui = useContext(UI),
    i = ui.lang === 'ar' ? 0 : 1;
  const strings = scope === 'site' ? siteText : panelText;
  const local = (value) => (Array.isArray(value) ? value[i] : value);
  return { ...ui, local, t: (key) => local(strings[key]) ?? key };
}
export function Icon({ name, className = '' }) {
  const path = panelIcons[name] || siteIcons[name];
  if (!path) throw new Error(`Unknown icon: ${name}`);
  return (
    <svg className={'i ' + className} viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}
export function SplitText({ children }) {
  const words = String(children).split(/\s+/);
  return words.map((word, index) => (
    <Fragment key={index}>
      <span className="w" style={{ '--word-index': index }}>
        <span>{word}</span>
      </span>
      {index < words.length - 1 ? ' ' : null}
    </Fragment>
  ));
}
export function Tools() {
  const { lang, language, toggleTheme } = useUI();
  return (
    <>
      <button
        className="ib"
        aria-label="Language"
        onClick={() => language(lang === 'ar' ? 'en' : 'ar')}
      >
        {lang === 'ar' ? 'EN' : 'ع'}
      </button>
      <button className="ib" aria-label="Theme" onClick={toggleTheme}>
        <Icon name="sun" />
      </button>
    </>
  );
}
export const money = (n) => '$' + Number(n).toFixed(2);
export function useResource(path, interval = 0) {
  const [state, set] = useState({ path: null, data: null, error: null });
  const [revision, update] = useState(0);
  const refresh = useCallback(() => update((n) => n + 1), []);
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    async function read() {
      try {
        const data = await request(path, { signal: controller.signal });
        if (!controller.signal.aborted) set({ path, data, error: null });
      } catch (error) {
        if (!controller.signal.aborted) set({ path, data: null, error });
      }
    }
    read();
    const timer = interval && setInterval(read, interval);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [path, interval, revision]);
  return {
    ...(state.path === path ? state : { data: null, error: null }),
    refresh,
  };
}
export function Status({ error, retry }) {
  const { local } = useUI();
  return (
    <div className="cd" role="status">
      {error ? (
        <>
          {error.message}{' '}
          <button className="ch" onClick={retry}>
            {local(['إعادة المحاولة', 'Retry'])}
          </button>
        </>
      ) : (
        local(['جارٍ التحميل…', 'Loading…'])
      )}
    </div>
  );
}
export function ActionForm({
  children,
  onSave,
  className = 'cd',
  reset = true,
}) {
  const [busy, setBusy] = useState(false),
    [message, notify] = useState('');
  const lock = useRef(false),
    attempt = useRef(null);
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    const form = event.currentTarget;
    lock.current = true;
    setBusy(true);
    notify('');
    const fields = new FormData(form);
    const fingerprint = JSON.stringify(
      [...fields].map(([name, value]) => [
        name,
        typeof value === 'string'
          ? value
          : [value.name, value.size, value.lastModified],
      ])
    );
    if (attempt.current?.fingerprint !== fingerprint) {
      attempt.current = { fingerprint, key: crypto.randomUUID() };
    }
    try {
      const message = await onSave(fields, attempt.current.key);
      attempt.current = null;
      if (reset) form.reset();
      notify(message || '');
    } catch (error) {
      notify(error.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <form className={className} onChange={() => notify('')} onSubmit={submit}>
      <fieldset disabled={busy}>{children}</fieldset>
      <p aria-live="polite">{message}</p>
    </form>
  );
}
export function Field({ label, ...props }) {
  return (
    <label>
      {label}
      <input required {...props} />
    </label>
  );
}
export function Table({ headers, rows }) {
  const { local } = useUI();
  return (
    <div className="tw">
      <table>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length}>
                {local(['لا توجد سجلات', 'No records'])}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
export function Badge({ value }) {
  const { t, local } = useUI();
  const colors = {
    done: 'g',
    up: 'g',
    prog: 'b',
    pending: 'o',
    review: 'o',
    rej: 'r',
    canc: 'r',
    off: 'o',
    partial: 'o',
    failed: 'r',
  };
  const extra = { partial: ['جزئي', 'Partial'], failed: ['فشل', 'Failed'] };
  return (
    <span className={'bd b-' + (colors[value] || 'b')}>
      {extra[value] ? local(extra[value]) : t(value)}
    </span>
  );
}
