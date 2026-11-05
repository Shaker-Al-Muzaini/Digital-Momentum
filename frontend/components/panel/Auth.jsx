'use client';
import Orb from './Orb';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useUI,
  Tools,
  ActionForm,
  Field,
  useResource,
  Status,
} from '../shared';
import { demoMode, request } from '../../lib/api';
import { useEffect } from 'react';

export default function Auth({ page }) {
  const { t, local } = useUI(),
    router = useRouter();
  const session = useResource('/me');
  useEffect(() => {
    if (session.data) router.replace('/panel/dashboard');
  }, [session.data, router]);
  const register = page === 'register',
    forgot = page === 'forgot';
  async function submit(form) {
    const values = Object.fromEntries(form);
    if (register && values.password !== values.confirm)
      throw Error(t('mismatch'));
    delete values.confirm;
    await request('/auth/' + page, { method: 'POST', body: values });
    if (forgot)
      return demoMode
        ? local([
            'معاينة محلية فقط. إرسال البريد يتطلب FastAPI.',
            'Local preview. Email delivery requires FastAPI.',
          ])
        : t('sent');
    router.replace('/panel/dashboard');
  }
  if (!session.error || session.error.status !== 401)
    return <Status error={session.error} retry={session.refresh} />;
  return (
    <div className="au">
      <section className="hero">
        <Orb />
        <h1>{t('tag')}</h1>
      </section>
      <section className="fm">
        <div className="row">
          <Link href="/">SMM Panel</Link>
          <div>
            <Tools />
          </div>
        </div>
        <h2 className="ttl">
          {t(register ? 'signup' : forgot ? 'forgot' : 'welcome')}
        </h2>
        <ActionForm className="" onSave={submit} reset={forgot}>
          {register && (
            <Field name="name" label={t('name')} autoComplete="name" />
          )}
          <Field
            name="email"
            type="email"
            label={t('email')}
            autoComplete="email"
            defaultValue={demoMode && page === 'login' ? 'demo@smm.app' : ''}
          />
          {!forgot && (
            <Field
              name="password"
              label={t('pass')}
              type="password"
              minLength={register ? 6 : undefined}
              autoComplete={register ? 'new-password' : 'current-password'}
              defaultValue={demoMode && !register ? 'demo1234' : ''}
            />
          )}
          {register && (
            <Field
              name="confirm"
              type="password"
              label={t('conf')}
              autoComplete="new-password"
            />
          )}
          <button className="bt w">
            {t(register ? 'signup' : forgot ? 'sendlink' : 'signin')}
          </button>
        </ActionForm>
        {demoMode && page === 'login' && (
          <p className="note">{t('hint')} · demo1234</p>
        )}
        {page === 'login' ? (
          <p>
            <Link className="lk" href="/auth/forgot">
              {t('forgot')}
            </Link>
            <br />
            {t('noacc')}{' '}
            <Link className="lk" href="/auth/register">
              {t('signup')}
            </Link>
          </p>
        ) : (
          <Link className="lk" href="/auth/login">
            {t('back')}
          </Link>
        )}
      </section>
    </div>
  );
}
