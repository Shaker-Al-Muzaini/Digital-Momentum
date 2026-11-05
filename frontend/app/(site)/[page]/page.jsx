import { notFound } from 'next/navigation';
import SitePage from '../../../components/site/SitePage';
export default async function Page({ params }) {
  const { page } = await params;
  if (!['services', 'pricing', 'how', 'api', 'faq', 'contact'].includes(page))
    notFound();
  return <SitePage key={page} page={page} />;
}
