'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Status, useResource } from '../shared';
import { Dashboard, OrderForm, Orders, ServiceList } from './Orders';
import { Funds, Transactions } from './Billing';
import { Account, Faq, Support, KeyPage, Referrals, News } from './Account';
import Admin from './Admin';
const routes = {
  dashboard: ['/dashboard', Dashboard],
  new: ['/services', OrderForm],
  mass: ['/services', OrderForm],
  orders: ['/orders', Orders],
  services: ['/services', ServiceList],
  funds: ['/payments', Funds],
  tx: ['/transactions', Transactions],
  ref: ['/referrals', Referrals],
  api: ['/account/api-key', KeyPage],
  news: ['/news', News],
  faq: [null, Faq],
  support: ['/tickets', Support],
  account: [null, Account],
  adm: ['/admin/dashboard', Admin],
  users: ['/admin/users', Admin],
  apay: ['/admin/payments', Admin],
  prov: ['/admin/providers', Admin],
  net: ['/admin/proxies', Admin],
  srv: ['/admin/health', Admin],
};
export default function PanelPage({ page }) {
  const router = useRouter(),
    [path, View] = routes[page];
  const { data, error, refresh } = useResource(
    path,
    [
      'dashboard',
      'orders',
      'srv',
      'funds',
      'apay',
      'adm',
      'tx',
      'net',
    ].includes(page)
      ? 60000
      : 0
  );
  useEffect(() => {
    if (error?.status === 401) router.replace('/auth/login');
  }, [router, error]);
  if (path && !data) return <Status error={error} retry={refresh} />;
  return (
    <View page={page} data={data} refresh={refresh} mass={page === 'mass'} />
  );
}
