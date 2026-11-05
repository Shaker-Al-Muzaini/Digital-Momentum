import { notFound } from 'next/navigation';
import Auth from '../../../../components/panel/Auth';
export default async function Page({ params }) {
  const { page } = await params;
  if (!['login', 'register', 'forgot'].includes(page)) notFound();
  return <Auth key={page} page={page} />;
}
